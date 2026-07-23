import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout } from '@/domain/workout'
import { WorkoutPage } from './WorkoutPage'

/**
 * RIR purge (M8 Phase 6, docs/PyramidProgression.md) — no RIR affordance
 * anywhere in the logging UI, and a logged set never carries an rir key
 * at all (not rir: null — the field doesn't exist on LoggedSet anymore).
 */

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
})

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

describe('RIR purge', () => {
  it('renders no RIR picker or label on the logging screen', async () => {
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
    expect(screen.queryByText(/RIR/)).toBeNull()
    expect(screen.queryByText('Reps left in the tank')).toBeNull()
  })

  it('logs a set with no rir key at all', async () => {
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
    await screen.findByText(/Set 1 of/)
    await userEvent.click(screen.getByRole('button', { name: 'Log set' }))

    const [logged] = await db.workouts.toArray()
    const loggedSet = logged.exercises[0].sets[0]
    expect(loggedSet).not.toHaveProperty('rir')
  })
})
