#!/usr/bin/env node
/**
 * Fast, direct exercise-art generation: the Images **edits** endpoint called
 * straight from here, no orchestrator, every request concurrent.
 *
 * Why this exists (owner ruling, 21 Oct 2026): "this generation took 30m, I
 * don't want this happened again, if we need to change the model behind
 * change it, I don't care the price, I need it to be generated fast and in
 * quality." `generate-via-sol.mjs` drives a reasoning model that calls an
 * image tool, serially with a 10 s throttle; this posts the goblet-squat style
 * anchor plus the exercise's prompt.md straight to the image model, so N
 * candidates for M exercises is one wave of N x M parallel requests (the
 * 21 Oct bake-off drew 15 candidates in 76 s). It supersedes that script.
 *
 * It writes ONLY candidates into --out, never into public/assets/** — picking
 * a candidate and landing it (reference.png, convert-assets.mjs, manifest) is
 * a separate, reviewed step.
 *
 * Usage:
 *   node scripts/generate-images.mjs --only mountain-climber --candidates 1 --out /tmp/gen
 *   node scripts/generate-images.mjs --only parallel-bar-dip --only inverted-row --out /tmp/gen
 *
 * Flags:
 *   --out <dir>          required. Candidate files: <dir>/<id>__c<n>.png
 *   --only <id>          required, repeatable. An exercise directory with a prompt.md
 *   --candidates <N>     candidates per exercise (default 3)
 *   --model <name>       default gpt-image-2.5-sunburst
 *   --quality <q>        default max
 *   --size <WxH>         default 1536x1024
 *
 * Failure policy: HTTP 429 (not insufficient_quota) backs off exponentially
 * with jitter, honouring Retry-After; 5xx and network errors retry twice; a
 * request times out after 5 minutes. After TWO configuration errors (model or
 * parameter rejected) the whole run switches once to gpt-image-2 / high and
 * does not debug further — the owner's rule for the route.
 *
 * Auth: OPENAI_API_KEY env var, or ~/.fit223-openai-key. Never logged or echoed.
 * Every request's start, end, seconds and outcome is appended to
 * generation-run.log at the repo root.
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', 'public', 'assets', 'exercises')
const ANCHOR = join(ROOT, 'goblet-squat', 'reference.png')
const LOG = join(HERE, '..', 'generation-run.log')

const URL = 'https://api.openai.com/v1/images/edits'
const CONCURRENCY = 10
const TIMEOUT_MS = 300_000
const MAX_429 = 6

// ---- args -------------------------------------------------------------------
const args = process.argv.slice(2)
const value = (name) => {
  const i = args.indexOf(`--${name}`)
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null
}
const values = (name) =>
  args.flatMap((a, i) => (a === `--${name}` && args[i + 1] && !args[i + 1].startsWith('--') ? [args[i + 1]] : []))

const only = values('only')
const outValue = value('out')
const CANDIDATES = value('candidates') ? Number(value('candidates')) : 3
const route = { model: value('model') ?? 'gpt-image-2.5-sunburst', quality: value('quality') ?? 'max' }
const SIZE = value('size') ?? '1536x1024'

function fail(message) {
  console.error(message)
  process.exit(1)
}
if (only.length === 0) fail('Pass at least one --only <id>.')
if (!outValue) fail('--out <dir> is required (this script never writes into public/assets/**).')
if (!Number.isInteger(CANDIDATES) || CANDIDATES < 1) fail('--candidates must be a positive integer.')
const OUT = resolve(outValue)
if (OUT.startsWith(resolve(ROOT))) fail('--out must not be inside public/assets/exercises.')

// ---- inputs -----------------------------------------------------------------
function loadKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY.trim()
  const f = join(homedir(), '.fit223-openai-key')
  return existsSync(f) ? readFileSync(f, 'utf8').trim() : null
}

/** The fenced ```text block of prompt.md — exactly what generate-via-sol.mjs extracts. */
function extractPrompt(file) {
  const text = readFileSync(file, 'utf8')
  const start = text.indexOf('```text')
  if (start === -1) throw new Error('no ```text fence')
  const bodyStart = start + '```text'.length
  const end = text.indexOf('```', bodyStart)
  if (end === -1) throw new Error('unterminated fence')
  return text.slice(bodyStart, end).trim()
}

const PREFIX =
  'Match the exact art style, character, and rendering of the attached reference image — but NOT its background: ' +
  'the reference predates the chroma-key change, and the background MUST be the single flat solid magenta #FF00FF ' +
  'the specification demands, with no magenta anywhere in the artwork itself. Generate one widescreen landscape ' +
  'image following this specification exactly:\n\n'

const key = loadKey()
if (!key) fail('No API key: set OPENAI_API_KEY or create ~/.fit223-openai-key')
if (!existsSync(ANCHOR)) fail(`Style anchor missing: ${ANCHOR}`)
const anchor = readFileSync(ANCHOR)

const prompts = new Map()
for (const id of only) {
  const file = join(ROOT, id, 'prompt.md')
  if (!existsSync(file)) fail(`No prompt.md for "${id}" (${file})`)
  try {
    prompts.set(id, PREFIX + extractPrompt(file))
  } catch (err) {
    fail(`${id}: ${err.message}`)
  }
}
mkdirSync(OUT, { recursive: true })

// ---- helpers ----------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const iso = (t) => new Date(t).toISOString().slice(11, 23)
function log(line) {
  const stamped = `${new Date().toISOString()} ${line}`
  console.log(stamped)
  appendFileSync(LOG, stamped + '\n')
}

let configErrors = 0
let switched = false
const results = []

async function request(id, candidate) {
  let n429 = 0
  let nNet = 0
  let n5xx = 0
  for (let attempt = 1; attempt <= 8; attempt++) {
    const cfg = { ...route }
    const t = Date.now()
    const fd = new FormData()
    fd.append('model', cfg.model)
    fd.append('prompt', prompts.get(id))
    fd.append('size', SIZE)
    fd.append('quality', cfg.quality)
    fd.append('n', '1')
    fd.append('image[]', new Blob([anchor], { type: 'image/png' }), 'anchor.png')
    const tag = `${id} c${candidate} a${attempt} ${cfg.model}/${cfg.quality}`
    const done = (outcome, extra = '') => {
      const seconds = ((Date.now() - t) / 1000).toFixed(1)
      log(`${tag} start=${iso(t)} end=${iso(Date.now())} ${seconds}s ${outcome}${extra ? ` ${extra}` : ''}`)
      const record = { id, candidate, attempt, outcome, seconds: Number(seconds) }
      results.push(record)
      return record
    }

    let res
    try {
      res = await fetch(URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}` },
        body: fd,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch (err) {
      const timedOut = /timeout/i.test(`${err?.name}${err?.message}`)
      if (timedOut) return done('timeout', 'no response in 5 min')
      if (++nNet <= 2) {
        done('neterr_retry', String(err?.cause?.code ?? err?.message).slice(0, 80))
        await sleep(2000)
        continue
      }
      return done('neterr', String(err?.cause?.code ?? err?.message).slice(0, 80))
    }

    if (res.ok) {
      const json = await res.json()
      const b64 = json?.data?.[0]?.b64_json
      if (!b64) return done('no_image', JSON.stringify(json).slice(0, 160))
      const buf = Buffer.from(b64, 'base64')
      writeFileSync(join(OUT, `${id}__c${candidate}.png`), buf)
      return done('ok', `${(buf.length / 1024).toFixed(0)}KB`)
    }

    const body = await res.text().catch(() => '<unreadable>')
    const note = body.replace(/\s+/g, ' ').slice(0, 160)
    if (res.status === 429 && !/insufficient_quota/.test(body)) {
      if (++n429 > MAX_429) return done('http_429_gaveup', note)
      const retryAfter = Number(res.headers.get('retry-after'))
      const wait = Math.min(60_000, (retryAfter > 0 ? retryAfter * 1000 : 4000 * 2 ** (n429 - 1)) + Math.random() * 1500)
      done('http_429_retry', `backoff ${(wait / 1000).toFixed(1)}s`)
      await sleep(wait)
      continue
    }
    if (res.status >= 500) {
      if (++n5xx <= 2) {
        done('http_5xx_retry', `HTTP ${res.status}`)
        await sleep(3000)
        continue
      }
      return done('http_5xx', `HTTP ${res.status} ${note}`)
    }
    if (/moderation|safety|content_policy|policy/i.test(body)) return done('blocked', `HTTP ${res.status} ${note}`)

    // A configuration error: model or parameter rejected.
    configErrors++
    done('config_error', `HTTP ${res.status} ${note}`)
    if (configErrors >= 2 && !switched) {
      switched = true
      route.model = 'gpt-image-2'
      route.quality = 'high'
      log('*** 2 configuration errors: switching ALL requests to gpt-image-2 / high; not debugging further ***')
    }
    if (cfg.model === route.model && cfg.quality === route.quality) return results[results.length - 1]
  }
  return { id, candidate, outcome: 'exhausted' }
}

/** Runs the jobs with at most CONCURRENCY in flight. */
async function pool(jobs) {
  let next = 0
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next++]
      await job()
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker))
}

// ---- run --------------------------------------------------------------------
const started = Date.now()
const jobs = []
for (let c = 1; c <= CANDIDATES; c++) for (const id of only) jobs.push(() => request(id, c))
log(`run start route=${route.model}/${route.quality} ${SIZE} ${jobs.length} requests (concurrency ${CONCURRENCY}) out=${OUT}`)
await pool(jobs)
const ok = results.filter((r) => r.outcome === 'ok')
const secs = ok.map((r) => r.seconds).sort((a, b) => a - b)
log(
  `DONE wall=${((Date.now() - started) / 1000).toFixed(1)}s ok=${ok.length}/${jobs.length}` +
    (secs.length ? ` min=${secs[0]}s median=${secs[Math.floor(secs.length / 2)]}s max=${secs.at(-1)}s` : ''),
)
if (ok.length < jobs.length) process.exitCode = 1
