import { describe, expect, it } from 'vitest'
import { carrySessionForward, isCarryBasisExposure, mostRecentCompleteExposureFor } from './carryForward'
import { lastEligibleExposureFor } from './historyEligibility'
import { detectStagnation } from './stagnation'
import { authoredExerciseIdOf, isSubstitute, withoutSwapState } from './substitutions'
import { strengthTrend } from './trends'
import {
  addCustomSlot,
  completeWorkout,
  createWorkout,
  logSet,
  previousSetsFor,
  skipPrescribedLevel,
  summarizeWorkout,
  swapExercise,
  workoutPosition,
} from './workout'
import type { Exercise, LadderPrescription, LoggedSet, SubstituteLoad, Workout, WorkoutExercise } from './types'

/**
 * Swapping, and swapping back (Phase 2b.3: CC4, OD-f, OD-d).
 *
 * The coach's CC4 (29 Oct): "the governing information is the actual exercise
 * performed and logged, not whether the athlete interacted with the swap
 * control". A slot swapped away and back is the original exercise, and counts
 * for the original's progression when it is complete; sets logged before the
 * return, and levels skipped on the substitute, can not make it complete. The
 * owner's OD-f resets `skippedLevels` and `customSlots` on every swap, and OD-d
 * keeps the sets a swap clears as a record (`priorAttempts`) that nothing
 * counts. `SetScreen.swapBack.test.tsx` is the screen half (C4);
 * `substitutions.guard.test.ts` is the source scan.
 *
 * Negative controls, run 30 Oct: each mutation applied to the source, the WHOLE
 * suite run (1772-1783 tests as it grew), the source restored and `cmp`ed. Each
 * was traced against the code as it stands after Phase 2b.3 (the swap marker is
 * gone from a returned slot, so a control that needs "a swap back" must find it
 * some other way). Test names are shortened; "(screen)" is
 * `SetScreen.swapBack.test.tsx`, "(guard)" is `substitutions.guard.test.ts`.
 *
 * C1: a genuine swap back counts as the original
 *   `isCarryBasisExposure` back to `exercise.substitutedForId === undefined`
 *                                      -> "a record stored before CC4 ... read the
 *                                         same way" and (guard) (2 red). The
 *                                         A -> B -> A test stays GREEN under it:
 *                                         a record written after CC4 carries no
 *                                         field, so the raw comparison is true
 *                                         for it. Only a stored legacy record can
 *                                         see this reader.
 *   the write side keeps `substitutedForId` (written on every swap)
 *                                      -> "a genuine return leaves an unswapped
 *                                         slot", "A -> B -> C -> A", workout.test's
 *                                         "also clears substitutedForId" and
 *                                         (screen) "stored with no swap state"
 *                                         (4 red). NOT the C1 carry test and NOT
 *                                         the screen's five: the read side
 *                                         compensates for exactly this, which is
 *                                         why the plan has both. The plan's
 *                                         "drop the write-side clear -> red" is
 *                                         red on the stored shape, not on carry.
 *   the write side keeps `substituteLoad` (`withoutSwapState` no longer drops it)
 *                                      -> "withoutSwapState drops exactly the two
 *                                         swap fields", "a genuine return",
 *                                         workout.test's "clears the stored load",
 *                                         SetScreen.substitute's T26 and, in
 *                                         (screen), "stored with no swap state" and
 *                                         "the ceiling returns" (the leftover load
 *                                         blanks the weight, so the warning cannot
 *                                         show) (6 red)
 *   `isSubstitute` without its own-id clause (`!== undefined` alone)
 *                                      -> "is false for a record swapped away and
 *                                         back", "a record stored before CC4 ...",
 *                                         substituteLoad.test's E5 swap-back case
 *                                         and all five (screen) stored-record cases
 *                                         (8 red)
 *   a second substitute recorded against the first (`authoredId = exerciseId`)
 *                                      -> "a second substitute is still recorded
 *                                         against the authored exercise", "a
 *                                         genuine return", "A -> B -> C -> A", C1,
 *                                         two workout.test cases and six (screen)
 *                                         cases: the slot comes back as a
 *                                         substitute of the first substitute, so
 *                                         the five stay withheld (12 red)
 *   the no-op guard removed (a swap to the exercise already in the slot)
 *                                      -> "swapping to the exercise already in
 *                                         the slot changes nothing" (1 red)
 *
 * C2: a partly done original does not become eligible
 *   The plan prescribes "treat any swap-back as complete". Once the swap marker is
 *   gone there is nothing to match a swap-back on, so that control was attempted
 *   in two forms that can be written against the new code:
 *   (a) `isCompleteExposure` returns true for a slot that has a `priorAttempts`
 *       record (the nearest thing to "this slot was swapped")
 *                                      -> C2 "sets logged before the swap are a
 *                                         record" (1 red)
 *   (b) a swap keeps the slot's `sets` (the pre-swap sets become the returned
 *       original's)                    -> C2, the position, summary, Last time and
 *                                         suggestion record tests, the OD-f/OD-d
 *                                         write tests, workout.test's two reset
 *                                         tests, the day-detail tests and the
 *                                         swap confirm test (15 red)
 *   (c) completeness not required (`[0]` instead of `.find(isCompleteExposure)`)
 *                                      -> both C2 tests, C3, and three
 *                                         carryForward.test cases (6 red); this is
 *                                         the control for a STORED partial record,
 *                                         which `isCarryBasisExposure` admits
 *   The levels are left unlogged, not skipped, as the plan requires: a skipped
 *   level would make `isCompleteExposure` count the slot complete and hide (a).
 *
 * C3 (OD-f): skippedLevels / customSlots reset
 *   `skippedLevels` kept across the swap -> "resets skippedLevels and customSlots"
 *                                         and C3 "skip level 2 on B" (2 red)
 *   `customSlots` kept across the swap -> "resets skippedLevels and customSlots"
 *                                         (1 red; no carry assertion depends on it)
 *
 * C5: a final substitute keeps its logs under itself
 *   `isSubstitute` false when the record carries a `substituteLoad`
 *                                      -> C5, and seven substitute screen tests
 *                                         (T19, T20, T24, the Rest screen pill,
 *                                         T4, the 24 Oct end to end, (screen) "while
 *                                         on the substitute") (8 red)
 *
 * OD-d: priorAttempts is a record only
 *   no record written (`priorAttempts` dropped from the result)
 *                                      -> "keeps the sets a swap clears", "appends",
 *                                         "writes nothing when no sets were logged",
 *                                         C2, and four day-detail tests (8 red)
 *   a swap overwrites the record instead of appending
 *                                      -> "appends, oldest first" (1 red)
 *   each consumer made to read it as if it were `sets`, one at a time:
 *     `summarizeWorkout`               -> "is not in the summary totals" and two
 *                                         day-detail tests (3 red)
 *     `workoutPosition`                -> "is not a position", the OD-f write test,
 *                                         workout.test's reset test and the swap
 *                                         confirm test (4 red)
 *     `previousSetsFor`                -> "is not Last time" (1 red)
 *     `scopedExposuresFor` (carry), each `priorAttempts` entry expanded into a
 *       synthetic exposure of the exercise it was performed as
 *                                      -> "is not a carry basis" (1 red). This is
 *                                         the only form that goes red. The first
 *                                         form tried, widening the pre-filter to
 *                                         `sets.length > 0 || priorAttempts`, stays
 *                                         fully GREEN (1788/1788; found by the
 *                                         independent check of 02761fe and
 *                                         re-run): the swapped slot's `exerciseId`
 *                                         is the substitute, so it never matches
 *                                         the original's id, and
 *                                         `isCompleteExposure` excludes it too. It
 *                                         is not a control and is not claimed as one.
 *     `hasAWeight` (the suggestion)    -> "is not a weight suggestion" (1 red)
 *     `strengthTrend`                  -> "is not a data point in the strength trend"
 *     `detectStagnation`               -> "is not a data point in stagnation"
 */

const P = 'p1'
const A = 'incline-dumbbell-press'
const B = 'dumbbell-bench-press'

/** Four levels, so "log 0, 1 and 3" can leave level 2 neither logged nor skipped. */
function ladder(exerciseId: string, weights: number[], reps = [12, 10, 8, 6]): LadderPrescription {
  return {
    exerciseId,
    sets: weights.length,
    mode: 'reps',
    restSeconds: 90,
    perSide: false,
    setPlan: weights.map((weightKg, i) => ({ weightKg, reps: reps[i] })),
    maxWeightKg: 40,
    weightStepKg: 2,
  }
}

const AUTHORED_WEIGHTS = [14, 16, 18, 20]
const authoredA = () => ladder(A, AUTHORED_WEIGHTS)
const authoredB = () => ladder(B, [30, 32, 34, 36], [8, 8, 8, 8])
const loadB: SubstituteLoad = { loaded: true, startWeightsKg: [], stepKg: 2 }

function started(id: string, date: string, items: LadderPrescription[] = [authoredA()]): Workout {
  return createWorkout({
    id,
    programId: P,
    session: { id: 's', name: 'S', focus: 'F', items },
    date,
    startedAt: `${date}T09:00:00.000Z`,
  })
}

function set(weightKg: number | null, reps: number): Omit<LoggedSet, 'setIndex'> {
  return { weightKg, reps, seconds: null, completedAt: '2026-07-17T10:00:00.000Z' }
}

/** Logs `[setIndex, weightKg, reps]` triples on slot 0, in the order given. */
function logLevels(workout: Workout, levels: [number, number, number][], exerciseIndex = 0): Workout {
  return levels.reduce((w, [setIndex, kg, reps]) => logSet(w, exerciseIndex, set(kg, reps), setIndex), workout)
}

const finish = (w: Workout): Workout => completeWorkout(w, `${w.date}T10:30:00.000Z`)

/** A real, complete exposure of A earlier in the month — what carry should resume from. */
function earlierRealExposure(): Workout {
  return finish(
    logLevels(started('earlier', '2026-07-10'), [
      [0, 16, 12],
      [1, 18, 10],
      [2, 20, 8],
      [3, 22, 6],
    ]),
  )
}
const EARLIER_WEIGHTS = [16, 18, 20, 22]

function carriedWeights(history: Workout[], prescription: LadderPrescription = authoredA()): (number | null)[] {
  const [carried] = carrySessionForward([prescription], history, P)
  return (carried as LadderPrescription).setPlan.map((rung) => rung.weightKg)
}

describe('isSubstitute and its companions (substitutions.ts)', () => {
  it('is true only for a slot performing an exercise other than the one it was prescribed for', () => {
    expect(isSubstitute({ exerciseId: A })).toBe(false)
    expect(isSubstitute({ exerciseId: B, substitutedForId: A })).toBe(true)
  })

  it('is false for a record swapped away and back that stored "substituted for itself" before CC4', () => {
    expect(isSubstitute({ exerciseId: A, substitutedForId: A })).toBe(false)
  })

  it('names the authored exercise of an unswapped, swapped and swapped-back slot', () => {
    expect(authoredExerciseIdOf({ exerciseId: A })).toBe(A)
    expect(authoredExerciseIdOf({ exerciseId: B, substitutedForId: A })).toBe(A)
    expect(authoredExerciseIdOf({ exerciseId: A, substitutedForId: A })).toBe(A)
  })

  it('withoutSwapState drops exactly the two swap fields and nothing else', () => {
    const slot: WorkoutExercise = {
      exerciseId: B,
      prescription: authoredA(),
      sets: [{ ...set(30, 8), setIndex: 0 }],
      substitutedForId: A,
      substituteLoad: loadB,
      skippedLevels: [1],
      customSlots: 1,
    }
    const plain = withoutSwapState(slot)
    expect('substitutedForId' in plain).toBe(false)
    expect('substituteLoad' in plain).toBe(false)
    expect(plain).toEqual({ exerciseId: B, prescription: slot.prescription, sets: slot.sets, skippedLevels: [1], customSlots: 1 })
    expect(slot.substitutedForId).toBe(A) // immutable
  })
})

describe('swapExercise: the write side of CC4', () => {
  it('a swap to a different exercise records what the slot was prescribed for, and the substitute load', () => {
    const swapped = swapExercise(started('w', '2026-07-17'), 0, B, loadB).exercises[0]
    expect(swapped.exerciseId).toBe(B)
    expect(swapped.substitutedForId).toBe(A)
    expect(swapped.substituteLoad).toEqual(loadB)
  })

  it('a genuine return leaves an unswapped slot: no substitutedForId, no substituteLoad', () => {
    const back = swapExercise(swapExercise(started('w', '2026-07-17'), 0, B, loadB), 0, A).exercises[0]
    expect(back.exerciseId).toBe(A)
    expect('substitutedForId' in back).toBe(false)
    expect('substituteLoad' in back).toBe(false)
  })

  it('a return through a second substitute (A -> B -> C -> A) is still a genuine return', () => {
    const c = 'incline-push-up'
    const w = swapExercise(swapExercise(swapExercise(started('w', '2026-07-17'), 0, B, loadB), 0, c), 0, A)
    expect('substitutedForId' in w.exercises[0]).toBe(false)
    expect(w.exercises[0].exerciseId).toBe(A)
  })

  it('a second substitute is still recorded against the authored exercise, not the first substitute', () => {
    const c = 'incline-push-up'
    const second = swapExercise(swapExercise(started('w', '2026-07-17'), 0, B, loadB), 0, c).exercises[0]
    expect(second.substitutedForId).toBe(A)
  })

  it('swapping to the exercise already in the slot changes nothing: no sets cleared, nothing recorded', () => {
    const logged = logLevels(started('w', '2026-07-17'), [[0, 14, 12]])
    expect(swapExercise(logged, 0, A)).toEqual(logged)
    const onB = swapExercise(started('w2', '2026-07-17'), 0, B, loadB)
    expect(swapExercise(onB, 0, B)).toEqual(onB)
  })

  it('does not mutate the workout it was given', () => {
    const before = logLevels(started('w', '2026-07-17'), [[0, 14, 12]])
    const snapshot = JSON.stringify(before)
    swapExercise(before, 0, B, loadB)
    expect(JSON.stringify(before)).toBe(snapshot)
  })
})

describe('swapExercise: what a swap resets (OD-f) and keeps (OD-d)', () => {
  it('resets skippedLevels and customSlots together with sets, on every swap', () => {
    let w = started('w', '2026-07-17')
    w = skipPrescribedLevel(w, 0, 3)
    w = addCustomSlot(w, 0)
    w = logLevels(w, [[0, 14, 12]])
    const swapped = swapExercise(w, 0, B, loadB).exercises[0]
    expect(swapped.sets).toEqual([])
    expect('skippedLevels' in swapped).toBe(false)
    expect('customSlots' in swapped).toBe(false)
    expect(workoutPosition(swapExercise(w, 0, B, loadB))).toEqual({ exerciseIndex: 0, setIndex: 0 })
  })

  it('keeps the sets a swap clears as a record, with the exercise they were performed as', () => {
    const w = logLevels(started('w', '2026-07-17'), [
      [0, 14, 12],
      [1, 16, 10],
    ])
    const swapped = swapExercise(w, 0, B, loadB).exercises[0]
    expect(swapped.sets).toEqual([])
    expect(swapped.priorAttempts).toEqual([{ exerciseId: A, sets: w.exercises[0].sets }])
  })

  it('appends, oldest first, across several swaps', () => {
    let w = logLevels(started('w', '2026-07-17'), [[0, 14, 12]])
    w = swapExercise(w, 0, B, loadB)
    w = logLevels(w, [[0, 30, 8]])
    w = swapExercise(w, 0, A)
    expect(w.exercises[0].priorAttempts?.map((attempt) => attempt.exerciseId)).toEqual([A, B])
    expect(w.exercises[0].priorAttempts?.[1].sets[0].weightKg).toBe(30)
  })

  it('writes nothing when no sets were logged: the field is absent, not empty', () => {
    const swapped = swapExercise(started('w', '2026-07-17'), 0, B, loadB).exercises[0]
    expect('priorAttempts' in swapped).toBe(false)
    // ...and a swap with nothing to add keeps the record that is already there.
    const logged = swapExercise(logLevels(started('w2', '2026-07-17'), [[0, 14, 12]]), 0, B, loadB)
    expect(swapExercise(logged, 0, A).exercises[0].priorAttempts).toHaveLength(1)
  })
})

describe('C1: a genuine swap back counts as the original, once it is complete', () => {
  it('A -> B -> A, every level of A logged: the next start carries from it', () => {
    let w = started('swapped-back', '2026-07-17')
    w = swapExercise(swapExercise(w, 0, B, loadB), 0, A)
    w = finish(
      logLevels(w, [
        [0, 24, 12],
        [1, 26, 10],
        [2, 28, 8],
        [3, 30, 6],
      ]),
    )
    expect(carriedWeights([w])).toEqual([24, 26, 28, 30])
  })

  it('a record stored before CC4 as "substituted for itself" is read the same way, with no migration', () => {
    const legacy: Workout = {
      ...started('legacy', '2026-07-17'),
      completedAt: '2026-07-17T10:30:00.000Z',
      exercises: [
        {
          exerciseId: A,
          prescription: authoredA(),
          substitutedForId: A,
          sets: [0, 1, 2, 3].map((i) => ({ ...set(24 + 2 * i, 12 - 2 * i), setIndex: i })),
        },
      ],
    }
    expect(isCarryBasisExposure(legacy.exercises[0])).toBe(true)
    expect(carriedWeights([legacy])).toEqual([24, 26, 28, 30])
  })

  it('a genuine substitute is still not a basis for the original', () => {
    let w = swapExercise(started('substituted', '2026-07-17'), 0, B, loadB)
    w = finish(logLevels(w, [[0, 40, 6], [1, 40, 6], [2, 40, 6], [3, 40, 6]]))
    expect(carriedWeights([w, earlierRealExposure()])).toEqual(EARLIER_WEIGHTS)
  })
})

describe('C2: a partly done original does not become eligible because the athlete switched back', () => {
  it('sets logged before the swap are a record, not the returned slot: one level after the return is incomplete', () => {
    let w = logLevels(started('partial', '2026-07-17'), [
      [0, 40, 12],
      [1, 40, 10],
      [2, 40, 8],
      [3, 40, 6],
    ])
    w = swapExercise(swapExercise(w, 0, B, loadB), 0, A)
    w = finish(logLevels(w, [[0, 24, 12]]))
    expect(w.exercises[0].sets).toHaveLength(1)
    expect(w.exercises[0].priorAttempts?.[0].sets).toHaveLength(4)
    // Levels 1-3 are neither logged nor skipped on the returned slot, so it is
    // not a complete exposure and carry resumes from the earlier real one.
    expect(mostRecentCompleteExposureFor([w, earlierRealExposure()], P, A)?.sets[0].weightKg).toBe(16)
    expect(carriedWeights([w, earlierRealExposure()])).toEqual(EARLIER_WEIGHTS)
  })

  it('a stored swapped-for-itself record that is partial stays out of carry too', () => {
    const partial: Workout = {
      ...started('partial-legacy', '2026-07-17'),
      completedAt: '2026-07-17T10:30:00.000Z',
      exercises: [
        {
          exerciseId: A,
          prescription: authoredA(),
          substitutedForId: A,
          sets: [0, 1].map((i) => ({ ...set(24 + 2 * i, 12 - 2 * i), setIndex: i })),
        },
      ],
    }
    expect(carriedWeights([partial, earlierRealExposure()])).toEqual(EARLIER_WEIGHTS)
  })
})

describe('C3 (OD-f): a level skipped on the substitute is not a skip of the original', () => {
  it('skip level 2 on B, swap back, log levels 0, 1 and 3: not complete, carry resumes from the earlier exposure', () => {
    let w = swapExercise(started('skip-on-b', '2026-07-17'), 0, B, loadB)
    w = skipPrescribedLevel(w, 0, 2)
    expect(w.exercises[0].skippedLevels).toEqual([2])
    w = swapExercise(w, 0, A)
    expect('skippedLevels' in w.exercises[0]).toBe(false)
    w = finish(
      logLevels(w, [
        [0, 24, 12],
        [1, 26, 10],
        [3, 30, 6],
      ]),
    )
    expect(mostRecentCompleteExposureFor([w, earlierRealExposure()], P, A)?.sets[0].weightKg).toBe(16)
    expect(carriedWeights([w, earlierRealExposure()])).toEqual(EARLIER_WEIGHTS)
  })

  it('the same three levels with level 2 skipped ON A are complete — the explicit-skip rule is untouched', () => {
    let w = started('skip-on-a', '2026-07-17')
    w = skipPrescribedLevel(w, 0, 2)
    w = finish(
      logLevels(w, [
        [0, 24, 12],
        [1, 26, 10],
        [3, 30, 6],
      ]),
    )
    expect(mostRecentCompleteExposureFor([w], P, A)).not.toBeNull()
  })
})

describe('C5: a final substitute keeps its logs under itself', () => {
  it("the original's carry resumes from its own last real exposure, and the substitute's own slot never reads the swap", () => {
    let w = swapExercise(started('final-sub', '2026-07-17'), 0, B, loadB)
    // Values and reps unlike B's own rungs (30..36 x 8): a swap that leaked
    // into B's carry would show.
    w = finish(logLevels(w, [[0, 50, 5], [1, 50, 5], [2, 50, 5], [3, 50, 5]]))
    expect(w.exercises[0].exerciseId).toBe(B)
    expect(carriedWeights([w, earlierRealExposure()])).toEqual(EARLIER_WEIGHTS)
    const [carriedB] = carrySessionForward([authoredB()], [w], P)
    expect(carriedB).toEqual(authoredB())
  })
})

describe('priorAttempts is a record only (OD-d)', () => {
  /** A slot that did real work as A, was swapped to B, and was never performed as B. */
  function recordOnly(id: string, date: string): Workout {
    const w = logLevels(started(id, date), [
      [0, 40, 12],
      [1, 40, 10],
      [2, 40, 8],
      [3, 40, 6],
    ])
    return finish(swapExercise(w, 0, B, loadB))
  }
  const incline: Exercise = { id: A, muscles: ['chest'], equipment: ['dumbbell', 'bench'], substitutionIds: [], isUnilateral: false }

  it('is not a position: the swapped slot is offered from its first level', () => {
    const w = swapExercise(logLevels(started('w', '2026-07-17'), [[0, 40, 12], [1, 40, 10]]), 0, B, loadB)
    expect(workoutPosition(w)).toEqual({ exerciseIndex: 0, setIndex: 0 })
  })

  it('is not in the summary totals', () => {
    expect(summarizeWorkout(recordOnly('w', '2026-07-17'))).toMatchObject({ totalSets: 0, volumeKg: 0 })
  })

  it('is not "Last time", for the exercise it was performed as or for the one it became', () => {
    const history = [recordOnly('w', '2026-07-17')]
    expect(previousSetsFor(history, A)).toEqual([])
    expect(previousSetsFor(history, B)).toEqual([])
  })

  it('is not a carry basis', () => {
    expect(mostRecentCompleteExposureFor([recordOnly('w', '2026-07-17')], P, A)).toBeNull()
    expect(carriedWeights([recordOnly('w', '2026-07-17')])).toEqual(AUTHORED_WEIGHTS)
  })

  it('is not a weight suggestion', () => {
    expect(lastEligibleExposureFor([recordOnly('w', '2026-07-17')], P, A)).toBeNull()
    expect(lastEligibleExposureFor([recordOnly('w', '2026-07-17')], P, B)).toBeNull()
  })

  const threeRecordOnly = () => ['2026-07-03', '2026-07-10', '2026-07-17'].map((date) => recordOnly(`r-${date}`, date))
  // The instrument can see a session when the same work is in `sets`:
  const threeReal = () =>
    ['2026-07-03', '2026-07-10', '2026-07-17'].map((date) => finish(logLevels(started(`real-${date}`, date), [[0, 40, 12]])))

  it('is not a data point in the strength trend', () => {
    expect(strengthTrend(A, threeRecordOnly()).status).toBe('insufficient-data')
    expect(strengthTrend(A, threeReal()).status).not.toBe('insufficient-data')
  })

  it('is not a data point in stagnation', () => {
    expect(detectStagnation(incline, threeRecordOnly()).status).toBe('insufficient-data')
    expect(detectStagnation(incline, threeReal()).status).not.toBe('insufficient-data')
  })
})
