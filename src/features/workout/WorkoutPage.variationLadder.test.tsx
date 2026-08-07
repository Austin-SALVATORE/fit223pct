import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { settingsRepo } from '@/data/repositories'
import { createWorkout, completeWorkout, logSet } from '@/domain/workout'
import { WorkoutPage } from './WorkoutPage'
import type { LadderPrescription, RepRangePrescription, SessionTemplate, SetTarget } from '@/domain/types'

/**
 * §10 "Load-ceiling progression" Phase C (`~/.claude/plans/
 * variation-ladder.md`) — N4: SetScreen and RestScreen must never
 * disagree about a pyramid's derived tempo, since both are asking the
 * same `withCeilingVariation(...)` call for the same prescription and
 * (gated) history. A transform applied at only one call site would let
 * them diverge — the exact class of bug `nextSetTarget`'s own module
 * docblock already exists to prevent for the load numbers, now true for
 * the tempo label too.
 *
 * **The chip only ever renders on RestScreen's *new-exercise* card**
 * (`NewExerciseCaption`'s own docblock: "a new exercise needs and a
 * familiar one doesn't") — "next set, same exercise" deliberately shows
 * no variant/MAX/range chip at all. So the comparison has to cross an
 * exercise transition: a one-set filler logged first, landing on the
 * ceiling exercise as a *new* exercise on RestScreen, then "Skip" into
 * SetScreen for that same rung.
 */

const ceilingSetPlan: SetTarget[] = [
  { weightKg: 10, reps: 12 },
  { weightKg: 12, reps: 10 },
  { weightKg: 14, reps: 8 },
  { weightKg: 15, reps: 6 },
]

const ceilingLadder: LadderPrescription = {
  exerciseId: 'incline-dumbbell-press',
  sets: 4,
  mode: 'reps',
  restSeconds: 120,
  perSide: false,
  setPlan: ceilingSetPlan,
  maxWeightKg: 15,
  weightStepKg: 2,
}

/** One set, logged first purely to trigger a "new exercise" transition into the ceiling ladder. */
const fillerPrescription: RepRangePrescription = {
  exerciseId: 'goblet-squat',
  sets: 1,
  mode: 'reps',
  range: { min: 8, max: 12 },
  restSeconds: 60,
  perSide: false,
  startWeightKg: 10,
  maxWeightKg: 20,
  weightStepKg: 2,
}

/** Used only to build the two prior *complete exposure* workouts — a single-item session is all completeCeilingExposures needs. */
const priorExposureSession: SessionTemplate = {
  id: 'ceiling-prior-exposure',
  name: 'Ceiling prior exposure',
  focus: 'Press',
  items: [ceilingLadder],
}

/** The active session under test: filler first, ceiling ladder second. */
const activeSession: SessionTemplate = {
  id: 'ceiling-n4-active',
  name: 'Ceiling N4 session',
  focus: 'Press',
  items: [fillerPrescription, ceilingLadder],
}

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
  await settingsRepo.update({ equipment: undefined })
})

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/workout']}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/workout" element={<WorkoutPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

/** Two complete exposures of the ceiling pyramid, under the same program — earns 'slow' (ceilingVariationFor(2)). */
async function seedTwoCompleteCeilingExposures() {
  for (const [id, date] of [
    ['ceiling-wk1', '2026-08-10'],
    ['ceiling-wk2', '2026-08-17'],
  ] as const) {
    let workout = createWorkout({
      id,
      programId: seedProgram.id,
      session: priorExposureSession,
      date,
      startedAt: `${date}T09:00:00.000Z`,
    })
    ceilingSetPlan.forEach((rung, index) => {
      workout = logSet(
        workout,
        0,
        { weightKg: rung.weightKg, reps: rung.reps, seconds: null, completedAt: `${date}T09:${10 + index}:00.000Z` },
        index,
      )
    })
    await db.workouts.put(completeWorkout(workout, `${date}T09:40:00.000Z`))
  }
}

describe('the derived tempo agrees between SetScreen and RestScreen (N4)', () => {
  it('shows the identical derived label on both screens for the same ceiling pyramid', async () => {
    await settingsRepo.update({ equipment: { confirmedAt: '2026-08-01' } })
    await seedTwoCompleteCeilingExposures()

    const activeWorkout = createWorkout({
      id: 'ceiling-active',
      programId: seedProgram.id,
      session: activeSession,
      date: '2026-08-24',
      startedAt: '2026-08-24T09:00:00.000Z',
    })
    await db.workouts.put(activeWorkout)

    renderApp()

    // SetScreen starts on the filler (item 0) — log its one set to
    // transition into the ceiling ladder as a *new* exercise.
    expect(await screen.findByRole('heading', { name: 'Goblet squat' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Log set' }))
    // AnimatePresence exits the old screen rather than unmounting it
    // instantly — wait for it to be gone before reading anything, or a
    // lingering element could pass an assertion for the wrong screen.
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Log set' })).toBeNull())

    // RestScreen: the ceiling ladder as a new exercise — the only card
    // shape that renders the variant chip at all.
    expect(await screen.findByRole('heading', { name: 'Rest' })).toBeInTheDocument()
    expect(await screen.findByText('Incline dumbbell press')).toBeInTheDocument()
    expect(await screen.findByText('Slow')).toBeInTheDocument()

    // Skip straight into SetScreen for the same exercise, same rung.
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Rest' })).toBeNull())

    // SetScreen must carry the identical label — not a second
    // computation that happens to agree, but literally the same
    // withCeilingVariation(...) call reached through its own call site.
    expect(await screen.findByRole('heading', { name: 'Incline dumbbell press' })).toBeInTheDocument()
    expect(await screen.findByText('Slow')).toBeInTheDocument()
  })
})
