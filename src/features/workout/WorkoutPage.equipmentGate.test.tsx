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
 * **The clearest single-assertion proof the progression model changed**
 * (28 Aug 2026, Phase 3 of `~/.claude/plans/progression-carry-forward.md`).
 * This test originally guarded coach spec v2.16 §4's equipment gate
 * (Phase 1, `equipment-aware-progression.md` AMENDMENT A): confirming the
 * athlete's dumbbell hardware opened arithmetic progression, and the
 * scenario below — startWeightKg 16, weightStepKg 2, a prior session that
 * topped every set — used to prove the gate really did open onto a
 * computed `16 + 2 = 18` once confirmed.
 *
 * **Under carry-forward there is no arithmetic to gate.** The coach's Q4(a)
 * ruling: carry-forward echoes a load the athlete already lifted and
 * computes nothing, so `equipment.confirmedAt` is not consulted for it at
 * all (`domain/carryForward.ts`'s own docblock — the absent settings
 * parameter is the structural proof). The athlete logged **16 kg**, so 16
 * kg is what carry-forward offers next time — never 18, confirmed or not.
 * The second test below is the flip: it used to assert 18 once confirmed
 * and now asserts confirming equipment makes **no difference at all**,
 * which is exactly the guard against silently reintroducing a
 * settings-aware path around carry-forward.
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

describe('the stepper pre-fill echoes what was logged, never a computed step, regardless of equipment confirmation', () => {
  it('offers the athlete\'s own logged 16 kg, never a computed 18, with no equipment profile confirmed', async () => {
    await seedToppedOutPriorSession()
    renderWorkout()

    expect(await screen.findByLabelText('Weight')).toHaveTextContent('16')
    expect(screen.queryByLabelText('Weight')).not.toHaveTextContent('18')
  })

  it('still offers 16 kg, never 18, once the equipment profile is confirmed — carry-forward is not settings-aware', async () => {
    await settingsRepo.update({ equipment: { confirmedAt: '2026-08-01' } })
    await seedToppedOutPriorSession()
    renderWorkout()

    expect(await screen.findByLabelText('Weight')).toHaveTextContent('16')
    expect(screen.queryByLabelText('Weight')).not.toHaveTextContent('18')
  })
})
