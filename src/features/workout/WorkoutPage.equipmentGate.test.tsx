import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { settingsRepo } from '@/data/repositories'
import { createWorkout, completeWorkout, logSet } from '@/domain/workout'
import { WorkoutPage } from './WorkoutPage'
import type { RepRangePrescription, SessionTemplate } from '@/domain/types'

/**
 * Equipment-aware progression, Phase 1 (`~/.claude/plans/
 * equipment-aware-progression.md`, AMENDMENT A) — coach spec v2.16 §4:
 * "must not calculate the next or previous load automatically" until the
 * athlete's dumbbell hardware is verified. QA traced arithmetic
 * progression to four live surfaces reachable on Monday's first screen;
 * this is T3, the plan's own named guard, for the sharpest of them — the
 * SetScreen stepper's pre-filled weight, which is what the athlete loads
 * before ever logging anything.
 *
 * A rep-range prescription, not a ladder — the plan's own T3 wording
 * ("a test must go red showing 18 where the coach wrote 16") describes
 * this exact scenario: startWeightKg 16, weightStepKg 2, a prior session
 * that topped every set, and increase-load's 16 + 2 = 18.
 */

const repRange: RepRangePrescription = {
  exerciseId: 'goblet-squat',
  sets: 3,
  mode: 'reps',
  range: { min: 8, max: 12 },
  restSeconds: 90,
  perSide: false,
  startWeightKg: 16,
  maxWeightKg: 20,
  weightStepKg: 2,
}

const repRangeSession: SessionTemplate = {
  id: 'rep-range-gate-test',
  name: 'Rep-range gate session',
  focus: 'Squat',
  items: [repRange],
}

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
  await settingsRepo.update({ equipment: undefined })
})

async function seedToppedOutPriorSession() {
  const priorCompleted = completeWorkout(
    [0, 1, 2].reduce(
      (w, i) =>
        logSet(
          w,
          0,
          { weightKg: 16, reps: 12, seconds: null, completedAt: '2026-07-20T09:05:00.000Z' },
          i,
        ),
      createWorkout({
        id: 'test-rep-range-gate-prior',
        programId: seedProgram.id,
        session: repRangeSession,
        date: '2026-07-20',
        startedAt: '2026-07-20T09:00:00.000Z',
      }),
    ),
    '2026-07-20T09:40:00.000Z',
  )
  await db.workouts.put(priorCompleted)

  const active = createWorkout({
    id: 'test-rep-range-gate-active',
    programId: seedProgram.id,
    session: repRangeSession,
    date: '2026-07-23',
    startedAt: '2026-07-23T09:00:00.000Z',
  })
  await db.workouts.put(active)
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

describe('the stepper pre-fill is gated on a verified equipment profile', () => {
  it('offers the coach\'s own 16 kg, never the computed 18, while equipment is unverified', async () => {
    await seedToppedOutPriorSession()
    renderWorkout()

    expect(await screen.findByLabelText('Weight')).toHaveTextContent('16')
    expect(screen.queryByLabelText('Weight')).not.toHaveTextContent('18')
  })

  it('offers the computed 18 once the equipment profile is confirmed — the rule still holds when the gate is open', async () => {
    await settingsRepo.update({ equipment: { confirmedAt: '2026-08-01' } })
    await seedToppedOutPriorSession()
    renderWorkout()

    expect(await screen.findByLabelText('Weight')).toHaveTextContent('18')
  })
})
