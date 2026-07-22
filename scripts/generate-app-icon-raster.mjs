#!/usr/bin/env node
/**
 * One-off: render the PWA/touch icon raster set from the committed
 * vector mark (public/assets/brand/app-icon/mark.svg — the "23%"
 * Fraunces mark, see that file's header comment for provenance).
 *
 * Not part of any ongoing pipeline — the mark only changes on a
 * deliberate rebrand, at which point this gets re-run by hand and can
 * be deleted once its output is re-verified. Re-run with:
 *   node scripts/generate-app-icon-raster.mjs
 *
 * Outputs (all public/, all fully opaque — no alpha channel, including
 * apple-touch-icon.png, which iOS requires to be alpha-free or it can
 * render with a dark halo):
 *   pwa-192.png            192x192, rounded tile, mark at 72%
 *   pwa-512.png            512x512, rounded tile, mark at 72%
 *   pwa-512-maskable.png   512x512, full-bleed tile (no rounding —
 *                          the OS applies its own mask shape), mark
 *                          at 55% — the standard maskable safe zone is
 *                          a centered circle of 40% radius, and the
 *                          mark's own bounding-box corners (not just
 *                          its ink) must clear that circle: at 55% the
 *                          corner sits ~199px from center against a
 *                          ~205px safe radius on a 512 canvas; 58%
 *                          (bounding-box-only "≤60%") was tried first
 *                          but its corners land just outside the true
 *                          circular safe zone, so this went tighter
 *   apple-touch-icon.png   180x180, full-bleed tile (no rounding —
 *                          iOS applies its own), mark at 72%
 */

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..')
const MARK_SVG = join(REPO, 'public', 'assets', 'brand', 'app-icon', 'mark.svg')
const BG = '#191512'
const CORNER_RADIUS_RATIO = 14 / 64 // matches the prior placeholder favicon.svg's rounding

const TARGETS = [
  { file: 'pwa-192.png', size: 192, markScale: 0.72, rounded: true },
  { file: 'pwa-512.png', size: 512, markScale: 0.72, rounded: true },
  { file: 'pwa-512-maskable.png', size: 512, markScale: 0.55, rounded: false },
  { file: 'apple-touch-icon.png', size: 180, markScale: 0.72, rounded: false },
]

function readMarkViewBox(svg) {
  const match = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)
  if (!match) throw new Error('mark.svg: could not read viewBox')
  return { width: Number(match[1]), height: Number(match[2]) }
}

function markInnerMarkup(svg) {
  // Strip the outer <svg ...> wrapper and any leading <!-- --> header
  // comment, keeping only the <path> elements, so they can be re-wrapped
  // in a nested <svg> with per-target size/position.
  return svg
    .replace(/<!--[\s\S]*?-->/, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim()
}

function composeTile({ size, markScale, rounded }, markPaths, markViewBox) {
  const rx = rounded ? size * CORNER_RADIUS_RATIO : 0
  const box = size * markScale
  const offset = (size - box) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" ${rx ? `rx="${rx}"` : ''} fill="${BG}"/>
  <svg x="${offset}" y="${offset}" width="${box}" height="${box}" viewBox="0 0 ${markViewBox.width} ${markViewBox.height}">
    ${markPaths}
  </svg>
</svg>`
}

async function main() {
  const markSvg = readFileSync(MARK_SVG, 'utf8')
  const markViewBox = readMarkViewBox(markSvg)
  const markPaths = markInnerMarkup(markSvg)

  for (const target of TARGETS) {
    const svg = composeTile(target, markPaths, markViewBox)
    const outPath = join(REPO, 'public', target.file)
    await sharp(Buffer.from(svg))
      .resize(target.size, target.size)
      .flatten({ background: BG }) // guarantees full opacity...
      .removeAlpha() // ...and strips the alpha channel entirely
      .png()
      .toFile(outPath)
    console.log(`wrote ${target.file} (${target.size}x${target.size}, mark ${Math.round(target.markScale * 100)}%, ${target.rounded ? 'rounded' : 'full-bleed'})`)
  }
}

main()
