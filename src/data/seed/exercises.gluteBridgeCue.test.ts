import { describe, expect, it } from 'vitest'
import enSeed from '@/locales/en/seed.json'
import frSeed from '@/locales/fr/seed.json'
import zhSeed from '@/locales/zh-CN/seed.json'

/**
 * Guards the leak the coach ruled against (follow-up ruling, 28 Aug 2026):
 * "Treat the 2-second top position as DOSE, not universal Library
 * technique. REMOVE the 2-second requirement from the generic Glute
 * Bridge Library cue." The Glute Bridge cue array has exactly ONE
 * render surface — `/library/glute-bridge` — which both Full Body C's
 * warm-up row and the Morning Posture Reset row link to (warm-up rows
 * never render cues themselves — `WarmupSection.tsx` imports only
 * `useExerciseName` and `ExerciseThumbnail`). So a tempo reintroduced
 * here leaks into the strength program silently, on a page nothing
 * else is positioned to check — this is the guard for that leak.
 *
 * **Asserts on a term, not a digit.** A first version of this guard
 * checked for the literal `2-second`/`2 secondes`/`2秒` tokens the
 * coach's removed strings happened to contain. That pins the digit,
 * not the concept, and is blind to any other tempo wording — "hold for
 * two seconds", "3-second contraction", "pause 2s at the top" would
 * all pass it. So this asserts on the unit word itself —
 * `second`/`seconde`/`秒`, matched case-insensitively as a substring —
 * which catches a tempo reintroduced in any phrasing, not only today's
 * exact strings.
 *
 * Proven red-first with **two** mutations, because a single mutation
 * cannot tell a concept check from a digit check wearing its clothes:
 *
 * 1. Re-added `"Controlled 2-second contraction at the top"` to
 *    `en/seed.json`'s `exercise.glute-bridge.cues` alone (fr/zh-CN
 *    untouched). Reddened exactly one case — `en`, message
 *    `en: glute-bridge cues carry a "second" tempo reference` — fr and
 *    zh-CN stayed green. Confirms the assertion is keyed per-locale.
 * 2. Added `"两秒"` (Chinese numeral "two seconds", no Arabic digit at
 *    all) to `zh-CN`'s glute-bridge cues alone. This is the
 *    discriminating mutation: it defeats any digit-based pattern
 *    (`2秒`, `\d秒`, …) while `includes('秒')` still catches it, because
 *    `两秒` contains `秒`. If this guard had passed on this mutation it
 *    would mean the term list had quietly regressed back to a digit
 *    check — do not "simplify" it back to one. Reddened exactly the
 *    `zh-CN` case; en/fr stayed green.
 *
 * Both mutations reverted immediately after measuring; suite green
 * again, `en/seed.json` and `zh-CN/seed.json` byte-diffed against their
 * pre-mutation state to confirm a clean revert.
 */
interface SeedShape {
  exercise: Record<string, { cues?: string[] }>
}

const LOCALES: { name: string; seed: SeedShape; term: string }[] = [
  { name: 'en', seed: enSeed as SeedShape, term: 'second' },
  { name: 'fr', seed: frSeed as SeedShape, term: 'seconde' },
  { name: 'zh-CN', seed: zhSeed as SeedShape, term: '秒' },
]

describe('glute-bridge Library cue — no tempo dose leak (coach ruling, 28 Aug 2026)', () => {
  it.each(LOCALES)('$name: cues carry no "$term" tempo reference', ({ name, seed, term }) => {
    const cues = seed.exercise['glute-bridge']?.cues
    expect(cues, `${name}: exercise.glute-bridge.cues missing`).toBeDefined()
    const lowerTerm = term.toLowerCase()
    const offending = (cues ?? []).filter((cue) => cue.toLowerCase().includes(lowerTerm))
    expect(offending, `${name}: glute-bridge cues carry a "${term}" tempo reference`).toEqual([])
  })
})
