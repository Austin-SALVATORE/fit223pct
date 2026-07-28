import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * Guard A — the routine subtree cannot reach the write layer.
 *
 * The owner's first ruling is that a routine guides and ends: nothing
 * written, nothing counted, no streak, no gap (docs/RecoveryRoutines.md).
 * That ruling is the one most likely to be eroded later by a well-meaning
 * "wouldn't it be nice to see consistency", so it gets a structural guard as
 * well as a behavioural one (Guard B, routineNoTracking.write.test.tsx).
 * Neither subsumes the other: this one fails at the moment someone *imports*
 * the repository — visible in the diff, at review time — while Guard B fails
 * if a write happens by a path this does not model.
 *
 * Technique is the seed-field guard's: build a real TypeScript program and
 * interrogate the resolved module graph, rather than grepping text.
 *
 * **Dynamic imports are handled explicitly and loudly.** A statement-level
 * walk misses `await import('@/data/repositories')` entirely, which would let
 * exactly the thing this forbids in through a hole. So the walk also visits
 * `import()` call expressions, and any dynamic import inside the guarded
 * subtree whose specifier is not a string literal fails the test —
 * unresolvable means uncleared, and uncleared must be loud.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, '../../..')

/** Everything that can persist. */
const WRITE_LAYER = ['src/data/db.ts', 'src/data/repositories.ts']

/** The subtree that must stay clean. */
const GUARDED_ENTRY = 'src/features/recovery/RoutinePlayer.tsx'

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
      // Static: import / export-from.
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
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

describe('the routine subtree cannot reach the write layer', () => {
  const graph = buildGraph(GUARDED_ENTRY)

  it('imports nothing that persists, transitively', () => {
    const reachable = WRITE_LAYER.filter((target) => graph.closure.has(target))

    expect(
      reachable,
      `${GUARDED_ENTRY} transitively imports the write layer. A routine writes nothing — ` +
        'no completion, no count, no streak (docs/RecoveryRoutines.md ruling 1). If a routine ' +
        'genuinely needs stored data, that is an owner decision, not an import.',
    ).toEqual([])
  })

  it('contains no dynamic import this guard cannot resolve', () => {
    expect(
      graph.unresolvable,
      'A dynamic import with a computed specifier inside the routine subtree cannot be ' +
        'cleared by this guard, so it is treated as uncleared. Use a static import, or a ' +
        'string-literal specifier.',
    ).toEqual([])
  })

  it('actually walked the subtree — the guard is not passing vacuously', () => {
    // A guard whose graph is empty passes every assertion above while
    // checking nothing. This is the tripwire for a broken entry path.
    expect(graph.closure.has(GUARDED_ENTRY)).toBe(true)
    expect(graph.closure.size).toBeGreaterThan(5)
  })
}, 60_000)
