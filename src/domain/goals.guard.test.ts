import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * The predict-nothing guard.
 *
 * `CLAUDE.md` forbids promising body-transformation outcomes, and a target
 * weight beside a trend line is exactly the shape that invites a promised
 * date. The rule is mostly structural already — `Trend`'s evidence points
 * are dated *observations* and `GoalProgress` has no duration field — but
 * "structural" only holds while nobody adds the field, and the person who
 * adds it will be doing something that feels helpful.
 *
 * So this asserts the rule at the level where it can be broken: **no
 * exported symbol in the profile or goal modules may even be named like a
 * forecast, and no exported interface may declare a date-typed field** other
 * than the birth date that is an input rather than a prediction.
 *
 * Names, not behaviour, on purpose. A test of behaviour cannot see
 * `estimatedDate` being added — it can only fail once something reads it,
 * which may be a release later. A name check fails in the diff that
 * introduces it.
 *
 * Technique is the seed-field guard's: interrogate a real TypeScript program
 * rather than grep, so a symbol renamed through a re-export is still caught.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, '../..')

const GUARDED = ['src/domain/profile.ts', 'src/domain/goals.ts']

/** Anything that would name a prediction rather than an observation. */
const FORECAST_NAME = /eta|forecast|project|predict|willReach|timeTo|byDate/i

/**
 * Date-typed fields are how a forecast smuggles itself in past a name check —
 * `target: Date` says nothing suspicious until you notice it is a *when*.
 * birthDate is the one legitimate date: an input the user supplies, never a
 * value the app derives.
 */
const ALLOWED_DATE_FIELDS = new Set(['birthDate', 'profileConfirmedAt'])

interface Finding {
  file: string
  detail: string
}

function inspect(): Finding[] {
  const configPath = path.join(REPO_ROOT, 'tsconfig.app.json')
  const config = ts.readConfigFile(configPath, ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, REPO_ROOT)
  const program = ts.createProgram(parsed.fileNames, parsed.options)
  const checker = program.getTypeChecker()
  const findings: Finding[] = []

  for (const relative of GUARDED) {
    const source = program.getSourceFile(path.join(REPO_ROOT, relative))
    if (!source) {
      findings.push({ file: relative, detail: 'not found in the TypeScript program' })
      continue
    }
    const moduleSymbol = checker.getSymbolAtLocation(source)
    if (!moduleSymbol) {
      findings.push({ file: relative, detail: 'exports nothing the checker can see' })
      continue
    }

    for (const exported of checker.getExportsOfModule(moduleSymbol)) {
      if (FORECAST_NAME.test(exported.getName())) {
        findings.push({
          file: relative,
          detail: `exported symbol "${exported.getName()}" is named like a prediction`,
        })
      }

      for (const declaration of exported.getDeclarations() ?? []) {
        if (!ts.isInterfaceDeclaration(declaration) && !ts.isTypeAliasDeclaration(declaration)) continue
        declaration.forEachChild((child) => {
          if (!ts.isPropertySignature(child) || !child.name) return
          const field = child.name.getText()
          if (FORECAST_NAME.test(field)) {
            findings.push({
              file: relative,
              detail: `${exported.getName()}.${field} is named like a prediction`,
            })
          }
          if (ALLOWED_DATE_FIELDS.has(field)) return
          const typeText = child.type?.getText() ?? ''
          if (/\bDate\b/.test(typeText)) {
            findings.push({
              file: relative,
              detail: `${exported.getName()}.${field} is date-typed (${typeText}) — a goal reports a distance, never a when`,
            })
          }
        })
      }
    }
  }
  return findings
}

describe('the profile and goal modules cannot express a prediction', () => {
  const findings = inspect()

  it('exports nothing named like a forecast, and no derived date field', () => {
    expect(
      findings.map((f) => `${f.file}: ${f.detail}`),
      'Goal progress is a distance, never a duration. CLAUDE.md forbids promising ' +
        'body-transformation outcomes, and joining a current value, a target and a rate ' +
        'into a date is that promise. If a projection is genuinely wanted, it is an owner ' +
        'decision, not a field.',
    ).toEqual([])
  })

  it('actually inspected both modules — the guard is not passing vacuously', () => {
    // A guard whose program failed to resolve would report no findings while
    // checking nothing. This is the tripwire for that.
    const configPath = path.join(REPO_ROOT, 'tsconfig.app.json')
    const config = ts.readConfigFile(configPath, ts.sys.readFile)
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, REPO_ROOT)
    const program = ts.createProgram(parsed.fileNames, parsed.options)
    const checker = program.getTypeChecker()

    for (const relative of GUARDED) {
      const source = program.getSourceFile(path.join(REPO_ROOT, relative))
      expect(source, `${relative} is missing from the program`).toBeDefined()
      const moduleSymbol = checker.getSymbolAtLocation(source!)
      const exports = checker.getExportsOfModule(moduleSymbol!)
      expect(exports.length, `${relative} exports nothing`).toBeGreaterThan(0)
    }
  })
}, 60_000)
