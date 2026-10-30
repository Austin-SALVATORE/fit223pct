import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import i18n from '@/i18n/i18next'
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
  await i18n.changeLanguage('en')
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
    // A real substitute: the slot was prescribed for another exercise. (The
    // slot's own id here is not a substitute since CC4 — SetScreen.swapBack.test.tsx.)
    await show(workout((w) => ({ ...w, exercises: w.exercises.map((e) => ({ ...e, substitutedForId: 'barbell-squat' })) })))
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

describe('a stored snapshot whose warm-up no longer exists (sheet §4.7)', () => {
  // Deleting a catalogue entry must degrade stored snapshots to "no prep
  // block", never crash: SetScreen is the one storage-sourced reader of an
  // exercise-level `warmupId`. Phase 4 deletes the C -v1 session warm-up, and
  // the forward rule is that deleting an exercise-level id later is safe only
  // because of this guard.
  it('renders the set screen without a prep block', async () => {
    await show(
      workout((w) => ({
        ...w,
        exercises: w.exercises.map((e) => ({ ...e, prescription: { ...item, warmupId: 'mesocycle2-deleted-prep-v0' } })),
      })),
    )
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.queryByText(WARMUP_HEADING)).toBeNull()
  })
})

/**
 * French decimals in a ramp row (Phase 2.4 ride-along, 29 Oct). `RampRow`
 * (`today/WarmupSection.tsx`, shared by the Today preview, the Plan day
 * preview and this prep block) passed the raw `step.weightKg` to the locale
 * string, so a French athlete read "7.75 kg au total × 5" directly above a
 * ladder printed "11,75 → 13,75 → 15,75 kg". The empty barbell is 7.75 kg on
 * this hardware, so the case is the common one, not an edge.
 *
 * Negative control, run 29 Oct: `weight: step.weightKg` in `RampRow` (the raw
 * number again) turns this test red — `Unable to find an element with the
 * text: 7,75 kg au total × 5` — and nothing else in the suite (the English
 * tests above are unaffected: "7.75" is what English writes).
 */
describe('a ramp row in French', () => {
  const overheadPress: LadderPrescription = {
    exerciseId: 'overhead-press',
    sets: 3,
    mode: 'reps',
    restSeconds: 120,
    perSide: false,
    setPlan: [
      { weightKg: 11.75, reps: 8 },
      { weightKg: 13.75, reps: 8 },
      { weightKg: 15.75, reps: 8 },
    ],
    maxWeightKg: 43.75,
    weightStepKg: 2,
    warmupId: 'mesocycle2-overhead-press-prep-v1',
  }

  it('writes the empty barbell as 7,75 kg, not 7.75', async () => {
    await i18n.changeLanguage('fr')
    await show(
      workout((w) => ({
        ...w,
        exercises: w.exercises.map((e) => ({ ...e, exerciseId: 'overhead-press', prescription: overheadPress })),
      })),
    )

    expect(screen.getByText('Avant ta première série')).toBeInTheDocument()
    expect(screen.getByText('7,75 kg au total × 5')).toBeInTheDocument()
    expect(screen.queryByText(/7\.75/)).toBeNull()
  })
})

