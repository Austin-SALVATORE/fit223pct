import { describe, expect, it } from 'vitest'
import { seedExercises } from '@/data/seed/exercises'
import {
  implementStepKg,
  lastLoggedWeightKg,
  loadImplementOf,
  substituteLoadFor,
  type LoadImplement,
} from './substituteLoad'
import { completeWorkout, createWorkout, logSet } from './workout'
import type { Exercise, LadderPrescription, Program, Workout } from './types'

/**
 * Cross-implement substitution start (coach Q4, option b; Track A Phase 2.3).
 * A substitute never inherits another implement's load: it starts from its own
 * last logged weight, or from nothing, and steps in its own implement's
 * increment. This file is the domain half; `SetScreen.substitute.test.tsx` is
 * the screen half.
 *
 * Negative controls, run 29 Oct (mutation applied, this file and its
 * neighbours run, restored byte-for-byte):
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
 *   lastLoggedWeightKg
 *     take the first non-null weight    -> "is the last non-null weight ...",
 *                                          "the last non-null weight — not the
 *                                          first, not the heaviest", "skips a
 *                                          trailing set ..."
 *     walk past a null-weight exposure  -> "does not walk past an exposure that
 *                                          logged no weight at all"
 *   substituteLoadFor
 *     treat every swap as incompatible
 *     (drop `from === to`)              -> "a same-implement swap keeps the
 *                                          slot's loads"
 *   Library lists
 *     remove 'inverted-row' from the
 *     single-arm row's list             -> "single-arm-db-row offers
 *                                          inverted-row ..." (and the screen's T19)
 * A swap back to the authored exercise has no control of its own: it is the
 * same-class case, covered by the line above and by
 * "swapping back to the authored exercise ..." below.
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

/** A completed workout that logged `weights` (reps 10 each) against `exerciseId`. */
function completed(
  id: string,
  date: string,
  exerciseId: string,
  weights: (number | null)[],
  overrides: { completedAt?: string | null } = {},
): Workout {
  let workout = createWorkout({
    id,
    programId: 'any-program',
    session: { id: 's', name: 'S', focus: 'F', items: [ladder(exerciseId, 2)] },
    date,
    startedAt: `${date}T09:00:00.000Z`,
  })
  weights.forEach((weightKg, index) => {
    workout = logSet(
      workout,
      0,
      { weightKg, reps: 10, seconds: null, completedAt: `${date}T09:1${index}:00.000Z` },
      index,
    )
  })
  const completedAt = overrides.completedAt === undefined ? `${date}T10:00:00.000Z` : overrides.completedAt
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
// lastLoggedWeightKg — the same lookup as "Last time".
// ---------------------------------------------------------------------------

describe('lastLoggedWeightKg', () => {
  it('is the last non-null weight of the most recent completed exposure', () => {
    const history = [
      completed('old', '2026-10-10', 'bent-over-row', [10, 12]),
      completed('new', '2026-10-17', 'bent-over-row', [17.75, 21.75, 25.75, 29.75]),
    ]
    expect(lastLoggedWeightKg(history, 'bent-over-row')).toBe(29.75)
  })

  it('the last non-null weight — not the first, not the heaviest', () => {
    const history = [completed('w', '2026-10-17', 'bent-over-row', [29.75, 21.75, 17.75])]
    expect(lastLoggedWeightKg(history, 'bent-over-row')).toBe(17.75)
  })

  it('skips a trailing set logged with no weight', () => {
    const history = [completed('w', '2026-10-17', 'bent-over-row', [21.75, 25.75, null])]
    expect(lastLoggedWeightKg(history, 'bent-over-row')).toBe(25.75)
  })

  it('does not walk past an exposure that logged no weight at all — "Last time" would not either', () => {
    const history = [
      completed('older', '2026-10-10', 'bent-over-row', [20]),
      completed('latest', '2026-10-17', 'bent-over-row', [null, null]),
    ]
    expect(lastLoggedWeightKg(history, 'bent-over-row')).toBeNull()
  })

  it('ignores an unfinished workout, other exercises, and an empty history', () => {
    const history = [
      completed('open', '2026-10-17', 'bent-over-row', [40], { completedAt: null }),
      completed('other', '2026-10-17', 'overhead-press', [30]),
    ]
    expect(lastLoggedWeightKg(history, 'bent-over-row')).toBeNull()
    expect(lastLoggedWeightKg([], 'bent-over-row')).toBeNull()
  })

  it('counts a log from another program or an easier day — it is real performance (CQ3)', () => {
    const otherProgram: Workout = {
      ...completed('p', '2026-10-17', 'bent-over-row', [27.75]),
      programId: 'some-other-program',
      readiness: { tier: 'easier', drivers: [] },
    }
    expect(lastLoggedWeightKg([otherProgram], 'bent-over-row')).toBe(27.75)
  })
})

// ---------------------------------------------------------------------------
// substituteLoadFor
// ---------------------------------------------------------------------------

describe('substituteLoadFor', () => {
  const base = { program: program([ladder('goblet-squat', 2), ladder('bent-over-row', 2.5)]), exerciseById, history: [] }

  it('a same-implement swap keeps the slot\'s loads (no substitute load)', () => {
    // DB bench -> incline DB press: both dumbbell.
    expect(
      substituteLoadFor({ ...base, authored: exercise('dumbbell-bench-press'), substitute: exercise('incline-dumbbell-press') }),
    ).toBeUndefined()
    // Bodyweight -> bodyweight: both unloaded.
    expect(
      substituteLoadFor({ ...base, authored: exercise('parallel-bar-dip'), substitute: exercise('incline-push-up') }),
    ).toBeUndefined()
  })

  it('swapping back to the authored exercise has no substitute load', () => {
    expect(
      substituteLoadFor({ ...base, authored: exercise('single-arm-db-row'), substitute: exercise('single-arm-db-row') }),
    ).toBeUndefined()
  })

  it('an unloaded substitute of a loaded slot has no weight, no start and no step', () => {
    // Single-arm DB row -> Inverted row.
    expect(
      substituteLoadFor({ ...base, authored: exercise('single-arm-db-row'), substitute: exercise('inverted-row') }),
    ).toEqual({ loaded: false, startWeightKg: null, stepKg: null })
  })

  it('a loaded substitute with no history starts from nothing, in its own increment', () => {
    // Single-arm DB row -> barbell bent-over row: the slot's dumbbell step is 2, the barbell's 2.5.
    expect(
      substituteLoadFor({ ...base, authored: exercise('single-arm-db-row'), substitute: exercise('bent-over-row') }),
    ).toEqual({ loaded: true, startWeightKg: null, stepKg: 2.5 })
  })

  it('a loaded substitute with history starts from its own last logged weight', () => {
    const history = [completed('h', '2026-10-17', 'bent-over-row', [17.75, 21.75, 25.75, 29.75])]
    expect(
      substituteLoadFor({ ...base, history, authored: exercise('single-arm-db-row'), substitute: exercise('bent-over-row') }),
    ).toEqual({ loaded: true, startWeightKg: 29.75, stepKg: 2.5 })
  })

  it('an unloaded slot swapped to a loaded exercise offers the control with no suggestion', () => {
    // Inverted row -> single-arm DB row.
    expect(
      substituteLoadFor({ ...base, authored: exercise('inverted-row'), substitute: exercise('single-arm-db-row') }),
    ).toEqual({ loaded: true, startWeightKg: null, stepKg: 2 })
  })
})
