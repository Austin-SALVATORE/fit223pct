import { describe, expect, it } from 'vitest'
import { mesocycle2Build } from './program'
import enSeed from '@/locales/en/seed.json'
import frSeed from '@/locales/fr/seed.json'
import zhSeed from '@/locales/zh-CN/seed.json'

/**
 * The reverse lunge's effort note, pinned to a fixed text (QA Q66).
 *
 * The coach's sentence is "Stop with about 2–3 good reps still possible on
 * each side." The range uses an EN DASH (U+2013), exactly as `program.ts`
 * records it under "coach's exact wording". The 29 Oct brief quoted it with a
 * hyphen; the committed text is the en dash, so that is what is pinned.
 *
 * Until this file, the sentence was named by no test. `localeFidelity` only
 * checks that the en locale equals the seed (so both could drift together),
 * and `localeParity` compares key families, not text.
 *
 * What is pinned, and to what:
 * - the seed note and the en locale value: the coach's sentence, exactly;
 * - the fr and zh-CN values: what is committed today. These are translations,
 *   not the coach's text, so the pin says "a change must be deliberate", not
 *   "this wording is right". A better translation edits the constant below in
 *   the same commit as the locale file.
 *
 * Nothing here changes the seed or a locale file; the frozen seed test stays
 * green.
 *
 * Negative controls, run 30 Oct on daf25c0 plus this file. Each mutation was
 * applied to a copy-restored file, the whole suite run, the file restored and
 * byte-compared. Each was run on its own: four first run in parallel shared
 * `program.ts` and gave identical, meaningless results, which were discarded.
 * - seed note with a hyphen: this file's seed test red, `localeFidelity` red
 *   (en no longer equals the seed) and the frozen hash red;
 * - en value with a hyphen: this file's en test red, `localeFidelity` red;
 * - fr value changed to "3 à 4": only this file's fr test red;
 * - zh value changed to "3-4": only this file's zh test red;
 * - seed AND en both changed to "1–2" together: this file's seed and en tests
 *   red, the frozen hash red, `localeFidelity` GREEN. That is the gap this
 *   file closes on the en side: the two could drift together unseen once the
 *   frozen test is lifted at the review;
 * - the constant here mutated to a hyphen: the seed, en and constant-sanity
 *   tests red (the hyphenated text the brief quoted is not what is shipped).
 *
 * What it cannot see: a fr or zh note rewritten on purpose passes only if this
 * file is edited too (intended); it does not check that a translation means
 * the same as the coach sentence; and it reads the JSON, not what the screen
 * renders (`seedProgram.ts` resolution is covered elsewhere).
 */

const SESSION_ID = 'mesocycle2-fullbody-hipext-shoulder'
const EXERCISE_ID = 'reverse-lunge'

const COACH_NOTE = 'Stop with about 2–3 good reps still possible on each side.'
const FR_NOTE = 'Arrête-toi quand il reste encore 2 à 3 bonnes répétitions possibles de chaque côté.'
const ZH_NOTE = '每侧还能做大约2-3个标准动作时停止。'

interface SeedLocaleJson {
  program: Record<string, unknown>
}

interface SessionNotesJson {
  exercise?: Record<string, { note?: string }>
}

function localeNote(seed: unknown): string | undefined {
  const program = (seed as SeedLocaleJson).program['mesocycle-2-build'] as {
    session: Record<string, SessionNotesJson>
  }
  return program.session[SESSION_ID]?.exercise?.[EXERCISE_ID]?.note
}

describe('reverse lunge effort note (Q66)', () => {
  it('the seed prescription carries the coach sentence exactly', () => {
    const session = mesocycle2Build.sessions.find((s) => s.id === SESSION_ID)
    expect(session, `${SESSION_ID} is a mesocycle 2 session`).toBeDefined()
    const items = (session?.items ?? []).filter((item) => item.exerciseId === EXERCISE_ID)
    expect(items, `${EXERCISE_ID} appears once in ${SESSION_ID}`).toHaveLength(1)
    expect(items[0].note).toBe(COACH_NOTE)
  })

  it('en/seed.json carries the coach sentence exactly', () => {
    expect(localeNote(enSeed)).toBe(COACH_NOTE)
  })

  it('fr/seed.json carries its committed translation', () => {
    expect(localeNote(frSeed)).toBe(FR_NOTE)
  })

  it('zh-CN/seed.json carries its committed translation', () => {
    expect(localeNote(zhSeed)).toBe(ZH_NOTE)
  })

  it('the pinned constants are what they claim (an en dash in the coach sentence, a digit range in each translation)', () => {
    expect(COACH_NOTE.codePointAt(COACH_NOTE.indexOf('2') + 1)).toBe(0x2013)
    expect(FR_NOTE).toContain('2 à 3')
    expect(ZH_NOTE).toContain('2-3')
  })
})
