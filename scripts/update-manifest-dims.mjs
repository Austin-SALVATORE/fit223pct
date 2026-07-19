#!/usr/bin/env node
/**
 * Add image dimensions to each exercise's metadata.json media block and
 * rebuild the runtime manifest. Measures the committed AVIFs directly
 * (magick identify) — no re-encoding, no asset churn.
 *
 *   media.referenceSize: [w, h]        // reference.avif
 *   media.frameSizes:    [[w, h], ...] // frames/01..NN.avif, 1-indexed order
 *
 * Run after any conversion that changes frames. Idempotent.
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..')
const ROOT = join(REPO, 'public', 'assets', 'exercises')
const MANIFEST = join(REPO, 'src', 'data', 'generated', 'asset-manifest.json')

const dims = file => {
  const out = execFileSync('magick', ['identify', '-format', '%w %h', file]).toString()
  const [w, h] = out.trim().split(' ').map(Number)
  if (!w || !h) throw new Error(`bad dimensions for ${file}`)
  return [w, h]
}

const manifest = {}
let updated = 0

for (const d of readdirSync(ROOT, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!d.isDirectory() || d.name.startsWith('_')) continue
  const dir = join(ROOT, d.name)
  const metaFile = join(dir, 'metadata.json')
  if (!existsSync(metaFile)) continue

  const meta = JSON.parse(readFileSync(metaFile, 'utf8'))
  if (!meta.media) continue

  const refAvif = join(dir, 'reference.avif')
  if (!existsSync(refAvif)) {
    console.error(`SKIP ${d.name} — metadata.json but no reference.avif`)
    continue
  }

  const frameSizes = []
  for (let k = 1; k <= meta.media.frameCount; k++) {
    const f = join(dir, 'frames', `${String(k).padStart(2, '0')}.avif`)
    if (!existsSync(f)) throw new Error(`${d.name}: missing frame ${k}`)
    frameSizes.push(dims(f))
  }

  meta.media = { ...meta.media, referenceSize: dims(refAvif), frameSizes }
  writeFileSync(metaFile, JSON.stringify(meta, null, 2) + '\n')
  manifest[d.name] = meta.media
  updated++
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
console.log(`updated ${updated} metadata.json files; manifest rebuilt with ${Object.keys(manifest).length} entries`)
