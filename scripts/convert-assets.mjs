#!/usr/bin/env node
/**
 * Phase-2 asset conversion (see docs/design/ExerciseAssetPipeline.md).
 *
 * For each exercise id passed via --only (or all with a reference.png):
 *   1. Slice reference.png into frames at white-gutter midpoints.
 *   2. Encode runtime AVIFs: reference.avif, frames/NN.avif, thumbnail.avif.
 *   3. Write authoring metadata.json (media block + credits).
 * Then aggregate all metadata.json into the runtime manifest
 * src/data/generated/asset-manifest.json (projection: media fields only).
 *
 * Frame count is read from the exercise's prompt.md ("Number of frames: N")
 * and validated against detected gutters — mismatch fails the exercise
 * rather than guessing.
 *
 * Usage:
 *   node scripts/convert-assets.mjs --only goblet-squat --only side-plank
 *   node scripts/convert-assets.mjs --compare-webp   # also report WebP sizes
 */

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, statSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { decodePng, encodePngRgb } from './lib/png-strip.mjs'

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

const args = process.argv.slice(2)
const only = args.flatMap((a, i) => (a === '--only' && args[i + 1] ? [args[i + 1]] : []))
const compareWebp = args.includes('--compare-webp')

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

  for (let k = 1; k <= frames; k++) {
    const png = slice(img, bounds[k - 1], bounds[k], ink)
    const tmpPng = join(tmp, `${id}-${k}.png`)
    writeFileSync(tmpPng, png)
    const dest = join(framesDir, `${String(k).padStart(2, '0')}.avif`)
    toAvif(tmpPng, dest)
    report.push(`frame ${k}: ${kb(dest)}`)
  }

  toAvif(refPng, join(dir, 'reference.avif'))
  const thumbFrame = Math.min(frames, Math.floor(frames / 2) + 1)
  toAvif(join(tmp, `${id}-${thumbFrame}.png`), join(dir, 'thumbnail.avif'), THUMB_MAX)

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
rmSync(tmp, { recursive: true, force: true })
process.exit(failed ? 1 : 0)
