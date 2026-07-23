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
 * M8 Phase 10 acceptance test: a full log-a-set flow against a real seeded
 * ladder item, not a hand-built fixture — the first point real setPlan
 * content reaches SetScreen through the actual app data flow.
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

describe('WorkoutPage against a real seeded ladder item', () => {
  it('logs a full set from the prescribed first rung of Chest & Back\'s incline dumbbell press', async () => {
    const session = seedProgram.sessions[0] // Chest & Back, item 0 = incline-dumbbell-press
    const workout = createWorkout({
      id: 'test-seed-ladder',
      programId: seedProgram.id,
      session,
      date: '2026-07-27',
      startedAt: '2026-07-27T09:00:00.000Z',
    })
    await db.workouts.put(workout)

    renderWorkout()
    expect(await screen.findByRole('heading', { name: 'Incline dumbbell press' })).toBeInTheDocument()
    // First rung of the coach-authored ladder (docs/programs/phase-1-home-v3-coach-spec.md).
    expect(screen.getByText('Set 1 of 3 — 12 kg × 12')).toBeInTheDocument()
    expect(screen.getByLabelText('Weight')).toHaveTextContent('12')
    expect(screen.getByLabelText('Reps')).toHaveTextContent('12')

    await userEvent.click(screen.getByRole('button', { name: 'Log set' }))

    const [logged] = await db.workouts.toArray()
    const loggedSet = logged.exercises[0].sets[0]
    expect(loggedSet.weightKg).toBe(12)
    expect(loggedSet.reps).toBe(12)
    expect(logged.exercises[0].prescription.setPlan).toEqual([
      { weightKg: 12, reps: 12 },
      { weightKg: 14, reps: 10 },
      { weightKg: 15, reps: 8 },
    ])
  })
})
