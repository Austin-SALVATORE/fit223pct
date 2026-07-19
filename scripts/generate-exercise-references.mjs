#!/usr/bin/env node
/**
 * Batch-generate exercise reference images from prompt.md files.
 *
 * Reads every public/assets/exercises/<id>/prompt.md, extracts the fenced
 * prompt, and calls the OpenAI image-edits API with the approved
 * goblet-squat reference.png attached as the style anchor. Results are
 * saved as <id>/reference.png. Folders that already have a reference.png
 * are skipped, so re-runs resume where they stopped.
 *
 * Usage:
 *   node scripts/generate-exercise-references.mjs --dry-run
 *   node scripts/generate-exercise-references.mjs --only bench-press
 *   node scripts/generate-exercise-references.mjs --limit 10 --quality high
 *
 * Flags:
 *   --dry-run        list what would be generated, call nothing
 *   --only <id>      generate a single exercise (repeatable)
 *   --limit <n>      stop after n generations
 *   --quality <q>    low | medium | high   (default: medium)
 *   --force          regenerate even if reference.png exists
 *
 * Auth: OPENAI_API_KEY env var, or ~/.fit223-openai-key file.
 * The key is never printed or logged.
 */

import { readFileSync, readdirSync, existsSync, writeFileSync, appendFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'exercises')
const ANCHOR = join(ROOT, 'goblet-squat', 'reference.png')
const LOG = join(dirname(fileURLToPath(import.meta.url)), '..', 'generation-run.log')

const API_URL = 'https://api.openai.com/v1/images/edits'
const THROTTLE_MS = 12_000 // stay well under image-API rate limits
const MAX_RETRIES = 3

const STYLE_ANCHOR_PREFIX =
  'Match the exact art style, character identity, rendering technique, and ' +
  'color palette of the attached reference image. Do NOT copy its pose, ' +
  'equipment, or frame count — those come from the specification below.\n' +
  'CANVAS RULE: this canvas is wider-than-tall but less wide than the ' +
  'reference. You MUST still fit the exact number of frames specified, all ' +
  'complete and fully inside the canvas: scale every figure down uniformly ' +
  'and tighten the gaps so that no figure or equipment is ever cropped or ' +
  'touched by any canvas edge. Count the frames before finishing.\n\n' +
  'Specification:\n\n'

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
const only = values('only')
const limit = value('limit') ? Number(value('limit')) : Infinity
const quality = value('quality') ?? 'medium'
const MODEL = value('model') ?? 'gpt-image-1'
const SIZE = value('size') ?? '1536x1024'

if (!['low', 'medium', 'high'].includes(quality)) {
  console.error(`Invalid --quality "${quality}" — use low, medium, or high.`)
  process.exit(1)
}
if (Number.isNaN(limit) || limit < 1) {
  console.error('Invalid --limit — must be a positive number.')
  process.exit(1)
}

// ---------- auth ----------
function loadKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY.trim()
  const keyFile = join(homedir(), '.fit223-openai-key')
  if (existsSync(keyFile)) return readFileSync(keyFile, 'utf8').trim()
  return null
}

// ---------- prompt extraction ----------
const FENCE_OPEN = '```text'
const FENCE_CLOSE = '```'

function extractPrompt(file) {
  const text = readFileSync(file, 'utf8')
  const start = text.indexOf(FENCE_OPEN)
  if (start === -1) throw new Error('no ```text fence found')
  const bodyStart = start + FENCE_OPEN.length
  const end = text.indexOf(FENCE_CLOSE, bodyStart)
  if (end === -1) throw new Error('unterminated ```text fence')
  const prompt = text.slice(bodyStart, end).trim()
  if (!prompt.startsWith('Create one wide instructional fitness illustration'))
    throw new Error('fenced block does not start with the expected style block')
  return prompt
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
    if (!force && existsSync(join(ROOT, id, 'reference.png'))) {
      skipped.push(`${id} (reference.png exists)`)
      continue
    }
    work.push({ id, promptFile })
  }
  return { work, skipped }
}

// ---------- api call ----------
async function generate(key, anchorBytes, prompt) {
  const frameMatch = prompt.match(/Number of frames:\s*(\d+)/)
  const frameRule = frameMatch
    ? `FRAME COUNT: the strip must contain EXACTLY ${frameMatch[1]} complete figures — ` +
      `count them: ${frameMatch[1]}. Not one more, not one fewer, none cropped.\n`
    : ''
  const form = new FormData()
  form.append('model', MODEL)
  form.append('size', SIZE)
  form.append('quality', quality)
  form.append('prompt', frameRule + STYLE_ANCHOR_PREFIX + prompt)
  form.append('image[]', new Blob([anchorBytes], { type: 'image/png' }), 'style-anchor.png')

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '<unreadable>')
    const retryable = res.status === 429 || res.status >= 500
    throw Object.assign(new Error(`HTTP ${res.status}: ${body.slice(0, 400)}`), { retryable })
  }

  const json = await res.json()
  const b64 = json?.data?.[0]?.b64_json
  if (!b64) throw new Error('response contained no image data')
  return Buffer.from(b64, 'base64')
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

function log(line) {
  const stamped = `${new Date().toISOString()} ${line}`
  console.log(stamped)
  appendFileSync(LOG, stamped + '\n')
}

// ---------- main ----------
async function main() {
  if (!existsSync(ANCHOR)) {
    console.error(`Style anchor missing: ${ANCHOR}`)
    process.exit(1)
  }

  const { work, skipped } = buildWorkList()
  const todo = work.slice(0, limit)

  console.log(`quality=${quality} size=${SIZE} model=${MODEL}`)
  console.log(`to generate : ${todo.length}${work.length > todo.length ? ` (of ${work.length} pending, limited)` : ''}`)
  console.log(`skipped     : ${skipped.length}`)
  if (skipped.length && (dryRun || only.length)) skipped.forEach(s => console.log(`  - ${s}`))

  if (dryRun) {
    todo.forEach(w => console.log(`  would generate: ${w.id}`))
    return
  }
  if (!todo.length) {
    console.log('Nothing to do.')
    return
  }

  const key = loadKey()
  if (!key) {
    console.error(
      'No API key. Set OPENAI_API_KEY or create ~/.fit223-openai-key\n' +
      '(in a separate terminal:  echo "sk-..." > ~/.fit223-openai-key && chmod 600 ~/.fit223-openai-key)'
    )
    process.exit(1)
  }

  const anchorBytes = readFileSync(ANCHOR)
  let ok = 0
  const failed = []

  for (const [i, { id, promptFile }] of todo.entries()) {
    let prompt
    try {
      prompt = extractPrompt(promptFile)
    } catch (err) {
      log(`FAIL ${id} — prompt extraction: ${err.message}`)
      failed.push(id)
      continue
    }

    let done = false
    for (let attempt = 1; attempt <= MAX_RETRIES && !done; attempt++) {
      try {
        log(`[${i + 1}/${todo.length}] generating ${id} (attempt ${attempt}, quality=${quality})`)
        const png = await generate(key, anchorBytes, prompt)
        writeFileSync(join(ROOT, id, 'reference.png'), png)
        log(`OK   ${id} — ${(png.length / 1024).toFixed(0)} KB written`)
        ok++
        done = true
      } catch (err) {
        log(`ERR  ${id} — ${err.message}`)
        if (!err.retryable || attempt === MAX_RETRIES) {
          failed.push(id)
          break
        }
        await sleep(THROTTLE_MS * attempt * 2)
      }
    }
    if (i < todo.length - 1) await sleep(THROTTLE_MS)
  }

  log(`DONE — ${ok} generated, ${failed.length} failed${failed.length ? ': ' + failed.join(', ') : ''}`)
  if (failed.length) process.exit(1)
}

main().catch(err => {
  console.error(`Fatal: ${err.message}`)
  process.exit(1)
})
