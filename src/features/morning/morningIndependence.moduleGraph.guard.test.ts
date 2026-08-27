/// <reference types="node" />
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * Layer 2 — the module-graph guard (plan §7.3/§7.3b), now the primary
 * independence guard. Technique is `routineNoTracking.guard.test.ts`'s,
 * reused rather than re-derived: build a real TypeScript program from
 * `tsconfig.app.json`, walk the resolved import graph from `MorningSection`,
 * handle dynamic `import()` explicitly (a statement-level walk misses
 * `await import(...)` entirely), and carry the same non-vacuity tripwire.
 *
 * **Two different reasons for two different forbidden sets, not one list.**
 *
 * `FORBIDDEN_STRENGTH_SIDE` — `program.ts`, `warmups.ts`, `progression.ts`,
 * `adjustments.ts`, `schedule.ts`, `scheduleShift.ts`, `weeklyReview.ts`,
 * `readiness.ts`, `variationLadder.ts`. Nothing in `MorningSection`'s
 * closure has a legitimate reason to reach any of these — the module is
 * program-independent by design (plan §1.7) and reads only settings.
 *
 * `FORBIDDEN_RECOVERY_PREFIX` — the whole `src/features/recovery/**`
 * subtree (§7.3b). With the `hold` kind deleted (doc 23 §8, plan §9.5) the
 * module has zero legitimate reason to reach the routine subsystem — no
 * `stepId`, no `routineStepAsset`, no `RoutinePlayer`. This is a *threat*
 * forbidding, not a *tightening*: §4.4's entire finding is that an
 * outbound-only graph guard cannot see a write a component performs
 * because someone *else* handed it a callback, and `RoutinePlayer` is
 * exactly the shared component §4.4 is about. Forbidding the directory
 * makes that trigger structurally visible the moment someone reaches for
 * it, rather than depending on a reviewer remembering §4.4 exists.
 *
 * **`src/data/repositories.ts` / `src/data/db.ts` are deliberately NOT
 * forbidden.** Forbidding them would buy a stronger v1 guarantee at the
 * price of having to *weaken* this guard the moment daily-`unavailable`
 * (§2.4) lands and legitimately needs the write layer — the erosion
 * `docs/RecoveryRoutines.md` names as "the honest-looking move at that
 * moment… exactly what the ruling exists to prevent." Scoped as it is,
 * this guard is correct before and after activation and never needs
 * weakening. **Do not add them here** — see Layer 4
 * (`morningNoTracking.write.test.tsx`) for the guard that actually covers
 * writes, behaviourally rather than structurally, for exactly this reason.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, '../../..')

const GUARDED_ENTRY = 'src/features/morning/MorningSection.tsx'

const FORBIDDEN_STRENGTH_SIDE = [
  'src/data/seed/program.ts',
  'src/data/seed/warmups.ts',
  'src/domain/progression.ts',
  'src/domain/adjustments.ts',
  'src/domain/schedule.ts',
  'src/domain/scheduleShift.ts',
  'src/domain/weeklyReview.ts',
  'src/domain/readiness.ts',
  'src/domain/variationLadder.ts',
]

const FORBIDDEN_RECOVERY_PREFIX = 'src/features/recovery/'

interface Graph {
  /** Transitive local imports, repo-relative. */
  closure: Set<string>
  /** Dynamic import call sites with a non-literal specifier. */
  unresolvable: string[]
}

function buildGraph(entry: string): Graph {
  const configPath = path.join(REPO_ROOT, 'tsconfig.app.json')
  const config = ts.readConfigFile(configPath, ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, REPO_ROOT)
  const program = ts.createProgram(parsed.fileNames, parsed.options)

  const rel = (fileName: string) => path.relative(REPO_ROOT, fileName)
  const byRel = new Map(program.getSourceFiles().map((file) => [rel(file.fileName), file]))

  const closure = new Set<string>()
  const unresolvable: string[] = []

  const resolve = (specifier: string, fromFile: string): string | undefined => {
    const resolved = ts.resolveModuleName(specifier, fromFile, parsed.options, ts.sys)
    const name = resolved.resolvedModule?.resolvedFileName
    if (!name || name.includes('node_modules')) return undefined
    return rel(name)
  }

  const visit = (relPath: string) => {
    if (closure.has(relPath)) return
    closure.add(relPath)
    const file = byRel.get(relPath)
    if (!file) return

    const walk = (node: ts.Node): void => {
      // Static: import / export-from. A fully `import type { … }` /
      // `export type { … }` declaration is erased at compile time — it
      // produces zero runtime JavaScript, so it can never let this module
      // *execute* anything on the far side. Skipped deliberately (a
      // refinement over `routineNoTracking.guard.test.ts`'s own walk, not
      // a copy of it — see this file's own docblock): without this, the
      // guard treated `src/domain/types.ts`'s `import type {
      // ReadinessSignal, ReadinessTier } from './readiness'` as
      // MorningSection "reaching" readiness.ts, a false positive with no
      // runtime coupling behind it. A *mixed* import (`import { type X,
      // Y } from 'Z'`) still carries a real value (`Y`), so only a
      // wholly-type-only clause is skipped — `importClause.isTypeOnly` /
      // the export declaration's own `isTypeOnly`, never a per-specifier
      // check, which would incorrectly skip the mixed case too.
      const isTypeOnly = ts.isImportDeclaration(node)
        ? (node.importClause?.isTypeOnly ?? false)
        : ts.isExportDeclaration(node)
          ? node.isTypeOnly
          : false
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        !isTypeOnly
      ) {
        const next = resolve(node.moduleSpecifier.text, file.fileName)
        if (next) visit(next)
      }
      // Dynamic: import(...) — the hole a statement-level walk leaves open.
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const [specifier] = node.arguments
        if (specifier && ts.isStringLiteral(specifier)) {
          const next = resolve(specifier.text, file.fileName)
          if (next) visit(next)
        } else {
          const { line } = file.getLineAndCharacterOfPosition(node.getStart())
          unresolvable.push(`${relPath}:${line + 1}`)
        }
      }
      ts.forEachChild(node, walk)
    }
    walk(file)
  }

  visit(entry)
  return { closure, unresolvable }
}

describe('Morning Posture Reset cannot reach the strength side or the routine subsystem', () => {
  const graph = buildGraph(GUARDED_ENTRY)

  it('actually walked the subtree — the guard is not passing vacuously', () => {
    // A guard whose graph is empty passes every assertion below while
    // checking nothing. Tripwire for a broken entry path, same shape as
    // routineNoTracking.guard.test.ts's own.
    expect(graph.closure.has(GUARDED_ENTRY)).toBe(true)
    expect(graph.closure.size).toBeGreaterThan(5)
  })

  it('imports nothing from the strength side, transitively', () => {
    const reachable = FORBIDDEN_STRENGTH_SIDE.filter((target) => graph.closure.has(target))

    expect(
      reachable,
      `${GUARDED_ENTRY} transitively imports the strength side. Morning Posture Reset is ` +
        'program-independent by design (plan §1.7) and reads only settings — it must never ' +
        'reach the strength-side program content, progression, scheduling, or readiness modules.',
    ).toEqual([])
  })

  it('imports nothing from src/features/recovery/**, transitively', () => {
    const reachable = [...graph.closure].filter((file) => file.startsWith(FORBIDDEN_RECOVERY_PREFIX))

    expect(
      reachable,
      `${GUARDED_ENTRY} transitively imports the recovery-routine subsystem. With no hold-kind ` +
        'step (doc 23 §8), Morning Posture Reset has zero legitimate reason to reach ' +
        'RoutinePlayer or the routine-step asset resolver — see plan §7.3b/§4.4.',
    ).toEqual([])
  })

  it('contains no dynamic import this guard cannot resolve', () => {
    expect(
      graph.unresolvable,
      'A dynamic import with a computed specifier inside the Morning subtree cannot be ' +
        'cleared by this guard, so it is treated as uncleared. Use a static import, or a ' +
        'string-literal specifier.',
    ).toEqual([])
  })
}, 60_000)
