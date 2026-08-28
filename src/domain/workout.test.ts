import { describe, expect, it } from 'vitest'
import {
  addCustomSlot,
  completeWorkout,
  createWorkout,
  hasVerifiedLoadList,
  logSet,
  plannedSetIndices,
  previousExposureFor,
  previousSetsFor,
  repairPositionCompleteWorkout,
  skipPrescribedLevel,
  summarizeWorkout,
  swapExercise,
  undoLastSet,
  workoutPosition,
} from './workout'
import { isCompleteExposure } from './carryForward'
import type { LoggedSet, RepRangePrescription, SessionTemplate, UserSettings, Workout } from './types'

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
    let workout = logSet(makeWorkout(), 0, set(10, 14), 0)
    expect(workoutPosition(workout)).toEqual({ exerciseIndex: 0, setIndex: 1 })

    workout = logSet(workout, 0, set(10, 14), 1)
    expect(workoutPosition(workout)).toEqual({ exerciseIndex: 1, setIndex: 0 })
  })

  it('reports completion when every prescribed set is logged', () => {
    let workout = makeWorkout()
    for (const [i] of session.items.entries()) {
      workout = logSet(workout, i, set(10, 14), 0)
      workout = logSet(workout, i, set(10, 14), 1)
    }
    expect(workoutPosition(workout)).toBe('complete')
  })

  // Skipping level 0 opens a custom slot at prescription.sets, not at the
  // vacated index — plannedSetIndices puts custom slots after every
  // prescribed one, never in place of a skipped one.
  it('steps over a skipped prescribed level and offers an opened custom slot after the prescribed ones', () => {
    let workout = skipPrescribedLevel(makeWorkout(), 0, 0)
    expect(workoutPosition(workout)).toEqual({ exerciseIndex: 0, setIndex: 1 })

    workout = logSet(workout, 0, set(10, 14), 1)
    // Level 0 skipped, level 1 done — exercise 0 offers nothing more
    // prescribed, so position moves to exercise 1, not a re-offered level 0.
    expect(workoutPosition(workout)).toEqual({ exerciseIndex: 1, setIndex: 0 })

    workout = addCustomSlot(workout, 0)
    // workoutPosition always scans from exercise 0 — opening a custom slot
    // there re-offers exercise 0 (at prescription.sets, not the skipped
    // index 0) rather than leaving position stuck on exercise 1.
    expect(plannedSetIndices(workout.exercises[0])).toEqual([1, 2])
    expect(workoutPosition(workout)).toEqual({ exerciseIndex: 0, setIndex: 2 })
  })
})

describe('logSet', () => {
  it('is immutable and stores the passed set index', () => {
    const original = makeWorkout()
    const logged = logSet(original, 0, set(10, 14), 0)
    expect(original.exercises[0].sets).toHaveLength(0)
    expect(logged.exercises[0].sets[0].setIndex).toBe(0)
  })

  /**
   * The measured defect, reproduced against the real engine
   * (docs/design/SessionSetCustomization.md §3.1/§8): skip prescribed
   * level 0, log a custom set. With the old derivation
   * (`setIndex: exercise.sets.length`), the custom set lands at index 0 —
   * the level that was SKIPPED — and the completion gate reads it as that
   * level, done. Explicit indexing from `workoutPosition` (which places
   * custom slots at `prescription.sets`, never at a skipped index) makes
   * this structurally impossible.
   */
  it('the index-inheritance regression: a custom set never lands at a skipped level\'s index', () => {
    const ladderSession: SessionTemplate = {
      id: 'L',
      name: 'Ladder session',
      focus: 'Squat',
      items: [
        {
          exerciseId: 'goblet-squat',
          sets: 2,
          mode: 'reps',
          restSeconds: 120,
          perSide: false,
          setPlan: [
            { weightKg: 10, reps: 12 },
            { weightKg: 12, reps: 10 },
          ],
          maxWeightKg: 15,
          weightStepKg: 2,
        },
      ],
    }
    let workout = createWorkout({
      id: 'w-ladder',
      programId: 'phase-1-home',
      session: ladderSession,
      date: '2026-08-07',
      startedAt: start,
    })

    // Skip level 0, open a custom slot. plannedSetIndices puts prescribed
    // levels before custom slots, so level 1 (the real rung) is offered
    // first, the custom slot second — log each at the index
    // workoutPosition actually offers, in that order.
    workout = skipPrescribedLevel(workout, 0, 0)
    workout = addCustomSlot(workout, 0)

    const rungPosition = workoutPosition(workout)
    if (rungPosition === 'complete') throw new Error('expected level 1 still open')
    expect(rungPosition.setIndex).toBe(1)
    workout = logSet(workout, 0, { reps: 10, weightKg: 12, seconds: null, completedAt: start }, rungPosition.setIndex)

    const customPosition = workoutPosition(workout)
    if (customPosition === 'complete') throw new Error('expected an open slot')
    expect(customPosition.setIndex).toBe(2) // prescription.sets, not the skipped 0
    workout = logSet(
      workout,
      0,
      { reps: 12, weightKg: 10, seconds: null, completedAt: start, custom: true },
      customPosition.setIndex,
    )

    expect(workout.exercises[0].sets.map((s) => s.setIndex).sort()).toEqual([1, 2])

    /**
     * Re-grounded for carry-forward, 28 Aug 2026 (Phase 3) — this used to
     * assert `suggestLadderProgression` (deleted) read the exposure as
     * `'repeat'` because level 0 was never logged. Under the new
     * completeness model (`carryForward.ts`'s `isCompleteExposure`) a
     * *skip* is a recorded decision, not an unsatisfied rung — level 0
     * being cleanly skipped (never silently satisfied by the custom set
     * landing at its index — that is this test's actual regression) is
     * exactly what makes this exposure complete: level 0 is accounted for
     * (skipped), level 1 is logged, and the custom slot at index 2 is
     * beyond the prescribed range so it cannot corrupt either reading.
     */
    expect(isCompleteExposure(workout.exercises[0])).toBe(true)
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
    const oneSetLogged = logSet(makeWorkout(), 0, set(10, 14), 0)
    expect(workoutPosition(oneSetLogged)).toEqual({ exerciseIndex: 0, setIndex: 1 })

    const swapped = swapExercise(oneSetLogged, 0, 'split-squat')
    expect(swapped.exercises[0].sets).toHaveLength(0)
    expect(workoutPosition(swapped)).toEqual({ exerciseIndex: 0, setIndex: 0 })
  })
})

describe('undoLastSet', () => {
  // D1
  it('removes the current exercise\'s last set and names the slot it vacated', () => {
    const twoSets = logSet(logSet(makeWorkout(), 0, set(10, 14), 0), 0, set(9, 16), 1)
    const result = undoLastSet(twoSets)

    expect(result.workout.exercises[0].sets).toHaveLength(1)
    expect(result.removed?.exerciseIndex).toBe(0)
    expect(result.removed?.set.weightKg).toBe(16)
  })

  // D2 — the spec's own example: the mistake is the first set of a later
  // exercise, and the user is already looking at the one after it.
  it('reaches back across the exercise boundary for the session\'s last set', () => {
    // ex0 filled (2 of 2), so position sits at the start of ex1.
    const ex0Full = logSet(logSet(makeWorkout(), 0, set(10, 14), 0), 0, set(9, 16), 1)
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
    const before = logSet(makeWorkout(), 0, set(10, 14), 0)
    const snapshot = structuredClone(before)
    const result = undoLastSet(before)

    expect(before).toEqual(snapshot)
    expect(result.workout).not.toBe(before)
    expect(result.workout.exercises[0].sets).not.toBe(before.exercises[0].sets)
  })

  // D5 — position is derived, so it must land on exactly the vacated slot.
  it('re-opens exactly the slot the removed set occupied, within and across exercises', () => {
    // Within: one set logged, position at {0,1}; undo re-offers {0,0}.
    const oneSet = logSet(makeWorkout(), 0, set(10, 14), 0)
    expect(workoutPosition(oneSet)).toEqual({ exerciseIndex: 0, setIndex: 1 })
    expect(workoutPosition(undoLastSet(oneSet).workout)).toEqual({ exerciseIndex: 0, setIndex: 0 })

    // Across: ex0 full, position already at {1,0}; undo walks *backwards*
    // into ex0 and re-offers its final slot.
    const ex0Full = logSet(oneSet, 0, set(9, 16), 1)
    expect(workoutPosition(ex0Full)).toEqual({ exerciseIndex: 1, setIndex: 0 })
    expect(workoutPosition(undoLastSet(ex0Full).workout)).toEqual({ exerciseIndex: 0, setIndex: 1 })
  })

  // D6 — surprising but correct, and documented rather than special-cased:
  // a swap cleared this slot's sets, so the previous exercise's last set
  // genuinely is the most recent surviving log. Undo is not "undo the swap".
  it('reaches into the previous exercise when a swap cleared the current one', () => {
    const ex0Full = logSet(logSet(makeWorkout(), 0, set(10, 14), 0), 0, set(9, 16), 1)
    const ex1Started = logSet(ex0Full, 1, set(8, 20), 0)
    const swapped = swapExercise(ex1Started, 1, 'split-squat')
    expect(swapped.exercises[1].sets).toHaveLength(0)

    const result = undoLastSet(swapped)
    expect(result.removed?.exerciseIndex).toBe(0)
    expect(result.workout.exercises[0].sets).toHaveLength(1)
    expect(result.workout.exercises[1].exerciseId).toBe('split-squat')
  })
})

/**
 * Boot-time repair for the "remove-last-set finishes on screen but not
 * storage" defect (WorkoutPage.handleRemoveSet, fixed alongside this) —
 * `completedAt` stayed null while `workoutPosition` had already gone
 * 'complete'. See the function's own doc for the full defect chain.
 */
describe('repairPositionCompleteWorkout', () => {
  const now = '2026-08-11T07:00:00.000Z'

  it('repairs a position-complete workout using the latest logged set\'s own completedAt', () => {
    // ex0 fully logged (two different timestamps — the later one must win);
    // ex1 fully skipped, no sets of its own.
    let workout = logSet(makeWorkout(), 0, { ...set(10, 14), completedAt: '2026-08-10T09:00:00.000Z' }, 0)
    workout = logSet(workout, 0, { ...set(9, 16), completedAt: '2026-08-10T09:05:00.000Z' }, 1)
    workout = skipPrescribedLevel(workout, 1, 0)
    workout = skipPrescribedLevel(workout, 1, 1)
    expect(workoutPosition(workout)).toBe('complete')

    const repaired = repairPositionCompleteWorkout(workout, now)
    expect(repaired?.completedAt).toBe('2026-08-10T09:05:00.000Z')
    expect(repaired?.abandonedAt).toBeNull()
  })

  it('falls back to abandonedAt when nothing was logged (every slot skipped)', () => {
    let workout = skipPrescribedLevel(makeWorkout(), 0, 0)
    workout = skipPrescribedLevel(workout, 0, 1)
    workout = skipPrescribedLevel(workout, 1, 0)
    workout = skipPrescribedLevel(workout, 1, 1)
    workout = { ...workout, abandonedAt: '2026-08-11T06:00:00.000Z' }
    expect(workoutPosition(workout)).toBe('complete')

    const repaired = repairPositionCompleteWorkout(workout, now)
    expect(repaired?.completedAt).toBe('2026-08-11T06:00:00.000Z')
    expect(repaired?.abandonedAt).toBeNull()
  })

  it('falls back to now when neither a logged set nor abandonedAt exists', () => {
    let workout = skipPrescribedLevel(makeWorkout(), 0, 0)
    workout = skipPrescribedLevel(workout, 0, 1)
    workout = skipPrescribedLevel(workout, 1, 0)
    workout = skipPrescribedLevel(workout, 1, 1)
    expect(workoutPosition(workout)).toBe('complete')

    expect(repairPositionCompleteWorkout(workout, now)?.completedAt).toBe(now)
  })

  it('never touches a genuinely mid-session workout — some slot is still open', () => {
    const workout = logSet(makeWorkout(), 0, set(10, 14), 0)
    expect(workoutPosition(workout)).not.toBe('complete')

    expect(repairPositionCompleteWorkout(workout, now)).toBeNull()
  })

  it('is a no-op on a workout that is already completed', () => {
    const workout = completeWorkout(makeWorkout(), '2026-08-10T09:00:00.000Z')
    expect(repairPositionCompleteWorkout(workout, now)).toBeNull()
  })
})

describe('summarizeWorkout', () => {
  it('totals sets, volume and duration', () => {
    let workout = logSet(makeWorkout(), 0, set(10, 14), 0)
    workout = logSet(workout, 1, set(8, 25), 0)
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
      ...logSet(makeWorkout(), 0, set(9, 12), 0),
      id: 'w-old',
      date: '2026-07-20',
      completedAt: '2026-07-20T19:00:00.000Z',
    }
    const newer: Workout = {
      ...logSet(makeWorkout(), 0, set(11, 14), 0),
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

/**
 * Progression carry-forward, Phase 1 (`~/.claude/plans/
 * progression-carry-forward.md` §4/§8) — the program-scoped sibling of
 * `previousSetsFor` above. Its own docblock states why it exists rather
 * than scoping `previousSetsFor` itself.
 */
describe('previousExposureFor', () => {
  it('returns null with no history at all', () => {
    expect(previousExposureFor([], 'phase-1-home', 'goblet-squat')).toBeNull()
  })

  it('ignores an incomplete (in-progress) workout', () => {
    const inProgress = logSet(makeWorkout(), 0, set(9, 12), 0)
    expect(inProgress.completedAt).toBeNull()
    expect(previousExposureFor([inProgress], 'phase-1-home', 'goblet-squat')).toBeNull()
  })

  it("ignores a different program's workout — goblet-squat is prescribed in both phase-1-home and mesocycle-2-build", () => {
    const otherProgram: Workout = {
      ...logSet(makeWorkout(), 0, set(9, 12), 0),
      id: 'w-other-program',
      programId: 'mesocycle-2-build',
      completedAt: '2026-07-20T19:00:00.000Z',
    }
    expect(previousExposureFor([otherProgram], 'phase-1-home', 'goblet-squat')).toBeNull()
  })

  it('picks the later of two same-day exposures, by completedAt tie-break', () => {
    const earlier: Workout = {
      ...logSet(makeWorkout(), 0, set(9, 12), 0),
      id: 'w-earlier',
      date: '2026-07-22',
      completedAt: '2026-07-22T09:00:00.000Z',
    }
    const later: Workout = {
      ...logSet(makeWorkout(), 0, set(11, 14), 0),
      id: 'w-later',
      date: '2026-07-22',
      completedAt: '2026-07-22T19:00:00.000Z',
    }
    // Deliberately passed in the "wrong" array order — earlier first — so
    // this can only pass by actually comparing completedAt, not by
    // coincidentally returning the last array element.
    const exposure = previousExposureFor([earlier, later], 'phase-1-home', 'goblet-squat')
    expect(exposure?.sets[0].reps).toBe(11)
  })

  it('returns the whole WorkoutExercise, including prescription and skippedLevels — not just the sets', () => {
    let workout = logSet(makeWorkout(), 0, set(9, 12), 0)
    workout = skipPrescribedLevel(workout, 0, 1)
    workout = { ...workout, id: 'w-full', completedAt: '2026-07-22T19:00:00.000Z' }

    const exposure = previousExposureFor([workout], 'phase-1-home', 'goblet-squat')
    expect(exposure?.prescription.exerciseId).toBe('goblet-squat')
    expect(exposure?.skippedLevels).toEqual([1])
  })
})

function settings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    id: 'user',
    name: 'Test',
    weeklyGoal: 3,
    lastSeenWeeklyReviewWeekStart: null,
    ...overrides,
  }
}

/**
 * Equipment-aware progression, Phase 1 (`~/.claude/plans/
 * equipment-aware-progression.md`, AMENDMENT A) — coach spec v2.16 §4:
 * "must not calculate the next or previous load automatically" until the
 * athlete's dumbbell hardware is verified.
 *
 * **`progressionHistoryFor` (the function this gated) is deleted, 28 Aug
 * 2026 (Phase 3, progression carry-forward)** — carry-forward runs
 * ungated per the coach's Q4(a), so this predicate has no current caller.
 * Kept anyway, and still tested: `hasVerifiedLoadList`'s own docblock
 * explains why it is a reserved gate for a future load-*generating*
 * mechanism, not dead code.
 */
describe('hasVerifiedLoadList', () => {
  it('is false with no settings record at all', () => {
    expect(hasVerifiedLoadList(undefined)).toBe(false)
  })

  it('is false with no equipment field', () => {
    expect(hasVerifiedLoadList(settings())).toBe(false)
  })

  it('is false when equipment is present but never confirmed — values happen to be present is not the same as verified', () => {
    expect(hasVerifiedLoadList(settings({ equipment: { handleKg: 2, confirmedAt: null } }))).toBe(false)
  })

  it('is true once confirmedAt is set', () => {
    expect(
      hasVerifiedLoadList(settings({ equipment: { handleKg: 2, confirmedAt: '2026-08-07' } })),
    ).toBe(true)
  })
})
