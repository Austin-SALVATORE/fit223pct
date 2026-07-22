#!/usr/bin/env node
/**
 * Phase-2 asset conversion (see docs/design/ExerciseAssetPipeline.md).
 *
 * For each exercise id passed via --only (or all with a reference.png):
 *   1. Slice reference.png into frames at white-gutter midpoints.
 *   2. Background-removal matte each frame + the reference — border
 *      flood-fill, then dilated connected-component grouping + pocket
 *      removal (see matte(), findNearWhiteComponents()) — approved
 *      design direction, replaces the baked-white treatment; see the
 *      Phase B prototype batch, the pocket-removal production fix, and
 *      the connectivity-fix production fix (POCKET_AREA_FRACTION's
 *      calibration-evidence comment below).
 *   3. Encode runtime AVIFs, alpha preserved: reference.avif,
 *      frames/NN.avif, thumbnail.avif.
 *   4. Write authoring metadata.json (media block + credits).
 * Then aggregate all metadata.json into the runtime manifest
 * src/data/generated/asset-manifest.json (projection: media fields only).
 * Run scripts/update-manifest-dims.mjs afterward to restore/recompute
 * referenceSize/frameSizes — this script's metadata.json write only
 * carries frameCount/thumbnailFrame, same as it always has.
 *
 * QA gate: every matted file is re-scanned after pocket removal for any
 * remaining opaque near-white component ≥ 1% of image area (see
 * remainingPockets()). The run exits non-zero if any file is flagged —
 * zero flagged files is the acceptance bar, not just "no fatal errors."
 *
 * Frame count is read from the exercise's prompt.md ("Number of frames: N")
 * and validated against detected gutters — mismatch fails the exercise
 * rather than guessing.
 *
 * Usage:
 *   node scripts/convert-assets.mjs --only goblet-squat --only side-plank
 *   node scripts/convert-assets.mjs --compare-webp   # also report WebP sizes
 *   node scripts/convert-assets.mjs --calibrate      # measure, don't write — see POCKET_AREA_FRACTION
 */

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, statSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { decodePng, encodePngRgb, decodePngRgba, encodePngRgba } from './lib/png-strip.mjs'

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..')
const ROOT = join(REPO, 'public', 'assets', 'exercises')
const MANIFEST = join(REPO, 'src', 'data', 'generated', 'asset-manifest.json')

const WHITE = 245        // channel value at/above which a pixel counts as background
const INK_TOL = 3        // px of ink a column may contain and still count as gutter
const MIN_GUTTER = 8     // px — narrower white runs are not cut points
const FRAME_PAD = 40     // px whitespace kept on each side of a sliced frame
const THUMB_MAX = 320    // px — longest side of thumbnail
const AVIF_QUALITY = '60'
const TODAY = '2026-07-19'
const MATTE_FUZZ = '8%'          // border-flood-fill tolerance — see matte()
const MATTE_FUZZ_FRACTION = 0.08 // same tolerance, as a 0..1 RGB-distance fraction — must match MATTE_FUZZ

/**
 * CALIBRATION EVIDENCE (recorded per the connectivity-fix production
 * incident — do not lower POCKET_AREA_FRACTION without re-running
 * `--calibrate` and re-reading this block; the finding below is not
 * obvious from the code).
 *
 * `--calibrate` swept every frame + reference across all 111 exercises
 * (57,133 raw near-white components post-border-flood-fill) looking for
 * the largest genuine specular highlight (hair sheen, metal glint), to
 * set removal threshold at ~3-5x that value as instructed. The
 * measurement's actual answer is not a smaller number — it's that the
 * premise doesn't hold for this render style:
 *
 *   1. True specular highlights are negligible. ~85% of all raw
 *      components are ≤0.01% of image area (single-pixel antialiasing
 *      noise); no population of large genuine hair/metal highlights
 *      exists to calibrate against — every barbell/dumbbell/hair
 *      candidate ≥0.05% that was visually inspected turned out to be a
 *      background gap (arm-torso, collar, between-leg), not a highlight.
 *
 *   2. Most of the raw fragmentation was a CONNECTIVITY bug, not a
 *      threshold problem. A single visible pocket (e.g.
 *      band-lateral-raise's band-to-torso gap) was splitting into 6+
 *      separate sub-1% components along thin anti-aliasing seams (a
 *      gradient edge a pixel or two wide, just outside the 8% fuzz
 *      tolerance) — not because the pocket was actually small. Fixed by
 *      MATTE_DILATE_RADIUS below: a small dilation merges same-source
 *      fragments before labeling. Confirmed by re-measurement: raw
 *      component count dropped 57,133 → 11,012 after adding dilation,
 *      and band-lateral-raise's own pocket merged from 6+ pieces
 *      (largest 6.08%) into one 9.86%-22.6%-of-image blob per frame —
 *      already well above any reasonable threshold, so this fix alone
 *      resolves the large majority of the reported defect with zero
 *      threshold change and zero risk to legitimate content.
 *
 *   3. What's left after dilation is a genuine, confirmed collision
 *      between real small pockets and legitimate white equipment
 *      (shoes) — their sizes measurably overlap and no single global
 *      area threshold separates them. Confirmed by direct visual
 *      inspection, not inference: dumbbell-shrug's actual shoe fragment
 *      is 0.5484% of frame area; band-lateral-raise frame 4's one
 *      remaining un-mergeable pocket sliver (a real second gap bounded
 *      by actual ink, not an antialiasing artifact — dilation up to 12px
 *      does not merge it into the main blob) is 0.5388% — 0.01 points
 *      SMALLER than the shoe it would have to be caught alongside.
 *      Other confirmed collision pairs sit within 0.005 points of each
 *      other (reverse-lunge's shoe at 0.2109% vs. band-row's real torso
 *      pocket at 0.2156%; close-grip-lat-pulldown's shoe at 0.2151% —
 *      all visually confirmed by rendering the flagged pixels, not
 *      assumed from position or shape: neither position-in-frame
 *      (lying/seated exercises put shoes at arbitrary heights) nor
 *      bbox-fill-ratio (both elongated and compact shoe fragments were
 *      found) reliably separates the two classes either.
 *
 * DECISION: POCKET_AREA_FRACTION stays at 0.01 (1%), unchanged from the
 * first pocket-removal fix. Lowering it measurably erodes real shoe
 * artwork somewhere in the library — confirmed, not hypothetical — for
 * a benefit that the dilation fix already captures almost all of.
 * band-lateral-raise frame 4 keeps one small residual sliver (~0.54% of
 * frame area, upper-torso height) as a known, recorded limitation: a
 * second real gap the flood-fill can't reach and area-threshold removal
 * can't safely touch. Same category as the dark-equipment-contrast
 * limitation already recorded above — a source-render fix (tightening
 * the band-line-to-torso clearance in the prompt for this exercise)
 * fixes it honestly; a lower compositing threshold would only trade it
 * for new, less-visible defects spread across other exercises' shoes.
 */
const POCKET_AREA_FRACTION = 0.01

const args = process.argv.slice(2)
const only = args.flatMap((a, i) => (a === '--only' && args[i + 1] ? [args[i + 1]] : []))
const compareWebp = args.includes('--compare-webp')
const calibrate = args.includes('--calibrate')

// ---------- helpers ----------
const kb = f => (statSync(f).size / 1024).toFixed(0) + ' KB'

function frameCountFromPrompt(id) {
  const text = readFileSync(join(ROOT, id, 'prompt.md'), 'utf8')
  const m = text.match(/Number of frames:\s*(\d+)/)
  if (!m) throw new Error('prompt.md has no "Number of frames:"')
  return Number(m[1])
}

/** Per-column count of non-background pixels. */
function inkProfile({ width, height, rgb }) {
  const ink = new Uint32Array(width)
  for (let y = 0; y < height; y++) {
    const row = y * width * 3
    for (let x = 0; x < width; x++) {
      const o = row + x * 3
      if (rgb[o] < WHITE || rgb[o + 1] < WHITE || rgb[o + 2] < WHITE) ink[x]++
    }
  }
  return ink
}

/** Midpoints of the N-1 widest interior white runs, left-to-right. */
function findCuts(ink, width, frames) {
  const runs = []
  let start = -1
  for (let x = 0; x <= width; x++) {
    const white = x < width && ink[x] <= INK_TOL
    if (white && start === -1) start = x
    if (!white && start !== -1) {
      runs.push({ start, end: x, width: x - start })
      start = -1
    }
  }
  const interior = runs.filter(r => r.start > 0 && r.end < width && r.width >= MIN_GUTTER)
  if (interior.length >= frames - 1)
    return {
      mode: 'gutter',
      cuts: interior
        .sort((a, b) => b.width - a.width)
        .slice(0, frames - 1)
        .sort((a, b) => a.start - b.start)
        .map(r => r.start + Math.floor(r.width / 2)),
    }

  // Fallback: equipment or bodies span the gutters (continuous pull-up bar,
  // lying figures, benches). Cut at the minimum-ink column near each
  // expected equal-width position — through the bar at its thinnest point.
  const frameW = width / frames
  const window = Math.floor(frameW / 4)
  const cuts = []
  for (let i = 1; i < frames; i++) {
    const center = Math.round(i * frameW)
    let best = center
    for (let x = Math.max(1, center - window); x <= Math.min(width - 2, center + window); x++)
      if (ink[x] < ink[best]) best = x
    // widen to the middle of the minimal plateau for a stable cut
    let a = best
    while (a > 1 && ink[a - 1] === ink[best]) a--
    let b = best
    while (b < width - 2 && ink[b + 1] === ink[best]) b++
    cuts.push(Math.floor((a + b) / 2))
  }
  return { mode: 'min-ink', cuts }
}

/** Slice [x0,x1) and trim to content + FRAME_PAD each side. */
function slice(img, x0, x1, ink) {
  let a = x0
  while (a < x1 && ink[a] <= INK_TOL) a++
  let b = x1 - 1
  while (b > a && ink[b] <= INK_TOL) b--
  a = Math.max(x0, a - FRAME_PAD)
  b = Math.min(x1 - 1, b + FRAME_PAD)
  const w = b - a + 1
  const out = Buffer.alloc(w * img.height * 3)
  for (let y = 0; y < img.height; y++)
    img.rgb.copy(out, y * w * 3, (y * img.width + a) * 3, (y * img.width + b + 1) * 3)
  return encodePngRgb(w, img.height, out)
}

function toAvif(srcPng, dest, resizeMax) {
  const resize = resizeMax ? ['-resize', `${resizeMax}x${resizeMax}>`] : []
  execFileSync('magick', [srcPng, ...resize, '-quality', AVIF_QUALITY, dest])
}

/** True if an RGB pixel is within MATTE_FUZZ_FRACTION's distance of pure white — same metric ImageMagick's -fuzz applies. */
function isNearWhite(r, g, b) {
  const dr = 255 - r, dg = 255 - g, db = 255 - b
  return Math.sqrt(dr * dr + dg * dg + db * db) <= MATTE_FUZZ_FRACTION * 255 * Math.sqrt(3)
}

/** Border flood-fill only (matte stage 1) — decodes the result, no pocket removal. */
function borderFloodFill(srcPng, floodedPng) {
  execFileSync('magick', [
    srcPng,
    '-alpha', 'set',
    '-bordercolor', 'white',
    '-border', '3',
    '-fuzz', MATTE_FUZZ,
    '-fill', 'none',
    '-floodfill', '+0+0', 'white',
    '-shave', '3x3',
    floodedPng,
  ])
  const decoded = decodePngRgba(readFileSync(floodedPng))
  rmSync(floodedPng, { force: true })
  return decoded
}

const MATTE_DILATE_RADIUS = 3 // px — see findNearWhiteComponents(); 3px merged every known-bad case tested, and 4-5px changed nothing further, so it's the minimal sufficient bridge, not a guess

function nearWhiteMask(rgba, width, height) {
  const n = width * height
  const mask = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    const o = i * 4
    mask[i] = rgba[o + 3] >= 128 && isNearWhite(rgba[o], rgba[o + 1], rgba[o + 2]) ? 1 : 0
  }
  return mask
}

/** Separable box dilation (horizontal pass, then vertical) of a boolean pixel mask by `radius`. */
function boxDilate(mask, width, height, radius) {
  const h = new Uint8Array(width * height)
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      let v = 0
      for (let dx = -radius; dx <= radius && !v; dx++) {
        const xx = x + dx
        if (xx >= 0 && xx < width && mask[y * width + xx]) v = 1
      }
      h[y * width + x] = v
    }
  const out = new Uint8Array(width * height)
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      let v = 0
      for (let dy = -radius; dy <= radius && !v; dy++) {
        const yy = y + dy
        if (yy >= 0 && yy < height && h[yy * width + x]) v = 1
      }
      out[y * width + x] = v
    }
  return out
}

/**
 * Connected components of opaque, near-white pixels in an RGBA buffer,
 * grouped through a small dilation first (see MATTE_DILATE_RADIUS) so
 * pixels that are visually one contiguous region but algorithmically
 * split by a thin anti-aliasing seam — a gradient edge a pixel or two
 * wide, just outside the fuzz tolerance — count as one component.
 *
 * This is the fix for the band-lateral-raise survivor defect: its
 * enclosed pocket wasn't several separate small components each under
 * the removal threshold, it was ONE ~10%-of-image triangle that plain
 * 4-connectivity fragmented into six pieces along thin seams. Without
 * merging, "lower the area threshold" and "don't erase legitimate
 * near-white content" are in direct conflict — real pockets and
 * legitimate white equipment (shoes) turned out to overlap in size once
 * measured (shoe fragments up to ~0.53% of frame area, smaller real
 * pocket fragments as low as ~0.28%), so no single area threshold could
 * separate them reliably. Merging first removes that overlap at the
 * source: real pockets merge up into the multi-percent range (comfortably
 * above any reasonable threshold), while a shoe's internal fragments
 * (laces, sole lines, logo gaps) merge into one shoe-shaped blob capped
 * by the shoe's own extent, not by chance proximity to a threshold.
 *
 * Reported size is always the count of TRUE near-white pixels within a
 * merged group, never the dilated halo — dilation only decides what
 * counts as "the same component," never what gets removed.
 */
function findNearWhiteComponents(rgba, width, height) {
  const n = width * height
  const mask = nearWhiteMask(rgba, width, height)
  const dilated = boxDilate(mask, width, height, MATTE_DILATE_RADIUS)
  const visited = new Uint8Array(n)
  const stack = new Int32Array(n)
  const components = []
  for (let start = 0; start < n; start++) {
    if (visited[start] || !dilated[start]) { visited[start] = 1; continue }
    visited[start] = 1
    const members = [start]
    let sp = 0
    stack[sp++] = start
    while (sp > 0) {
      const idx = stack[--sp]
      const x = idx % width, y = (idx / width) | 0
      const neighbors = []
      if (x > 0) neighbors.push(idx - 1)
      if (x < width - 1) neighbors.push(idx + 1)
      if (y > 0) neighbors.push(idx - width)
      if (y < height - 1) neighbors.push(idx + width)
      for (const nb of neighbors) {
        if (visited[nb] || !dilated[nb]) continue
        visited[nb] = 1
        stack[sp++] = nb
        members.push(nb)
      }
    }
    let minY = height, maxY = 0
    const pixels = []
    for (const idx of members) {
      if (!mask[idx]) continue
      pixels.push(idx)
      const y = (idx / width) | 0
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
    if (pixels.length) components.push({ size: pixels.length, pixels, minYFraction: minY / height, maxYFraction: maxY / height })
  }
  return components
}

/** Zeroes alpha on every near-white component ≥ POCKET_AREA_FRACTION of the image; returns their sizes for logging. */
function removePockets(rgba, width, height) {
  const threshold = Math.round(width * height * POCKET_AREA_FRACTION)
  const large = findNearWhiteComponents(rgba, width, height).filter(c => c.size >= threshold)
  for (const c of large) for (const idx of c.pixels) rgba[idx * 4 + 3] = 0
  return large.map(c => c.size)
}

/** Post-removal QA scan — should always return [] if removePockets did its job; a non-empty result is a bug, not an art problem. */
function remainingPockets(rgba, width, height) {
  const threshold = Math.round(width * height * POCKET_AREA_FRACTION)
  return findNearWhiteComponents(rgba, width, height).filter(c => c.size >= threshold).map(c => c.size)
}

const qaFlags = []

/**
 * Background-removal matte, two stages:
 *   1. Flood-fill transparency in from the image border (guaranteed
 *      background after padding it white) — not a global white
 *      threshold, since that punches holes in near-white highlights
 *      *inside* the figure (hair sheen, metal weight reflections) that
 *      aren't contiguous with the true background.
 *   2. Remove enclosed background pockets the border flood-fill can't
 *      reach — near-white regions fully surrounded by ink (band lines,
 *      gaps between plates and a bar). Components are grouped through a
 *      small dilation first (see findNearWhiteComponents) so one visual
 *      pocket fragmented by thin anti-aliasing seams still counts as one
 *      component, then removed by size, so small near-white components
 *      (genuine specular highlights, and — per POCKET_AREA_FRACTION's
 *      calibration-evidence comment — legitimate white equipment like
 *      shoes) survive. Found in production on band-lateral-raise: two
 *      triangles of baked-white between the band lines and the body,
 *      never touching the frame edge, so stage 1 alone left them opaque;
 *      the fragmentation fix then found those "two" triangles were
 *      really six-plus disconnected pieces each below the original
 *      removal threshold.
 * Approved design direction (Phase B prototype batch) replacing the
 * baked-white treatment; AVIF's alpha channel carries the result through
 * to runtime.
 */
function matte(srcPng, destPng, label) {
  const floodedPng = `${destPng}.flood.png`
  const { width, height, rgba } = borderFloodFill(srcPng, floodedPng)

  const area = width * height
  const removed = removePockets(rgba, width, height)
  for (const size of removed)
    console.log(`     pocket removed: ${label} — ${size}px (${((size / area) * 100).toFixed(1)}% of image)`)

  const remaining = remainingPockets(rgba, width, height)
  for (const size of remaining)
    qaFlags.push(`${label}: ${size}px (${((size / area) * 100).toFixed(1)}%) still opaque near-white after matte`)

  writeFileSync(destPng, encodePngRgba(width, height, rgba))
}

// ---------- per-exercise ----------
function convert(id, tmp) {
  const dir = join(ROOT, id)
  const refPng = join(dir, 'reference.png')
  if (!existsSync(refPng)) throw new Error('no reference.png')

  const frames = frameCountFromPrompt(id)
  const img = decodePng(readFileSync(refPng))
  const ink = inkProfile(img)
  const { mode, cuts } = findCuts(ink, img.width, frames)

  const framesDir = join(dir, 'frames')
  mkdirSync(framesDir, { recursive: true })
  const bounds = [0, ...cuts, img.width]
  const report = []

  const mattedFrames = {}
  for (let k = 1; k <= frames; k++) {
    const png = slice(img, bounds[k - 1], bounds[k], ink)
    const tmpPng = join(tmp, `${id}-${k}.png`)
    writeFileSync(tmpPng, png)
    const tmpAlpha = join(tmp, `${id}-${k}-alpha.png`)
    matte(tmpPng, tmpAlpha, `${id} frame ${k}`)
    mattedFrames[k] = tmpAlpha
    const dest = join(framesDir, `${String(k).padStart(2, '0')}.avif`)
    toAvif(tmpAlpha, dest)
    report.push(`frame ${k}: ${kb(dest)}`)
  }

  const refAlpha = join(tmp, `${id}-ref-alpha.png`)
  matte(refPng, refAlpha, `${id} reference`)
  toAvif(refAlpha, join(dir, 'reference.avif'))
  const thumbFrame = Math.min(frames, Math.floor(frames / 2) + 1)
  toAvif(mattedFrames[thumbFrame], join(dir, 'thumbnail.avif'), THUMB_MAX)

  if (compareWebp) {
    const w = join(tmp, `${id}-ref.webp`)
    execFileSync('cwebp', ['-quiet', '-q', '80', refPng, '-o', w])
    report.push(`webp-compare reference: ${kb(w)}`)
  }

  const metadata = {
    exerciseId: id,
    version: 1,
    media: { frameCount: frames, thumbnailFrame: thumbFrame },
    credits: { source: 'gpt-5.6-sol', generated: TODAY },
  }
  writeFileSync(join(dir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n')

  return {
    id,
    frames,
    thumbFrame,
    cuts,
    mode,
    sizes: {
      refPng: kb(refPng),
      refAvif: kb(join(dir, 'reference.avif')),
      thumb: kb(join(dir, 'thumbnail.avif')),
    },
    report,
  }
}

// ---------- calibration ----------
/**
 * Sweeps every source render (every frame + reference, all exercises,
 * ignoring --only) and measures every near-white opaque component
 * surviving the border flood-fill, before any pocket removal runs. Used
 * to set POCKET_AREA_FRACTION by evidence — see the header comment for
 * the recorded result — rather than by guessing a number. Read-only:
 * writes nothing under public/assets/exercises, only scratch temp files.
 */
function runCalibration(allIds, tmp) {
  const samples = []
  for (const id of allIds) {
    const dir = join(ROOT, id)
    const refPng = join(dir, 'reference.png')
    let frames, img, ink, cuts
    try {
      frames = frameCountFromPrompt(id)
      img = decodePng(readFileSync(refPng))
      ink = inkProfile(img)
      ;({ cuts } = findCuts(ink, img.width, frames))
    } catch (err) {
      console.error(`SKIP ${id} — ${err.message}`)
      continue
    }
    const bounds = [0, ...cuts, img.width]
    for (let k = 1; k <= frames; k++) {
      const png = slice(img, bounds[k - 1], bounds[k], ink)
      const tmpPng = join(tmp, `${id}-${k}-cal.png`)
      writeFileSync(tmpPng, png)
      const floodedPng = join(tmp, `${id}-${k}-cal-flood.png`)
      const { width, height, rgba } = borderFloodFill(tmpPng, floodedPng)
      const area = width * height
      for (const c of findNearWhiteComponents(rgba, width, height))
        samples.push({ label: `${id} frame ${k}`, size: c.size, fraction: c.size / area, minY: c.minYFraction, maxY: c.maxYFraction })
    }
    const floodedRef = join(tmp, `${id}-cal-ref-flood.png`)
    const { width: rw, height: rh, rgba: rrgba } = borderFloodFill(refPng, floodedRef)
    const rArea = rw * rh
    for (const c of findNearWhiteComponents(rrgba, rw, rh))
      samples.push({ label: `${id} reference`, size: c.size, fraction: c.size / rArea, minY: c.minYFraction, maxY: c.maxYFraction })
  }

  samples.sort((a, b) => b.fraction - a.fraction)
  console.log(`\ncalibration: ${samples.length} near-white components across ${allIds.length} exercises (post border-flood-fill, pre-removal)\n`)
  console.log('largest 50 components — label, % of image, px:')
  for (const s of samples.slice(0, 50))
    console.log(`  ${(s.fraction * 100).toFixed(3)}%  ${s.size}px  ${s.label}`)

  const buckets = [0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 1, 2, 5, 10, 100]
  console.log('\nhistogram — components per (%,%] bucket of image area:')
  let prev = 0
  for (const b of buckets) {
    const count = samples.filter(s => s.fraction * 100 > prev && s.fraction * 100 <= b).length
    if (count) console.log(`  (${prev}%, ${b}%]: ${count}`)
    prev = b
  }

  // Full sample dump for offline analysis — not needed by the run itself,
  // just a diagnostic escape hatch for picking the threshold by evidence.
  if (process.env.CALIBRATION_JSON_OUT) {
    writeFileSync(process.env.CALIBRATION_JSON_OUT, JSON.stringify(samples))
    console.log(`\nfull sample dump: ${samples.length} rows → ${process.env.CALIBRATION_JSON_OUT}`)
  }
}

// ---------- manifest ----------
function buildManifest() {
  const manifest = {}
  for (const d of readdirSync(ROOT, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name.startsWith('_')) continue
    const metaFile = join(ROOT, d.name, 'metadata.json')
    if (!existsSync(metaFile)) continue
    const meta = JSON.parse(readFileSync(metaFile, 'utf8'))
    if (meta.media) manifest[d.name] = meta.media // projection: media only
  }
  mkdirSync(dirname(MANIFEST), { recursive: true })
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
  return Object.keys(manifest).length
}

// ---------- main ----------
const ids = only.length
  ? only
  : readdirSync(ROOT, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('_'))
      .map(d => d.name)
      .filter(id => existsSync(join(ROOT, id, 'reference.png')))
      .sort()

const tmp = join(tmpdir(), `fit223-convert-${process.pid}`)
mkdirSync(tmp, { recursive: true })

if (calibrate) {
  // Always sweeps every exercise, ignoring --only — a calibration run
  // needs the full population to find the true max genuine highlight.
  const allIds = readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .map(d => d.name)
    .filter(id => existsSync(join(ROOT, id, 'reference.png')))
    .sort()
  runCalibration(allIds, tmp)
  rmSync(tmp, { recursive: true, force: true })
  process.exit(0)
}

let failed = 0
for (const id of ids) {
  try {
    const r = convert(id, tmp)
    console.log(`OK   ${id} — ${r.frames} frames [${r.mode}] (cuts at ${r.cuts.join(', ')}), thumb=frame ${r.thumbFrame}`)
    console.log(`     png ${r.sizes.refPng} → avif ${r.sizes.refAvif}, thumbnail ${r.sizes.thumb}`)
    r.report.forEach(line => console.log(`     ${line}`))
  } catch (err) {
    console.error(`FAIL ${id} — ${err.message}`)
    failed++
  }
}

const entries = buildManifest()
console.log(`manifest: ${entries} entr${entries === 1 ? 'y' : 'ies'} → ${MANIFEST}`)

if (qaFlags.length) {
  console.error(`\nQA: ${qaFlags.length} file(s) still show an opaque near-white component ≥ ${(POCKET_AREA_FRACTION * 100).toFixed(0)}% of image area after matte:`)
  qaFlags.forEach(f => console.error(`  FLAGGED  ${f}`))
} else {
  console.log(`\nQA: 0 flagged — no matted asset has a background pocket ≥ ${(POCKET_AREA_FRACTION * 100).toFixed(0)}% of image area. This is the acceptance bar for a conversion run.`)
}

rmSync(tmp, { recursive: true, force: true })
process.exit(failed || qaFlags.length ? 1 : 0)
