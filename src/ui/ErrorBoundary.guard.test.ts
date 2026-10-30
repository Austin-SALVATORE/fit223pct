// Runs under the suite's shared jsdom environment (src/test/setup.ts assumes
// it) — this test only needs node's fs through ts.sys, which is available
// either way.
/// <reference types="node" />
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * The crash recovery cannot touch data, and cannot phone home.
 *
 * An in-progress workout lives in Dexie, there is no server backup, and the
 * app has no backend and no telemetry (docs/Roadmap.md, the owner's rulings). A
 * boundary that "helpfully" cleared storage, unregistered the service worker or
 * posted an error report would be the one bug that turns a recoverable crash into
 * lost training. The behavioural test (`App.crash.test.tsx`) shows the recovery
 * leaves the database byte-identical; this guard is the other half: the three
 * files that make up the recovery import nothing that could write.
 *
 * What counts: an import from the data layer or Dexie (`@/data/*`, `dexie`,
 * `dexie-react-hooks`), and any use of a storage, cache or network API by name
 * (`localStorage`, `sessionStorage`, `indexedDB`, `caches`, `fetch`,
 * `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `.serviceWorker`,
 * `.storage`). Syntax, not types, so a comment or a string that merely mentions
 * one does not trip it.
 *
 * **What it cannot see**, stated so nobody mistakes it for more:
 *   - code the three files call that lives elsewhere: they import only React,
 *     react-router, react-i18next, `@/ui/Main` and each other, and this guard
 *     fails on any other import being added from the data layer, but it does not
 *     follow `@/ui/Main` or the i18n setup to read THEIR imports;
 *   - an API reached by a name this list does not hold (a new storage API), or
 *     through an alias (`const s = window['local' + 'Storage']`);
 *   - any other file: a future caller that wraps a boundary around a write.
 * The two files that matter most (the boundary and the fallbacks) are held to the
 * same list as the wiring.
 *
 * Negative controls, run 30 Oct (mutation applied, the whole suite run, restored and
 * `cmp`ed):
 *   `import { db } from '@/data/db'` added to CrashFallback.tsx
 *                         -> "no recovery file imports the data layer" (1 red), naming
 *                            the file, the line and the module
 *   the same import plus `void db.workouts.clear()` in the retry handler
 *                         -> that test and App.crash's byte-identical-database test (2 red)
 *   `localStorage.removeItem('x')` in `RouteErrorBoundary` (boundaries.tsx)
 *                         -> "no recovery file uses a storage or network API", and ten
 *                            screen tests that render the boundary, because this test
 *                            environment has no `localStorage` (11 red)
 *   `fetch('/report', ...)` added to `ErrorBoundary.componentDidCatch`
 *                         -> "no recovery file uses a storage or network API" (1 red)
 * and the scanner's own self-test below shows each shape found and each
 * look-alike (a comment, a string, a property that is not the API) left alone.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, '../..')

const FILES = ['src/ui/ErrorBoundary.tsx', 'src/app/CrashFallback.tsx', 'src/app/boundaries.tsx']

const FORBIDDEN_MODULES = [/^@\/data(\/|$)/, /^dexie(-react-hooks)?$/]
const FORBIDDEN_GLOBALS = new Set([
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'caches',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
])
const FORBIDDEN_PROPERTIES = new Set(['sendBeacon', 'serviceWorker', 'storage', 'localStorage', 'sessionStorage', 'indexedDB', 'caches', 'fetch'])

interface Finding {
  line: number
  what: string
}

function findings(sourceFile: ts.SourceFile): Finding[] {
  const found: Finding[] = []
  const record = (node: ts.Node, what: string) => {
    found.push({ line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1, what })
  }
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const module = node.moduleSpecifier.text
      if (FORBIDDEN_MODULES.some((pattern) => pattern.test(module))) record(node, `imports ${module}`)
    } else if (ts.isIdentifier(node) && FORBIDDEN_GLOBALS.has(node.text) && isReference(node)) {
      record(node, `uses ${node.text}`)
    } else if (ts.isPropertyAccessExpression(node) && FORBIDDEN_PROPERTIES.has(node.name.text)) {
      record(node, `uses .${node.name.text}`)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return found
}

/** An identifier that is a use, not the name of a property being declared or accessed (that case is `.name` above). */
function isReference(node: ts.Identifier): boolean {
  const parent = node.parent
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) return false
  if (ts.isPropertyAssignment(parent) && parent.name === node) return false
  if (ts.isImportSpecifier(parent) || ts.isBindingElement(parent)) return false
  return true
}

const parse = (name: string, text: string) => ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

function scan(file: string, only: 'import' | 'api'): string[] {
  const text = ts.sys.readFile(path.join(REPO_ROOT, file))
  if (text === undefined) throw new Error(`${file} is missing`)
  return findings(parse(file, text))
    .filter((finding) => (only === 'import') === finding.what.startsWith('imports'))
    .map((finding) => `${file}:${finding.line} ${finding.what}`)
}

describe('the crash recovery cannot touch data or phone home', () => {
  it('no recovery file imports the data layer', () => {
    expect(FILES.flatMap((file) => scan(file, 'import'))).toEqual([])
  })

  it('no recovery file uses a storage or network API', () => {
    expect(FILES.flatMap((file) => scan(file, 'api'))).toEqual([])
  })

  it('the scan reads the files that exist (a missing path would be a clean result for nothing)', () => {
    for (const file of FILES) expect(ts.sys.fileExists(path.join(REPO_ROOT, file)), file).toBe(true)
  })

  describe('the scanner: each shape is found, each look-alike is left alone', () => {
    const what = (code: string) => findings(parse('probe.tsx', code)).map((finding) => finding.what)

    it.each([
      ['a data-layer import', "import { db } from '@/data/db'", ['imports @/data/db']],
      ['a repository import', "import { workoutRepo } from '@/data/repositories'", ['imports @/data/repositories']],
      ['a Dexie import', "import Dexie from 'dexie'", ['imports dexie']],
      ['a live query import', "import { useLiveQuery } from 'dexie-react-hooks'", ['imports dexie-react-hooks']],
      ['localStorage', 'localStorage.clear()', ['uses localStorage']],
      ['window.localStorage', 'window.localStorage.setItem("a", "b")', ['uses .localStorage']],
      ['indexedDB', 'indexedDB.deleteDatabase("fit223pct")', ['uses indexedDB']],
      ['the cache API', 'await caches.delete("workbox")', ['uses caches']],
      ['fetch', 'await fetch("/report", { method: "POST" })', ['uses fetch']],
      ['sendBeacon', 'navigator.sendBeacon("/r", "x")', ['uses .sendBeacon']],
      ['the service worker', 'const r = await navigator.serviceWorker.getRegistrations()', ['uses .serviceWorker']],
      ['navigator.storage', 'await navigator.storage.persist()', ['uses .storage']],
    ])('finds %s', (_name, code, expected) => {
      expect(what(code)).toEqual(expected)
    })

    it.each([
      ['an ordinary import', "import { Link } from 'react-router'"],
      ['a comment naming one', '// never calls localStorage or fetch'],
      ['a string naming one', "const note = 'localStorage is not touched'"],
      ['an object key of the same name', 'const options = { fetch: true }'],
      ['reload, which is allowed', 'window.location.reload()'],
    ])('ignores %s', (_name, code) => {
      expect(what(code)).toEqual([])
    })
  })
})
