/// <reference types="node" />
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Layer 6 — the "rounds" translation guard (plan `~/.claude/plans/
 * morning-posture-reset.md` §7.3d). FR *séries* and ZH 组 both mean
 * "sets" and are the established strength-glossary terms; the coach
 * excluded "sets" for this module by name (doc 23, "use 'rounds', not
 * 'sets'"). A translator handed "rounds" reaches for the glossary and
 * reintroduces the exact excluded word — in two of three locales, where
 * nobody reviewing the English source would ever see it. Sequenced after
 * the glossary entries (`docs/I18n-glossary-fr.md` "tour",
 * `docs/I18n-glossary-zh.md` 轮), which had to exist first — a guard
 * pinning a term nobody had chosen yet would pin a placeholder.
 *
 * **Positive, not a blocklist.** A blocklist ("assert *séries* / 组 are
 * absent") can only forbid the cases it has already met — FR *sets*
 * (borrowed) or *reprises*, or ZH 次, would all sail past a two-term
 * blocklist and the guard would go green on a wrong translation nobody
 * anticipated (`verification.md`'s central failure: a clean result from
 * an instrument that cannot see the subject). Asserting the *chosen* term
 * is present fails every wrong word, including the ones nobody predicted,
 * because the right one is missing. The two-term absence check stays as
 * a cheap secondary — it catches the one case the positive check alone
 * would miss: a translator writing both ("2 tours (séries)").
 *
 * **Scope is load-bearing, not incidental.** This walks only the
 * `morning.*` key prefix. 组 is an ordinary character (组合, 小组) that
 * the strength copy legitimately uses elsewhere in the same file — an
 * unscoped scan would fire constantly on innocent content and get turned
 * off. Prefix-scoped or not at all.
 *
 * **How this differs from `translationKeys.guard.test.ts`'s own blind
 * spot.** That guard's regex-over-source failure ("silently discarded
 * every `tCommon()` call") cannot recur here: this reads parsed JSON and
 * walks an object, so there is no pattern that can silently match
 * nothing. Its *own* vacuity mode is different — if `morning.*` is ever
 * renamed, the walk finds nothing and every assertion passes while
 * checking nothing, the same shape as `tsc --noEmit -p .` checking an
 * empty file set. Closed explicitly below: assert a non-zero leaf count
 * *before* asserting anything about the leaves.
 *
 * **What "positive" is scoped to.** Not every leaf under `morning.*`
 * needs to say "rounds" — `morning.name`/`heading`/`descriptor`/
 * `breathingInstruction` legitimately don't. Every locale key this phase
 * adds that denotes the rounds unit is named with a `rounds` prefix
 * (`roundsReps`, `roundsRepsRange`, `roundsLabel`) precisely so this
 * guard can select them structurally, by key-family name, rather than by
 * an enumerated list that silently drifts as rows are added.
 *
 * **Made to fail on purpose** (dev's report per `team-roles.md`): FR
 * `morning.roundsReps_other` was changed from *tours* to *séries*, the
 * guard alone was run, it named the key and the offending term, and the
 * change was reverted — quoted in the phase report, not encoded as a
 * permanent test here (a self-inflicted red is a one-time proof, not a
 * standing assertion).
 */

const REPO_ROOT = path.resolve(import.meta.dirname, '../../..')

const PLURAL_SUFFIX_PATTERN = /^(.*)_(zero|one|two|few|many|other)$/

interface Leaf {
  /** Dotted key path under `morning.`, with any trailing CLDR plural suffix stripped. */
  family: string
  value: string
}

function loadTodayJson(locale: 'fr' | 'zh-CN'): Record<string, unknown> {
  const file = path.join(REPO_ROOT, 'src', 'locales', locale, 'today.json')
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>
}

/** Same technique as `localeParity.test.ts`'s `collectLeaves` — walk an object, strip the CLDR suffix — but scoped to one prefix and collecting the leaf *value*, not just its key shape. */
function collectMorningLeaves(bundle: Record<string, unknown>): Leaf[] {
  const morning = bundle.morning
  if (morning === undefined) return []
  return walk(morning, 'morning')
}

function walk(value: unknown, prefix: string): Leaf[] {
  if (typeof value === 'string') {
    const match = PLURAL_SUFFIX_PATTERN.exec(prefix)
    return [{ family: match ? match[1] : prefix, value }]
  }
  if (typeof value !== 'object' || value === null) return []
  return Object.entries(value).flatMap(([key, child]) => walk(child, `${prefix}.${key}`))
}

const ROUNDS_TERM = {
  fr: 'tour',
  'zh-CN': '轮',
} as const

const FORBIDDEN_SETS_TERM = {
  fr: 'série',
  'zh-CN': '组',
} as const

describe('Morning Posture Reset — "rounds" translation guard (Layer 6, plan §7.3d)', () => {
  for (const locale of ['fr', 'zh-CN'] as const) {
    describe(locale, () => {
      const leaves = collectMorningLeaves(loadTodayJson(locale))

      it('vacuity tripwire — the walk actually found morning.* leaves', () => {
        expect(leaves.length).toBeGreaterThan(0)
      })

      it('every rounds-unit leaf contains the chosen term', () => {
        const roundsLeaves = leaves.filter((leaf) => leaf.family.toLowerCase().includes('rounds'))
        expect(roundsLeaves.length, 'no rounds-named key families found under morning.*').toBeGreaterThan(0)
        const missing = roundsLeaves.filter((leaf) => !leaf.value.includes(ROUNDS_TERM[locale]))
        expect(missing, `${locale}: leaves missing "${ROUNDS_TERM[locale]}"`).toEqual([])
      })

      it('no leaf under morning.* contains the excluded "sets" term (secondary, catches "X (séries)")', () => {
        const offending = leaves.filter((leaf) => leaf.value.includes(FORBIDDEN_SETS_TERM[locale]))
        expect(offending, `${locale}: leaves containing "${FORBIDDEN_SETS_TERM[locale]}"`).toEqual([])
      })
    })
  }
})
