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
 * Asserted positively (the specific `2-second` token absent), per
 * `.claude/rules/verification.md`'s rule against blocklists that only
 * catch what was already thought of: it names the exact tempo phrase
 * the coach removed, not an exhaustive list of tempo language this
 * cue must never carry.
 *
 * Proven red-first: with `"Controlled 2-second contraction at the
 * top"` re-added to `en/seed.json`'s `exercise.glute-bridge.cues`
 * alone (fr/zh-CN untouched), this suite reported exactly one
 * failure — the `en` case, naming `en: glute-bridge cues still carry
 * a 2-second tempo`. fr and zh-CN stayed green, confirming the
 * assertion is keyed per-locale rather than passing or failing as a
 * block. Reverted immediately after; suite green again.
 */
interface SeedShape {
  exercise: Record<string, { cues?: string[] }>
}

const LOCALES: { name: string; seed: SeedShape; token: string }[] = [
  { name: 'en', seed: enSeed as SeedShape, token: '2-second' },
  { name: 'fr', seed: frSeed as SeedShape, token: '2 secondes' },
  { name: 'zh-CN', seed: zhSeed as SeedShape, token: '2秒' },
]

describe('glute-bridge Library cue — no tempo dose leak (coach ruling, 28 Aug 2026)', () => {
  it.each(LOCALES)('$name: cues carry no $token token', ({ name, seed, token }) => {
    const cues = seed.exercise['glute-bridge']?.cues
    expect(cues, `${name}: exercise.glute-bridge.cues missing`).toBeDefined()
    const offending = (cues ?? []).filter((cue) => cue.includes(token))
    expect(offending, `${name}: glute-bridge cues still carry a ${token} tempo`).toEqual([])
  })
})
