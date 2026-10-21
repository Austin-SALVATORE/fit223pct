import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { mesocycle2Build } from '@/data/seed/program'
import { prepareSessionForStart } from '@/domain/sessionStart'
import { createWorkout } from '@/domain/workout'
import type { LadderPrescription, LoggedSet, Workout } from '@/domain/types'
import { WorkoutPage } from './WorkoutPage'

/**
 * Phase 4 (sheet §4.5, T-Workout; ARB acceptance 5 — "historical extra sets
 * do not override the new set counts"). A past C session with FOUR logged
 * overhead-press sets must not make the revised session offer a fourth: the
 * stored plan is the revised three, and after three the screen moves on.
 * The F3 class: the count shown, the count stored and the count offered must
 * agree.
 */

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
})

const sessionC = mesocycle2Build.sessions[2]
const ohpAuthored = sessionC.items.find((i) => i.exerciseId === 'overhead-press')!

/** f8b20ccd's four-rung overhead press, as a literal. */
const OLD_OHP: LadderPrescription = {
  exerciseId: 'overhead-press',
  sets: 4,
  mode: 'reps',
  restSeconds: 120,
  perSide: false,
  role: 'main',
  setPlan: [
    { weightKg: 11.75, reps: 12 },
    { weightKg: 13.75, reps: 10 },
    { weightKg: 15.75, reps: 8 },
    { weightKg: 17.75, reps: 6 },
  ],
  maxWeightKg: 43.75,
  weightStepKg: 2,
}

const log = (setIndex: number): LoggedSet => ({
  setIndex,
  weightKg: 12.75 + setIndex * 2,
  reps: 10,
  seconds: null,
  completedAt: '2026-10-16T10:00:00.000Z',
})

describe('the revised overhead press is offered three sets, not four', () => {
  it('after three logged sets the session moves on to the inverted row', async () => {
    const oldBase = createWorkout({
      id: 'past-c',
      programId: mesocycle2Build.id,
      session: { id: sessionC.id, name: 'Full Body C', focus: 'x', items: [OLD_OHP] },
      date: '2026-10-16',
      startedAt: '2026-10-16T09:00:00.000Z',
    })
    const past: Workout = {
      ...oldBase,
      completedAt: '2026-10-16T10:00:00.000Z',
      readiness: { tier: 'ready', drivers: [] },
      exercises: oldBase.exercises.map((e) => ({ ...e, sets: [0, 1, 2, 3].map(log) })),
    }

    // The session as Today would start it: OHP then inverted row, carried through the real start path.
    const reduced = {
      ...sessionC,
      items: sessionC.items.filter((i) => i.exerciseId === 'overhead-press' || i.exerciseId === 'inverted-row'),
    }
    const started = createWorkout({
      id: 'current-c',
      programId: mesocycle2Build.id,
      session: prepareSessionForStart(reduced, [past], mesocycle2Build.id, { tier: 'ready', drivers: [], consecutiveLowDays: 0 }),
      date: '2026-10-19',
      startedAt: '2026-10-19T09:00:00.000Z',
    })
    expect(started.exercises[0].prescription.sets).toBe(ohpAuthored.sets)
    expect(started.exercises[0].prescription.sets).toBe(3)

    await db.workouts.bulkPut([
      past,
      {
        ...started,
        readiness: { tier: 'ready', drivers: [] },
        exercises: started.exercises.map((e, i) => (i === 0 ? { ...e, sets: [0, 1, 2].map(log) } : e)),
      },
    ])

    render(
      <MemoryRouter initialEntries={['/workout']}>
        <Routes>
          <Route path="/" element={<p>TODAY PROBE</p>} />
          <Route path="/workout" element={<WorkoutPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { level: 1, name: 'Inverted row' })).toBeInTheDocument()
    expect(screen.queryByText(/Set 4 of/)).toBeNull()
  })
})
