import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout, logSet } from '@/domain/workout'
import { ExercisePage } from '@/features/library/ExercisePage'
import { WorkoutPage } from './WorkoutPage'

/**
 * Session-preservation regressions: the workout's position is derived from
 * persisted sets, so leaving (refresh, Technique detour, app kill) and
 * returning must resume at the exact set.
 */

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
})

async function insertActiveWorkoutWithOneLoggedSet() {
  const session = seedProgram.sessions[0]
  let workout = createWorkout({
    id: 'test-active',
    programId: seedProgram.id,
    session,
    date: '2026-07-22',
    startedAt: '2026-07-22T09:00:00.000Z',
  })
  workout = logSet(workout, 0, {
    weightKg: 14,
    reps: 10,
    seconds: null,
    rir: 2,
    completedAt: '2026-07-22T09:05:00.000Z',
  })
  await db.workouts.put(workout)
}

function renderWorkout() {
  return render(
    <MemoryRouter initialEntries={['/workout']}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/workout" element={<WorkoutPage />} />
        <Route path="/library/:exerciseId" element={<ExercisePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('WorkoutPage session preservation', () => {
  it('resumes at the exact set derived from persisted data', async () => {
    await insertActiveWorkoutWithOneLoggedSet()
    renderWorkout()
    expect(await screen.findByText(/Set 2 of 3/)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Goblet squat' })).toBeInTheDocument()
  })

  it('survives a Technique detour: Workout → detail → back → same set', async () => {
    await insertActiveWorkoutWithOneLoggedSet()
    renderWorkout()
    await screen.findByText(/Set 2 of 3/)

    await userEvent.click(screen.getByRole('link', { name: 'Technique' }))
    expect(
      await screen.findByRole('heading', { name: 'Goblet squat' }),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: /Workout/ }))
    expect(await screen.findByText(/Set 2 of 3/)).toBeInTheDocument()
  })

  it('offers a way back to Today when no session is in progress', async () => {
    renderWorkout()
    expect(await screen.findByText(/no session in progress/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: /Back to Today/ }))
    expect(await screen.findByText('TODAY PROBE')).toBeInTheDocument()
  })
})
