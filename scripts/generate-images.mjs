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
 *   node scripts/generate-images.mjs --only parallel-bar-dip --ref ~/ts100.jpg --out /tmp/gen
 *
 * Flags:
 *   --out <dir>          required. Candidate files: <dir>/<id>__c<n>.png
 *   --only <id>          required, repeatable. An exercise directory with a prompt.md
 *   --candidates <N>     candidates per exercise (default 3)
 *   --model <name>       default gpt-image-2.5-sunburst
 *   --quality <q>        default max
 *   --size <WxH>         default 1536x1024
 *   --ref <path>         optional, repeatable, one path per flag. A photo of the exact equipment to
 *                        draw. Sent as an extra image[] part AFTER the style anchor, which stays
 *                        first, with a note in the prompt prefix: the first image is the style
 *                        reference, the later ones show the equipment to copy and nothing else.
 *                        PNG, JPEG or WebP, read from the file's first bytes (not its name).
 *                        Everything is checked before any request. Without --ref the request is
 *                        byte-identical to what this script sent before the flag existed.
 *
 * Why --ref exists (athlete/coach ruling, 23 Oct 2026, docs/programs/
 * parallel-bars-station-ruling-2026-10-23.md): the parallel-bar art must match the athlete's
 * actual station, and the existing reference is to be passed to the illustration workflow
 * rather than a station design being guessed.
 *
 * Failure policy: HTTP 429 (not insufficient_quota) backs off exponentially
 * with jitter, honouring Retry-After; 5xx and network errors retry twice; a
 * request times out after 5 minutes. On the SECOND configuration error (model
 * or parameter rejected) the run STOPS: it prints and logs one line naming the
 * model, the HTTP status and the API's message, and exits non-zero. It never
 * switches models by itself — a standing tool must not let a batch be drawn by
 * a model the owner did not choose. `--model` is the only way to change it.
 *
 * Input-image limits behind the --ref checks (read 23 Oct 2026, not guessed): at most 16 images
 * per request, each a png, webp or jpg file under 50MB. The count is in the Images edits
 * reference, "Create image edit": "For GPT image models, you can provide up to 16 images"
 * (developers.openai.com/api/reference/resources/images.md). That page states no per-image size
 * and no formats; those are in the openai-node 7.43.0 types, resources/images.d.ts,
 * ImageEditParamsBase.image: "each image should be a `png`, `webp`, or `jpg` file less than
 * 50MB. You can provide up to 16 images". The image-generation guide repeats the 50MB figure
 * under its mask requirements ("less than 50MB in size"). The style anchor is one of the 16, so
 * at most 15 --ref. "50MB" is read as 50,000,000 bytes, the smaller reading, so a file the API
 * might refuse is never sent. HEIC is not accepted; export it as JPEG. Magic bytes prove the
 * type, not that the image decodes.
 *
 * Auth: OPENAI_API_KEY env var, or ~/.fit223-openai-key. Never logged or echoed.
 * Every request's start, end, seconds and outcome is appended to
 * generation-run.log at the repo root.
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync, appendFileSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
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
/** Null until loaded, so `redact()` and the crash handlers are safe to use at any point. */
let key = null

/**
 * Every externally sourced string (API error bodies, fetch/network error
 * messages, parse errors) passes through here before reaching stdout, stderr
 * or generation-run.log. OpenAI echoes a *masked* key on a 401 (its prefix and
 * last characters), and fetch can echo a raw `Authorization` value — neither
 * may leave the process. The pattern rules always apply; the exact-key rule
 * applies once the key is known.
 */
function redact(text) {
  let out = String(text)
  if (key) out = out.split(key).join('[redacted]')
  return out.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]').replace(/sk-[A-Za-z0-9_\-*.\u2026]{4,}/g, 'sk-[redacted]')
}

/**
 * No crash path may print raw text: Node's default uncaught-error output
 * prints the whole error (and, for a failed JSON parse, the response body),
 * bypassing `redact()`. These handlers log one redacted, truncated line and
 * exit non-zero instead.
 */
function crash(kind, err) {
  const text = `${kind}: ${err?.name ?? 'Error'}: ${err?.message ?? err}`.slice(0, 300)
  try {
    log(`FATAL ${text}`)
  } catch {
    console.error(redact(`FATAL ${text}`))
  }
  process.exit(1)
}
process.on('uncaughtException', (err) => crash('uncaughtException', err))
process.on('unhandledRejection', (err) => crash('unhandledRejection', err))

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

// ---- reference images: optional, repeatable --ref <path> ---------------------
// Limits and where they were read: see the header. The style anchor is one of the 16 images.
const MAX_INPUT_IMAGES = 16
const MAX_IMAGE_BYTES = 50_000_000 // "less than 50MB", read as decimal MB: the smaller reading
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'])

/**
 * With at least one --ref, REF_NOTE goes just before PREFIX's final sentence. PREFIX itself is never
 * edited, so a run without --ref sends exactly the bytes it always did.
 */
const TASK_SENTENCE = 'Generate one widescreen landscape image following this specification exactly:\n\n'
const REF_NOTE =
  'More than one image is attached. The FIRST attached image is the style reference described above. ' +
  'Every attached image after the first shows the exact equipment to draw: copy its construction, ' +
  'proportions, number of separate pieces, base and feet, and bar shape. Do NOT copy anything else from ' +
  'those equipment images: not their photographic look, colors, lighting or background, not the room, and ' +
  'not any person or object in them. The specification below still decides the style, colors, background, ' +
  'figure, pose and movement. '
if (!PREFIX.endsWith(TASK_SENTENCE)) fail('Internal: PREFIX no longer ends with TASK_SENTENCE; change them together.')
const PREFIX_WITH_REFS = PREFIX.slice(0, -TASK_SENTENCE.length) + REF_NOTE + TASK_SENTENCE

/** PNG, JPEG or WebP by the file's first bytes; null for anything else. The extension is never consulted. */
function sniffImage(buf) {
  const text = (from, to) => buf.toString('latin1', from, to)
  if (buf.length >= PNG_SIGNATURE.length && buf.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    return { mime: 'image/png', ext: 'png' }
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' }
  if (buf.length >= 12 && text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP') return { mime: 'image/webp', ext: 'webp' }
  return null
}

/** An ISO-BMFF `ftyp` box with a HEIC/HEIF brand: what an iPhone photo is by default. */
function isHeic(buf) {
  return buf.length >= 12 && buf.toString('latin1', 4, 8) === 'ftyp' && HEIC_BRANDS.has(buf.toString('latin1', 8, 12))
}

/**
 * Every --ref path, in order. --ref is repeatable and takes exactly one path per flag. Any other shape
 * (no path, `--ref=path`, a second path after one flag) would quietly send fewer photos than the caller
 * meant, so each one stops the run instead of degrading to a request without the photo.
 */
function refPathsFromArgs() {
  const paths = []
  args.forEach((a, i) => {
    if (a.startsWith('--ref') && a !== '--ref') {
      fail(
        a.startsWith('--ref=')
          ? '--ref does not take --ref=<path>; write the path as a separate argument: --ref <path>.'
          : `Unknown option ${a.split('=')[0]}: the reference-image flag is --ref <path>.`,
      )
    }
    if (a !== '--ref') return
    const path = args[i + 1]
    if (!path || path.startsWith('--')) fail('--ref needs a path: --ref <path>.')
    const extra = args[i + 2]
    if (extra && !extra.startsWith('--')) fail('--ref takes one path per flag; repeat --ref for each further image.')
    paths.push(path)
  })
  return paths
}

/** Validates one --ref and returns its bytes. Every message names the path only, never the file's contents. */
function loadRef(path) {
  const file = resolve(path)
  let st
  try {
    st = statSync(file)
  } catch (err) {
    const missing = err?.code === 'ENOENT' || err?.code === 'ENOTDIR'
    return fail(`--ref ${path}: ${missing ? 'no such file' : `cannot be read (${err?.code ?? 'unknown error'})`}`)
  }
  if (st.isDirectory()) return fail(`--ref ${path}: is a directory, not an image file`)
  if (!st.isFile()) return fail(`--ref ${path}: not a regular file`)
  if (st.size >= MAX_IMAGE_BYTES) {
    return fail(`--ref ${path}: ${(st.size / 1e6).toFixed(1)} MB is too large; each image must be under ${MAX_IMAGE_BYTES / 1e6} MB`)
  }
  let bytes
  try {
    bytes = readFileSync(file)
  } catch (err) {
    return fail(`--ref ${path}: cannot be read (${err?.code ?? 'unknown error'})`)
  }
  const kind = sniffImage(bytes)
  if (!kind) {
    return fail(
      isHeic(bytes)
        ? `--ref ${path}: HEIC/HEIF is not accepted; export it as JPEG and pass that`
        : `--ref ${path}: not a PNG, JPEG or WebP image (the type is read from the file's first bytes, not its name)`,
    )
  }
  return { path, bytes, ...kind, sha: createHash('sha256').update(bytes).digest('hex').slice(0, 12) }
}

const refPaths = refPathsFromArgs()
if (1 + refPaths.length > MAX_INPUT_IMAGES) {
  fail(
    `Too many images: the style anchor plus ${refPaths.length} --ref is ${1 + refPaths.length}, and the endpoint ` +
      `accepts at most ${MAX_INPUT_IMAGES} per request (so at most ${MAX_INPUT_IMAGES - 1} --ref).`,
  )
}
/** Checked before the key is read: a bad --ref never gets as far as a secret or the network. */
const refs = refPaths.map((p) => loadRef(p))

key = loadKey()
if (!key) fail('No API key: set OPENAI_API_KEY or create ~/.fit223-openai-key')
// A key with whitespace, control or non-ASCII characters cannot be a real key,
// and sending it makes fetch throw an error whose message echoes the key.
// Refuse before any request, and say nothing about its content.
if (/[^\x21-\x7e]/.test(key)) {
  fail('API key is malformed (whitespace or control characters); check OPENAI_API_KEY or ~/.fit223-openai-key')
}

if (!existsSync(ANCHOR)) fail(`Style anchor missing: ${ANCHOR}`)
const anchor = readFileSync(ANCHOR)

const prompts = new Map()
const prefix = refs.length > 0 ? PREFIX_WITH_REFS : PREFIX
for (const id of only) {
  const file = join(ROOT, id, 'prompt.md')
  if (!existsSync(file)) fail(`No prompt.md for "${id}" (${file})`)
  try {
    prompts.set(id, prefix + extractPrompt(file))
  } catch (err) {
    fail(`${id}: ${err.message}`)
  }
}
mkdirSync(OUT, { recursive: true })

// ---- helpers ----------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const iso = (t) => new Date(t).toISOString().slice(11, 23)
function log(line) {
  const stamped = `${new Date().toISOString()} ${redact(line)}`
  console.log(stamped)
  appendFileSync(LOG, stamped + '\n')
}

let configErrors = 0
const results = []
/** Aborts every in-flight request and stops new ones once a run-ending error is found. */
const halt = new AbortController()
let haltLine = null

/** The API's own message from an error body, when it is JSON; the raw start of the body otherwise. */
function apiMessage(body) {
  try {
    const message = JSON.parse(body)?.error?.message
    if (typeof message === 'string') return message.replace(/\s+/g, ' ').slice(0, 300)
  } catch {
    // not JSON — fall through to the raw text
  }
  return body.replace(/\s+/g, ' ').slice(0, 300)
}

async function request(id, candidate) {
  let n429 = 0
  let nNet = 0
  let n5xx = 0
  for (let attempt = 1; attempt <= 8; attempt++) {
    if (halt.signal.aborted) return { id, candidate, outcome: 'halted' }
    const cfg = { ...route }
    const t = Date.now()
    const fd = new FormData()
    fd.append('model', cfg.model)
    fd.append('prompt', prompts.get(id))
    fd.append('size', SIZE)
    fd.append('quality', cfg.quality)
    fd.append('n', '1')
    fd.append('image[]', new Blob([anchor], { type: 'image/png' }), 'anchor.png')
    // Equipment references ride after the anchor, which stays first. None without --ref.
    refs.forEach((ref, i) => fd.append('image[]', new Blob([ref.bytes], { type: ref.mime }), `equipment-${i + 1}.${ref.ext}`))
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
        signal: AbortSignal.any([AbortSignal.timeout(TIMEOUT_MS), halt.signal]),
      })
    } catch (err) {
      if (halt.signal.aborted) return done('halted')
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
      // External data: parse defensively. A 200 with a non-JSON body must end
      // this candidate with one redacted, truncated line — never a crash that
      // prints the body.
      const text = await res.text().catch(() => '')
      let json
      try {
        json = JSON.parse(text)
      } catch {
        return done('bad_response', `HTTP ${res.status} not JSON: ${text.slice(0, 200)}`)
      }
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

    // A configuration error: model or parameter rejected. The first is retried
    // once (it may be one bad request); the second ends the run.
    configErrors++
    done('config_error', `HTTP ${res.status} ${note}`)
    if (configErrors >= 2) {
      // Concurrent rejections all reach here; only the first announces the stop.
      if (haltLine === null) {
        haltLine =
          `STOPPED: model "${cfg.model}" (quality ${cfg.quality}) was rejected with HTTP ${res.status}: ${apiMessage(body)} ` +
          '— rerun with --model <name> to choose another model explicitly'
        log(haltLine) // terminal (stdout) and generation-run.log, once each
        halt.abort()
      }
      return results[results.length - 1]
    }
  }
  return { id, candidate, outcome: 'exhausted' }
}

/** Runs the jobs with at most CONCURRENCY in flight. */
async function pool(jobs) {
  let next = 0
  const worker = async () => {
    while (next < jobs.length && !halt.signal.aborted) {
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
log(
  `run start route=${route.model}/${route.quality} ${SIZE} ${jobs.length} requests (concurrency ${CONCURRENCY}) out=${OUT}` +
    (refs.length > 0 ? ` refs=${refs.length}` : ''),
)
// Provenance for the redraw's prompt.md: which photo, by path, type, size and a short digest (never its bytes).
refs.forEach((ref, i) => log(`ref ${i + 1}: ${ref.path} ${ref.mime} ${(ref.bytes.length / 1024).toFixed(0)}KB sha256=${ref.sha}`))
await pool(jobs)
const ok = results.filter((r) => r.outcome === 'ok')
const secs = ok.map((r) => r.seconds).sort((a, b) => a - b)
log(
  `DONE wall=${((Date.now() - started) / 1000).toFixed(1)}s ok=${ok.length}/${jobs.length}` +
    (secs.length ? ` min=${secs[0]}s median=${secs[Math.floor(secs.length / 2)]}s max=${secs.at(-1)}s` : ''),
)
if (ok.length < jobs.length) process.exitCode = 1
