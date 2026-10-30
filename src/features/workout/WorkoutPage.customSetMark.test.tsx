import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout } from '@/domain/workout'
import type { Workout } from '@/domain/types'
import i18n from '@/i18n/i18next'
import { PlanDayPage } from '@/features/plan/PlanDayPage'
import { WorkoutPage } from './WorkoutPage'

/**
 * Add Set, through the real screens, to the places that show it (QA F1, 30 Oct).
 *
 * QA did this by hand: start the session, tap Add set on the goblet squat, log the extra
 * set, finish, open the day in the Plan. The stored extra set had no `custom` key, so
 * History's "(Custom)" and the summary's "1 custom set" never appeared, while a full
 * suite was green: every test of those two readers built its sets by hand with the key
 * already on them, and no test went from the button to the screen. This one does.
 *
 * Legs & Core's goblet squat is a 3-rung ladder. The workout holds that one exercise, so
 * the fourth log finishes the session and lands on the summary.
 *
 * Negative controls, run 30 Oct (mutation applied, the whole suite run, restored and
 * `cmp`ed):
 *   `logSet` not writing the marker (the code as it was)
 *       -> 3 red: stored, summary, History. The "Add Set not used" row stays green.
 *   `>` for `>=` in `logSet`            -> the same 3
 *   the marker written on every set    -> 4 red: the three above and the "not used" row
 *   `PlanDayPage` ignoring the marker  -> 1 red here (History), plus seven in the existing History tests
 *   the summary's custom count removed -> 2 red here (the summary, and History, which waits on it),
 *                                         plus two in `SessionSummary.test.tsx`
 *
 * What it cannot see: the French and Chinese wording (the keys have their own locale
 * tests), and a device: this is jsdom, the real screens with the real database.
 */

const DATE = '2026-07-22'
const squat = seedProgram.sessions[1].items[0]

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 27, 9, 0, 0) })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

afterEach(async () => {
  cleanup()
  await db.workouts.clear()
  await i18n.changeLanguage('en')
})

function squatOnly(): Workout {
  return {
    ...createWorkout({
      id: 'w-add-set',
      programId: seedProgram.id,
      session: { ...seedProgram.sessions[1], items: [squat] },
      date: DATE,
      startedAt: `${DATE}T09:00:00.000Z`,
    }),
    readiness: { tier: 'ready', drivers: [] },
  }
}

/** Add one set, then log all four. Ends on the summary. */
async function addOneSetAndFinish(): Promise<void> {
  await db.workouts.put(squatOnly())
  render(
    <MemoryRouter initialEntries={['/workout']}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/workout" element={<WorkoutPage />} />
      </Routes>
    </MemoryRouter>,
  )
  expect(await screen.findByText(/Set 1 of 3/)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Add set' }))
  expect(await screen.findByText(/Set 1 of 4/)).toBeInTheDocument()
  for (let n = 1; n <= 4; n += 1) {
    await userEvent.click(await screen.findByRole('button', { name: 'Log set' }))
    if (n < 4) await userEvent.click(await screen.findByRole('button', { name: /^Skip/ }))
  }
}

describe('a set added with Add Set, from the button to the screens that show it', () => {
  it('is stored marked, and only that set is', async () => {
    await addOneSetAndFinish()
    await screen.findByRole('heading', { level: 1 })
    const [stored] = await db.workouts.toArray()
    const sets = stored.exercises[0].sets
    expect(sets.map((s) => s.setIndex)).toEqual([0, 1, 2, 3])
    expect(sets.map((s) => s.custom ?? false)).toEqual([false, false, false, true])
    expect(stored.exercises[0].prescription.sets).toBe(3)
  })

  it('shows on the summary the app lands on', async () => {
    await addOneSetAndFinish()
    expect(await screen.findByText('1 custom set')).toBeInTheDocument()
  })

  it('shows in History, on the day, as the QA steps end', async () => {
    await addOneSetAndFinish()
    await screen.findByText('1 custom set')
    cleanup()
    render(
      <MemoryRouter initialEntries={[`/plan/${DATE}`]}>
        <Routes>
          <Route path="/" element={<p>TODAY PROBE</p>} />
          <Route path="/plan/:date" element={<PlanDayPage />} />
        </Routes>
      </MemoryRouter>,
    )
    // Three unmarked sets, then the fourth marked: the mark is on that one alone. The printed
    // line is found by its shape ("12 × 10 kg · ..."); the spoken sentence beside it carries
    // the same mark in words ("then 8 reps at 15 kg (Custom)") and must not be the match.
    const printed = /^(\d+ × [\d.]+ kg · ){3}\d+ × [\d.]+ kg \(Custom\)$/
    const line = await screen.findByText(printed)
    expect(line.textContent?.match(/\(Custom\)/g)).toHaveLength(1)
    expect(line).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows nothing when Add Set was not used', async () => {
    await db.workouts.put(squatOnly())
    render(
      <MemoryRouter initialEntries={['/workout']}>
        <Routes>
          <Route path="/workout" element={<WorkoutPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText(/Set 1 of 3/)).toBeInTheDocument()
    for (let n = 1; n <= 3; n += 1) {
      await userEvent.click(await screen.findByRole('button', { name: 'Log set' }))
      if (n < 3) await userEvent.click(await screen.findByRole('button', { name: /^Skip/ }))
    }
    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByText(/custom set/)).toBeNull()
    const [stored] = await db.workouts.toArray()
    expect(stored.exercises[0].sets.some((s) => 'custom' in s)).toBe(false)
  })
})
