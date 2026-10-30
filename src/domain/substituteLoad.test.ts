import { describe, expect, it } from 'vitest'
import { seedExercises } from '@/data/seed/exercises'
import { lastEligibleExposureFor } from './historyEligibility'
import {
  implementStepKg,
  loadImplementOf,
  substituteLoadFor,
  suggestedWeightsFor,
  type LoadImplement,
} from './substituteLoad'
import { completeWorkout, createWorkout, logSet } from './workout'
import type { Exercise, LadderPrescription, Program, SubstituteLoad, Workout } from './types'

/**
 * Substitution start. Track A Phase 2.3 (coach Q4) made a swap's load its own;
 * the stopgap of 29 Oct 16:53 blanked it ("every swap starts with a blank weight
 * until the coach's set-by-set rule is built"); Phase 2b.1 builds that rule
 * (coach CQ1-CQ4, CC1-CC3). A loaded substitute is offered, per set, the weight
 * at the same position of **its own** most recent eligible exposure
 * (`suggestedWeightsFor`, over the layers in `historyEligibility.ts`) and
 * nothing where there is none: never the slot's rung, never a neighbouring
 * rung, never the weight just lifted. An unloaded one stays unloaded; both step
 * in their own implement's increment. The only swap with no `SubstituteLoad` is
 * the swap back to the authored exercise. This file is the domain half;
 * `SetScreen.substitute.test.tsx` is the screen half.
 *
 * Negative controls, Phase 2b.1, run 29 Oct. Each mutation was applied to the
 * source, the five files run together (this file, `nextSetTarget.test`,
 * `workout.test`, `SetScreen.substitute.test`, `WorkoutPage.swapOther.test`:
 * 224 tests), and the source restored
 * byte-for-byte (`cmp` against the pre-mutation copy). They ran against the
 * finished 2b.1 tree, so each is traced through the code as it is after the
 * change. Test names are shortened to their id; "the screen" is
 * `SetScreen.substitute.test.tsx`.
 *
 * The layers in `historyEligibility.ts`
 *   L1: drop the easier-day clause (`readiness?.tier !== 'easier'`)
 *                                       -> E3 and, on the screen, E3 + E13 (2 red)
 *   L1: drop `completedAt !== null`     -> "L1: an unfinished workout is skipped"
 *                                          (1 red; no screen test can see it)
 *   L3: drop `programId === programId`  -> E4, "L3 walks back past another
 *                                          program", "history of another program
 *                                          is not eligible (CC2)", and on the
 *                                          screen E4 and the OD-e "nothing
 *                                          eligible" test (5 red)
 *   L4: drop the `substituteLoad` clause (own identity = not a substitute)
 *                                       -> E5 "a substitute record logged under
 *                                          the new rules is eligible", "a valid
 *                                          later bench log builds the bench its
 *                                          own history", and on the screen E5
 *                                          (3 red). NOT E6: see "prescribed
 *                                          control" below.
 *   L4: Reading A, own identity =
 *     `substitutedForId === undefined`  -> the E5 eligible case, the E5 stored
 *                                          swap-back case, "a valid later bench
 *                                          log", and on the screen E5 (4 red)
 *   L4: a swap-back record
 *     (`substitutedForId === exerciseId`) counted as a substitute
 *                                       -> the E5 stored swap-back case only
 *                                          (1 red; the F4 shape, which no screen
 *                                          test reaches)
 *   L4: drop it altogether              -> E5 "a legacy substitute record is
 *                                          ineligible", E6 (the 24 Oct bench,
 *                                          20 kg x 4), "the 24 Oct swapped bench
 *                                          does not seed the next barbell bench",
 *                                          and on the screen T25b (4 red)
 *   L5: drop `hasAWeight`               -> "L5: an exposure with no weight at
 *                                          all is skipped" (1 red)
 *   L2: ignore the hook                 -> "a flagged exposure is skipped and the
 *                                          walk continues" (1 red)
 *   the date / completion-time sort removed
 *                                       -> E1, E12, "basis", "newest by date,
 *                                          then by completion time", and the L2
 *                                          hook test (5 red)
 *
 * `suggestedWeightsFor` and `substituteLoadFor`
 *   E1b: the last set's weight for every position
 *                                       -> E1, E12, "a skipped level", "a set
 *                                          logged with no weight", E3, "a valid
 *                                          later bench", E7, "a loaded substitute
 *                                          with history is offered its own
 *                                          weights", and on the screen T21,
 *                                          basis, E2, E3 + E13, E5, T26, T24
 *                                          (15 red)
 *   E12: walk back per position, filling a gap from an older exposure. The count
 *     depends on WHICH eligibility layers that walk reuses, so it is named (run 30
 *     Oct, the whole suite; positions 0-3, nearest older exposure first):
 *       (a) the older exposures are the same program and completed only (the form
 *           recorded on 29 Oct: no easier-day check, no L4, no L5)
 *                                       -> E12 and "a valid later bench" (2 red)
 *       (b) L1 in full, L3 and L5 kept, L4 skipped
 *                                       -> the same two (2 red)
 *       (c) L1, L3, L4 and L5 all kept (only an own-identity record can fill a gap)
 *                                       -> E12 only (1 red): the walk then ignores
 *                                          the excluded legacy bench, so "a valid
 *                                          later bench" stays green
 *     Other forms red more or fewer: the independent check of c731222 reported 1,
 *     2 and 6 for different walks. None of them is the shipped rule; (c) is the
 *     nearest to it.
 *   `basis` omitted                     -> "basis names the exposure", E7, "with
 *                                          history ... the exposure is recorded",
 *                                          and on the screen the basis test
 *                                          (4 red)
 *   E7: restore the old `from === to` early return
 *                                       -> E8, E7, "bodyweight -> bodyweight stays
 *                                          unloaded", and on the screen T24, E7,
 *                                          T25, and the same-implement increment
 *                                          test (7 red)
 *   E9: drop `authored.id === substitute.id`
 *                                       -> E9 and, on the screen, T26 (2 red; it
 *                                          is the only thing that returns
 *                                          `undefined`)
 *   `programId` not threaded (`''` in `handleSwap`, WorkoutPage.tsx)
 *                                       -> on the screen T21, basis, E2,
 *                                          E3 + E13, E5, T26, T24 (7 red); no
 *                                          domain test can see it
 *   E10: the Stepper's `step` read from the slot, not the substitute
 *                                       -> on the screen T23 and both increment
 *                                          tests (3 red)
 *   E13: "Last time" routed through L1  -> on the screen E3 + E13 only (1 red)
 *
 * **A prescribed control that could not go red.** Plan rev 2 §7 E5 prescribes
 * "drop the `substituteLoad` clause -> E6 red". It cannot: dropping that clause
 * makes MORE records ineligible, and E6 asserts that the legacy 24 Oct bench is
 * ineligible, so E6 stays green. The defect is real and is seen, by the E5
 * "eligible" case and by "a valid later bench" (above), which are the tests that
 * ask for a record to count. The control as written would have read as "no
 * defect here".
 *
 * Recorded at 2.3 / the stopgap (29 Oct), NOT re-run in 2b.1. The code they
 * touch is unchanged by 2b.1, except the unloaded branch, which now also returns
 * `startWeightsKg: []`:
 *   pin table
 *     add an unlisted Library entry     -> "classifies every Library exercise,
 *                                          and nothing else" and "<id> is
 *                                          classified as the table says",
 *                                          naming the new id
 *     precedence order reversed, so
 *     `machine` beats `barbell`         -> "barbell-squat is classified as the
 *                                          table says" and "the barbell wins
 *                                          when an entry also carries a machine tag"
 *   implementStepKg
 *     drop step 1 (own prescription)    -> "the program's own prescription of
 *                                          the substitute wins ..."
 *     `size === 1` becomes `size >= 1`  -> "an implement with two different
 *                                          steps has no step"
 *     return the dumbbell step (a constant 2) instead of reading the
 *     program                           -> "a barbell substitute steps in the
 *                                          program's barbell increment" and six more
 *   substituteLoadFor
 *     the unloaded branch removed       -> "an unloaded substitute ..."
 *   Library lists
 *     remove 'inverted-row' from the
 *     single-arm row's list             -> "single-arm-db-row offers
 *                                          inverted-row ..." (and the screen's T19)
 *
 * Tests that guard a function this phase deleted (`lastLoggedWeightKg`: "the
 * last non-null weight", "does not walk past an exposure that logged no weight")
 * went with it; `suggestedWeightsFor`'s tests replace them.
 */

// ---------------------------------------------------------------------------
// The pin table — every Library exercise's load implement, stated.
// ---------------------------------------------------------------------------

/**
 * Written out id by id rather than computed, so that a new Library entry (or a
 * changed equipment tag) fails here until somebody decides what it is. The
 * class is *derived* from the tags in `loadImplementOf`; this table is the
 * independent statement the derivation is held to. `barbell-squat` carries two
 * load tags (`barbell`, `machine`) and is the one entry precedence decides.
 */
const LOAD_IMPLEMENT_BY_ID: Record<string, LoadImplement | null> = {
  // dumbbell
  'goblet-squat': 'dumbbell',
  'split-squat': 'dumbbell',
  'db-floor-press': 'dumbbell',
  'dumbbell-bench-press': 'dumbbell',
  'incline-dumbbell-press': 'dumbbell',
  'single-arm-db-row': 'dumbbell',
  'single-leg-rdl': 'dumbbell',
  'dumbbell-rdl': 'dumbbell',
  'bulgarian-split-squat': 'dumbbell',
  'single-arm-db-press': 'dumbbell',
  'dumbbell-shoulder-press': 'dumbbell',
  'hip-thrust': 'dumbbell',
  'rear-delt-fly': 'dumbbell',
  'dumbbell-fly': 'dumbbell',
  'dumbbell-pullover': 'dumbbell',
  'chest-supported-row': 'dumbbell',
  'standing-calf-raise': 'dumbbell',
  'dumbbell-lateral-raise': 'dumbbell',
  'dumbbell-curl': 'dumbbell',
  'overhead-triceps-extension': 'dumbbell',
  'hammer-curl': 'dumbbell',
  'dumbbell-rowboat': 'dumbbell',
  'russian-twist': 'dumbbell',
  'dumbbell-squeeze-press': 'dumbbell',
  'reverse-lunge': 'dumbbell',
  // barbell
  'bench-press': 'barbell',
  'bent-over-row': 'barbell',
  'romanian-deadlift': 'barbell',
  'overhead-press': 'barbell',
  'barbell-squat': 'barbell',
  'barbell-hip-thrust': 'barbell',
  'barbell-curl': 'barbell',
  // machine
  'cable-row': 'machine',
  'lat-pulldown': 'machine',
  // unloaded: body weight, band, parallel bars, a bench on its own
  'tempo-bodyweight-squat': null,
  'deficit-push-up': null,
  'band-row': null,
  'single-leg-hip-thrust': null,
  'band-pull-apart': null,
  'band-lateral-raise': null,
  'band-curl': null,
  'dead-bug': null,
  'side-plank': null,
  'push-up': null,
  'hamstring-walkout': null,
  'bird-dog': null,
  'incline-push-up': null,
  'scapular-push-up': null,
  'wall-slide': null,
  'bodyweight-squat': null,
  'glute-bridge': null,
  'bicycle-crunch': null,
  plank: null,
  'mountain-climber': null,
  'bodyweight-hip-hinge': null,
  'wall-angel': null,
  'ninety-ninety-breathing': null,
  'parallel-bar-dip': null,
  'inverted-row': null,
  'supported-knee-raise': null,
}

describe('loadImplementOf — the pin table', () => {
  it('classifies every Library exercise, and nothing else', () => {
    // A new Library entry fails here, naming it, until it is classified above.
    const libraryIds = seedExercises.map((exercise) => exercise.id).sort()
    expect(Object.keys(LOAD_IMPLEMENT_BY_ID).sort()).toEqual(libraryIds)
  })

  it.each(seedExercises.map((exercise) => [exercise.id, exercise] as const))(
    '%s is classified as the table says',
    (id, exercise) => {
      expect(loadImplementOf(exercise)).toBe(LOAD_IMPLEMENT_BY_ID[id])
    },
  )

  it('the barbell wins when an entry also carries a machine tag (barbell-squat), in either tag order', () => {
    expect(loadImplementOf({ equipment: ['barbell', 'machine'] })).toBe('barbell')
    expect(loadImplementOf({ equipment: ['machine', 'barbell'] })).toBe('barbell')
  })

  it('a bench or parallel bars alone is not a load implement', () => {
    expect(loadImplementOf({ equipment: ['bench'] })).toBeNull()
    expect(loadImplementOf({ equipment: ['parallel-bars'] })).toBeNull()
    expect(loadImplementOf({ equipment: ['bench', 'bodyweight'] })).toBeNull()
  })
})

describe('the Library lists the inverted row both ways (coach Q1)', () => {
  const byId = new Map(seedExercises.map((exercise) => [exercise.id, exercise]))

  it('single-arm-db-row offers inverted-row, and inverted-row offers it back', () => {
    expect(byId.get('single-arm-db-row')?.substitutionIds).toContain('inverted-row')
    expect(byId.get('inverted-row')?.substitutionIds).toContain('single-arm-db-row')
  })
})

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const exerciseById: ReadonlyMap<string, Exercise> = new Map(seedExercises.map((e) => [e.id, e]))
const exercise = (id: string): Exercise => {
  const found = exerciseById.get(id)
  if (!found) throw new Error(`no Library exercise ${id}`)
  return found
}

function ladder(exerciseId: string, weightStepKg: number | null, maxWeightKg: number | null = null): LadderPrescription {
  return {
    exerciseId,
    sets: 2,
    mode: 'reps',
    restSeconds: 90,
    perSide: false,
    setPlan: [
      { weightKg: weightStepKg === null ? null : 10, reps: 10 },
      { weightKg: weightStepKg === null ? null : 12, reps: 8 },
    ],
    maxWeightKg,
    weightStepKg,
  }
}

function program(items: LadderPrescription[]): Program {
  return {
    id: 'synthetic',
    name: 'Synthetic',
    phase: 1,
    startDate: '2026-10-01',
    endDate: null,
    trainingWeekdays: [1],
    rotation: ['s'],
    sessions: [{ id: 's', name: 'S', focus: 'F', items }],
  }
}

const P = 'p1'

interface CompletedOptions {
  completedAt?: string | null
  programId?: string
  /** 'easier' makes it an easier day. */
  tier?: 'ready' | 'steady' | 'easier'
  /** As recorded under a swap. */
  substitutedForId?: string
  substituteLoad?: SubstituteLoad
  /** The `setIndex` of each logged weight, for a skipped level (default 0, 1, 2 ...). */
  setIndexes?: number[]
}

/** A completed workout that logged `weights` (reps 10 each) against `exerciseId`. */
function completed(
  id: string,
  date: string,
  exerciseId: string,
  weights: (number | null)[],
  options: CompletedOptions = {},
): Workout {
  let workout = createWorkout({
    id,
    programId: options.programId ?? P,
    session: { id: 's', name: 'S', focus: 'F', items: [ladder(exerciseId, 2)] },
    date,
    startedAt: `${date}T09:00:00.000Z`,
  })
  weights.forEach((weightKg, index) => {
    workout = logSet(
      workout,
      0,
      { weightKg, reps: 10, seconds: null, completedAt: `${date}T09:1${index}:00.000Z` },
      options.setIndexes?.[index] ?? index,
    )
  })
  if (options.substitutedForId !== undefined || options.substituteLoad !== undefined) {
    workout = {
      ...workout,
      exercises: workout.exercises.map((e) => ({
        ...e,
        ...(options.substitutedForId !== undefined ? { substitutedForId: options.substitutedForId } : {}),
        ...(options.substituteLoad !== undefined ? { substituteLoad: options.substituteLoad } : {}),
      })),
    }
  }
  if (options.tier !== undefined) workout = { ...workout, readiness: { tier: options.tier, drivers: [] } }
  const completedAt = options.completedAt === undefined ? `${date}T10:00:00.000Z` : options.completedAt
  return completedAt === null ? workout : completeWorkout(workout, completedAt)
}

// ---------------------------------------------------------------------------
// implementStepKg — the step source (every M2 step is 2, so only a synthetic
// program can tell a correct source from the slot's step).
// ---------------------------------------------------------------------------

describe('implementStepKg', () => {
  // A dumbbell slot steps in 2; the barbell this program uses steps in 2.5.
  const mixed = program([ladder('goblet-squat', 2), ladder('bent-over-row', 2.5)])

  it('a barbell substitute steps in the program\'s barbell increment, not the dumbbell slot\'s', () => {
    expect(implementStepKg(mixed, exerciseById, 'barbell', 'bent-over-row')).toBe(2.5)
  })

  it("the program's own prescription of the substitute wins over the implement's other steps", () => {
    // Two barbell lifts with different steps: the substitute's own is 2.5.
    const two = program([ladder('bent-over-row', 2.5), ladder('overhead-press', 5)])
    expect(implementStepKg(two, exerciseById, 'barbell', 'bent-over-row')).toBe(2.5)
    expect(implementStepKg(two, exerciseById, 'barbell', 'overhead-press')).toBe(5)
  })

  it('an unprescribed substitute takes the one step the program uses for that implement', () => {
    // romanian-deadlift is not in `mixed`; the only barbell step there is 2.5.
    expect(implementStepKg(mixed, exerciseById, 'barbell', 'romanian-deadlift')).toBe(2.5)
  })

  it('an implement with two different steps has no step', () => {
    const two = program([ladder('bent-over-row', 2.5), ladder('overhead-press', 5)])
    expect(implementStepKg(two, exerciseById, 'barbell', 'romanian-deadlift')).toBeNull()
  })

  it('an implement the program never uses has no step, and neither does no program at all', () => {
    expect(implementStepKg(mixed, exerciseById, 'machine', 'lat-pulldown')).toBeNull()
    expect(implementStepKg(undefined, exerciseById, 'barbell', 'bent-over-row')).toBeNull()
  })

  it('an unloaded prescription (step null) contributes nothing', () => {
    const withBodyweight = program([ladder('inverted-row', null), ladder('goblet-squat', 2)])
    expect(implementStepKg(withBodyweight, exerciseById, 'dumbbell', 'single-arm-db-row')).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// suggestedWeightsFor — one eligible exposure, positional (CQ2, CQ3, CC1-CC3)
// ---------------------------------------------------------------------------

/** The `SubstituteLoad` an exposure carries once it was logged under the new rules (CC1, Reading B). */
const LOGGED_UNDER_THE_NEW_RULES: SubstituteLoad = { loaded: true, startWeightsKg: [], stepKg: 2 }

describe('suggestedWeightsFor', () => {
  it('E1: the weight at each position of the most recent exposure, matched by position', () => {
    const history = [
      completed('old', '2026-10-10', 'bent-over-row', [10, 12]),
      completed('new', '2026-10-17', 'bent-over-row', [17.75, 21.75, 25.75, 29.75]),
    ]
    expect(suggestedWeightsFor(history, P, 'bent-over-row').startWeightsKg).toEqual([17.75, 21.75, 25.75, 29.75])
  })

  it('E12: one exposure, never a mixture — the newest eligible [12, 14] beats an older [10, 12, 14, 16]', () => {
    const history = [
      completed('older', '2026-10-10', 'bent-over-row', [10, 12, 14, 16]),
      completed('newer', '2026-10-17', 'bent-over-row', [12, 14]),
    ]
    // Positions 2 and 3 are not borrowed from the older exposure.
    expect(suggestedWeightsFor(history, P, 'bent-over-row').startWeightsKg).toEqual([12, 14])
  })

  it('a skipped level is a gap in the positions, not a shift of them', () => {
    // Level 1 skipped: sets 0 and 2 were logged.
    const history = [completed('h', '2026-10-17', 'bent-over-row', [17.75, 25.75], { setIndexes: [0, 2] })]
    expect(suggestedWeightsFor(history, P, 'bent-over-row').startWeightsKg).toEqual([17.75, null, 25.75])
  })

  it('a set logged with no weight is a gap too: no suggestion for that position', () => {
    const history = [completed('h', '2026-10-17', 'bent-over-row', [17.75, null, 25.75])]
    expect(suggestedWeightsFor(history, P, 'bent-over-row').startWeightsKg).toEqual([17.75, null, 25.75])
  })

  it('E3 (L1): a newer easier-day exposure is skipped for the older normal one', () => {
    const history = [
      completed('normal', '2026-10-10', 'bent-over-row', [17.75, 21.75]),
      completed('easier', '2026-10-17', 'bent-over-row', [9.75, 11.75], { tier: 'easier' }),
    ]
    expect(suggestedWeightsFor(history, P, 'bent-over-row').startWeightsKg).toEqual([17.75, 21.75])
  })

  it('a ready or steady day is a normal day', () => {
    const history = [completed('w', '2026-10-17', 'bent-over-row', [17.75], { tier: 'ready' })]
    expect(suggestedWeightsFor(history, P, 'bent-over-row').startWeightsKg).toEqual([17.75])
  })

  it('L1: an unfinished workout is skipped', () => {
    const history = [
      completed('done', '2026-10-10', 'bent-over-row', [17.75]),
      completed('open', '2026-10-17', 'bent-over-row', [40], { completedAt: null }),
    ]
    expect(suggestedWeightsFor(history, P, 'bent-over-row').startWeightsKg).toEqual([17.75])
  })

  it('E4 (L3): another program\'s history is not used, even the newest and only (Phase 1 only)', () => {
    const history = [completed('phase1', '2026-10-17', 'bent-over-row', [8, 10, 12], { programId: 'phase-1-home' })]
    expect(suggestedWeightsFor(history, P, 'bent-over-row')).toEqual({ startWeightsKg: [] })
  })

  it('L3 walks back past another program to this one', () => {
    const history = [
      completed('mine', '2026-10-10', 'bent-over-row', [17.75]),
      completed('theirs', '2026-10-17', 'bent-over-row', [8], { programId: 'phase-1-home' }),
    ]
    expect(suggestedWeightsFor(history, P, 'bent-over-row').startWeightsKg).toEqual([17.75])
  })

  it('L5: an exposure with no weight at all is skipped for an older one that has some', () => {
    const history = [
      completed('older', '2026-10-10', 'bent-over-row', [17.75]),
      completed('blank', '2026-10-17', 'bent-over-row', [null, null]),
    ]
    expect(suggestedWeightsFor(history, P, 'bent-over-row').startWeightsKg).toEqual([17.75])
  })

  it('ignores another exercise, and no history at all gives nothing and no basis', () => {
    const history = [completed('other', '2026-10-17', 'overhead-press', [30])]
    expect(suggestedWeightsFor(history, P, 'bent-over-row')).toEqual({ startWeightsKg: [] })
    expect(suggestedWeightsFor([], P, 'bent-over-row')).toEqual({ startWeightsKg: [] })
  })

  describe('L4: an own-identity record (CC1, Reading B)', () => {
    it('E5: a legacy substitute record is ineligible', () => {
      const legacy = completed('legacy', '2026-10-17', 'bent-over-row', [30], { substitutedForId: 'single-arm-db-row' })
      expect(suggestedWeightsFor([legacy], P, 'bent-over-row').startWeightsKg).toEqual([])
    })

    it('E5: a substitute record logged under the new rules (it carries a substituteLoad) is eligible', () => {
      const valid = completed('valid', '2026-10-17', 'bent-over-row', [30], {
        substitutedForId: 'single-arm-db-row',
        substituteLoad: LOGGED_UNDER_THE_NEW_RULES,
      })
      expect(suggestedWeightsFor([valid], P, 'bent-over-row').startWeightsKg).toEqual([30])
    })

    it("E5: a stored swap-back record (substitutedForId === its own exercise) is the exercise's own", () => {
      const swappedBack = completed('back', '2026-10-17', 'bent-over-row', [30], { substitutedForId: 'bent-over-row' })
      expect(suggestedWeightsFor([swappedBack], P, 'bent-over-row').startWeightsKg).toEqual([30])
    })

    it('E6: the 24 Oct bench (a legacy swapped record, clamped at 20) gives nothing', () => {
      const oct24 = completed('oct24', '2026-10-24', 'bench-press', [20, 20, 20, 20], { substitutedForId: 'dumbbell-bench-press' })
      expect(suggestedWeightsFor([oct24], P, 'bench-press')).toEqual({ startWeightsKg: [] })
    })

    it('a valid later bench log builds the bench its own history, next to the excluded one', () => {
      const oct24 = completed('oct24', '2026-10-24', 'bench-press', [20, 20, 20, 20], { substitutedForId: 'dumbbell-bench-press' })
      const later = completed('nov', '2026-11-03', 'bench-press', [27.75, 29.75], {
        substitutedForId: 'dumbbell-bench-press',
        substituteLoad: LOGGED_UNDER_THE_NEW_RULES,
      })
      expect(suggestedWeightsFor([oct24, later], P, 'bench-press').startWeightsKg).toEqual([27.75, 29.75])
    })
  })

  it('basis names the exposure the weights came from', () => {
    const history = [
      completed('older', '2026-10-10', 'bent-over-row', [10]),
      completed('newer', '2026-10-17', 'bent-over-row', [17.75]),
    ]
    expect(suggestedWeightsFor(history, P, 'bent-over-row').basis).toEqual({ workoutId: 'newer', date: '2026-10-17' })
  })

  it('newest by date, then by completion time, whatever order the history arrives in', () => {
    const early = completed('early', '2026-10-17', 'bent-over-row', [10], { completedAt: '2026-10-17T08:00:00.000Z' })
    const late = completed('late', '2026-10-17', 'bent-over-row', [20], { completedAt: '2026-10-17T18:00:00.000Z' })
    expect(suggestedWeightsFor([early, late], P, 'bent-over-row').startWeightsKg).toEqual([20])
    expect(suggestedWeightsFor([late, early], P, 'bent-over-row').startWeightsKg).toEqual([20])
  })

  it('does not reorder or mutate the history it is given', () => {
    const history = [
      completed('b', '2026-10-17', 'bent-over-row', [20]),
      completed('a', '2026-10-10', 'bent-over-row', [10]),
    ]
    const before = history.map((workout) => workout.id)
    suggestedWeightsFor(history, P, 'bent-over-row')
    expect(history.map((workout) => workout.id)).toEqual(before)
  })
})

describe('lastEligibleExposureFor: the L2 hook', () => {
  it('a flagged exposure is skipped and the walk continues to the next eligible one', () => {
    const history = [
      completed('older', '2026-10-10', 'bent-over-row', [17.75]),
      completed('flagged', '2026-10-17', 'bent-over-row', [20]),
    ]
    const flagged = (workout: Workout) => workout.id === 'flagged'
    expect(lastEligibleExposureFor(history, P, 'bent-over-row', (workout) => flagged(workout))?.workout.id).toBe('older')
    // And with nothing flagged (the default), the newest wins.
    expect(lastEligibleExposureFor(history, P, 'bent-over-row')?.workout.id).toBe('flagged')
  })
})

// ---------------------------------------------------------------------------
// substituteLoadFor
// ---------------------------------------------------------------------------

describe('substituteLoadFor', () => {
  const base = {
    program: program([ladder('goblet-squat', 2), ladder('bent-over-row', 2.5)]),
    exerciseById,
    history: [] as Workout[],
    programId: P,
  }

  it('E8: a different movement on the same implement with no history of its own starts blank, in its own increment (CQ4)', () => {
    expect(
      substituteLoadFor({ ...base, authored: exercise('dumbbell-bench-press'), substitute: exercise('dumbbell-lateral-raise') }),
    ).toEqual({ loaded: true, startWeightsKg: [], stepKg: 2 })
  })

  it("E7: a same-implement swap takes the substitute's OWN history, not the slot's (incline press after the dumbbell bench)", () => {
    const history = [completed('h', '2026-10-17', 'incline-dumbbell-press', [14, 16, 18])]
    expect(
      substituteLoadFor({ ...base, history, authored: exercise('dumbbell-bench-press'), substitute: exercise('incline-dumbbell-press') }),
    ).toEqual({ loaded: true, startWeightsKg: [14, 16, 18], stepKg: 2, basis: { workoutId: 'h', date: '2026-10-17' } })
  })

  it('bodyweight -> bodyweight stays unloaded', () => {
    expect(
      substituteLoadFor({ ...base, authored: exercise('parallel-bar-dip'), substitute: exercise('incline-push-up') }),
    ).toEqual({ loaded: false, startWeightsKg: [], stepKg: null })
  })

  it('E9: swapping back to the authored exercise has no substitute load', () => {
    expect(
      substituteLoadFor({ ...base, authored: exercise('single-arm-db-row'), substitute: exercise('single-arm-db-row') }),
    ).toBeUndefined()
  })

  it('an unloaded substitute of a loaded slot has no weight, no suggestion and no step, whatever history exists', () => {
    const history = [completed('h', '2026-10-17', 'inverted-row', [5])]
    expect(
      substituteLoadFor({ ...base, history, authored: exercise('single-arm-db-row'), substitute: exercise('inverted-row') }),
    ).toEqual({ loaded: false, startWeightsKg: [], stepKg: null })
  })

  it('a loaded substitute with no history starts from nothing, in its own increment', () => {
    // Single-arm DB row -> barbell bent-over row: the slot's dumbbell step is 2, the barbell's 2.5.
    expect(
      substituteLoadFor({ ...base, authored: exercise('single-arm-db-row'), substitute: exercise('bent-over-row') }),
    ).toEqual({ loaded: true, startWeightsKg: [], stepKg: 2.5 })
  })

  it('a loaded substitute with history is offered its own weights, set by set, and the exposure is recorded', () => {
    const history = [completed('h', '2026-10-17', 'bent-over-row', [17.75, 21.75, 25.75, 29.75])]
    expect(
      substituteLoadFor({ ...base, history, authored: exercise('single-arm-db-row'), substitute: exercise('bent-over-row') }),
    ).toEqual({
      loaded: true,
      startWeightsKg: [17.75, 21.75, 25.75, 29.75],
      stepKg: 2.5,
      basis: { workoutId: 'h', date: '2026-10-17' },
    })
  })

  it("history of another program is not eligible: the swap is made in this workout's program (CC2)", () => {
    const history = [completed('phase1', '2026-10-17', 'bent-over-row', [8, 10, 12], { programId: 'phase-1-home' })]
    expect(
      substituteLoadFor({ ...base, history, authored: exercise('single-arm-db-row'), substitute: exercise('bent-over-row') }),
    ).toEqual({ loaded: true, startWeightsKg: [], stepKg: 2.5 })
  })

  it('the 24 Oct swapped bench (20 kg x 4, a legacy record) does not seed the next barbell bench', () => {
    const oct24 = completed('oct24', '2026-10-24', 'bench-press', [20, 20, 20, 20], { substitutedForId: 'dumbbell-bench-press' })
    expect(
      substituteLoadFor({ ...base, history: [oct24], authored: exercise('dumbbell-bench-press'), substitute: exercise('bench-press') }),
    ).toEqual({ loaded: true, startWeightsKg: [], stepKg: 2.5 })
  })

  it('an unloaded slot swapped to a loaded exercise offers the control, suggesting only from that exercise\'s own history', () => {
    // Inverted row -> single-arm DB row.
    expect(
      substituteLoadFor({ ...base, authored: exercise('inverted-row'), substitute: exercise('single-arm-db-row') }),
    ).toEqual({ loaded: true, startWeightsKg: [], stepKg: 2 })
  })

  it('never writes the retired single start weight', () => {
    const history = [completed('h', '2026-10-17', 'bent-over-row', [17.75])]
    const load = substituteLoadFor({ ...base, history, authored: exercise('single-arm-db-row'), substitute: exercise('bent-over-row') })
    expect(load).not.toHaveProperty('startWeightKg')
  })
})
