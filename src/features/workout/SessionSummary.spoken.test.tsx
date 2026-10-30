import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { seedExercises } from '@/data/seed/exercises'
import { seedProgram } from '@/data/seed/program'
import type { LoggedSet } from '@/domain/types'
import { createWorkout, logSet } from '@/domain/workout'
import i18n from '@/i18n/i18next'
import { heard } from '@/test/heard'
import { SessionSummary } from './SessionSummary'

/**
 * Backlog A14's remainder (batch A2): the summary's per-exercise line, "2 sets ·
 * top 12 × 14 kg". A screen reader voices the middle dot and "12 times 14
 * kilograms". The visible line stays, hidden from assistive technology, and a
 * keyed sentence follows it: "2 sets, top set: 12 reps at 14 kg".
 *
 * What must hold, in all three languages:
 *   - the visible line is unchanged and `aria-hidden`;
 *   - the sentence that follows it is exactly the spoken text, with none of
 *     → × – · / in it;
 *   - seconds and bare-reps details, which are words already, are reused as they
 *     are, and only the "·" becomes a comma;
 *   - an assisted top set says so, after the sentence;
 *   - the weight is spoken as the language writes it (French "17,75").
 *
 * jsdom does not apply the `sr-only` stylesheet and has no layout. The real
 * accessibility tree of the summary is in the report.
 *
 * Negative controls, run 30 Oct (mutation applied to `SessionSummary.tsx`, this
 * file run, restored from a saved copy, `cmp` clean):
 *   `aria-hidden` removed from the visible line       -> 18 red: the hidden test and the sentence test (which asserts the glyph line is not
 *                                                        heard), 3 rows x 3 languages each
 *   the `sr-only` sentence removed                    -> 12 red: the sentence test (9) and the decimal-weight test (3)
 *   `topSetLineSpoken` replaced by the visible key    -> 15 red: the sentence test (9, the "·" is back) and the decimal test (3), plus the
 *                                                        three "hold" hidden-line tests, by accident: a hold's visible and spoken text become
 *                                                        identical and the text query finds two elements
 *   `detailSpoken` replaced by `detail`               -> 9 red: the weighted and assisted rows (6, the "12 × 14 kg" is back in the sentence)
 *                                                        and the decimal test (3); the hold row is unaffected, as it should be
 *   the assisted wrapper dropped from the spoken line -> 3 red: the assisted row only
 *   the weight left unformatted                       -> 1 red: the French decimal row (17,75 spoken as 17.75); en and zh-CN print a point
 */

const exerciseById = new Map(seedExercises.map((e) => [e.id, e]))
const done = '2026-08-07T09:05:00.000Z'

type SetInput = Omit<LoggedSet, 'setIndex'>
const weighted = (weightKg: number, reps: number, extra: Partial<SetInput> = {}): SetInput => ({
  weightKg,
  reps,
  seconds: null,
  completedAt: done,
  ...extra,
})
const held = (seconds: number): SetInput => ({ weightKg: null, reps: null, seconds, completedAt: done })

function renderSummary(sets: SetInput[]) {
  let workout = createWorkout({
    id: 'w-spoken',
    programId: seedProgram.id,
    session: seedProgram.sessions[1],
    date: '2026-08-07',
    startedAt: '2026-08-07T09:00:00.000Z',
  })
  sets.forEach((set, index) => {
    workout = logSet(workout, 0, set, index)
  })
  return render(
    <MemoryRouter>
      <SessionSummary workout={workout} exerciseById={exerciseById} history={[]} />
    </MemoryRouter>,
  )
}

afterEach(async () => {
  await i18n.changeLanguage('en')
})

type Row = [name: string, sets: SetInput[], visible: string[], spoken: string[]]

// [en, fr, zh-CN] in each of visible and spoken.
const rows: Row[] = [
  [
    'a weighted top set (the heavier-volume set wins: 14x12 beats 16x10)',
    [weighted(14, 12), weighted(16, 10)],
    ['2 sets · top 12 × 14 kg', '2 séries · meilleure série 12 × 14 kg', '2 组 · 最佳 12 × 14 kg'],
    [
      '2 sets, top set: 12 reps at 14 kg',
      '2 séries, meilleure série : 12 répétitions à 14 kg',
      '2 组，最佳：14 kg做12 次',
    ],
  ],
  [
    'an assisted top set',
    [weighted(14, 12, { assisted: true })],
    [
      '1 set · top 12 × 14 kg, assisted',
      '1 série · meilleure série 12 × 14 kg, avec assistance',
      '1 组 · 最佳 12 × 14 kg，有辅助',
    ],
    [
      '1 set, top set: 12 reps at 14 kg, assisted',
      '1 série, meilleure série : 12 répétitions à 14 kg, avec assistance',
      '1 组，最佳：14 kg做12 次，有辅助',
    ],
  ],
  [
    'a hold (words already; only the dot becomes a comma)',
    [held(40)],
    ['1 set · top 40s hold', '1 série · meilleure série 40s de maintien', '1 组 · 最佳 40秒保持'],
    ['1 set, top set: 40s hold', '1 série, meilleure série : 40s de maintien', '1 组，最佳：40秒保持'],
  ],
]

const LOCALES = ['en', 'fr', 'zh-CN'] as const

describe.each(LOCALES.map((locale, i) => [locale, i] as const))('SessionSummary top-set line, spoken — %s', (locale, i) => {
  it.each(rows)('the sentence follows the hidden line: %s', async (_name, sets, visible, spoken) => {
    await i18n.changeLanguage(locale)
    renderSummary(sets)
    const line = screen.getByText(visible[i])
    const sentence = line.nextElementSibling as HTMLElement
    expect(heard(sentence)).toBe(spoken[i])
    expect(heard(sentence)).not.toMatch(/[→×–·/]/)
    // And what is heard from the whole block does not include the glyph line.
    expect(heard(line.parentElement as HTMLElement)).not.toContain(visible[i])
  })

  it.each(rows)('the visible line is unchanged and hidden from assistive technology: %s', async (_name, sets, visible) => {
    await i18n.changeLanguage(locale)
    renderSummary(sets)
    const line = screen.getByText(visible[i])
    expect(line).toHaveAttribute('aria-hidden', 'true')
    expect(line.textContent).toBe(visible[i])
  })
})

describe('SessionSummary top-set line, spoken — the weight is spoken as the language writes it', () => {
  it.each([
    ['en', '1 set, top set: 8 reps at 17.75 kg'],
    ['fr', '1 série, meilleure série : 8 répétitions à 17,75 kg'],
    ['zh-CN', '1 组，最佳：17.75 kg做8 次'],
  ])('%s', async (locale, spoken) => {
    await i18n.changeLanguage(locale)
    renderSummary([weighted(17.75, 8)])
    expect(heard(screen.getByText(spoken))).toBe(spoken)
  })
})
