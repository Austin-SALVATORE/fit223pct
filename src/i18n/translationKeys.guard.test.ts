import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { NAMESPACES } from './i18next'

/**
 * Every literal translation key in `src/**` exists in `en`.
 *
 * **This closes the one gap `localeParity.test.ts` structurally cannot see.**
 * Parity compares fr and zh-CN *against en*, which proves the locales agree
 * with each other — so an fr-only omission is impossible while it is green.
 * A key missing from **all three** is invisible to it, because en is the
 * reference rather than something being checked.
 *
 * That is not hypothetical. `common:cancel` was called at
 * `ProfileCard.tsx:241` and declared in no locale at all, so the profile
 * form's Cancel button rendered the raw key — a lowercase "cancel" — from
 * M10 phase 3 until it was found by reading browser console output during an
 * unrelated device check. Parity was green the whole time. It cost a manual
 * pass to find something that belongs in a diff.
 *
 * ## Why the dev-time log is not a substitute
 *
 * `missingKeyHandler` (`i18next.ts:57-66`) already logs a missing key in DEV,
 * which is what eventually surfaced `common:cancel` — but it only fires for a
 * code path someone actually renders, in a build nobody ships, watched by
 * somebody who happens to be reading the console. This runs on every commit
 * over every literal key, rendered or not.
 *
 * It is also a weaker signal than it looks, in a way worth stating because it
 * misled a diagnosis: the handler logs its `languages` argument, and with
 * `saveMissing` on but **`saveMissingTo` left unset** — which is the case
 * here, verified: the option appears nowhere in `i18next.ts` — i18next's
 * default is `'fallback'`, so the log names `en` even while rendering French.
 * That reads as "missing in English" when it means "missing, reported against
 * the fallback". Anyone setting `saveMissingTo: 'all'` would change what those
 * logs say without touching the handler, so do not treat the locale in that
 * message as evidence of which bundle has the hole.
 *
 * ## Deliberately conservative in one direction
 *
 * A key is accepted if it resolves in **any** namespace the file loads,
 * rather than in the specific namespace of the `t` alias that used it. So a
 * key sitting in the wrong namespace of a file that loads two will pass here.
 *
 * That bias is intentional: this guard's job is to catch "declared nowhere",
 * and the cost of a false positive is a failing build that blames innocent
 * code, which is how a guard gets deleted. Namespace-precise attribution
 * would mean tracking each destructured alias to its `useTranslation`
 * argument — more machinery for a failure mode that logs loudly in dev
 * (`missingKeyHandler`) and shows up as a raw key on screen.
 *
 * ## What it cannot see
 *
 * Computed keys — ``t(`activityName.${level}`)`` — are excluded, because a
 * static scan cannot know the interpolated value. Those stay covered by
 * rendering tests that assert the resolved string. The exclusion is by
 * character class, not by best effort: any key containing `$`, `{` or `}` is
 * skipped rather than guessed at.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, '../..')
const SRC = path.join(REPO_ROOT, 'src')
const LOCALE_DIR = path.join(SRC, 'locales/en')

/** i18next's `defaultNS` — what a bare `useTranslation()` resolves against. */
const DEFAULT_NAMESPACE = 'common'

type Bundle = Record<string, unknown>

function loadEnglishBundles(): Map<string, Bundle> {
  const bundles = new Map<string, Bundle>()
  for (const namespace of NAMESPACES) {
    const file = path.join(LOCALE_DIR, `${namespace}.json`)
    bundles.set(namespace, JSON.parse(fs.readFileSync(file, 'utf8')) as Bundle)
  }
  return bundles
}

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'locales' ? [] : sourceFiles(full)
    if (!/\.tsx?$/.test(entry.name)) return []
    // Tests register their own resource bundles at runtime, so their keys are
    // legitimately absent from the shipped locale files.
    if (/\.test\.tsx?$/.test(entry.name)) return []
    return [full]
  })
}

/** Walks a dotted path, treating a plural family as the key existing. */
function declared(bundle: Bundle | undefined, key: string): boolean {
  if (!bundle) return false
  const parts = key.split('.')
  const leaf = parts.pop()
  if (leaf === undefined) return false

  let node: unknown = bundle
  for (const part of parts) {
    if (typeof node !== 'object' || node === null || !(part in node)) return false
    node = (node as Record<string, unknown>)[part]
  }
  if (typeof node !== 'object' || node === null) return false

  const scope = node as Record<string, unknown>
  if (leaf in scope) return true
  // `ageValue` is declared as ageValue_one / ageValue_other — a CLDR family is
  // a real declaration of the key.
  //
  // Only `_other` counts, deliberately, rather than "any plural suffix":
  // localeParity already requires every family to carry `other` in every
  // locale (it is i18next's universal plural fallback), and all 20 families in
  // en do. So this never false-positives, and it is usefully stricter — a
  // family declared with only `_one` would be caught here as well as there.
  return `${leaf}_other` in scope
}

interface Usage {
  file: string
  line: number
  key: string
  namespaces: string[]
}

/**
 * Every literal `t(...)` call, with the namespaces its file loads.
 *
 * **The identifier pattern is `t` or `t` + CapitalisedSuffix**, which is the
 * convention this codebase uses for aliased translators (`t`, `tCommon`). It
 * covers `i18n.t(...)` for free, since the `\b` holds after the dot.
 *
 * It deliberately does *not* parse `const { t: tCommon } = useTranslation(...)`
 * to learn alias names. The first version of this guard did, and the attempt
 * is why it shipped blind: in
 * `/\bt:\s*(\w+)|\bconst\s*\{[^}]*\bt\b[^}]*\}\s*=\s*useTranslation/`, the
 * second alternative begins at `const` — earlier in the string than
 * `t: tCommon` — so leftmost-match made it win, it captured nothing, and every
 * `tCommon(...)` call was then filtered out as "not a translator". The guard
 * passed with `common:cancel` deleted, which is the exact bug it was written
 * for. Caught by the negative control, not by review.
 *
 * The narrow pattern also excludes the near-misses that made filtering seem
 * necessary: `toDateKey('…')`, `test('…')`, `title('…')`, `toEqual('…')` all
 * fail `t[A-Z]`.
 */
function collectUsages(): Usage[] {
  const CALL = /\b(t|t[A-Z][A-Za-z]*)\(\s*'([^'${}]+)'/g
  const NS = /useTranslation\(\s*'([^']+)'/g

  const usages: Usage[] = []
  for (const file of sourceFiles(SRC)) {
    const source = fs.readFileSync(file, 'utf8')
    if (!/useTranslation|i18n(?:ext)?\.t\(/.test(source)) continue

    const namespaces = [...source.matchAll(NS)].map((match) => match[1])
    // A bare useTranslation() resolves against defaultNS.
    if (/useTranslation\(\s*\)/.test(source)) namespaces.push(DEFAULT_NAMESPACE)
    if (namespaces.length === 0) continue

    const lineStarts = [...source].reduce<number[]>(
      (acc, char, index) => (char === '\n' ? [...acc, index + 1] : acc),
      [0],
    )
    for (const match of source.matchAll(CALL)) {
      const line = lineStarts.filter((start) => start <= match.index).length
      usages.push({
        file: path.relative(REPO_ROOT, file),
        line,
        key: match[2],
        namespaces,
      })
    }
  }
  return usages
}

describe('every literal translation key is declared in en', () => {
  const bundles = loadEnglishBundles()
  const usages = collectUsages()

  it('resolves, or names the file and line that does not', () => {
    const unresolved = usages.filter((usage) => {
      // An explicit 'namespace:key' form carries its own namespace.
      if (usage.key.includes(':')) {
        const [namespace, ...rest] = usage.key.split(':')
        return !declared(bundles.get(namespace), rest.join(':'))
      }
      return !usage.namespaces.some((namespace) => declared(bundles.get(namespace), usage.key))
    })

    expect(
      unresolved.map((usage) => `${usage.file}:${usage.line} — ${usage.key}`),
      'These keys are called in src/** and declared in no en locale file, so they render as the ' +
        'raw key path on screen. localeParity.test.ts cannot catch this: it compares fr and ' +
        'zh-CN against en, so a key missing from every locale passes. Add the key to en, fr and ' +
        'zh-CN together.',
    ).toEqual([])
  })

  it('actually scanned something — the guard is not passing vacuously', () => {
    // A broken regex or a wrong root would make the assertion above pass while
    // checking nothing, which is the failure mode a guard cannot afford.
    expect(usages.length).toBeGreaterThan(150)
    expect(new Set(usages.map((usage) => usage.file)).size).toBeGreaterThan(20)
    expect(bundles.size).toBe(NAMESPACES.length)
  })

  it('excludes computed keys rather than guessing at them', () => {
    // The exclusion is load-bearing: a template key's value is unknown
    // statically, so including it would produce false failures and the guard
    // would be deleted. Asserted so the character class is not "simplified".
    expect(usages.every((usage) => !/[${}]/.test(usage.key))).toBe(true)
    // And the codebase does contain such keys, so this is a real exclusion
    // rather than a vacuous one.
    const withTemplates = fs
      .readFileSync(path.join(SRC, 'features/profile/ProfileCard.tsx'), 'utf8')
      .includes('t(`activityName.${level}`)')
    expect(withTemplates).toBe(true)
  })
})
