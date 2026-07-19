#!/usr/bin/env node
/**
 * Per-frame exercise reference generation + stitching.
 *
 * For each exercise, generates every frame described in its prompt.md as a
 * separate single-figure image (gpt-image-1, style-anchored on the approved
 * goblet-squat reference), then stitches the frames into one horizontal
 * strip saved as <id>/reference.png. Individual frames are kept in
 * <id>/frames/frame-<k>.png so a single bad frame can be deleted and
 * regenerated without redoing the whole strip.
 *
 * Skip rules per exercise:
 *   - reference.png exists and no frames/ dir  -> skipped (UI-approved asset)
 *   - frames/ exists                           -> generate missing frames, restitch
 *   - neither                                  -> full generation
 *   - --force                                  -> regenerate everything selected
 *
 * Usage:
 *   node scripts/generate-exercise-frames.mjs --dry-run
 *   node scripts/generate-exercise-frames.mjs --only cable-row --force
 *   node scripts/generate-exercise-frames.mjs --limit 10 --quality medium
 *   node scripts/generate-exercise-frames.mjs --only plank --stitch-only
 *
 * Auth: OPENAI_API_KEY env var, or ~/.fit223-openai-key file. Never logged.
 */

import { readFileSync, readdirSync, existsSync, writeFileSync, appendFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { stitchHorizontal } from './lib/png-strip.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'exercises')
const ANCHOR = join(ROOT, 'goblet-squat', 'reference.png')
const LOG = join(dirname(fileURLToPath(import.meta.url)), '..', 'generation-run.log')

const API_URL = 'https://api.openai.com/v1/images/edits'
const MODEL = 'gpt-image-1'
const THROTTLE_MS = 8_000
const MAX_RETRIES = 3
const GUTTER_PX = 32

// ---------- args ----------
const args = process.argv.slice(2)
const flag = name => args.includes(`--${name}`)
const value = name => {
  const i = args.indexOf(`--${name}`)
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null
}
const values = name =>
  args.flatMap((a, i) =>
    a === `--${name}` && args[i + 1] && !args[i + 1].startsWith('--') ? [args[i + 1]] : []
  )

const dryRun = flag('dry-run')
const force = flag('force')
const stitchOnly = flag('stitch-only')
const only = values('only')
const limit = value('limit') ? Number(value('limit')) : Infinity
const quality = value('quality') ?? 'medium'

if (!['low', 'medium', 'high'].includes(quality)) {
  console.error(`Invalid --quality "${quality}"`)
  process.exit(1)
}

// ---------- auth ----------
function loadKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY.trim()
  const f = join(homedir(), '.fit223-openai-key')
  return existsSync(f) ? readFileSync(f, 'utf8').trim() : null
}

// ---------- prompt parsing ----------
// The style block is byte-identical across all prompt.md files (enforced by
// the template + verifier), so exact-string markers are safe here.
const STRIP_OPENING =
  'Create one wide instructional fitness illustration: a single horizontal strip\n' +
  'showing the SAME person performing one repetition, read left to right.'
const SINGLE_OPENING =
  'Create one instructional fitness illustration: ONE single figure — one\n' +
  'person captured at one exact moment of an exercise repetition.'
const COMPOSITION_MARK = 'COMPOSITION:'
const EXCLUDE_MARK = 'STRICTLY EXCLUDE:'
const SINGLE_COMPOSITION =
  'COMPOSITION:\n' +
  'Exactly ONE figure, centered, standing on an invisible ground line. The\n' +
  'entire body is visible, including both feet and all equipment — nothing is\n' +
  'cropped or touched by any canvas edge. The figure fills about 80 percent\n' +
  'of the canvas height. Eye-level camera.\n\n'

function extractPrompt(file) {
  const text = readFileSync(file, 'utf8')
  const start = text.indexOf('```text')
  if (start === -1) throw new Error('no ```text fence')
  const bodyStart = start + '```text'.length
  const end = text.indexOf('```', bodyStart)
  if (end === -1) throw new Error('unterminated fence')
  return text.slice(bodyStart, end).trim()
}

function parsePrompt(prompt) {
  const movIdx = prompt.indexOf('MOVEMENT FOR THIS IMAGE:')
  if (movIdx === -1) throw new Error('no MOVEMENT block')
  const style = prompt.slice(0, movIdx)
  const movement = prompt.slice(movIdx)

  const framesIdx = movement.indexOf('\nFrames:')
  if (framesIdx === -1) throw new Error('no Frames: list')
  const header = movement.slice(0, framesIdx).trim()

  const techIdx = movement.indexOf('\nTECHNIQUE')
  const framesBlock = movement.slice(framesIdx + '\nFrames:'.length, techIdx === -1 ? undefined : techIdx)
  const technique = techIdx === -1 ? '' : movement.slice(techIdx).trim()

  const frames = framesBlock
    .split(/\n(?=\d+\.\s)/)
    .map(s => s.replace(/^\d+\.\s*/, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  if (!frames.length) throw new Error('empty frame list')

  // single-figure style transform (markers guaranteed by byte-identity)
  if (!style.includes(STRIP_OPENING)) throw new Error('style opening marker missing')
  const compIdx = style.indexOf(COMPOSITION_MARK)
  const exclIdx = style.indexOf(EXCLUDE_MARK)
  if (compIdx === -1 || exclIdx === -1) throw new Error('composition markers missing')
  const styleSingle =
    style.slice(0, compIdx).replace(STRIP_OPENING, SINGLE_OPENING) +
    SINGLE_COMPOSITION +
    style.slice(exclIdx)

  const camera = (header.match(/Camera:\s*([^\n]+)/) ?? [])[1] ?? ''
  return { styleSingle, header, frames, technique, camera }
}

function pickSize(camera) {
  return /bench-side|floor-side/.test(camera) ? '1536x1024' : '1024x1536'
}

function facingRule(camera) {
  if (/bench-side/.test(camera))
    return 'lying on the bench with the head end toward the LEFT edge of the canvas'
  if (/floor-side/.test(camera))
    return 'on the floor with the head toward the RIGHT edge of the canvas'
  if (/front/.test(camera) && !/three-quarter/.test(camera))
    return 'facing the viewer'
  return 'facing toward the RIGHT edge of the canvas'
}

function buildFramePrompt(parsed, k) {
  const n = parsed.frames.length
  // Neighbouring frame descriptions give the model motion context without an
  // image anchor (an attached pose image gets copied, killing progression).
  const prev = k > 1 ? `\nThe PREVIOUS moment (do not draw): ${parsed.frames[k - 2]}\n` : ''
  const next = k < n ? `The NEXT moment (do not draw): ${parsed.frames[k]}\n` : ''
  return (
    parsed.styleSingle +
    parsed.header +
    `\n\nThis image is FRAME ${k} of ${n} in the movement sequence. ` +
    `Depict EXACTLY this moment and no other:\n${parsed.frames[k - 1]}\n` +
    prev + next +
    '\n' + parsed.technique +
    `\n\nSCENE LOCK (identical in every frame of this sequence):\n` +
    `The figure is ${facingRule(parsed.camera)}. The equipment is drawn with ` +
    'the IDENTICAL design, shape, size, attachment, and position relative to ' +
    'the figure as in every other frame — as if the camera never moved and ' +
    'only the person moved. Never mirror or flip the scene.\n' +
    '\nEXACTLY ONE figure. Full body and all equipment inside the canvas. ' +
    'The pose must match the FRAME description above precisely — joint angles, ' +
    'equipment position, and body position are not negotiable.'
  )
}

// ---------- api ----------
async function callApi(key, prompt, size, anchors) {
  const form = new FormData()
  form.append('model', MODEL)
  form.append('size', size)
  form.append('quality', quality)
  form.append(
    'prompt',
    'Match the exact art style, character identity, rendering technique, and ' +
      'color palette of the FIRST attached image. Do NOT copy its pose, ' +
      'equipment, or layout.\n\n' + prompt
  )
  anchors.forEach((bytes, i) =>
    form.append('image[]', new Blob([bytes], { type: 'image/png' }), `anchor-${i}.png`)
  )
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '<unreadable>')
    const retryable = res.status === 429 || res.status >= 500
    throw Object.assign(new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`), { retryable })
  }
  const json = await res.json()
  const b64 = json?.data?.[0]?.b64_json
  if (!b64) throw new Error('no image data in response')
  return Buffer.from(b64, 'base64')
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
function log(line) {
  const stamped = `${new Date().toISOString()} ${line}`
  console.log(stamped)
  appendFileSync(LOG, stamped + '\n')
}

// ---------- work list ----------
function buildWorkList() {
  const dirs = readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .map(d => d.name)
    .sort()
  const work = []
  const skipped = []
  for (const id of dirs) {
    if (only.length && !only.includes(id)) continue
    const promptFile = join(ROOT, id, 'prompt.md')
    if (!existsSync(promptFile)) {
      skipped.push(`${id} (no prompt.md)`)
      continue
    }
    const hasRef = existsSync(join(ROOT, id, 'reference.png'))
    const hasFrames = existsSync(join(ROOT, id, 'frames'))
    if (!force && hasRef && !hasFrames) {
      skipped.push(`${id} (UI-approved reference.png)`)
      continue
    }
    work.push({ id, promptFile })
  }
  return { work, skipped }
}

// ---------- main ----------
async function main() {
  if (!existsSync(ANCHOR)) {
    console.error(`Style anchor missing: ${ANCHOR}`)
    process.exit(1)
  }
  const { work, skipped } = buildWorkList()
  const todo = work.slice(0, limit)
  console.log(`quality=${quality} model=${MODEL} mode=per-frame`)
  console.log(`exercises   : ${todo.length}${work.length > todo.length ? ` (of ${work.length}, limited)` : ''}`)
  console.log(`skipped     : ${skipped.length}`)
  if (dryRun) {
    for (const { id, promptFile } of todo) {
      try {
        const p = parsePrompt(extractPrompt(promptFile))
        console.log(`  ${id}: ${p.frames.length} frames @ ${pickSize(p.camera)} (${p.camera})`)
      } catch (err) {
        console.log(`  ${id}: PARSE ERROR — ${err.message}`)
      }
    }
    return
  }
  if (!todo.length) return console.log('Nothing to do.')

  const key = loadKey()
  if (!key && !stitchOnly) {
    console.error('No API key: set OPENAI_API_KEY or create ~/.fit223-openai-key')
    process.exit(1)
  }
  const anchorBytes = readFileSync(ANCHOR)
  let ok = 0
  const failed = []

  for (const { id, promptFile } of todo) {
    let parsed
    try {
      parsed = parsePrompt(extractPrompt(promptFile))
    } catch (err) {
      log(`FAIL ${id} — parse: ${err.message}`)
      failed.push(id)
      continue
    }
    const size = pickSize(parsed.camera)
    const n = parsed.frames.length
    const framesDir = join(ROOT, id, 'frames')
    mkdirSync(framesDir, { recursive: true })

    let exerciseFailed = false
    for (let k = 1; k <= n && !exerciseFailed; k++) {
      const framePath = join(framesDir, `frame-${k}.png`)
      if (!force && existsSync(framePath)) continue
      if (stitchOnly) {
        log(`FAIL ${id} — stitch-only but frame ${k} missing`)
        exerciseFailed = true
        break
      }
      const anchors = [anchorBytes] // style anchor only — pose anchors get copied

      let done = false
      for (let attempt = 1; attempt <= MAX_RETRIES && !done; attempt++) {
        try {
          log(`${id} frame ${k}/${n} (attempt ${attempt}, ${size}, quality=${quality})`)
          const png = await callApi(key, buildFramePrompt(parsed, k), size, anchors)
          writeFileSync(framePath, png)
          done = true
        } catch (err) {
          log(`ERR  ${id} frame ${k} — ${err.message}`)
          if (!err.retryable || attempt === MAX_RETRIES) {
            exerciseFailed = true
            break
          }
          await sleep(THROTTLE_MS * attempt * 2)
        }
      }
      if (done) await sleep(THROTTLE_MS)
    }

    if (exerciseFailed) {
      failed.push(id)
      continue
    }
    try {
      const frameBuffers = Array.from({ length: n }, (_, i) =>
        readFileSync(join(framesDir, `frame-${i + 1}.png`))
      )
      writeFileSync(join(ROOT, id, 'reference.png'), stitchHorizontal(frameBuffers, GUTTER_PX))
      log(`OK   ${id} — ${n} frames stitched into reference.png`)
      ok++
    } catch (err) {
      log(`FAIL ${id} — stitch: ${err.message}`)
      failed.push(id)
    }
  }

  log(`DONE — ${ok} exercises complete, ${failed.length} failed${failed.length ? ': ' + failed.join(', ') : ''}`)
  if (failed.length) process.exit(1)
}

main().catch(err => {
  console.error(`Fatal: ${err.message}`)
  process.exit(1)
})
