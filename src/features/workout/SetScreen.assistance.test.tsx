import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { workoutRepo } from '@/data/repositories'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout } from '@/domain/workout'
import type { ExercisePrescription, RepRangePrescription, Workout } from '@/domain/types'
import { WorkoutPage } from './WorkoutPage'

/**
 * Per-set dip assistance on the set screen (ruling 21 Oct 2026). Uses a real
 * Library id for the page; the control is driven by `assistable`, not by id.
 */

const plain = (overrides: Partial<RepRangePrescription> = {}): RepRangePrescription => ({
  exerciseId: 'incline-push-up',
  sets: 2,
  mode: 'reps',
  restSeconds: 60,
  perSide: false,
  range: { min: 5, max: 8 },
  startWeightKg: null,
  maxWeightKg: null,
  weightStepKg: null,
  ...overrides,
})

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
})

function started(prescription: ExercisePrescription): Workout {
  return {
    ...createWorkout({
      id: 'assist',
      programId: seedProgram.id,
      session: { id: 's', name: 'S', focus: 'F', items: [prescription] },
      date: '2026-07-27',
      startedAt: '2026-07-27T09:00:00.000Z',
    }),
    readiness: { tier: 'ready', drivers: [] },
  }
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

const radio = (name: string) => screen.getByRole('radio', { name })

describe('the Unassisted / Assisted control', () => {
  it('A1 is absent on a prescription that does not opt in', async () => {
    await show(started(plain()))
    expect(screen.queryByRole('radiogroup', { name: 'Assistance' })).toBeNull()
  })

  it('A1 logging an Assisted set stores `assisted: true`', async () => {
    await show(started(plain({ assistable: true })))
    await userEvent.click(radio('Assisted'))
    await userEvent.click(screen.getByRole('button', { name: 'Log set' }))

    const stored = await workoutRepo.getActive()
    expect(stored?.exercises[0].sets[0].assisted).toBe(true)
  })

  it('A5 first exposure defaults to Unassisted, and a set logged untouched has no `assisted` field', async () => {
    await show(started(plain({ assistable: true })))
    expect(radio('Unassisted')).toHaveAttribute('aria-checked', 'true')
    expect(radio('Assisted')).toHaveAttribute('aria-checked', 'false')

    await userEvent.click(screen.getByRole('button', { name: 'Log set' }))
    const stored = await workoutRepo.getActive()
    expect(stored?.exercises[0].sets[0]).not.toHaveProperty('assisted')
  })

  it('pre-sets Assisted from a carried assisted rung, and switching back is one tap, logged unassisted', async () => {
    const carriedPrescription: ExercisePrescription = {
      ...plain({ assistable: true }),
      setPlan: [
        { weightKg: null, reps: 7, assisted: true },
        { weightKg: null, reps: 5 },
      ],
      range: undefined,
      startWeightKg: undefined,
    } as unknown as ExercisePrescription
    await show(started(carriedPrescription))

    expect(radio('Assisted')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Assisted', { selector: 'span' })).toBeInTheDocument() // the target caption says so too

    await userEvent.click(radio('Unassisted'))
    await userEvent.click(screen.getByRole('button', { name: 'Log set' }))
    const stored = await workoutRepo.getActive()
    expect(stored?.exercises[0].sets[0]).not.toHaveProperty('assisted')
  })

  // QA F-P4-1: `swapExercise` keeps the slot's prescription, so a swapped slot
  // still reads `assistable: true` (and a carried `assisted` rung). The ruling
  // says the control is "specific to Parallel Bar Dip", so it must not follow
  // the dip onto the exercise it was swapped for — the same gate the prep
  // block already uses (`substitutedForId === undefined`).
  it('F-P4-1 is absent on a swapped slot, shows no Assisted tag, and logs without `assisted` even from a carried assisted target', async () => {
    const carried: ExercisePrescription = {
      ...plain({ assistable: true }),
      setPlan: [
        { weightKg: null, reps: 7, assisted: true },
        { weightKg: null, reps: 5 },
      ],
      range: undefined,
      startWeightKg: undefined,
    } as unknown as ExercisePrescription
    const w = started(carried)
    await show({
      ...w,
      exercises: w.exercises.map((e) => ({ ...e, exerciseId: 'incline-push-up', substitutedForId: 'parallel-bar-dip' })),
    })

    expect(screen.queryByRole('radiogroup', { name: 'Assistance' })).toBeNull()
    expect(screen.queryByText('Assisted')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Log set' }))
    const stored = await workoutRepo.getActive()
    expect(stored?.exercises[0].sets[0]).not.toHaveProperty('assisted')
  })
})
