import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { workoutRepo } from '@/data/repositories'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout, plannedSetIndices, workoutPosition } from '@/domain/workout'
import type { LoggedSet, Workout } from '@/domain/types'
import { TodayPage } from './TodayPage'

/**
 * F3 (QA, 20 Oct). A completed custom 4th set carries forward as a 4th rung,
 * and the screens offered "of 4" — but the workout *stored* at Start still
 * held the authored 3-set prescription, so `workoutPosition` (which walks the
 * stored `prescription.sets`) moved on after set 3 and set 4 was counted and
 * never offered. The Start snapshot must be the carried plan.
 *
 * Time frozen to Wed 22 Jul, which offers the session containing the 3-rung
 * goblet-squat (see TodayPage.test.tsx).
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 22, 9, 0, 0) })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
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
    completedAt: '2026-07-15T10:00:00.000Z',
    ...(custom ? { custom } : {}),
  }
}

describe('starting a session snapshots the carried plan', () => {
  it('stores 4 sets for a lift whose last exposure had a completed custom set, and offers all 4', async () => {
    const base = createWorkout({
      id: 'prior',
      programId: seedProgram.id,
      session: seedProgram.sessions[1],
      date: '2026-07-15',
      startedAt: '2026-07-15T09:00:00.000Z',
    })
    const prior: Workout = {
      ...base,
      completedAt: '2026-07-15T10:30:00.000Z',
      exercises: base.exercises.map((e) =>
        e.exerciseId === 'goblet-squat'
          ? { ...e, customSlots: 1, sets: [logged(0), logged(1), logged(2), logged(3, true)] }
          : e,
      ),
    }
    await db.workouts.put(prior)

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/workout" element={<p>WORKOUT PROBE</p>} />
        </Routes>
      </MemoryRouter>,
    )
    await userEvent.click(await screen.findByRole('button', { name: 'Start session' }))
    await screen.findByText('WORKOUT PROBE')

    const stored = await workoutRepo.getActive()
    const squat = stored?.exercises.find((e) => e.exerciseId === 'goblet-squat')
    expect(squat?.prescription.sets).toBe(4)

    // The position walk must offer the 4th slot after three sets are logged.
    const afterThree: Workout = {
      ...stored!,
      exercises: stored!.exercises.map((e) =>
        e.exerciseId === 'goblet-squat' ? { ...e, sets: [logged(0), logged(1), logged(2)] } : e,
      ),
    }
    expect(plannedSetIndices(afterThree.exercises.find((e) => e.exerciseId === 'goblet-squat')!)).toEqual([0, 1, 2, 3])
    const position = workoutPosition(afterThree)
    expect(position !== 'complete' && afterThree.exercises[position.exerciseIndex].exerciseId).toBe('goblet-squat')
  })
})
