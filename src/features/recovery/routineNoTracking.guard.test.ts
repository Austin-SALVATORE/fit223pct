/// <reference types="node" />
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
 * **This outbound walk is one half.** It sees what the player imports and nothing
 * that sits above it; the other half, further down this file ("the other direction"),
 * holds the player to taking no props and walks its importers up to the route (QA
 * Q55/Q56). The bound that used to be written down as an open hole is now the
 * list of what that second half cannot see.
 *
 * **Dynamic imports are handled explicitly and loudly.** A statement-level
 * walk misses `await import('@/data/repositories')` entirely, which would let
 * exactly the thing this forbids in through a hole. So the walk also visits
 * `import()` call expressions, and any dynamic import inside the guarded
 * subtree whose specifier is not a string literal fails the test —
 * unresolvable means uncleared, and uncleared must be loud.
 *
 * **Type-only imports are erased, so they are not runtime coupling.** A
 * fully `import type { … }` / `export type { … }` clause produces zero
 * runtime JavaScript — it can never let this module *execute* anything on
 * the far side, so it is skipped deliberately. Fix mirrored from
 * `morningIndependence.moduleGraph.guard.test.ts`, which found this exact
 * false positive first: without the check, a type-only import of a
 * forbidden module fails the guard as though it were real coupling. A
 * *mixed* clause (`import { type A, b } from '...'`) still carries a real
 * value (`b`), so only a wholly-type-only clause is skipped —
 * `importClause.isTypeOnly` / the export declaration's own `isTypeOnly`,
 * never a per-specifier check, which would incorrectly skip the mixed case
 * too. Two guards, one notion of "import" — see that file's docblock for
 * why drift here would be a bug.
 *
 * Proved three ways in `RoutinePlayer.tsx`, then reverted (mutate, observe,
 * revert — see verification.md); `git diff` was byte-clean afterward:
 * 1. `import type { Fit223Database } from '@/data/db'` → guard stayed
 *    GREEN (the false positive this fixes; `db.ts` has no other exported
 *    type, so the class name doubles as the type-only target).
 * 2. `import { db } from '@/data/db'` → guard went RED, reporting
 *    `['src/data/db.ts']`.
 * 3. `import { type Fit223Database, db } from '@/data/db'` (mixed clause)
 *    → guard went RED, same report — only wholly-erased clauses are
 *    skipped, not any clause containing a type.
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

interface Context {
  /** Every source file of the app program, by repo-relative path. */
  byRel: Map<string, ts.SourceFile>
  rel: (fileName: string) => string
  /** A module specifier from a file, to a repo-relative project file (undefined for a package). */
  resolve: (specifier: string, fromFile: string) => string | undefined
  /**
   * A file parsed WITH parent pointers, for the checks that walk up from a node. The
   * program's own source files carry none, so `node.parent` is unusable on them.
   */
  parsed: (relPath: string) => ts.SourceFile
}

function createContext(): Context {
  const configPath = path.join(REPO_ROOT, 'tsconfig.app.json')
  const config = ts.readConfigFile(configPath, ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, REPO_ROOT)
  const program = ts.createProgram(parsed.fileNames, parsed.options)

  const rel = (fileName: string) => path.relative(REPO_ROOT, fileName)
  const byRel = new Map(program.getSourceFiles().map((file) => [rel(file.fileName), file]))
  const resolve = (specifier: string, fromFile: string): string | undefined => {
    const resolved = ts.resolveModuleName(specifier, fromFile, parsed.options, ts.sys)
    const name = resolved.resolvedModule?.resolvedFileName
    if (!name || name.includes('node_modules')) return undefined
    return rel(name)
  }
  const cache = new Map<string, ts.SourceFile>()
  const parsedFile = (relPath: string): ts.SourceFile => {
    let file = cache.get(relPath)
    if (!file) {
      const text = ts.sys.readFile(path.join(REPO_ROOT, relPath))
      if (text === undefined) throw new Error(`${relPath} is missing`)
      file = ts.createSourceFile(relPath, text, ts.ScriptTarget.Latest, true, relPath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
      cache.set(relPath, file)
    }
    return file
  }
  return { byRel, rel, resolve, parsed: parsedFile }
}

function buildGraph(entry: string): Graph {
  return closureFrom(createContext(), entry)
}

function closureFrom({ byRel, resolve }: Pick<Context, 'byRel' | 'resolve'>, entry: string): Graph {
  const closure = new Set<string>()
  const unresolvable: string[] = []

  const visit = (relPath: string) => {
    if (closure.has(relPath)) return
    closure.add(relPath)
    const file = byRel.get(relPath)
    if (!file) return

    const walk = (node: ts.Node): void => {
      // Static: import / export-from. A fully `import type { … }` /
      // `export type { … }` declaration is erased at compile time and
      // carries no runtime coupling — skipped deliberately, per-clause
      // rather than per-specifier so a mixed clause still counts.
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

/**
 * Guard A, the other direction — nothing ABOVE the player writes either, and the
 * player takes nothing from above that could.
 *
 * The outbound walk above sees only what the player imports. A completion write
 * REQUESTED by the player and PERFORMED by something above it (the component that
 * renders it, the route's wrapper, a callback handed down as a prop) is invisible
 * to it, and `routineNoTracking.write.test.tsx` renders the player bare, so an
 * optional callback is `undefined` there and cannot fire (docs/RecoveryRoutines.md,
 * "A stated bound on the no-tracking guards"; QA Q55/Q56). Closed in two parts:
 *
 *   (a) the player takes no props. Its signature has no parameters today only by
 *       convention; this makes it a fact. Without a prop there is no `onComplete`
 *       for a parent to pass, and a test that renders it bare is the whole story.
 *       Every place that renders it must pass none either (JSX attributes, spreads).
 *   (b) everything between the player and the route is checked. Starting at the
 *       player, the importers are walked upward until the file that defines the
 *       `<Route>`; each of those files must not import the write layer, the
 *       components wrapped around the player up to the route must not reach it
 *       transitively, any function the chain files import and CALL (a hook, a
 *       helper) must not reach it, and the `<Route>` itself carries no `loader`,
 *       `action` or `lazy` (a data-router action is a write path above the player).
 *
 * **What it still cannot see**, stated so nobody mistakes it for more:
 *   - anything above the route file: `main.tsx` legitimately writes at boot (seeding,
 *     closing stale workouts) and the router that hosts the route is out of scope;
 *   - a write that reaches the player's ancestors with no import link from the chain
 *     files: a context or provider installed elsewhere, a global event listener, a
 *     store module someone else imports; a completion SIGNAL can travel that way
 *     with no prop at all;
 *   - a write done by a component that only OBSERVES the player (for instance one that
 *     writes when the route unmounts) but is not in the chain, and a write keyed on the
 *     URL it navigates to (a "done" route that records): the chain is the player's
 *     importers and their wrappers, not everything that could notice it finish;
 *   - names: a write layer reached through a module that is not `db.ts` or
 *     `repositories.ts` (a new persistence module would have to be added to
 *     `WRITE_LAYER`).
 *
 * Negative controls, run 30 Oct (mutation applied, the whole suite run, restored and
 * `cmp`ed). In every one the outbound guard above and `routineNoTracking.write.test.tsx`
 * stay GREEN, which is the hole: only the new tests see it.
 *   `RoutinePlayer({ onComplete }: ...)`, a completion callback in the signature
 *                         -> "(a) RoutinePlayer ... takes no parameters" (1 red)
 *   `<RoutinePlayer onComplete={...} />` in App.tsx, a parent passing one
 *                         -> "(a) every place that renders it passes no props" (1 red)
 *   `import { db } from '@/data/db'` in App.tsx, the route file writing
 *                         -> "(b) no file between the player and the route imports the
 *                            write layer" (1 red)
 *   `import { workoutRepo } from '@/data/repositories'` in boundaries.tsx, the wrapper
 *     around the player      -> "(b) the components wrapped around the player ... cannot
 *                            reach the write layer" and ErrorBoundary.guard (2 red)
 *   App.tsx importing and CALLING `seedDatabase()` from the data layer, a hook-shaped
 *     write the route file runs
 *                         -> "(b) nothing the chain files import and call" (1 red; the
 *                            direct-import test is green, the module is `data/seed`)
 *   an `action={...}` on the `<Route>` around the player
 *                         -> "(b) the <Route> ... carries no loader, action or lazy" (1 red)
 * and the scanners' self-tests show each shape found and each look-alike left alone.
 */

interface ExportedFunction {
  name: string
  parameters: number
}

/** The exported function-like declarations of a file, with how many parameters each takes. */
function exportedFunctions(sourceFile: ts.SourceFile): ExportedFunction[] {
  const found: ExportedFunction[] = []
  const exported = (node: ts.Node) =>
    ts.canHaveModifiers(node) && (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && exported(statement)) {
      found.push({ name: statement.name?.text ?? 'default', parameters: statement.parameters.length })
    } else if (ts.isVariableStatement(statement) && exported(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const init = declaration.initializer
        if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
          found.push({ name: declaration.name.getText(sourceFile), parameters: init.parameters.length })
        }
      }
    } else if (ts.isExportAssignment(statement)) {
      const expr = statement.expression
      if (ts.isArrowFunction(expr) || ts.isFunctionExpression(expr)) {
        found.push({ name: 'default', parameters: expr.parameters.length })
      }
    }
  }
  return found
}

interface UsageSite {
  line: number
  /** The attributes it passes, as source text: must be empty. */
  attributes: string[]
  /** Tag names of the JSX elements around it, innermost first, up to and not including the nearest `<Route>`. */
  ancestors: string[]
  /** The `<Route>` it sits in, if any: its attribute names. */
  routeAttributes: string[] | null
}

const rootName = (tag: ts.JsxTagNameExpression): string => {
  let current: ts.Node = tag
  while (ts.isPropertyAccessExpression(current)) current = current.expression
  return current.getText()
}

/** Every JSX use of `RoutinePlayer` in a file, however it was imported. */
function usageSitesIn(sourceFile: ts.SourceFile, bindings: { named: string[]; namespaces: string[] }): UsageSite[] {
  const sites: UsageSite[] = []
  const isPlayerTag = (tag: ts.JsxTagNameExpression): boolean => {
    if (ts.isIdentifier(tag)) return bindings.named.includes(tag.text)
    if (ts.isPropertyAccessExpression(tag)) {
      return ts.isIdentifier(tag.expression) && bindings.namespaces.includes(tag.expression.text) && tag.name.text === 'RoutinePlayer'
    }
    return false
  }
  const visit = (node: ts.Node): void => {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      if (isPlayerTag(node.tagName)) {
        const ancestors: string[] = []
        let routeAttributes: string[] | null = null
        for (let parent: ts.Node | undefined = node.parent; parent; parent = parent.parent) {
          if (ts.isJsxElement(parent) || ts.isJsxSelfClosingElement(parent)) {
            const opening: ts.JsxOpeningLikeElement = ts.isJsxElement(parent) ? parent.openingElement : parent
            if (parent === node.parent && ts.isJsxElement(parent) && opening === node) continue
            const name = rootName(opening.tagName)
            if (name === 'Route') {
              routeAttributes = opening.attributes.properties.map((p: ts.JsxAttributeLike) =>
                ts.isJsxAttribute(p) ? p.name.getText(sourceFile) : `...${p.expression.getText(sourceFile)}`,
              )
              break
            }
            ancestors.push(name)
          }
        }
        sites.push({
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
          attributes: node.attributes.properties.map((p) => p.getText(sourceFile)),
          ancestors,
          routeAttributes,
        })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return sites
}

/** How a file imports the player: local names, and namespace names (`import * as X`). */
function playerBindings(ctx: Context, sourceFile: ts.SourceFile): { named: string[]; namespaces: string[] } {
  const named: string[] = []
  const namespaces: string[] = []
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
    if (ctx.resolve(statement.moduleSpecifier.text, sourceFile.fileName) !== GUARDED_ENTRY) continue
    const bindings = statement.importClause?.namedBindings
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        if ((element.propertyName ?? element.name).text === 'RoutinePlayer') named.push(element.name.text)
      }
    } else if (bindings && ts.isNamespaceImport(bindings)) {
      namespaces.push(bindings.name.text)
    }
  }
  return { named, namespaces }
}

/** Repo-relative project files that import `target` (statically or by `import('literal')`). */
function importersOf(ctx: Context, target: string): string[] {
  const found: string[] = []
  for (const [file, sourceFile] of ctx.byRel) {
    if (!file.startsWith('src/') || /\.test\.tsx?$/.test(file) || file.endsWith('.d.ts')) continue
    let imports = false
    const visit = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && !node.importClause?.isTypeOnly) {
        if (ctx.resolve(node.moduleSpecifier.text, sourceFile.fileName) === target) imports = true
      } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const [specifier] = node.arguments
        if (specifier && ts.isStringLiteral(specifier) && ctx.resolve(specifier.text, sourceFile.fileName) === target) imports = true
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
    if (imports) found.push(file)
  }
  return found
}

/** Whether a file renders a `<Route>` — where the climb ends. */
function definesRoute(sourceFile: ts.SourceFile): boolean {
  let found = false
  const visit = (node: ts.Node): void => {
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && rootName(node.tagName) === 'Route') found = true
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return found
}

interface Chain {
  /** The importers climbed through, ending at the file(s) that define the route. */
  files: string[]
  routeFiles: string[]
}

function chainToRoute(ctx: Context): Chain {
  const files: string[] = []
  const routeFiles: string[] = []
  const queue = [GUARDED_ENTRY]
  const seen = new Set(queue)
  while (queue.length > 0) {
    const current = queue.shift() as string
    for (const importer of importersOf(ctx, current)) {
      if (seen.has(importer)) continue
      seen.add(importer)
      files.push(importer)
      if (definesRoute(ctx.parsed(importer))) routeFiles.push(importer)
      else queue.push(importer)
    }
  }
  return { files, routeFiles }
}

/** Project files a file imports directly (type-only imports are erased and skipped). */
function directImports(ctx: Context, sourceFile: ts.SourceFile): string[] {
  const found: string[] = []
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && !node.importClause?.isTypeOnly) {
      const target = ctx.resolve(node.moduleSpecifier.text, sourceFile.fileName)
      if (target) found.push(target)
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [specifier] = node.arguments
      if (specifier && ts.isStringLiteral(specifier)) {
        const target = ctx.resolve(specifier.text, sourceFile.fileName)
        if (target) found.push(target)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return found
}

/** The project modules a file imports AND CALLS (`useX()`, `doY()`): where its logic can live. */
function calledImports(ctx: Context, sourceFile: ts.SourceFile): string[] {
  const local = new Map<string, string>()
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || statement.importClause?.isTypeOnly) continue
    const target = ctx.resolve(statement.moduleSpecifier.text, sourceFile.fileName)
    if (!target) continue
    const clause = statement.importClause
    if (clause?.name) local.set(clause.name.text, target)
    const bindings = clause?.namedBindings
    if (bindings && ts.isNamedImports(bindings)) for (const element of bindings.elements) local.set(element.name.text, target)
    if (bindings && ts.isNamespaceImport(bindings)) local.set(bindings.name.text, target)
  }
  const called = new Set<string>()
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression
      const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) ? callee.expression.text : undefined
      if (name !== undefined && local.has(name)) called.add(local.get(name) as string)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return [...called]
}

/** The project module a JSX tag name was imported from, or undefined (a package, or defined in the file). */
function moduleOfTag(ctx: Context, sourceFile: ts.SourceFile, tag: string): string | undefined {
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || statement.importClause?.isTypeOnly) continue
    const clause = statement.importClause
    const bindings = clause?.namedBindings
    const names = [
      ...(clause?.name ? [clause.name.text] : []),
      ...(bindings && ts.isNamedImports(bindings) ? bindings.elements.map((e) => e.name.text) : []),
      ...(bindings && ts.isNamespaceImport(bindings) ? [bindings.name.text] : []),
    ]
    if (names.includes(tag)) return ctx.resolve(statement.moduleSpecifier.text, sourceFile.fileName)
  }
  return undefined
}

describe('the routine player takes no props, and nothing above it writes', () => {
  const ctx = createContext()
  const playerFile = ctx.parsed(GUARDED_ENTRY)
  const chain = chainToRoute(ctx)

  const usage = chain.files.flatMap((file) => {
    const sourceFile = ctx.parsed(file)
    return usageSitesIn(sourceFile, playerBindings(ctx, sourceFile)).map((site) => ({ file, ...site }))
  })

  it('(a) RoutinePlayer is exported and takes no parameters, and so does everything else the file exports', () => {
    const exports = exportedFunctions(playerFile)
    expect(exports.map((e) => e.name), 'the player must be an exported function component').toContain('RoutinePlayer')
    const withParameters = exports.filter((e) => e.parameters > 0).map((e) => `${e.name}(${e.parameters})`)
    expect(
      withParameters,
      'The routine player takes no props: with an `onComplete` there is a completion callback a parent can ' +
        'turn into a write, which the outbound no-tracking guard cannot see (docs/RecoveryRoutines.md, ruling 1).',
    ).toEqual([])
  })

  it('(a) every place that renders it passes no props, no spread', () => {
    expect(usage.length, 'the player must be rendered somewhere, or this checked nothing').toBeGreaterThan(0)
    const passing = usage.filter((site) => site.attributes.length > 0).map((s) => `${s.file}:${s.line} passes ${s.attributes.join(' ')}`)
    expect(passing).toEqual([])
  })

  it('(b) the walk reaches the route: the player is rendered inside a <Route> in a file this found', () => {
    expect(chain.routeFiles).toContain('src/app/App.tsx')
    expect(usage.some((site) => site.routeAttributes !== null), 'a <Route> around the player').toBe(true)
  })

  it('(b) no file between the player and the route imports the write layer', () => {
    const writers = chain.files.flatMap((file) =>
      directImports(ctx, ctx.parsed(file))
        .filter((target) => WRITE_LAYER.includes(target))
        .map((target) => `${file} imports ${target}`),
    )
    expect(writers, 'a component above the player must not be able to record that a routine happened').toEqual([])
  })

  it('(b) the components wrapped around the player, up to the route, cannot reach the write layer', () => {
    const wrappers = usage.flatMap((site) =>
      site.ancestors.map((tag) => ({ file: site.file, tag, module: moduleOfTag(ctx, ctx.parsed(site.file), tag) })),
    )
    const reaching = wrappers
      .filter((w) => w.module !== undefined)
      .filter((w) => WRITE_LAYER.some((target) => closureFrom(ctx, w.module as string).closure.has(target)))
      .map((w) => `<${w.tag}> (${w.module}) around the player in ${w.file} reaches the write layer`)
    expect(reaching).toEqual([])
  })

  it('(b) nothing the chain files import and call (a hook, a helper) can reach the write layer', () => {
    const reaching = chain.files.flatMap((file) =>
      calledImports(ctx, ctx.parsed(file))
        .filter((target) => WRITE_LAYER.some((layer) => closureFrom(ctx, target).closure.has(layer)))
        .map((target) => `${file} calls into ${target}, which reaches the write layer`),
    )
    expect(reaching).toEqual([])
  })

  it('(b) the <Route> around the player carries no loader, action or lazy (a data-router action is a write path)', () => {
    const attributes = usage.flatMap((site) =>
      (site.routeAttributes ?? []).filter((name) => ['loader', 'action', 'lazy'].includes(name) || name.startsWith('...')).map((name) => `${site.file}:${site.line} <Route ${name}>`),
    )
    expect(attributes).toEqual([])
  })

  describe('the scanners: each shape is found, each look-alike is left alone', () => {
    const parse = (code: string) => ts.createSourceFile('probe.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const named = { named: ['RoutinePlayer'], namespaces: [] as string[] }

    it('exportedFunctions counts parameters of every form of export', () => {
      expect(exportedFunctions(parse('export function RoutinePlayer({ onComplete }: Props) { return null }'))).toEqual([
        { name: 'RoutinePlayer', parameters: 1 },
      ])
      expect(exportedFunctions(parse('export const RoutinePlayer = (props: Props) => null'))).toEqual([{ name: 'RoutinePlayer', parameters: 1 }])
      expect(exportedFunctions(parse('export default function (props: Props) { return null }'))).toEqual([{ name: 'default', parameters: 1 }])
      expect(exportedFunctions(parse('export function RoutinePlayer() { return null }'))).toEqual([{ name: 'RoutinePlayer', parameters: 0 }])
      // Not exported: not part of the player's contract.
      expect(exportedFunctions(parse('function ReadyScreen({ onStart }: Props) { return null }'))).toEqual([])
    })

    it('usageSitesIn finds the props passed, however they are written', () => {
      expect(usageSitesIn(parse('const a = <RoutinePlayer />'), named)[0].attributes).toEqual([])
      expect(usageSitesIn(parse('const a = <RoutinePlayer onComplete={save} />'), named)[0].attributes).toEqual(['onComplete={save}'])
      expect(usageSitesIn(parse('const a = <RoutinePlayer {...rest} />'), named)[0].attributes).toEqual(['{...rest}'])
      expect(usageSitesIn(parse('const a = <Player.RoutinePlayer done />'), { named: [], namespaces: ['Player'] })[0].attributes).toEqual(['done'])
    })

    it('usageSitesIn lists the wrappers around the player, innermost first, up to the Route', () => {
      const [site] = usageSitesIn(
        parse('const r = <Route path="x" loader={l} element={<Guard><Tracker><RoutinePlayer /></Tracker></Guard>} />'),
        named,
      )
      expect(site.ancestors).toEqual(['Tracker', 'Guard'])
      expect(site.routeAttributes).toEqual(['path', 'loader', 'element'])
    })

    it('ignores a different component with a similar name, and a use that is not JSX', () => {
      expect(usageSitesIn(parse('const a = <RoutinePlayerShell />'), named)).toEqual([])
      expect(usageSitesIn(parse('const a = RoutinePlayer()'), named)).toEqual([])
    })

    it('definesRoute sees a Route and nothing else', () => {
      expect(definesRoute(parse('const a = <Routes><Route path="x" element={null} /></Routes>'))).toBe(true)
      expect(definesRoute(parse('const a = <Routes><Router /></Routes>'))).toBe(false)
    })
  })
}, 120_000)
