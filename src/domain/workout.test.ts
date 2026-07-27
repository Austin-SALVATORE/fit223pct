import { describe, expect, it } from 'vitest'
import {
  completeWorkout,
  createWorkout,
  logSet,
  previousSetsFor,
  summarizeWorkout,
  swapExercise,
  undoLastSet,
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
  return { setIndex: 0, reps, weightKg, seconds: null, completedAt: start }
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

describe('undoLastSet', () => {
  // D1
  it('removes the current exercise\'s last set and names the slot it vacated', () => {
    const twoSets = logSet(logSet(makeWorkout(), 0, set(10, 14)), 0, set(9, 16))
    const result = undoLastSet(twoSets)

    expect(result.workout.exercises[0].sets).toHaveLength(1)
    expect(result.removed?.exerciseIndex).toBe(0)
    expect(result.removed?.set.weightKg).toBe(16)
  })

  // D2 — the spec's own example: the mistake is the first set of a later
  // exercise, and the user is already looking at the one after it.
  it('reaches back across the exercise boundary for the session\'s last set', () => {
    // ex0 filled (2 of 2), so position sits at the start of ex1.
    const ex0Full = logSet(logSet(makeWorkout(), 0, set(10, 14)), 0, set(9, 16))
    expect(workoutPosition(ex0Full)).toEqual({ exerciseIndex: 1, setIndex: 0 })

    const result = undoLastSet(ex0Full)
    expect(result.removed?.exerciseIndex).toBe(0)
    expect(result.workout.exercises[0].sets).toHaveLength(1)
  })

  // D3
  it('reports nothing removed, and changes nothing, when no set is logged', () => {
    const untouched = makeWorkout()
    const result = undoLastSet(untouched)

    expect(result.removed).toBeNull()
    expect(result.workout).toEqual(untouched)
  })

  // D4
  it('does not mutate the workout it was given', () => {
    const before = logSet(makeWorkout(), 0, set(10, 14))
    const snapshot = structuredClone(before)
    const result = undoLastSet(before)

    expect(before).toEqual(snapshot)
    expect(result.workout).not.toBe(before)
    expect(result.workout.exercises[0].sets).not.toBe(before.exercises[0].sets)
  })

  // D5 — position is derived, so it must land on exactly the vacated slot.
  it('re-opens exactly the slot the removed set occupied, within and across exercises', () => {
    // Within: one set logged, position at {0,1}; undo re-offers {0,0}.
    const oneSet = logSet(makeWorkout(), 0, set(10, 14))
    expect(workoutPosition(oneSet)).toEqual({ exerciseIndex: 0, setIndex: 1 })
    expect(workoutPosition(undoLastSet(oneSet).workout)).toEqual({ exerciseIndex: 0, setIndex: 0 })

    // Across: ex0 full, position already at {1,0}; undo walks *backwards*
    // into ex0 and re-offers its final slot.
    const ex0Full = logSet(oneSet, 0, set(9, 16))
    expect(workoutPosition(ex0Full)).toEqual({ exerciseIndex: 1, setIndex: 0 })
    expect(workoutPosition(undoLastSet(ex0Full).workout)).toEqual({ exerciseIndex: 0, setIndex: 1 })
  })

  // D6 — surprising but correct, and documented rather than special-cased:
  // a swap cleared this slot's sets, so the previous exercise's last set
  // genuinely is the most recent surviving log. Undo is not "undo the swap".
  it('reaches into the previous exercise when a swap cleared the current one', () => {
    const ex0Full = logSet(logSet(makeWorkout(), 0, set(10, 14)), 0, set(9, 16))
    const ex1Started = logSet(ex0Full, 1, set(8, 20))
    const swapped = swapExercise(ex1Started, 1, 'split-squat')
    expect(swapped.exercises[1].sets).toHaveLength(0)

    const result = undoLastSet(swapped)
    expect(result.removed?.exerciseIndex).toBe(0)
    expect(result.workout.exercises[0].sets).toHaveLength(1)
    expect(result.workout.exercises[1].exerciseId).toBe('split-squat')
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
