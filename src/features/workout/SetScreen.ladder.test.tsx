import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout, completeWorkout, logSet } from '@/domain/workout'
import { WorkoutPage } from './WorkoutPage'
import type { LadderPrescription, SessionTemplate } from '@/domain/types'

/**
 * M8 Phase 7 — ladder-aware SetScreen. Neither the seed nor any imported
 * data ships setPlan content yet (Phase 10), so these sessions are
 * hand-built the same way SessionPreview's ladder test is.
 */

const ladder: LadderPrescription = {
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
  maxWeightKg: 14,
  weightStepKg: 2,
}

const ladderSession: SessionTemplate = {
  id: 'ladder-test',
  name: 'Ladder session',
  focus: 'Squat',
  items: [ladder],
}

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

describe('SetScreen ladder rendering', () => {
  it('shows the ladder position in the header and pre-fills weight/reps from the prescribed rung', async () => {
    const workout = createWorkout({
      id: 'test-ladder-fresh',
      programId: seedProgram.id,
      session: ladderSession,
      date: '2026-07-23',
      startedAt: '2026-07-23T09:00:00.000Z',
    })
    await db.workouts.put(workout)

    renderWorkout()
    expect(await screen.findByText('Set 1 of 3 — 8 kg × 12')).toBeInTheDocument()
    expect(screen.getByLabelText('Weight')).toHaveTextContent('8')
    expect(screen.getByLabelText('Reps')).toHaveTextContent('12')
  })

  it('shows the second rung once the first is logged', async () => {
    const workout = createWorkout({
      id: 'test-ladder-fresh',
      programId: seedProgram.id,
      session: ladderSession,
      date: '2026-07-23',
      startedAt: '2026-07-23T09:00:00.000Z',
    })
    await db.workouts.put(logSet(workout, 0, { weightKg: 8, reps: 12, seconds: null, completedAt: '2026-07-23T09:05:00.000Z' }))

    renderWorkout()
    expect(await screen.findByText('Set 2 of 3 — 10 kg × 10')).toBeInTheDocument()
  })

  it('pre-fills the next rung stepped up when every rung was completed last time', async () => {
    const priorCompleted = completeWorkout(
      [0, 1, 2].reduce(
        (w, i) =>
          logSet(w, 0, {
            weightKg: ladder.setPlan[i].weightKg,
            reps: ladder.setPlan[i].reps,
            seconds: null,
            completedAt: '2026-07-20T09:05:00.000Z',
          }),
        createWorkout({
          id: 'test-ladder-prior',
          programId: seedProgram.id,
          session: ladderSession,
          date: '2026-07-20',
          startedAt: '2026-07-20T09:00:00.000Z',
        }),
      ),
      '2026-07-20T09:40:00.000Z',
    )
    await db.workouts.put(priorCompleted)

    const active = createWorkout({
      id: 'test-ladder-active',
      programId: seedProgram.id,
      session: ladderSession,
      date: '2026-07-23',
      startedAt: '2026-07-23T09:00:00.000Z',
    })
    await db.workouts.put(active)

    renderWorkout()
    expect(await screen.findByText('Set 1 of 3 — 10 kg × 12')).toBeInTheDocument()
    expect(screen.getByLabelText('Weight')).toHaveTextContent('10')
  })

  it('shows at-equipment-max messaging and holds the ladder when the top rung cannot take another step', async () => {
    // Top rung caps at 12 kg here (vs. 14 kg in the other tests) — stepping
    // by weightStepKg (2) would land at 14, over this ceiling, so a fully
    // completed ladder must hold rather than advance.
    const cappedSession: SessionTemplate = {
      ...ladderSession,
      items: [{ ...ladder, maxWeightKg: 12 }],
    }

    const priorCompleted = completeWorkout(
      [0, 1, 2].reduce(
        (w, i) =>
          logSet(w, 0, {
            weightKg: ladder.setPlan[i].weightKg,
            reps: ladder.setPlan[i].reps,
            seconds: null,
            completedAt: '2026-07-20T09:05:00.000Z',
          }),
        createWorkout({
          id: 'test-ladder-cap-prior',
          programId: seedProgram.id,
          session: cappedSession,
          date: '2026-07-20',
          startedAt: '2026-07-20T09:00:00.000Z',
        }),
      ),
      '2026-07-20T09:40:00.000Z',
    )
    await db.workouts.put(priorCompleted)

    const active = createWorkout({
      id: 'test-ladder-cap-active',
      programId: seedProgram.id,
      session: cappedSession,
      date: '2026-07-23',
      startedAt: '2026-07-23T09:00:00.000Z',
    })
    await db.workouts.put(active)

    renderWorkout()
    expect(await screen.findByText('Set 1 of 3 — 8 kg × 12')).toBeInTheDocument()
    expect(
      screen.getByText('Every rung is maxed for this setup — hold the ladder and own the reps.'),
    ).toBeInTheDocument()
  })
})
