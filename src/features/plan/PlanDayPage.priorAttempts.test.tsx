import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import i18n from '@/i18n/i18next'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { completeWorkout, createWorkout, logSet, swapExercise } from '@/domain/workout'
import type { Workout } from '@/domain/types'
import { PlanDayPage } from './PlanDayPage'

/**
 * Sets logged before a swap are kept as a record (owner OD-d, 29 Oct 17:02) and
 * shown in the day detail, one line per attempt, under the sets that count. They
 * are not part of the day's totals. A slot swapped after real work and not yet
 * performed as the new exercise has no `sets` of its own and must still be in
 * the list, or the work vanishes from history.
 *
 * Negative controls, run 30 Oct (mutation applied, the whole suite run, restored
 * and `cmp`ed; traced against the code after Phase 2b.3):
 *   the prior-attempt lines not rendered (the list mapped over nothing)
 *                                      -> "shows them under the exercise the slot
 *                                         became", "keeps a slot swapped after real
 *                                         work", and both locale tests (4 red)
 *   `hasLoggedRecord` without its `priorAttempts` clause (a slot with only a
 *     record is filtered out of the list)
 *                                      -> "keeps a slot swapped after real work and
 *                                         never performed as the new exercise"
 *                                         only (1 red): the work vanishes from
 *                                         history, and nothing else notices
 *   `summarizeWorkout` counting the record -> "keeps them out of the day totals" and
 *                                         "keeps a slot swapped after real work"
 *                                         ("0 sets · 0 kg") (2 red), plus
 *                                         swapBack.test's summary case
 *   no record written by `swapExercise`   -> the first, third and both locale tests
 *                                         (4 red here; 8 in all)
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 27, 9, 0, 0) })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

afterEach(async () => {
  await db.workouts.clear()
  await i18n.changeLanguage('en')
})

const DATE = '2026-07-22'

function at(minute: number) {
  return `${DATE}T09:${String(minute).padStart(2, '0')}:00.000Z`
}

/** Goblet squat: 20 kg x 10 and 20 kg x 9, then swapped to split squat. `afterSwap` sets are logged on the split squat. */
function swappedWorkout(afterSwap: { kg: number; reps: number }[]): Workout {
  let w = createWorkout({
    id: 'w-swapped',
    programId: seedProgram.id,
    session: seedProgram.sessions[1], // Legs & Core, item 0 = goblet-squat
    date: DATE,
    startedAt: at(0),
  })
  w = logSet(w, 0, { weightKg: 20, reps: 10, seconds: null, completedAt: at(10) }, 0)
  w = logSet(w, 0, { weightKg: 20, reps: 9, seconds: null, completedAt: at(15) }, 1)
  w = swapExercise(w, 0, 'split-squat')
  afterSwap.forEach(({ kg, reps }, i) => {
    w = logSet(w, 0, { weightKg: kg, reps, seconds: null, completedAt: at(20 + i) }, i)
  })
  return completeWorkout(w, at(40))
}

function renderDay() {
  return render(
    <MemoryRouter initialEntries={[`/plan/${DATE}`]}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/plan/:date" element={<PlanDayPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PlanDayPage: sets logged before a swap are a record', () => {
  it('shows them under the exercise the slot became, as what they were performed as', async () => {
    await db.workouts.put(swappedWorkout([{ kg: 12, reps: 10 }]))
    renderDay()

    expect(await screen.findByRole('link', { name: 'Split squat' })).toBeInTheDocument()
    expect(screen.getByText('10 × 12 kg')).toBeInTheDocument() // the sets that count
    expect(screen.getByText('Before the swap, Goblet squat: 10 × 20 kg · 9 × 20 kg')).toBeInTheDocument()
  })

  it('keeps them out of the day totals: only the set on the exercise performed counts', async () => {
    await db.workouts.put(swappedWorkout([{ kg: 12, reps: 10 }]))
    renderDay()

    // 1 set, 10 x 12 = 120 kg; the two goblet squat sets (380 kg) are not in it.
    expect(await screen.findByText(/1 set · 120 kg/)).toBeInTheDocument()
  })

  it('keeps a slot swapped after real work and never performed as the new exercise in the list', async () => {
    await db.workouts.put(swappedWorkout([]))
    renderDay()

    expect(await screen.findByRole('link', { name: 'Split squat' })).toBeInTheDocument()
    expect(screen.getByText('Before the swap, Goblet squat: 10 × 20 kg · 9 × 20 kg')).toBeInTheDocument()
    expect(screen.getByText(/0 sets · 0 kg/)).toBeInTheDocument()
  })

  it.each([
    ['fr', /^Avant le remplacement, .+ : /],
    ['zh-CN', /^更换前，.+：/],
  ])('reads in %s, not as a raw key', async (lng, pattern) => {
    await i18n.changeLanguage(lng)
    await db.workouts.put(swappedWorkout([{ kg: 12, reps: 10 }]))
    renderDay()

    await screen.findByRole('list')
    expect(screen.getByText(pattern)).toBeInTheDocument()
    expect(screen.queryByText(/priorAttempt/)).toBeNull()
  })

  it('shows nothing extra for a workout with no swap — unchanged behavior', async () => {
    const plain = logSet(
      createWorkout({ id: 'w-plain', programId: seedProgram.id, session: seedProgram.sessions[1], date: DATE, startedAt: at(0) }),
      0,
      { weightKg: 20, reps: 10, seconds: null, completedAt: at(10) },
      0,
    )
    await db.workouts.put(completeWorkout(plain, at(40)))
    renderDay()

    await screen.findByRole('link', { name: 'Goblet squat' })
    expect(screen.queryByText(/Before the swap/)).toBeNull()
  })
})
