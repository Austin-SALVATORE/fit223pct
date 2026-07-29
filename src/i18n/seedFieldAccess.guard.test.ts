// Runs under the suite's shared jsdom environment (src/test/setup.ts assumes
// it) — this test only needs node's fs through ts.sys, which is available
// either way.
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * The bug class this guard exists for (docs/review-backlog.md §4):
 * a locale key exists in all three locales, one render site consults it,
 * and a second site reads the stored English field directly. The shipped
 * weekdayActivities bug was this. So was I1 (TodayPage's resume hero).
 *
 * Neither existing test can catch it. The orphan sweep proves no key is
 * *dead*; localeParity.test.ts proves no key is *missing*. Nothing proved
 * that a site which should ask for a key actually does — a suite that is
 * green tells you nothing about this class. That gap is what this file
 * closes.
 *
 * Mechanism: the TypeScript *type checker*, not a text scan. The linter
 * here is oxlint, which has no custom-rule plugin API, and a regex over
 * these field names returns 28 hits in src/features of which one is a
 * defect — `.focus()` DOM calls, `t('doneToday.title')`, `file.name`,
 * `document.title`. A guard that cries wolf 27 times acquires a
 * suppression list and stops meaning anything. Resolving the *receiver's
 * type* gives zero such false positives, and still fires when a variable
 * is renamed.
 *
 * The assertion is an exact set match, deliberately. A threshold ("no
 * more than N") rots into a permanent allowlist. An exact match fails both
 * ways: a new raw read fails as an extra, and an allowlist entry whose
 * code is gone fails as a stale declaration that must be deleted.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, '../..')

/** Domain types whose string fields are seed content — locale-keyed, translated via src/i18n/. */
const SEED_CONTENT_TYPES = new Set([
  'Program',
  'SessionTemplate',
  'ActivityTemplate',
  'ActivityItem',
  'Exercise',
  'RepRangePrescription',
  'LadderPrescription',
])

/** The fields that carry display prose. Reading one raw in a feature bypasses translation. */
const LOCALIZED_FIELDS = new Set(['name', 'focus', 'title', 'cues', 'note', 'label'])

interface DeclaredRead {
  /** Path relative to the repo root. */
  file: string
  /** Source text of the property access, e.g. 'result.program.name'. */
  read: string
  /** Why this raw read is correct. An entry without a real reason is a suppression. */
  reason: string
}

/**
 * Every raw seed-field read that is *intentional*. Not a backlog of things
 * to fix later — each entry is a claim that translating here would be
 * wrong, or a defect filed elsewhere and knowingly left.
 */
const DECLARED_READS: DeclaredRead[] = [
  {
    file: 'src/features/plan/ProgramDataActions.tsx',
    read: 'result.program.name',
    reason:
      "Imported content renders verbatim (.claude/rules/architecture.md) — validateProgramImport stamps origin:'imported', so translating the name the owner typed would be the seed-shadowing bug that rule exists to prevent.",
  },
  {
    file: 'src/features/plan/ProgramDataActions.tsx',
    read: 'importState.program.name',
    reason: 'Same imported program, confirm-replace path — verbatim by the same rule.',
  },
  {
    file: 'src/features/plan/ProgramDataActions.tsx',
    read: 'state.program.name',
    reason: 'Same imported program, rendered in the confirm prompt — verbatim by the same rule.',
  },
]

function seedTypeNamesOf(type: ts.Type): string[] {
  const parts = type.isUnion() ? type.types : [type]
  const names: string[] = []
  for (const part of parts) {
    const symbol = part.aliasSymbol ?? part.getSymbol()
    const name = symbol?.getName()
    if (name && SEED_CONTENT_TYPES.has(name)) names.push(name)
  }
  return names
}

interface Finding {
  file: string
  read: string
  line: number
  detail: string
}

function findRawSeedFieldReads(): Finding[] {
  const configPath = path.join(REPO_ROOT, 'tsconfig.app.json')
  const config = ts.readConfigFile(configPath, ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, REPO_ROOT)
  const program = ts.createProgram(parsed.fileNames, parsed.options)
  const checker = program.getTypeChecker()
  const findings: Finding[] = []

  for (const sourceFile of program.getSourceFiles()) {
    const file = path.relative(REPO_ROOT, sourceFile.fileName)
    if (!file.startsWith('src/features/')) continue
    if (/\.test\.tsx?$/.test(file)) continue

    const record = (node: ts.Node, read: string, detail: string) => {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
      findings.push({ file, read, line: line + 1, detail })
    }

    const visit = (node: ts.Node): void => {
      // `session.focus`
      if (ts.isPropertyAccessExpression(node) && LOCALIZED_FIELDS.has(node.name.text)) {
        const type = checker.getNonNullableType(checker.getTypeAtLocation(node.expression))
        const seedTypes = seedTypeNamesOf(type)
        if (seedTypes.length > 0) {
          record(node, node.getText(), `${seedTypes.join('|')}.${node.name.text}`)
        }
      }
      // `const { focus } = session`
      if (ts.isObjectBindingPattern(node)) {
        const type = checker.getNonNullableType(checker.getTypeAtLocation(node))
        const seedTypes = seedTypeNamesOf(type)
        if (seedTypes.length > 0) {
          for (const element of node.elements) {
            const field = (element.propertyName ?? element.name).getText()
            if (LOCALIZED_FIELDS.has(field)) {
              record(element, `{ ${field} } = ${node.parent.getChildAt(2)?.getText() ?? '?'}`,
                `destructured ${seedTypes.join('|')}.${field}`)
            }
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
  }
  return findings
}

function identity(entry: { file: string; read: string }): string {
  // Line-independent on purpose: an unrelated edit above a declared read
  // must not fail this test, but changing what is read must.
  return `${entry.file} :: ${entry.read}`
}

describe('seed content is read through src/i18n, never raw in src/features', () => {
  it('every raw seed-field read in src/features is declared, and every declaration is still real', () => {
    const found = findRawSeedFieldReads()
    const foundIdentities = found.map(identity).sort()
    const declaredIdentities = DECLARED_READS.map(identity).sort()

    const undeclared = found.filter((f) => !declaredIdentities.includes(identity(f)))
    const stale = DECLARED_READS.filter((d) => !foundIdentities.includes(identity(d)))

    expect(
      undeclared.map((f) => `${f.file}:${f.line}  ${f.detail}  →  ${f.read}`),
      'Raw seed-content field read in src/features. Translate it through a hook in ' +
        'src/i18n/seedProgram.ts or seedExercise.ts (useSessionName, useSessionFocus, ' +
        'useLocalizedActivity, useExerciseName, …). If the raw read is genuinely correct — ' +
        'imported content renders verbatim — add it to DECLARED_READS with a reason.',
    ).toEqual([])

    expect(
      stale.map((d) => `${d.file} :: ${d.read}`),
      'Declared raw read no longer exists in the code. Delete the DECLARED_READS entry — ' +
        'a stale declaration silently pre-approves a future read of the same expression.',
    ).toEqual([])
  }, 60_000)
})
