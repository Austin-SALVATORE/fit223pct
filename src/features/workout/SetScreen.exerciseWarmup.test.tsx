import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout } from '@/domain/workout'
import type { LadderPrescription, Workout } from '@/domain/types'
import { WorkoutPage } from './WorkoutPage'

/**
 * Coach Q6: preparation that belongs to one exercise appears in Workout mode
 * before that exercise's first offered set. Uses a real catalogue entry
 * (`mesocycle2-fullbody-hinge-warmup-v1`) as the pointer's target.
 */

const WARMUP_HEADING = 'Before your first set'

const item: LadderPrescription = {
  exerciseId: 'goblet-squat',
  sets: 3,
  mode: 'reps',
  restSeconds: 120,
  perSide: false,
  setPlan: [
    { weightKg: 8, reps: 12 },
    { weightKg: 10, reps: 10 },
    { weightKg: 12, reps: 8 },
  ],
  maxWeightKg: 20,
  weightStepKg: 2,
  warmupId: 'mesocycle2-fullbody-hinge-warmup-v1',
}

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
})

function workout(overrides: (w: Workout) => Workout = (w) => w): Workout {
  return overrides({
    ...createWorkout({
      id: 'exercise-warmup',
      programId: seedProgram.id,
      session: { id: 's', name: 'S', focus: 'F', items: [item] },
      date: '2026-07-27',
      startedAt: '2026-07-27T09:00:00.000Z',
    }),
    readiness: { tier: 'ready', drivers: [] },
  })
}

async function show(w: Workout) {
  await db.workouts.put(w)
  render(
    <MemoryRouter initialEntries={['/workout']}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/workout" element={<WorkoutPage />} />
      </Routes>
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { level: 1 })
}

const logged = (setIndex: number) => ({ setIndex, weightKg: 8, reps: 12, seconds: null, completedAt: '2026-07-27T09:05:00.000Z' })

describe('exercise-level warm-up on the set screen', () => {
  it('shows before the first offered set', async () => {
    await show(workout())
    expect(screen.getByText(WARMUP_HEADING)).toBeInTheDocument()
    expect(screen.getByText('7.75 kg total × 8')).toBeInTheDocument()
  })

  it('is gone once a set has been logged', async () => {
    await show(workout((w) => ({ ...w, exercises: w.exercises.map((e) => ({ ...e, sets: [logged(0)] })) })))
    expect(screen.queryByText(WARMUP_HEADING)).toBeNull()
  })

  it('still shows when level 0 was skipped, because the first OFFERED set is index 1', async () => {
    await show(workout((w) => ({ ...w, exercises: w.exercises.map((e) => ({ ...e, skippedLevels: [0] })) })))
    expect(screen.getByText(/Set 1 of 2/)).toBeInTheDocument()
    expect(screen.getByText(WARMUP_HEADING)).toBeInTheDocument()
  })

  it('is suppressed on a substitute — a barbell ramp for a swapped movement is a false instruction', async () => {
    await show(workout((w) => ({ ...w, exercises: w.exercises.map((e) => ({ ...e, substitutedForId: 'goblet-squat' })) })))
    expect(screen.queryByText(WARMUP_HEADING)).toBeNull()
  })

  it('does not appear for a prescription with no warmupId', async () => {
    await show(
      workout((w) => ({
        ...w,
        exercises: w.exercises.map((e) => ({ ...e, prescription: { ...item, warmupId: undefined } })),
      })),
    )
    expect(screen.queryByText(WARMUP_HEADING)).toBeNull()
  })
})
