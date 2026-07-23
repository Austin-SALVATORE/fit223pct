import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout, logSet } from '@/domain/workout'
import { WorkoutPage } from './WorkoutPage'

/**
 * Side plank (Legs & Core) is a seconds-mode set with no way to time it —
 * the hold timer pre-fills the Hold Stepper on stop; the Stepper stays
 * the source of truth for what actually gets logged.
 */

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
  vi.useRealTimers()
})

async function insertActiveWorkoutAtSidePlank() {
  const session = seedProgram.sessions[1] // Legs & Core
  let workout = createWorkout({
    id: 'test-active-b',
    programId: seedProgram.id,
    session,
    date: '2026-07-24',
    startedAt: '2026-07-24T09:00:00.000Z',
  })
  // Log every set of the first four exercises to reach side plank (index 4).
  for (let exerciseIndex = 0; exerciseIndex < 4; exerciseIndex++) {
    const sets = workout.exercises[exerciseIndex].prescription.sets
    for (let i = 0; i < sets; i++) {
      workout = logSet(workout, exerciseIndex, {
        weightKg: null,
        reps: 10,
        seconds: null,
        completedAt: '2026-07-24T09:05:00.000Z',
      })
    }
  }
  await db.workouts.put(workout)
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

describe('hold timer', () => {
  it('pre-fills the Hold Stepper with the elapsed count on stop', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    await insertActiveWorkoutAtSidePlank()
    renderWorkout()
    expect(await screen.findByRole('heading', { name: 'Side plank' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Start hold' }))
    await vi.advanceTimersByTimeAsync(12_000)

    const stopButton = screen.getByRole('button', { name: 'Stop hold' })
    const elapsed = stopButton.querySelector('time')?.textContent?.match(/(\d+)s/)?.[1]
    expect(Number(elapsed)).toBeGreaterThanOrEqual(11)
    await user.click(stopButton)

    expect(screen.getByLabelText('Hold')).toHaveTextContent(elapsed ?? '')
  })

  it('does not show the hold timer for reps-mode sets', async () => {
    const session = seedProgram.sessions[0]
    const workout = createWorkout({
      id: 'test-active-a',
      programId: seedProgram.id,
      session,
      date: '2026-07-22',
      startedAt: '2026-07-22T09:00:00.000Z',
    })
    await db.workouts.put(workout)

    renderWorkout()
    expect(await screen.findByText(/Set 1 of/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start hold' })).not.toBeInTheDocument()
  })
})
