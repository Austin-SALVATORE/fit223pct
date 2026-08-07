import { describe, expect, it } from 'vitest'
import {
  CEILING_VARIATION_LADDER,
  ceilingVariationFor,
  completeCeilingExposures,
  withCeilingVariation,
} from './variationLadder'
import { createWorkout, completeWorkout, logSet } from './workout'
import type { LadderPrescription, RepRangePrescription, SessionTemplate, SetTarget, Workout } from './types'
import type { ReadinessTier } from './readiness'

/**
 * §10 "Load-ceiling progression" (coach spec v2.16), `~/.claude/plans/
 * variation-ladder.md` Phase A. Fixture mirrors the plan's own measured
 * P0 data (§2) — incline-dumbbell-press's real committed shape, a
 * genuine ceiling pyramid (top rung 15 kg, maxWeightKg 15).
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

const PROGRAM_ID = 'mesocycle-2-build'

/**
 * Builds one completed workout for `ceilingLadder`'s exercise, logging
 * every rung of `setPlan` to its exact target reps — a genuine complete
 * exposure, unless the caller overrides `setPlan` to something short of
 * the full pyramid (simulating a missed rung, T2) or `readinessTier`
 * (simulating an eased day, N2 — `applyReadiness` truncates the stored
 * setPlan the same way, but the fixture short-circuits straight to the
 * stored shape rather than re-deriving it, since `adjustments.ts` is not
 * this module's concern).
 */
function completedWorkout(
  id: string,
  date: string,
  overrides: {
    setPlan?: SetTarget[]
    missReps?: number
    readinessTier?: ReadinessTier
    programId?: string
  } = {},
): Workout {
  const setPlan = overrides.setPlan ?? ceilingSetPlan
  const prescription: LadderPrescription = { ...ceilingLadder, setPlan, sets: setPlan.length }
  const session: SessionTemplate = {
    id: 'ceiling-test',
    name: 'Ceiling test session',
    focus: 'Press',
    items: [prescription],
  }
  let workout = createWorkout({
    id,
    programId: overrides.programId ?? PROGRAM_ID,
    session,
    date,
    startedAt: `${date}T09:00:00.000Z`,
  })
  setPlan.forEach((rung, index) => {
    const reps = index === setPlan.length - 1 ? (overrides.missReps ?? rung.reps) : rung.reps
    workout = logSet(
      workout,
      0,
      { weightKg: rung.weightKg, reps, seconds: null, completedAt: `${date}T09:${10 + index}:00.000Z` },
      index,
    )
  })
  if (overrides.readinessTier) {
    workout = { ...workout, readiness: { tier: overrides.readinessTier, drivers: [] } }
  }
  return completeWorkout(workout, `${date}T09:40:00.000Z`)
}

describe('CEILING_VARIATION_LADDER', () => {
  it('is normal, slow, slow-pause, in that order — §10:414-419', () => {
    expect(CEILING_VARIATION_LADDER).toEqual(['normal', 'slow', 'slow-pause'])
  })
})

// T1
describe('ceilingVariationFor', () => {
  it('produces normal, normal, slow, slow-pause, slow-pause over five complete exposures', () => {
    const sequence = [0, 1, 2, 3, 4].map(ceilingVariationFor)
    expect(sequence).toEqual(['normal', 'normal', 'slow', 'slow-pause', 'slow-pause'])
  })
})

// T2
describe('completeCeilingExposures — a missed exposure repeats, never skips', () => {
  it("reproduces §10's own worked example (P5), including the missed Week 3", () => {
    const workouts: Workout[] = []
    const exposuresBefore = () => completeCeilingExposures(workouts, PROGRAM_ID, ceilingLadder)
    const variationBefore = () => ceilingVariationFor(exposuresBefore())

    // Week 1 — calibration, nothing completed yet.
    expect(variationBefore()).toBe('normal')
    workouts.push(completedWorkout('wk1', '2026-08-10'))

    // Week 2 — baseline, one complete exposure so far.
    expect(exposuresBefore()).toBe(1)
    expect(variationBefore()).toBe('normal')
    workouts.push(completedWorkout('wk2', '2026-08-17'))

    // Week 3 — two complete exposures earn 'slow' — but this week's own
    // attempt falls short on the top rung (5 reps, not 6).
    expect(exposuresBefore()).toBe(2)
    expect(variationBefore()).toBe('slow')
    workouts.push(completedWorkout('wk3-missed', '2026-08-24', { missReps: 5 }))

    // Week 4 — still 2 complete exposures (the miss doesn't count), so
    // 'slow' repeats rather than the calendar skipping it to slow-pause.
    expect(exposuresBefore()).toBe(2)
    expect(variationBefore()).toBe('slow')
    workouts.push(completedWorkout('wk4', '2026-08-31'))

    // Week 5 — the repeated 'slow' finally completed, three exposures now.
    expect(exposuresBefore()).toBe(3)
    expect(variationBefore()).toBe('slow-pause')
  })
})

// N2
describe('completeCeilingExposures — an eased exposure does not advance the ladder (D8)', () => {
  it("does not count a Yellow day's own (truncated) pyramid, even though it was fully hit", () => {
    const workouts: Workout[] = [completedWorkout('wk1', '2026-08-10')]
    expect(completeCeilingExposures(workouts, PROGRAM_ID, ceilingLadder)).toBe(1)

    // An eased day stores a 3-rung pyramid (applyReadiness drops the top
    // rung) and this one hits all three of its own rungs — genuinely
    // complete on its own terms, and still must not count.
    workouts.push(
      completedWorkout('wk2-eased', '2026-08-17', {
        setPlan: ceilingSetPlan.slice(0, 3),
        readinessTier: 'easier',
      }),
    )
    expect(completeCeilingExposures(workouts, PROGRAM_ID, ceilingLadder)).toBe(1)
    expect(ceilingVariationFor(completeCeilingExposures(workouts, PROGRAM_ID, ceilingLadder))).toBe('normal')
  })

  it('treats an unrated day as neutral, not eased — matching nextSetTarget\'s own convention', () => {
    const workouts: Workout[] = [completedWorkout('wk1', '2026-08-10')]
    expect(completeCeilingExposures(workouts, PROGRAM_ID, ceilingLadder)).toBe(1)
  })
})

describe('completeCeilingExposures — other exercises and other workouts never count', () => {
  it('ignores a completed workout for a different exercise entirely', () => {
    const other = completedWorkout('other', '2026-08-10', {
      setPlan: [{ weightKg: 8, reps: 12 }],
    })
    const workout: Workout = {
      ...other,
      exercises: other.exercises.map((e) => ({ ...e, exerciseId: 'goblet-squat' })),
    }
    expect(completeCeilingExposures([workout], PROGRAM_ID, ceilingLadder)).toBe(0)
  })

  it('ignores an in-progress (not yet completed) workout', () => {
    let workout = createWorkout({
      id: 'in-progress',
      programId: PROGRAM_ID,
      session: {
        id: 's',
        name: 'S',
        focus: 'Press',
        items: [ceilingLadder],
      },
      date: '2026-08-10',
      startedAt: '2026-08-10T09:00:00.000Z',
    })
    ceilingSetPlan.forEach((rung, index) => {
      workout = logSet(
        workout,
        0,
        { weightKg: rung.weightKg, reps: rung.reps, seconds: null, completedAt: '2026-08-10T09:10:00.000Z' },
        index,
      )
    })
    // Never completeWorkout()'d.
    expect(completeCeilingExposures([workout], PROGRAM_ID, ceilingLadder)).toBe(0)
  })
})

describe('withCeilingVariation', () => {
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

  it('passes a rep-range prescription through unchanged — §10 is a pyramid rule, no ceiling state to compute', () => {
    const result = withCeilingVariation(repRange, [], PROGRAM_ID)
    expect(result).toBe(repRange)
  })

  it('passes a ladder through unchanged with no history — not yet at ceiling', () => {
    const result = withCeilingVariation(ceilingLadder, [], PROGRAM_ID)
    expect(result).toBe(ceilingLadder)
  })

  it('passes a ladder through unchanged when it has headroom, even if fully completed', () => {
    const headroom: LadderPrescription = { ...ceilingLadder, maxWeightKg: 25 }
    const workouts = [completedWorkout('wk1', '2026-08-10', { setPlan: headroom.setPlan })]
    const result = withCeilingVariation(headroom, workouts, PROGRAM_ID)
    expect(result).toBe(headroom)
  })

  it('writes the derived tempo onto every rung once the pyramid is at ceiling', () => {
    const workouts = [completedWorkout('wk1', '2026-08-10')]
    const result = withCeilingVariation(ceilingLadder, workouts, PROGRAM_ID) as LadderPrescription

    // One complete exposure earns 'normal' still (ceilingVariationFor(1)).
    expect(result.setPlan.every((rung) => rung.variantKey === 'normal')).toBe(true)
    // A new object — the authored prescription is never mutated.
    expect(result).not.toBe(ceilingLadder)
    expect(ceilingLadder.setPlan.every((rung) => rung.variantKey === undefined)).toBe(true)
  })

  it('advances the written tempo as more complete exposures accumulate', () => {
    const workouts = [completedWorkout('wk1', '2026-08-10'), completedWorkout('wk2', '2026-08-17')]
    const result = withCeilingVariation(ceilingLadder, workouts, PROGRAM_ID) as LadderPrescription

    expect(result.setPlan.every((rung) => rung.variantKey === 'slow')).toBe(true)
  })

  it("passes readinessTier straight through to the load engine's own classification, so the two can never disagree", () => {
    // Perfect history, but today is being asked about as an easier day —
    // suggestLadderProgression's own easier-day defer fires before the
    // ceiling check, so this must NOT read as at-ceiling here either.
    const workouts = [completedWorkout('wk1', '2026-08-10')]
    const result = withCeilingVariation(ceilingLadder, workouts, PROGRAM_ID, 'easier')
    expect(result).toBe(ceilingLadder)
  })
})
