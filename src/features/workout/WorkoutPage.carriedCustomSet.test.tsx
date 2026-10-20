import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { carrySessionForward } from '@/domain/carryForward'
import { createWorkout } from '@/domain/workout'
import type { LoggedSet, Workout } from '@/domain/types'
import { WorkoutPage } from './WorkoutPage'

/**
 * F3 at page level. Carry-forward is applied once, at workout start; the
 * page then reads the stored plan only. Legs & Core item 0 is the 3-rung
 * goblet-squat; its previous exposure here carries a completed custom 4th set.
 */

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
})

function logged(setIndex: number, custom?: true): LoggedSet {
  return {
    setIndex,
    weightKg: 14,
    reps: 10,
    seconds: null,
    completedAt: '2026-07-20T10:00:00.000Z',
    ...(custom ? { custom } : {}),
  }
}

function newWorkout(id: string, date: string, carry: readonly Workout[]): Workout {
  const session = seedProgram.sessions[1]
  return createWorkout({
    id,
    programId: seedProgram.id,
    session: { ...session, items: carrySessionForward(session.items, carry, seedProgram.id) },
    date,
    startedAt: `${date}T09:00:00.000Z`,
  })
}

function priorWithCustomSet(): Workout {
  const base = newWorkout('prior', '2026-07-20', [])
  return {
    ...base,
    completedAt: '2026-07-20T10:30:00.000Z',
    exercises: base.exercises.map((e, i) =>
      i === 0 ? { ...e, customSlots: 1, sets: [logged(0), logged(1), logged(2), logged(3, true)] } : e,
    ),
  }
}

function withFirstExerciseSets(w: Workout, sets: LoggedSet[]): Workout {
  return {
    ...w,
    readiness: { tier: 'ready', drivers: [] },
    exercises: w.exercises.map((e, i) => (i === 0 ? { ...e, sets } : e)),
  }
}

function renderWorkout() {
  render(
    <MemoryRouter initialEntries={['/workout']}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/workout" element={<WorkoutPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('a carried custom set is offered, not just counted', () => {
  it('after sets 1-3 of a workout started with the carried plan, offers set 4 of 4', async () => {
    const prior = priorWithCustomSet()
    const current = withFirstExerciseSets(newWorkout('current', '2026-07-27', [prior]), [
      logged(0),
      logged(1),
      logged(2),
    ])
    expect(current.exercises[0].prescription.sets).toBe(4)
    await db.workouts.bulkPut([prior, current])

    renderWorkout()
    expect(await screen.findByText(/Set 4 of 4/)).toBeInTheDocument()
  })

  it('a legacy workout stored with the authored plan is not re-carried: it shows its stored counts', async () => {
    const prior = priorWithCustomSet()
    const legacy = withFirstExerciseSets(newWorkout('legacy', '2026-07-27', []), [])
    expect(legacy.exercises[0].prescription.sets).toBe(3)
    await db.workouts.bulkPut([prior, legacy])

    renderWorkout()
    expect(await screen.findByText(/Set 1 of 3/)).toBeInTheDocument()
    expect(screen.queryByText(/Set 1 of 4/)).toBeNull()
  })
})
