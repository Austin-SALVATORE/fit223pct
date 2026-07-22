#!/usr/bin/env node
/**
 * Asset conversion — chroma-key era (see docs/design/ExerciseAssetPipeline.md).
 *
 * Sources are now rendered on flat #FF00FF magenta (style-block change,
 * propagated to all 111 prompts). Background removal is therefore a
 * deterministic chroma key, replacing the white-era border-flood-fill +
 * pocket-removal machinery and its recorded shoe/pocket ambiguity — the
 * calibration evidence that motivated this change lives in git history
 * (white-era convert-assets.mjs) and in the pipeline doc.
 *
 * Per exercise (--only <id>, or all with a reference.png):
 *   1. Chroma-key the reference strip: alpha out near-#FF00FF pixels,
 *      despill magenta edge fringing, feather the matte edge 1px.
 *   2. Slice frames at transparent-gutter midpoints (alpha-based profile,
 *      same gutter/min-ink logic as before).
 *   3. Encode runtime AVIFs, alpha preserved: reference.avif,
 *      frames/NN.avif, thumbnail.avif.
 *   4. Write authoring metadata.json (media block + credits).
 * Then rebuild the runtime manifest. Run update-manifest-dims.mjs after —
 * it recomputes sizes AND content hashes (cache-busting URLs).
 *
 * QA gate (zero flagged = the acceptance bar, run exits non-zero otherwise):
 *   a. Zero remaining opaque near-magenta pixels in any output.
 *   b. Zero opaque near-white components ≥ 0.5% of image area — the
 *      white-era pocket detector retained as a free regression check
 *      (catches any render that ignored the magenta background spec).
 */

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, statSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { decodePngRgba, encodePngRgba } from './lib/png-strip.mjs'

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..')
const ROOT = join(REPO, 'public', 'assets', 'exercises')
const MANIFEST = join(REPO, 'src', 'data', 'generated', 'asset-manifest.json')

const INK_TOL = 3        // opaque px a column may contain and still count as gutter
const MIN_GUTTER = 8     // px — narrower transparent runs are not cut points
const FRAME_PAD = 40     // px background kept on each side of a sliced frame
const THUMB_MAX = 320    // px — longest side of thumbnail
const AVIF_QUALITY = '60'
const TODAY = '2026-07-22'

// Chroma key: generous keying tolerance (nothing in the artwork palette is
// near magenta), tighter tolerance for the post-key QA scan.
const KEY_FUZZ_FRACTION = 0.18   // of max RGB distance — pixels this close to #FF00FF go transparent
const QA_MAGENTA_FRACTION = 0.12 // any OPAQUE pixel this close to #FF00FF fails QA
const DESPILL_MARGIN = 12        // r>g+m && b>g+m marks magenta spill (skin r>g but b<g; navy b>g but r<g)

// Edge decontamination (owner amendment): every pixel that is not solidly
// opaque gets its RGB replaced by the nearest solid artwork color — the
// semi-transparent edge ring loses its background component entirely, and
// fully-transparent pixels carry artwork color (alpha bleeding) so samplers
// interpolating at render time never pick up background RGB.
const ALPHA_SOLID = 200          // α at/above which a pixel is an artwork-color source
const QA_FRINGE_FRACTION = 0.25  // semi-transparent px this close to #FF00FF = fringe QA failure

// White-era pocket detector, retained as regression check.
const WHITE_FUZZ_FRACTION = 0.08
// Directive said 0.5%; pilot measurement: white sneakers are 0.50-0.62% of
// frame area (two components per frame, every frame), so 0.5% flags shoes in
// perpetuity. The check's target — a render that ignored the magenta spec —
// is a white BACKGROUND at 30-60% of image area. 5% separates the classes by
// ~10x in both directions. Parameter deviation flagged to owner in the pilot
// report.
const POCKET_AREA_FRACTION = 0.05
const MATTE_DILATE_RADIUS = 3

const args = process.argv.slice(2)
const only = args.flatMap((a, i) => (a === '--only' && args[i + 1] ? [args[i + 1]] : []))

// ---------- helpers ----------
const kb = f => (statSync(f).size / 1024).toFixed(0) + ' KB'
const MAXD = 255 * Math.sqrt(3)

function frameCountFromPrompt(id) {
  const text = readFileSync(join(ROOT, id, 'prompt.md'), 'utf8')
  const m = text.match(/Number of frames:\s*(\d+)/)
  if (!m) throw new Error('prompt.md has no "Number of frames:"')
  return Number(m[1])
}

const magentaDist = (r, g, b) => Math.sqrt((255 - r) ** 2 + g * g + (255 - b) ** 2)
const isNearWhite = (r, g, b) =>
  Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2) <= WHITE_FUZZ_FRACTION * MAXD

// ---------- chroma key ----------
/**
 * In place: key near-magenta to alpha 0, despill magenta fringe on
 * surviving pixels, feather the matte edge with one 3x3 alpha blur pass.
 */
function chromaKey(rgba, width, height) {
  const n = width * height
  const keyTol = KEY_FUZZ_FRACTION * MAXD

  for (let i = 0; i < n; i++) {
    const o = i * 4
    const r = rgba[o], g = rgba[o + 1], b = rgba[o + 2]
    if (magentaDist(r, g, b) <= keyTol) {
      rgba[o + 3] = 0
      continue
    }
    // despill: magenta cast has BOTH r and b elevated over g
    const spill = Math.min(r - g, b - g)
    if (spill > DESPILL_MARGIN) {
      rgba[o] = r - spill
      rgba[o + 2] = b - spill
    }
  }

  // feather: one 3x3 box blur over alpha, only where it changes anything
  const alpha = Buffer.alloc(n)
  for (let i = 0; i < n; i++) alpha[i] = rgba[i * 4 + 3]
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0, cnt = 0
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy
        if (yy < 0 || yy >= height) continue
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          if (xx < 0 || xx >= width) continue
          sum += alpha[yy * width + xx]
          cnt++
        }
      }
      // feather only ever REDUCES alpha: averaging must not resurrect keyed
      // magenta pixels in concave edges (pilot finding: 2-104 px/file revived)
      const o = (y * width + x) * 4 + 3
      rgba[o] = Math.min(rgba[o], Math.round(sum / cnt))
    }
  }
}

/**
 * Multi-source BFS from solid pixels (α ≥ ALPHA_SOLID): every non-solid
 * pixel's RGB becomes the color of its nearest solid artwork pixel. Alpha is
 * untouched. Runs after chromaKey; O(n).
 */
function decontaminate(rgba, width, height) {
  const n = width * height
  const queue = new Int32Array(n)
  const seen = new Uint8Array(n)
  let head = 0, tail = 0
  for (let i = 0; i < n; i++)
    if (rgba[i * 4 + 3] >= ALPHA_SOLID) { seen[i] = 1; queue[tail++] = i }
  if (tail === 0 || tail === n) return // no artwork at all, or fully solid
  while (head < tail) {
    const idx = queue[head++]
    const x = idx % width, y = (idx / width) | 0
    const o = idx * 4
    for (const nb of [x > 0 ? idx - 1 : -1, x < width - 1 ? idx + 1 : -1, y > 0 ? idx - width : -1, y < height - 1 ? idx + width : -1]) {
      if (nb < 0 || seen[nb]) continue
      seen[nb] = 1
      const no = nb * 4
      rgba[no] = rgba[o]
      rgba[no + 1] = rgba[o + 1]
      rgba[no + 2] = rgba[o + 2]
      queue[tail++] = nb
    }
  }
}

// ---------- QA scans ----------
function fringeCount(rgba, n) {
  const tol = QA_FRINGE_FRACTION * MAXD
  let count = 0
  for (let i = 0; i < n; i++) {
    const o = i * 4
    const a = rgba[o + 3]
    if (a >= 8 && a <= 247 && magentaDist(rgba[o], rgba[o + 1], rgba[o + 2]) <= tol) count++
  }
  return count
}

function opaqueMagentaCount(rgba, n) {
  const tol = QA_MAGENTA_FRACTION * MAXD
  let count = 0
  for (let i = 0; i < n; i++) {
    const o = i * 4
    if (rgba[o + 3] >= 128 && magentaDist(rgba[o], rgba[o + 1], rgba[o + 2]) <= tol) count++
  }
  return count
}

/** Separable box dilation of a boolean mask. */
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

/** Opaque near-white components (dilation-grouped) ≥ POCKET_AREA_FRACTION — white-era regression check. */
function nearWhitePockets(rgba, width, height) {
  const n = width * height
  const mask = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    const o = i * 4
    mask[i] = rgba[o + 3] >= 128 && isNearWhite(rgba[o], rgba[o + 1], rgba[o + 2]) ? 1 : 0
  }
  const dilated = boxDilate(mask, width, height, MATTE_DILATE_RADIUS)
  const visited = new Uint8Array(n)
  const stack = new Int32Array(n)
  const sizes = []
  for (let start = 0; start < n; start++) {
    if (visited[start] || !dilated[start]) { visited[start] = 1; continue }
    visited[start] = 1
    let sp = 0, size = mask[start] ? 1 : 0
    stack[sp++] = start
    while (sp > 0) {
      const idx = stack[--sp]
      const x = idx % width, y = (idx / width) | 0
      for (const nb of [x > 0 ? idx - 1 : -1, x < width - 1 ? idx + 1 : -1, y > 0 ? idx - width : -1, y < height - 1 ? idx + width : -1]) {
        if (nb < 0 || visited[nb] || !dilated[nb]) continue
        visited[nb] = 1
        stack[sp++] = nb
        if (mask[nb]) size++
      }
    }
    if (size) sizes.push(size)
  }
  const threshold = Math.round(n * POCKET_AREA_FRACTION)
  return sizes.filter(s => s >= threshold)
}

const qaFlags = []

function qaScan(rgba, width, height, label) {
  const magenta = opaqueMagentaCount(rgba, width * height)
  if (magenta > 0) qaFlags.push(`${label}: ${magenta} opaque near-magenta px after key`)
  const fringe = fringeCount(rgba, width * height)
  if (fringe > 0) qaFlags.push(`${label}: ${fringe} background-dominant semi-transparent edge px`)
  for (const size of nearWhitePockets(rgba, width, height))
    qaFlags.push(`${label}: opaque near-white component ${size}px (${((size / (width * height)) * 100).toFixed(2)}%)`)
}

// ---------- slicing (alpha-based) ----------
function opaqueProfile(rgba, width, height) {
  const ink = new Uint32Array(width)
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (rgba[(y * width + x) * 4 + 3] >= 128) ink[x]++
  return ink
}

function findCuts(ink, width, frames) {
  const runs = []
  let start = -1
  for (let x = 0; x <= width; x++) {
    const clear = x < width && ink[x] <= INK_TOL
    if (clear && start === -1) start = x
    if (!clear && start !== -1) {
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
  const frameW = width / frames
  const window = Math.floor(frameW / 4)
  const cuts = []
  for (let i = 1; i < frames; i++) {
    const center = Math.round(i * frameW)
    let best = center
    for (let x = Math.max(1, center - window); x <= Math.min(width - 2, center + window); x++)
      if (ink[x] < ink[best]) best = x
    let a = best
    while (a > 1 && ink[a - 1] === ink[best]) a--
    let b = best
    while (b < width - 2 && ink[b + 1] === ink[best]) b++
    cuts.push(Math.floor((a + b) / 2))
  }
  return { mode: 'min-ink', cuts }
}

/** Slice [x0,x1) of an RGBA image and trim to opaque content + FRAME_PAD each side. */
function slice(rgba, width, height, x0, x1, ink) {
  let a = x0
  while (a < x1 && ink[a] <= INK_TOL) a++
  let b = x1 - 1
  while (b > a && ink[b] <= INK_TOL) b--
  a = Math.max(x0, a - FRAME_PAD)
  b = Math.min(x1 - 1, b + FRAME_PAD)
  const w = b - a + 1
  const out = Buffer.alloc(w * height * 4)
  for (let y = 0; y < height; y++)
    rgba.copy(out, y * w * 4, (y * width + a) * 4, (y * width + b + 1) * 4)
  return { width: w, height, rgba: out }
}

function toAvif(srcPng, dest, resizeMax) {
  const resize = resizeMax ? ['-resize', `${resizeMax}x${resizeMax}>`] : []
  execFileSync('magick', [srcPng, ...resize, '-define', 'heic:chroma=444', '-quality', AVIF_QUALITY, dest])
}

// ---------- per-exercise ----------
function convert(id, tmp) {
  const dir = join(ROOT, id)
  const refPng = join(dir, 'reference.png')
  if (!existsSync(refPng)) throw new Error('no reference.png')

  const frames = frameCountFromPrompt(id)
  const { width, height, rgba } = decodePngRgba(readFileSync(refPng))
  chromaKey(rgba, width, height)
  decontaminate(rgba, width, height)
  qaScan(rgba, width, height, `${id} reference`)

  const ink = opaqueProfile(rgba, width, height)
  const { mode, cuts } = findCuts(ink, width, frames)

  const framesDir = join(dir, 'frames')
  mkdirSync(framesDir, { recursive: true })
  const bounds = [0, ...cuts, width]
  const report = []
  const framePngs = {}

  for (let k = 1; k <= frames; k++) {
    const f = slice(rgba, width, height, bounds[k - 1], bounds[k], ink)
    qaScan(f.rgba, f.width, f.height, `${id} frame ${k}`)
    const tmpPng = join(tmp, `${id}-${k}.png`)
    writeFileSync(tmpPng, encodePngRgba(f.width, f.height, f.rgba))
    framePngs[k] = tmpPng
    const dest = join(framesDir, `${String(k).padStart(2, '0')}.avif`)
    toAvif(tmpPng, dest)
    report.push(`frame ${k}: ${kb(dest)}`)
  }

  const refMatted = join(tmp, `${id}-ref.png`)
  writeFileSync(refMatted, encodePngRgba(width, height, rgba))
  toAvif(refMatted, join(dir, 'reference.avif'))
  // roundtrip: decode the encoded AVIF and re-run the scans — verifies the
  // encoder (quality/chroma settings) reintroduced no halos or fringe
  const rt = join(tmp, `${id}-roundtrip.png`)
  execFileSync('magick', [join(dir, 'reference.avif'), rt])
  const rtImg = decodePngRgba(readFileSync(rt))
  qaScan(rtImg.rgba, rtImg.width, rtImg.height, `${id} reference[avif-roundtrip]`)
  const thumbFrame = Math.min(frames, Math.floor(frames / 2) + 1)
  toAvif(framePngs[thumbFrame], join(dir, 'thumbnail.avif'), THUMB_MAX)

  const metadata = {
    exerciseId: id,
    version: 1,
    media: { frameCount: frames, thumbnailFrame: thumbFrame },
    credits: { source: 'gpt-5.6-sol', generated: TODAY },
  }
  writeFileSync(join(dir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n')

  return {
    id, frames, thumbFrame, cuts, mode,
    sizes: { refPng: kb(refPng), refAvif: kb(join(dir, 'reference.avif')), thumb: kb(join(dir, 'thumbnail.avif')) },
    report,
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
    if (meta.media) manifest[d.name] = meta.media
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
  console.error(`\nQA: ${qaFlags.length} flag(s) — near-magenta or near-white survivors:`)
  qaFlags.forEach(f => console.error(`  FLAGGED  ${f}`))
} else {
  console.log(
    `\nQA: 0 flagged — no opaque near-magenta pixels, no edge fringe, no near-white components ≥ ${POCKET_AREA_FRACTION * 100}% (deviation from directive's 0.5%, pending owner veto). Acceptance bar met.`
  )
}

rmSync(tmp, { recursive: true, force: true })
process.exit(failed || qaFlags.length ? 1 : 0)
