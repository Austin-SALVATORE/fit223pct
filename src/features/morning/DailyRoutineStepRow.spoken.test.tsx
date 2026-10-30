import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import i18n from '@/i18n/i18next'
import type { DailyRoutineStep } from '@/domain/dailyRoutine'
import { heard } from '@/test/heard'
import { DailyRoutineStepRow } from './DailyRoutineStepRow'

/**
 * Backlog A14 leftover (batch A3), site 3: the morning routine's rounds line. Printed, it is
 * "2 rounds × 6 /side" or "2 rounds × 8–10": the multiplication sign is voiced as "times",
 * the en dash is skipped or read as "minus" (so a range of 8 to 10 reads as "8 10"), and
 * "/side" is "slash side". It stays on screen, hidden from assistive technology, with the
 * sentence beside it: "2 rounds of 6 reps per side", "2 rounds of 8 to 10 reps".
 *
 * The row is a link, so its accessible name is computed from its content: `getByRole` with a
 * `name` is the real computation, and `heard()` shows the glyphs are absent by a second route.
 * The "N s hold each rep" line under a glute bridge has no glyph and is left exactly as it was.
 *
 * Negative controls, run 30 Oct (mutation applied to `DailyRoutineStepRow.tsx`, this file run,
 * restored from a saved copy, `cmp` clean):
 *   `aria-hidden` removed from the printed line       -> 15 red: "hears none of the glyphs ...", five rows x three languages. The "name carries
 *                                                        the sentence" test stays GREEN (the sentence is still there beside the glyphs)
 *   the `sr-only` sentence removed                    -> 30 red: both tests, five rows x three languages
 *   `perSide` ignored when building the sentence      -> 12 red: the two per-side rows, both tests, three languages
 *   the range collapsed to the low end                -> 18 red: the three range rows, both tests, three languages
 *   the plural taken from `reps`, not the larger end  -> 4 red: "a range that starts at one", both tests, en and fr. zh-CN has no plural and is
 *                                                        blind to it; no other row has a range whose low end is singular, which is why the row exists
 *   the rounds' plural fixed at 2                     -> 6 red: "a single round of a single rep", both tests, three languages
 */

afterEach(async () => {
  await i18n.changeLanguage('en')
})

const movement = (extra: Partial<Extract<DailyRoutineStep, { kind: 'movement' }>>): DailyRoutineStep => ({
  kind: 'movement',
  exerciseId: 'dead-bug',
  rounds: 2,
  reps: 6,
  ...extra,
})

// [name, step, [en visible, en spoken], [fr visible, fr spoken], [zh visible, zh spoken]]
const cases: [string, DailyRoutineStep, [string, string], [string, string], [string, string]][] = [
  [
    'a per-side movement',
    movement({ perSide: true }),
    ['2 rounds × 6 /side', '2 rounds of 6 reps per side'],
    ['2 tours × 6 /côté', '2 tours de 6 répétitions par côté'],
    ['2 轮 × 6 次 /侧', '2 轮，每轮每侧6 次'],
  ],
  [
    'a range',
    movement({ exerciseId: 'wall-slide', reps: 8, repsMax: 10 }),
    ['2 rounds × 8–10', '2 rounds of 8 to 10 reps'],
    ['2 tours × 8–10', '2 tours de 8 à 10 répétitions'],
    ['2 轮 × 8–10 次', '2 轮，每轮8到10 次'],
  ],
  [
    'a single round of a single rep (the singulars)',
    movement({ exerciseId: 'glute-bridge', rounds: 1, reps: 1 }),
    ['1 round × 1', '1 round of 1 rep'],
    ['1 tour × 1', '1 tour de 1 répétition'],
    ['1 轮 × 1 次', '1 轮，每轮1 次'],
  ],
  [
    'a range that starts at one (the plural follows the larger end: "1 to 3 reps")',
    movement({ exerciseId: 'wall-slide', reps: 1, repsMax: 3 }),
    ['2 rounds × 1–3', '2 rounds of 1 to 3 reps'],
    ['2 tours × 1–3', '2 tours de 1 à 3 répétitions'],
    ['2 轮 × 1–3 次', '2 轮，每轮1到3 次'],
  ],
  [
    'a per-side range',
    movement({ exerciseId: 'bird-dog', reps: 6, repsMax: 8, perSide: true }),
    ['2 rounds × 6–8 /side', '2 rounds of 6 to 8 reps per side'],
    ['2 tours × 6–8 /côté', '2 tours de 6 à 8 répétitions par côté'],
    ['2 轮 × 6–8 次 /侧', '2 轮，每轮每侧6到8 次'],
  ],
]

function renderRow(step: DailyRoutineStep) {
  return render(
    <MemoryRouter>
      <DailyRoutineStepRow step={step} />
    </MemoryRouter>,
  )
}

describe.each([
  ['en', 2],
  ['fr', 3],
  ['zh-CN', 4],
] as const)('DailyRoutineStepRow rounds line, spoken — %s', (locale, column) => {
  it.each(cases)("the row's name carries the sentence: %s", async (...row) => {
    const [, step] = row
    const [visible, spoken] = row[column] as [string, string]
    await i18n.changeLanguage(locale)
    renderRow(step)
    expect(screen.getByRole('link', { name: new RegExp(spoken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })).toBeInTheDocument()
    expect(screen.getByText(visible)).toBeInTheDocument()
  })

  it.each(cases)('hears none of the glyphs; the printed line is kept and hidden: %s', async (...row) => {
    const [, step] = row
    const [visible, spoken] = row[column] as [string, string]
    await i18n.changeLanguage(locale)
    const { container } = renderRow(step)
    const line = screen.getByText(visible)
    expect(line).toHaveAttribute('aria-hidden', 'true')
    expect(heard(line.nextElementSibling as HTMLElement)).toBe(spoken)
    const said = heard(container)
    expect(said).not.toMatch(/[×–/]/)
    expect(said).not.toContain(visible)
  })
})

describe('DailyRoutineStepRow — what is left alone', () => {
  it('the "hold each rep" line has no glyph, so it is not hidden and has no sibling', async () => {
    renderRow(movement({ exerciseId: 'glute-bridge', reps: 10, holdSecondsPerRep: 2 }))
    const hold = screen.getByText('2 s hold each rep')
    expect(hold).not.toHaveAttribute('aria-hidden')
    expect(hold.nextElementSibling).toBeNull()
  })

  it('a breathing step ("2 rounds") has no glyph and is left exactly as it was', () => {
    const { container } = renderRow({ kind: 'breathing', exerciseId: 'ninety-ninety-breathing', rounds: 2, breaths: 5 })
    const rounds = screen.getByText('2 rounds')
    expect(rounds).not.toHaveAttribute('aria-hidden')
    expect(container.querySelector('.sr-only')).toBeNull()
  })
})
