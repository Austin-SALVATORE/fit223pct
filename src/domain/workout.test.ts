import { describe, expect, it } from 'vitest'
import {
  completeWorkout,
  createWorkout,
  logSet,
  previousSetsFor,
  summarizeWorkout,
  swapExercise,
  workoutPosition,
} from './workout'
import type {
  LoggedSet,
  RepRangePrescription,
  SessionTemplate,
  Workout,
} from './types'

function prescription(
  exerciseId: string,
  sets: number,
  overrides: Partial<RepRangePrescription> = {},
): RepRangePrescription {
  return {
    exerciseId,
    sets,
    mode: 'reps',
    range: { min: 8, max: 12 },
    targetRir: 2,
    restSeconds: 120,
    perSide: false,
    startWeightKg: 14,
    maxWeightKg: 20,
    weightStepKg: 2,
    ...overrides,
  }
}

const session: SessionTemplate = {
  id: 'A',
  name: 'Session A',
  focus: 'Squat & pull',
  items: [prescription('goblet-squat', 2), prescription('bench-press', 2)],
}

const start = '2026-07-22T18:00:00.000Z'

function set(reps: number, weightKg: number): LoggedSet {
  return { setIndex: 0, reps, weightKg, seconds: null, rir: 2, completedAt: start }
}

function makeWorkout(): Workout {
  return createWorkout({
    id: 'w1',
    programId: 'phase-1-home',
    session,
    date: '2026-07-22',
    startedAt: start,
  })
}

describe('createWorkout', () => {
  it('snapshots every prescription with empty set logs', () => {
    const workout = makeWorkout()
    expect(workout.exercises).toHaveLength(2)
    expect(workout.exercises[0].prescription.exerciseId).toBe('goblet-squat')
    expect(workout.exercises[0].sets).toHaveLength(0)
    expect(workout.completedAt).toBeNull()
  })
})

describe('workoutPosition', () => {
  it('starts at the first set of the first exercise', () => {
    expect(workoutPosition(makeWorkout())).toEqual({ exerciseIndex: 0, setIndex: 0 })
  })

  it('advances within an exercise, then to the next exercise', () => {
    let workout = logSet(makeWorkout(), 0, set(10, 14))
    expect(workoutPosition(workout)).toEqual({ exerciseIndex: 0, setIndex: 1 })

    workout = logSet(workout, 0, set(10, 14))
    expect(workoutPosition(workout)).toEqual({ exerciseIndex: 1, setIndex: 0 })
  })

  it('reports completion when every prescribed set is logged', () => {
    let workout = makeWorkout()
    for (const [i] of session.items.entries()) {
      workout = logSet(workout, i, set(10, 14))
      workout = logSet(workout, i, set(10, 14))
    }
    expect(workoutPosition(workout)).toBe('complete')
  })
})

describe('logSet', () => {
  it('is immutable and stamps the set index', () => {
    const original = makeWorkout()
    const logged = logSet(original, 0, set(10, 14))
    expect(original.exercises[0].sets).toHaveLength(0)
    expect(logged.exercises[0].sets[0].setIndex).toBe(0)
  })
})

describe('swapExercise', () => {
  it('replaces the exercise and records provenance', () => {
    const swapped = swapExercise(makeWorkout(), 0, 'split-squat')
    expect(swapped.exercises[0].exerciseId).toBe('split-squat')
    expect(swapped.exercises[0].substitutedForId).toBe('goblet-squat')
    expect(swapped.exercises[0].prescription.startWeightKg).toBe(14)
  })

  // Bug: swapping mid-session used to carry the original exercise's already
  // -logged sets over to the substitute, so it read as partially (or fully)
  // done before a single real set of it existed — workoutPosition would then
  // skip straight to a later set index, or even the next exercise, for
  // something the user hadn't actually started.
  it('resets logged sets on swap — the substitute starts clean, not partially done', () => {
    const oneSetLogged = logSet(makeWorkout(), 0, set(10, 14))
    expect(workoutPosition(oneSetLogged)).toEqual({ exerciseIndex: 0, setIndex: 1 })

    const swapped = swapExercise(oneSetLogged, 0, 'split-squat')
    expect(swapped.exercises[0].sets).toHaveLength(0)
    expect(workoutPosition(swapped)).toEqual({ exerciseIndex: 0, setIndex: 0 })
  })
})

describe('summarizeWorkout', () => {
  it('totals sets, volume and duration', () => {
    let workout = logSet(makeWorkout(), 0, set(10, 14))
    workout = logSet(workout, 1, set(8, 25))
    workout = completeWorkout(workout, '2026-07-22T18:42:00.000Z')

    const summary = summarizeWorkout(workout)
    expect(summary.totalSets).toBe(2)
    expect(summary.volumeKg).toBe(10 * 14 + 8 * 25)
    expect(summary.durationMinutes).toBe(42)
  })
})

describe('previousSetsFor', () => {
  it('finds sets from the most recent completed workout containing the exercise', () => {
    const older: Workout = {
      ...logSet(makeWorkout(), 0, set(9, 12)),
      id: 'w-old',
      date: '2026-07-20',
      completedAt: '2026-07-20T19:00:00.000Z',
    }
    const newer: Workout = {
      ...logSet(makeWorkout(), 0, set(11, 14)),
      id: 'w-new',
      date: '2026-07-22',
      completedAt: '2026-07-22T19:00:00.000Z',
    }
    const active = makeWorkout()

    const previous = previousSetsFor([older, active, newer], 'goblet-squat')
    expect(previous).toHaveLength(1)
    expect(previous[0].reps).toBe(11)
  })

  it('returns an empty list for a never-performed exercise', () => {
    expect(previousSetsFor([makeWorkout()], 'overhead-press')).toEqual([])
  })
})
