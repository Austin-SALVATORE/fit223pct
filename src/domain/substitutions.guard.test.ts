// Runs under the suite's shared jsdom environment (src/test/setup.ts assumes
// it) — this test only needs node's fs through ts.sys, which is available
// either way.
/// <reference types="node" />
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * `substitutedForId` is read in exactly one place: `substitutions.ts`.
 *
 * CC4 (coach, 29 Oct): "the governing information is the actual exercise
 * performed and logged, not whether the athlete interacted with the swap
 * control". Stored records can still hold a slot swapped away and back as
 * `substitutedForId === exerciseId` (written before CC4), so a reader that
 * compares the field itself — `substitutedForId === undefined`, the form six
 * readers used until Phase 2b.3 — misclassifies the original exercise as a
 * substitute and hides its note, warm-up prep, assistance control, ceiling
 * warning and per-side pill, and keeps it out of carry-forward. `isSubstitute`
 * and `authoredExerciseIdOf` read the field correctly; this fails any other
 * module that reads it.
 *
 * What counts as a read: a property access (`x.substitutedForId`, optional
 * chaining included), a destructured binding, a shorthand property, and **any
 * string literal spelling the name** — which is how `'substitutedForId' in x`,
 * `x['substitutedForId']`, `Object.prototype.hasOwnProperty.call(x,
 * 'substitutedForId')` and `Reflect.get(x, 'substitutedForId')` all read it. (The
 * first version of this guard looked only at property and element accesses; the
 * independent check of 02761fe planted the `in` and `hasOwnProperty` forms in
 * `historyEligibility.ts` and it stayed green.) What does not count: an object
 * literal's key (`swapExercise` WRITES the field), a type member (`types.ts`, the
 * legacy shape in `db.ts`) and a string-literal TYPE (`Pick<..., 'substitutedForId'>`),
 * which cannot read anything.
 *
 * Syntax, not types, deliberately: the name is unique in this codebase, so a
 * type checker adds nothing here, and a plain parse is fast.
 *
 * **What it still cannot see**, stated so nobody mistakes it for more:
 *   - a name assembled at runtime: `'substituted' + 'ForId'`, a template literal
 *     with a substitution, a key looked up in a variable;
 *   - a read that never names the field: `Object.keys` / `Object.entries` /
 *     `Object.values` over a slot, spreading one into code that inspects it,
 *     `JSON.stringify` and a regex over the result;
 *   - a wrong read inside `substitutions.ts` itself, the one file exempt;
 *   - files the scan does not parse: `*.test.*`, `scripts/`, and anything that
 *     is not TypeScript.
 * Nor does it police `substituteLoad`, deliberately: that field is read in many
 * places on purpose (`nextSetTarget`, `SetScreen`, the suggestion walk) and has no
 * CC4 ambiguity to misread; it is `substitutedForId`, whose stored value may be
 * the slot's own id, that needs one reader.
 *
 * Negative controls, run 30 Oct (mutation applied, the whole suite run, restored
 * and `cmp`ed): a raw `workoutExercise.substitutedForId === undefined` put back
 * in `SetScreen.tsx` at the note, the assistance control, the ceiling warning or
 * the warm-up prep -> "no other module reads it", whose failure names
 * `src/features/workout/SetScreen.tsx:71 property access:
 * workoutExercise.substitutedForId` (and, in `SetScreen.swapBack.test.tsx`, that
 * reader's own assertion). A planted `void exercise.substitutedForId` in
 * `historyEligibility.ts` -> the same test, naming `src/domain/historyEligibility.ts:53`
 * (it is the only red test in the suite). The one reader this guard CANNOT see is
 * `showsPerSidePill`, because it lives in `substitutions.ts`, the allowed file; a
 * raw comparison there is caught by the screen test for the pill alone.
 *
 * The assertion is an exact list, not a count: a new read fails as an extra,
 * with its file and line. The self-test below is what keeps the scanner honest:
 * it shows each shape of read being found and each shape of write being left
 * alone, so a clean result on the real tree means something.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, '../..')
const FIELD = 'substitutedForId'
/** The one module allowed to read the field. */
const HELPER_FILE = 'src/domain/substitutions.ts'

interface Read {
  line: number
  shape: string
  text: string
}

function readsOfField(sourceFile: ts.SourceFile): Read[] {
  const reads: Read[] = []
  const record = (node: ts.Node, shape: string) => {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
    reads.push({ line: line + 1, shape, text: node.getText(sourceFile) })
  }
  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAccessExpression(node) && node.name.text === FIELD) {
      record(node, 'property access')
    } else if (ts.isStringLiteralLike(node) && node.text === FIELD && !ts.isLiteralTypeNode(node.parent)) {
      record(node, 'string literal')
    } else if (ts.isBindingElement(node) && (node.propertyName ?? node.name).getText(sourceFile) === FIELD) {
      record(node, 'destructured binding')
    } else if (ts.isShorthandPropertyAssignment(node) && node.name.text === FIELD) {
      record(node, 'shorthand property')
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return reads
}

function parse(fileName: string, text: string): ts.SourceFile {
  return ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
}

function sourceFilesUnderSrc(): string[] {
  const config = ts.readConfigFile(path.join(REPO_ROOT, 'tsconfig.app.json'), ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, REPO_ROOT)
  return parsed.fileNames
    .map((file) => path.relative(REPO_ROOT, file))
    .filter((file) => file.startsWith('src/') && !/\.test\.tsx?$/.test(file) && !file.endsWith('.d.ts'))
}

describe('substitutedForId is read only through substitutions.ts', () => {
  it('no other module reads it', () => {
    const files = sourceFilesUnderSrc()
    // The scan must have looked at the code that matters, or a clean result is vacuous.
    expect(files).toContain('src/features/workout/SetScreen.tsx')
    expect(files).toContain('src/domain/carryForward.ts')
    expect(files).toContain(HELPER_FILE)

    const stray: string[] = []
    for (const file of files) {
      if (file === HELPER_FILE) continue
      const text = ts.sys.readFile(path.join(REPO_ROOT, file))
      if (text === undefined || !text.includes(FIELD)) continue
      for (const read of readsOfField(parse(file, text))) {
        stray.push(`${file}:${read.line} ${read.shape}: ${read.text}`)
      }
    }
    expect(stray, 'read the swap state through isSubstitute / authoredExerciseIdOf (substitutions.ts)').toEqual([])
  })

  it('the helper module does read it — the scan can see that file', () => {
    const text = ts.sys.readFile(path.join(REPO_ROOT, HELPER_FILE)) ?? ''
    expect(readsOfField(parse(HELPER_FILE, text)).length).toBeGreaterThan(0)
  })

  describe('the scanner: every shape of read is found, every shape of write is left alone', () => {
    const shapes = (code: string) => readsOfField(parse('probe.ts', code)).map((read) => read.shape)

    it.each([
      ['a comparison', 'if (slot.substitutedForId === undefined) go()', ['property access']],
      ['optional chaining', 'const id = slot?.substitutedForId', ['property access']],
      ['a nullish default', 'const id = slot.substitutedForId ?? slot.exerciseId', ['property access']],
      ['an element access', "const id = slot['substitutedForId']", ['string literal']],
      ['an `in` test', "const swapped = 'substitutedForId' in slot", ['string literal']],
      ['hasOwnProperty', "const has = Object.prototype.hasOwnProperty.call(slot, 'substitutedForId')", ['string literal']],
      ['Reflect.get', "const id = Reflect.get(slot, 'substitutedForId')", ['string literal']],
      ['a template literal with no substitution', 'const id = slot[`substitutedForId`]', ['string literal']],
      ['a destructured binding', 'const { substitutedForId } = slot', ['destructured binding']],
      ['a renamed binding', 'const { substitutedForId: from } = slot', ['destructured binding']],
      ['a shorthand property', 'const copy = { substitutedForId }', ['shorthand property']],
    ])('finds %s', (_name, code, expected) => {
      expect(shapes(code)).toEqual(expected)
    })

    it.each([
      ['an object literal key (a write)', 'const slot = { exerciseId: a, substitutedForId: authored }'],
      ['a type member', 'interface Slot { substitutedForId?: string }'],
      ['a string-literal type', "type S = Pick<WorkoutExercise, 'exerciseId' | 'substitutedForId'>"],
      ['a string that only mentions it', "const note = 'a record with substitutedForId set'"],
      ['a comment', '// slot.substitutedForId === undefined'],
      ['a string', "const note = 'substitutedForId is not read here'"],
    ])('ignores %s', (_name, code) => {
      expect(shapes(code)).toEqual([])
    })
  })
})
