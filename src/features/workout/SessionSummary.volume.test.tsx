import { afterEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { seedExercises } from '@/data/seed/exercises'
import { seedProgram } from '@/data/seed/program'
import { createWorkout, logSet } from '@/domain/workout'
import i18n from '@/i18n/i18next'
import { SessionSummary } from './SessionSummary'

/**
 * Backlog I6 (batch A1), the session summary's half; see
 * `WeeklyReviewCard.volume.test.tsx` for the reasoning, which is the same.
 * The workout's volume is 12,345 kg (1000x10 + 500x4 + 345x1), so it prints in
 * compact form in every language.
 *
 * **Fit at 320px.** The same 72-case browser matrix as the weekly card (numbers
 * and method in `WeeklyReviewCard.volume.test.tsx`), here reaching the real
 * summary by logging a workout's last set through the UI so the minutes tile is
 * present too. French at 320px, summary, 123,5 k kg: 4.8px past the edge before the
 * change, 11.2px after the format only, 0 once the stats row wraps. jsdom sees only
 * the `flex-wrap` token and the strings.
 *
 * Negative controls, run 30 Oct (mutation applied to `SessionSummary.tsx`,
 * this file run, restored, `cmp` clean):
 *   `formatVolume(summary.volumeKg, i18n.language)` -> `..., 'en')`   -> "fr" and "zh-CN" rows
 *   the summary's own `${(v / 1000).toFixed(1)}k` restored             -> all three rows
 *   `flex-wrap` removed from the stats row                             -> "the stats row may wrap"
 */

const exerciseById = new Map(seedExercises.map((e) => [e.id, e]))

function heavyWorkout() {
  let workout = createWorkout({
    id: 'w-volume',
    programId: seedProgram.id,
    session: seedProgram.sessions[1],
    date: '2026-08-07',
    startedAt: '2026-08-07T09:00:00.000Z',
  })
  const done = '2026-08-07T09:05:00.000Z'
  workout = logSet(workout, 0, { weightKg: 1000, reps: 10, seconds: null, completedAt: done }, 0)
  workout = logSet(workout, 0, { weightKg: 500, reps: 4, seconds: null, completedAt: done }, 1)
  workout = logSet(workout, 0, { weightKg: 345, reps: 1, seconds: null, completedAt: done }, 2)
  return workout
}

afterEach(async () => {
  await i18n.changeLanguage('en')
})

/** The volume tile is the last of the summary's stats. */
function volumeText(): string {
  const { container } = render(
    <MemoryRouter>
      <SessionSummary workout={heavyWorkout()} exerciseById={exerciseById} history={[]} />
    </MemoryRouter>,
  )
  const values = container.querySelector('dl')?.querySelectorAll('dd') ?? []
  return values[values.length - 1].textContent ?? ''
}

describe('SessionSummary stats row', () => {
  it('may wrap, so a tile that does not fit at 320px moves to the next row whole', () => {
    const { container } = render(
      <MemoryRouter>
        <SessionSummary workout={heavyWorkout()} exerciseById={exerciseById} history={[]} />
      </MemoryRouter>,
    )
    expect(container.querySelector('dl')?.className).toMatch(/\bflex-wrap\b/)
  })
})

describe('SessionSummary volume follows the language', () => {
  it.each([
    ['en', '12.3K kg'],
    ['fr', '12,3 k kg'],
    ['zh-CN', '1.2万 kg'],
  ])('%s', async (language, expected) => {
    await i18n.changeLanguage(language)
    expect(volumeText()).toBe(expected)
  })
})
