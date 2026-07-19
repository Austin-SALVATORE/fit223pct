#!/usr/bin/env node
/**
 * Reproduce the manual ChatGPT-UI generation flow via the API:
 * GPT-5.6 Sol (high reasoning) receives the goblet-squat style anchor and
 * the exercise's prompt.md fenced prompt — exactly what the user pastes in
 * the UI — and generates the strip through its image_generation tool.
 * Result saved as <id>/reference.png.
 *
 * QA policy: none applied here. The user reviews output themselves.
 *
 * Usage:
 *   node scripts/generate-via-sol.mjs --only deadlift
 *   node scripts/generate-via-sol.mjs            # all exercises missing reference.png
 *   node scripts/generate-via-sol.mjs --limit 10 --force
 *
 * Auth: OPENAI_API_KEY env var, or ~/.fit223-openai-key file. Never logged.
 */

import { readFileSync, readdirSync, existsSync, writeFileSync, appendFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'exercises')
const ANCHOR = join(ROOT, 'goblet-squat', 'reference.png')
const LOG = join(dirname(fileURLToPath(import.meta.url)), '..', 'generation-run.log')

const API_URL = 'https://api.openai.com/v1/responses'
const THROTTLE_MS = 10_000
const MAX_RETRIES = 3

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
const MODEL = value('model') ?? 'gpt-5.6-sol'
const EFFORT = value('effort') ?? 'high'

// Deferred pending consolidation decisions — never auto-generate.
const DEFERRED = new Set([
  'machine-chest-fly', 'cable-rear-delt-fly', 'leaning-lateral-raise',
  'ez-bar-curl', 'dumbbell-shrug', 'neutral-grip-lat-pulldown',
  'wide-grip-lat-pulldown', 'close-grip-lat-pulldown',
])

function loadKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY.trim()
  const f = join(homedir(), '.fit223-openai-key')
  return existsSync(f) ? readFileSync(f, 'utf8').trim() : null
}

function extractPrompt(file) {
  const text = readFileSync(file, 'utf8')
  const start = text.indexOf('```text')
  if (start === -1) throw new Error('no ```text fence')
  const bodyStart = start + '```text'.length
  const end = text.indexOf('```', bodyStart)
  if (end === -1) throw new Error('unterminated fence')
  return text.slice(bodyStart, end).trim()
}

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
    if (!existsSync(promptFile)) { skipped.push(`${id} (no prompt.md)`); continue }
    if (!only.length && DEFERRED.has(id)) { skipped.push(`${id} (deferred)`); continue }
    if (!force && existsSync(join(ROOT, id, 'reference.png'))) {
      skipped.push(`${id} (reference.png exists)`)
      continue
    }
    work.push({ id, promptFile })
  }
  return { work, skipped }
}

async function generate(key, anchorB64, prompt) {
  const body = {
    model: MODEL,
    reasoning: { effort: EFFORT },
    tools: [{ type: 'image_generation', size: 'auto', quality: 'high' }],
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_image', image_url: `data:image/png;base64,${anchorB64}` },
          {
            type: 'input_text',
            text:
              'Match the exact art style, character, and rendering of the attached ' +
              'reference image. Then generate one widescreen landscape image ' +
              'following this specification exactly:\n\n' + prompt,
          },
        ],
      },
    ],
  }
  let res
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(360_000), // hung connections must not stall the run
    })
  } catch (err) {
    throw Object.assign(new Error(`request failed/timed out: ${err.message}`), { retryable: true })
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '<unreadable>')
    const retryable = res.status === 429 || res.status >= 500
    throw Object.assign(new Error(`HTTP ${res.status}: ${text.slice(0, 400)}`), { retryable })
  }
  const json = await res.json()
  const call = (json.output ?? []).find(o => o.type === 'image_generation_call' && o.result)
  if (!call) {
    const msg = (json.output ?? [])
      .filter(o => o.type === 'message')
      .flatMap(o => o.content ?? [])
      .map(c => c.text ?? '')
      .join(' ')
      .slice(0, 300)
    throw new Error(`no image in response${msg ? `; model said: ${msg}` : ''}`)
  }
  return Buffer.from(call.result, 'base64')
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
function log(line) {
  const stamped = `${new Date().toISOString()} ${line}`
  console.log(stamped)
  appendFileSync(LOG, stamped + '\n')
}

async function main() {
  if (!existsSync(ANCHOR)) {
    console.error(`Style anchor missing: ${ANCHOR}`)
    process.exit(1)
  }
  const { work, skipped } = buildWorkList()
  const todo = work.slice(0, limit)
  console.log(`model=${MODEL} effort=${EFFORT} tool=image_generation(auto,high)`)
  console.log(`to generate : ${todo.length}${work.length > todo.length ? ` (of ${work.length}, limited)` : ''}`)
  console.log(`skipped     : ${skipped.length}`)
  if (dryRun) return todo.forEach(w => console.log(`  would generate: ${w.id}`))
  if (!todo.length) return console.log('Nothing to do.')

  const key = loadKey()
  if (!key) {
    console.error('No API key: set OPENAI_API_KEY or create ~/.fit223-openai-key')
    process.exit(1)
  }
  const anchorB64 = readFileSync(ANCHOR).toString('base64')
  let ok = 0
  const failed = []

  for (const [i, { id, promptFile }] of todo.entries()) {
    let prompt
    try {
      prompt = extractPrompt(promptFile)
    } catch (err) {
      log(`FAIL ${id} — ${err.message}`)
      failed.push(id)
      continue
    }
    let done = false
    for (let attempt = 1; attempt <= MAX_RETRIES && !done; attempt++) {
      try {
        log(`[${i + 1}/${todo.length}] ${id} (attempt ${attempt})`)
        const png = await generate(key, anchorB64, prompt)
        writeFileSync(join(ROOT, id, 'reference.png'), png)
        log(`OK   ${id} — ${(png.length / 1024).toFixed(0)} KB`)
        ok++
        done = true
      } catch (err) {
        log(`ERR  ${id} — ${err.message}`)
        if (!err.retryable || attempt === MAX_RETRIES) { failed.push(id); break }
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
