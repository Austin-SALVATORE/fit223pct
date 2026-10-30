// Runs under the suite's shared jsdom environment (src/test/setup.ts assumes
// it) — this test only needs node's fs through ts.sys, which is available
// either way.
/// <reference types="node" />
import path from 'node:path'
import ts from 'typescript'
import { beforeAll, describe, expect, it } from 'vitest'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'

/**
 * Nothing in this release stores a progress photo, or anything about one.
 *
 * The owner's ruling (6 Aug, docs/Roadmap.md, "Private progress photos"): "Fit223
 * should not store images, paths, metadata, or completion status in the current
 * release", with privacy, deletion, backup and local-first storage to be designed
 * before any implementation. The clause most likely to be broken by accident is the
 * last one: a boolean feels like nothing, and "photo taken" is exactly that.
 *
 * The roadmap said this ruling "has no equivalent guard yet", unlike the stretching
 * rule, which a structural guard (`routineNoTracking.guard.test.ts`) and a
 * behavioural one (`routineNoTracking.write.test.tsx`) hold. There is no photo
 * feature to drive a behavioural test through, so this is structural, in four
 * layers, each failing at the moment someone adds the thing, in the diff:
 *
 *   1. the persistence files (the model, the Dexie schema, the repositories, the
 *      two export formats, the import schema) contain no identifier or string that
 *      names a photo, an image, a path to one, or capture metadata;
 *   2. no source file captures or ingests an image: no `getUserMedia`,
 *      `ImageCapture`, `createImageBitmap`, `readAsDataURL`, canvas export, JSX
 *      `capture` attribute, or file input that accepts an image; and a file input
 *      at all is allowed in one place only (program import, `.json`/`.md`);
 *   3. no write call (`put`, `add`, `update`, `bulkPut`, `bulkAdd`) is handed an
 *      object literal with such a key;
 *   4. at runtime, after the app boots, no stored record in any table has such a
 *      key at any depth.
 *
 * **What it cannot see**, stated so nobody mistakes it for more:
 *   - VALUES: a photo status kept under a neutral key (`done: true` on a week-3
 *     record, `note: 'photo taken'`, a `flags` bag) passes every layer. It guards
 *     names, so it stops the obvious field and the well-meant "small flag", not a
 *     disguised one; a reviewer must catch that;
 *   - a name built at runtime (`record['pho' + 'to']`), and a variable passed to a
 *     write rather than an object literal (layer 3);
 *   - image bytes in a store this does not look at: the Cache Storage / service
 *     worker precache (it is configured in `vite.config.ts`, and holds the app's own
 *     art), `localStorage`, a library's own storage;
 *   - the exercise art itself and every `<img>`: displaying an image is not storing
 *     one, and layer 2 does not flag it;
 *   - program TEXT: the coach's spec mentions photos in weeks 1, 3 and 5, and a
 *     program's prose may say so; text a person reads is not a stored status;
 *   - a feature added in a file layer 1 does not list: it is caught only if it
 *     touches the persistence files, a write call, or a capture API.
 *
 * Negative controls, run 30 Oct (mutation applied, the whole suite run, restored and
 * `cmp`ed):
 *   `photoTaken?: boolean` added to `CheckIn` in types.ts
 *                         -> layer 1 (1 red), naming `src/domain/types.ts:<line> names
 *                            "photoTaken"`
 *   a `photoWeek` index added to the `checkins` store in db.ts
 *                         -> layer 1 (1 red)
 *   the program-import file input changed to `accept="image/*"`
 *                         -> layer 2 and "the one file input accepts only program
 *                            files" (2 red), and eight ProgramDataActions tests, which
 *                            upload a `.json` the input now refuses
 *   `capture="environment"` added to that input
 *                         -> layer 2 (1 red)
 *   `{ locale: next, photoTaken: true }` handed to `settingsRepo.update` in
 *     SettingsPage.tsx    -> layer 3 (1 red)
 *   `progressPhotoDone: false` written into the seeded settings record
 *                         -> layer 3 AND layer 4 (2 red): the first run of this control
 *                            wrote the literal as `{ ... } as never`, and layer 3 did NOT
 *                            see it, because the argument was a cast, not an object
 *                            literal. That was a hole in the guard; `unwrap` now peels
 *                            casts and parentheses, and the self-test has the case.
 * and the scanners' self-tests show each shape of each layer found and each look-alike
 * left alone.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, '../..')

/** Names that mean a photo, an image, a path to one, or capture metadata. */
const PHOTO_NAME = /photo|picture|selfie|image|img|exif|camera|capture|bitmap|blob|base64|dataurl|filepath|mediaurl|attachment/i

/** Layer 1: everything that defines what is stored, or how it is exported or imported. */
const PERSISTENCE_FILES = [
  'src/domain/types.ts',
  'src/data/db.ts',
  'src/data/repositories.ts',
  'src/domain/dataExport.ts',
  'src/domain/programExport.ts',
  'src/domain/programImport.ts',
]

/** Layer 2: APIs that capture or read an image. */
const CAPTURE_APIS = new Set([
  'getUserMedia',
  'mediaDevices',
  'ImageCapture',
  'createImageBitmap',
  'readAsDataURL',
  'toDataURL',
  'toBlob',
  'showOpenFilePicker',
])

/** The one file input in the app: program import, `.json` / `.md` only. */
const FILE_INPUT_ALLOWED = 'src/features/plan/ProgramDataActions.tsx'

const WRITE_METHODS = new Set(['put', 'add', 'update', 'bulkPut', 'bulkAdd', 'upsert'])

interface Finding {
  line: number
  what: string
}

const parse = (name: string, text: string) => ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

function lineOf(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
}

/** Layer 1: an identifier or a string whose text names a photo. */
function namesInFile(sourceFile: ts.SourceFile): Finding[] {
  const found: Finding[] = []
  const visit = (node: ts.Node): void => {
    if ((ts.isIdentifier(node) || ts.isStringLiteralLike(node)) && PHOTO_NAME.test(node.text)) {
      found.push({ line: lineOf(sourceFile, node), what: `names "${node.text}"` })
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return found
}

/** Layer 2: a capture or ingest API, or a file input that is not the program import. */
function captureInFile(sourceFile: ts.SourceFile, file: string): Finding[] {
  const found: Finding[] = []
  const attr = (node: ts.JsxAttributes, name: string) =>
    node.properties.find((p): p is ts.JsxAttribute => ts.isJsxAttribute(p) && p.name.getText(sourceFile) === name)
  const text = (a: ts.JsxAttribute | undefined) =>
    a?.initializer && ts.isStringLiteral(a.initializer) ? a.initializer.text : undefined
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && CAPTURE_APIS.has(node.text)) {
      found.push({ line: lineOf(sourceFile, node), what: `uses ${node.text}` })
    }
    if (ts.isJsxOpeningLikeElement(node)) {
      const attributes = node.attributes
      if (attr(attributes, 'capture')) found.push({ line: lineOf(sourceFile, node), what: 'has a capture attribute' })
      const accept = text(attr(attributes, 'accept'))
      if (accept !== undefined && /image|photo|\.(jpe?g|png|heic|heif|webp|avif|gif)\b/i.test(accept)) {
        found.push({ line: lineOf(sourceFile, node), what: `accepts images (${accept})` })
      }
      if (text(attr(attributes, 'type')) === 'file' && file !== FILE_INPUT_ALLOWED) {
        found.push({ line: lineOf(sourceFile, node), what: 'is a file input outside program import' })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return found
}

/** Peels `( ... )`, `x as T` and `x satisfies T` so a wrapped object literal is still seen. */
function unwrap(node: ts.Expression): ts.Expression {
  let current = node
  while (ts.isParenthesizedExpression(current) || ts.isAsExpression(current) || ts.isSatisfiesExpression(current)) {
    current = current.expression
  }
  return current
}

/** Layer 3: an object literal handed straight to a write call, with such a key. */
function writesInFile(sourceFile: ts.SourceFile): Finding[] {
  const found: Finding[] = []
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      WRITE_METHODS.has(node.expression.name.text)
    ) {
      for (const argument of node.arguments) {
        // The literal may be wrapped in a cast or parentheses: `put({ ... } as never)`.
        const literal = unwrap(argument)
        if (!ts.isObjectLiteralExpression(literal)) continue
        for (const property of literal.properties) {
          const name = property.name && (ts.isIdentifier(property.name) || ts.isStringLiteralLike(property.name)) ? property.name.text : undefined
          if (name !== undefined && PHOTO_NAME.test(name)) {
            found.push({ line: lineOf(sourceFile, property), what: `writes a "${name}" key via .${node.expression.name.text}()` })
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return found
}

/** Layer 4: every key, at any depth, of a stored record. */
function photoKeysIn(value: unknown, trail = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((item, i) => photoKeysIn(item, `${trail}[${i}]`))
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [
      ...(PHOTO_NAME.test(key) ? [`${trail}.${key}`] : []),
      ...photoKeysIn(child, `${trail}.${key}`),
    ])
  }
  return []
}

function sourceFilesUnderSrc(): string[] {
  const config = ts.readConfigFile(path.join(REPO_ROOT, 'tsconfig.app.json'), ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, REPO_ROOT)
  return parsed.fileNames
    .map((file) => path.relative(REPO_ROOT, file))
    .filter((file) => file.startsWith('src/') && !/\.test\.tsx?$/.test(file) && !file.endsWith('.d.ts'))
}

const read = (file: string) => {
  const text = ts.sys.readFile(path.join(REPO_ROOT, file))
  if (text === undefined) throw new Error(`${file} is missing`)
  return text
}

describe('layer 1: the persistence files name no photo, image, path or capture metadata', () => {
  it('the files this guard reads exist and are not empty (a clean result for nothing is not a result)', () => {
    for (const file of PERSISTENCE_FILES) expect(read(file).length, file).toBeGreaterThan(500)
  })

  it('none of them does', () => {
    const found = PERSISTENCE_FILES.flatMap((file) => namesInFile(parse(file, read(file))).map((f) => `${file}:${f.line} ${f.what}`))
    expect(found, 'the owner ruled: no images, paths, metadata or completion status in this release').toEqual([])
  })
})

describe('layer 2: nothing captures or ingests an image', () => {
  it('no source file does', () => {
    const files = sourceFilesUnderSrc()
    // The scan must reach the code that could (a UI file with a file input, the data layer).
    expect(files).toContain(FILE_INPUT_ALLOWED)
    expect(files).toContain('src/data/db.ts')
    const found = files.flatMap((file) => {
      const text = read(file)
      return captureInFile(parse(file, text), file).map((f) => `${file}:${f.line} ${f.what}`)
    })
    expect(found).toEqual([])
  })

  it('the one file input is program import, and it accepts only program files', () => {
    const text = read(FILE_INPUT_ALLOWED)
    expect(text).toMatch(/accept="\.json,\.md,\.markdown"/)
  })
})

describe('layer 3: no write is handed such a key', () => {
  it('no source file writes one', () => {
    const found = sourceFilesUnderSrc().flatMap((file) =>
      writesInFile(parse(file, read(file))).map((f) => `${file}:${f.line} ${f.what}`),
    )
    expect(found).toEqual([])
  })
})

describe('layer 4: after boot, no stored record has such a key', () => {
  beforeAll(async () => {
    await seedDatabase()
  })

  it('in any table, at any depth', async () => {
    const tables = await Promise.all(db.tables.map(async (table) => [table.name, await table.toArray()] as const))
    // Seeding must have put something in there, or this checked nothing.
    expect(tables.flatMap(([, rows]) => rows).length).toBeGreaterThan(20)
    const found = tables.flatMap(([name, rows]) => photoKeysIn(rows, name))
    expect(found).toEqual([])
  })
})

describe('the scanners: each shape is found, each look-alike is left alone', () => {
  const names = (code: string) => namesInFile(parse('p.ts', code)).map((f) => f.what)
  const capture = (code: string, file = 'p.tsx') => captureInFile(parse(file, code), file).map((f) => f.what)
  const writes = (code: string) => writesInFile(parse('p.ts', code)).map((f) => f.what)

  it.each([
    ['a field', 'interface CheckIn { photoTaken?: boolean }', ['names "photoTaken"']],
    ['a type name', 'interface ProgressPhoto { id: string }', ['names "ProgressPhoto"']],
    ['an image path', 'interface Entry { imagePath: string }', ['names "imagePath"']],
    ['capture metadata', 'interface Entry { exifData: unknown }', ['names "exifData"']],
    ['a Dexie table', "this.version(9).stores({ progressPhotos: 'id, week' })", ['names "progressPhotos"']],
    ['a Dexie index', "this.version(9).stores({ checkins: 'id, date, photoWeek' })", ['names "id, date, photoWeek"']],
    ['a bytes field', 'interface Entry { photoBlob: Blob }', ['names "photoBlob"', 'names "Blob"']],
  ])('layer 1 finds %s', (_name, code, expected) => {
    expect(names(code)).toEqual(expected)
  })

  it.each([
    ['getUserMedia', 'navigator.mediaDevices.getUserMedia({ video: true })', ['uses mediaDevices', 'uses getUserMedia']],
    ['a capture attribute', '<input type="file" capture="environment" />', ['has a capture attribute', 'is a file input outside program import']],
    ['an image-accepting input', '<input accept="image/*" />', ['accepts images (image/*)']],
    ['a file extension accept', '<input accept=".jpg,.png" />', ['accepts images (.jpg,.png)']],
    ['a file input elsewhere', '<input type="file" accept=".json" />', ['is a file input outside program import']],
    ['a canvas export', 'canvas.toDataURL("image/png")', ['uses toDataURL']],
    ['a data URL read', 'reader.readAsDataURL(file)', ['uses readAsDataURL']],
  ])('layer 2 finds %s', (_name, code, expected) => {
    expect(capture(code)).toEqual(expected)
  })

  it('layer 2 leaves the program import input alone', () => {
    expect(capture('<input type="file" accept=".json,.md" />', FILE_INPUT_ALLOWED)).toEqual([])
  })

  it.each([
    ['put', 'db.checkins.put({ id, photoTaken: true })', ['writes a "photoTaken" key via .put()']],
    ['update', "db.settings.update('user', { 'photoDone': true })", ['writes a "photoDone" key via .update()']],
    ['add', 'db.workouts.add({ id, imageUri })', ['writes a "imageUri" key via .add()']],
    ['a literal wrapped in a cast', 'db.settings.put({ id, photoDone: false } as never)', ['writes a "photoDone" key via .put()']],
  ])('layer 3 finds a write: %s', (_name, code, expected) => {
    expect(writes(code)).toEqual(expected)
  })

  it('layer 4 finds a key at any depth, in an array, and names the path', () => {
    expect(photoKeysIn([{ id: 1, nested: { photoDone: true } }], 'checkins')).toEqual(['checkins[0].nested.photoDone'])
  })

  it('layer 4 reads keys, not values: program text that mentions photos is not a stored status', () => {
    expect(photoKeysIn([{ note: 'Progress photos in weeks 1, 3 and 5' }], 'programs')).toEqual([])
  })

  it.each([
    ['a comment', '// no photo is stored here'],
    ['a word that only contains a letter run', 'interface Plan { cameraman?: never }'.replace('cameraman', 'cameo')],
    ['an ordinary write', 'db.checkins.put({ id, sleep: 4 })'],
  ])('ignores %s', (_name, code) => {
    expect(names(code)).toEqual([])
    expect(writes(code)).toEqual([])
    expect(capture(code)).toEqual([])
  })
})
