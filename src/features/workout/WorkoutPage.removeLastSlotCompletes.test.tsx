import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout, logSet } from '@/domain/workout'
import type { Workout } from '@/domain/types'
import { WorkoutPage } from './WorkoutPage'

/**
 * Reproduction for the owner's Monday defect (11 Aug): removing the last
 * remaining unlogged slot in the whole session emptied
 * `plannedSetIndices`, so `workoutPosition` read 'complete' and
 * `WorkoutPage`'s defensive branch (line ~110) rendered SessionSummary —
 * but `handleRemoveSet` only ever called `skipPrescribedLevel`/
 * `undoCustomSlot` and `put`, never `completeWorkout`. Storage stayed
 * open; `closeStaleWorkouts` abandoned it the next boot; it vanished from
 * the rotation's count and the same session was re-offered.
 *
 * Legs & Core (`seedProgram.sessions[1]`) has 5 items totalling 13
 * prescribed slots: goblet-squat/bulgarian-split-squat/dumbbell-rdl (3
 * rungs each), single-leg-hip-thrust and side-plank (2 sets each). The
 * fixture logs every slot except side-plank's second — the session's
 * very last planned index — so "Remove this set" there is the exact
 * reproduction.
 */

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
})

function almostDoneWorkout(): Workout {
  let workout = createWorkout({
    id: 'test-almost-done',
    programId: seedProgram.id,
    session: seedProgram.sessions[1], // Legs & Core
    date: '2026-07-22',
    startedAt: '2026-07-22T09:00:00.000Z',
  })
  const ts = '2026-07-22T09:05:00.000Z'
  // Exercises 0-2: 3-rung ladders (goblet-squat, bulgarian-split-squat,
  // dumbbell-rdl), fully logged.
  for (let exerciseIndex = 0; exerciseIndex < 3; exerciseIndex += 1) {
    for (let level = 0; level < 3; level += 1) {
      workout = logSet(
        workout,
        exerciseIndex,
        { weightKg: 10, reps: 10, seconds: null, completedAt: ts },
        level,
      )
    }
  }
  // Exercise 3: single-leg-hip-thrust, 2 sets, fully logged.
  for (let level = 0; level < 2; level += 1) {
    workout = logSet(
      workout,
      3,
      { weightKg: 10, reps: 12, seconds: null, completedAt: ts },
      level,
    )
  }
  // Exercise 4: side-plank, 2 sets — only the first logged. The second is
  // the whole session's last remaining slot.
  workout = logSet(
    workout,
    4,
    { weightKg: null, reps: null, seconds: 30, completedAt: ts },
    0,
  )
  return { ...workout, readiness: { tier: 'ready', drivers: [] } }
}

function renderWorkout() {
  return render(
    <MemoryRouter initialEntries={['/workout']}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/workout" element={<WorkoutPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('removing the last remaining slot', () => {
  it('completes the workout in storage, not just on screen', async () => {
    await db.workouts.put(almostDoneWorkout())
    renderWorkout()

    expect(await screen.findByText(/Set 2 of 2/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remove this set' }))
    await screen.findByRole('heading', { name: 'Skip this set?' })
    await userEvent.click(screen.getByRole('button', { name: 'Skip this set' }))

    // Screen shows the summary...
    expect(await screen.findByRole('heading', { name: 'Nice work.' })).toBeInTheDocument()

    // ...and storage agrees: completedAt is set, not left null. This is
    // the assertion the pre-fix code fails — the summary rendered while
    // the stored record stayed open.
    const stored = await db.workouts.get('test-almost-done')
    expect(stored?.completedAt).not.toBeNull()
    expect(stored?.exercises[4].skippedLevels).toEqual([1])
  })

  it('leaves no reachable Undo control on the summary screen', async () => {
    await db.workouts.put(almostDoneWorkout())
    renderWorkout()

    await screen.findByText(/Set 2 of 2/)
    await userEvent.click(screen.getByRole('button', { name: 'Remove this set' }))
    await screen.findByRole('heading', { name: 'Skip this set?' })
    await userEvent.click(screen.getByRole('button', { name: 'Skip this set' }))
    await screen.findByRole('heading', { name: 'Nice work.' })

    expect(screen.queryByRole('button', { name: /Undo/ })).toBeNull()
  })
})
