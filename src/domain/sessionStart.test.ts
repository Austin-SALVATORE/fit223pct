import { describe, expect, it } from 'vitest'
import { applyReadiness } from './adjustments'
import { carrySessionForward } from './carryForward'
import type { Readiness } from './readiness'
import { prepareSessionForStart } from './sessionStart'
import type {
  ExercisePrescription,
  LadderPrescription,
  LoggedSet,
  RepRangePrescription,
  SessionTemplate,
  Workout,
  WorkoutExercise,
} from './types'

/**
 * Easier-day start (coach Q7; addendum §3.4/§3.5, D2-D4). On an easier day the
 * workout is the *normal carried plan* one rung/set shorter — never the eased
 * authored plan carried (which handed the dropped rung back) and never a
 * redefinition of the normal plan.
 */

const EASIER: Readiness = { tier: 'easier', drivers: [], consecutiveLowDays: 1 }
const READY: Readiness = { tier: 'ready', drivers: [], consecutiveLowDays: 0 }

const AUTHORED_RUNGS = [
  { weightKg: 11.75, reps: 12 },
  { weightKg: 13.75, reps: 10 },
  { weightKg: 15.75, reps: 8 },
  { weightKg: 17.75, reps: 6 },
]

function ladder(overrides: Partial<LadderPrescription> = {}): LadderPrescription {
  return {
    exerciseId: 'overhead-press',
    sets: 4,
    mode: 'reps',
    restSeconds: 120,
    perSide: false,
    role: 'main',
    setPlan: AUTHORED_RUNGS.map((r) => ({ ...r })),
    maxWeightKg: 43.75,
    weightStepKg: 2,
    ...overrides,
  }
}

function repRangeMain(): RepRangePrescription {
  return {
    exerciseId: 'reverse-lunge',
    sets: 3,
    mode: 'reps',
    restSeconds: 90,
    perSide: true,
    role: 'main',
    range: { min: 8, max: 12 },
    startWeightKg: 6,
    maxWeightKg: 20,
    weightStepKg: 2,
  }
}

function logged(setIndex: number, weightKg: number, reps: number): LoggedSet {
  return { setIndex, weightKg, reps, seconds: null, completedAt: '2026-07-15T10:00:00.000Z' }
}

function normalWorkout(prescription: ExercisePrescription, sets: LoggedSet[]): Workout {
  const exercise: WorkoutExercise = { exerciseId: prescription.exerciseId, prescription, sets }
  return {
    id: 'normal',
    programId: 'p1',
    sessionTemplateId: 's1',
    date: '2026-07-15',
    startedAt: '2026-07-15T09:00:00.000Z',
    completedAt: '2026-07-15T10:00:00.000Z',
    exercises: [exercise],
  }
}

function session(...items: ExercisePrescription[]): SessionTemplate {
  return { id: 's1', name: 'S', focus: 'F', items }
}

const normalLog = AUTHORED_RUNGS.map((r, i) => logged(i, (r.weightKg ?? 0) + 2, r.reps)) // +2 over authored

describe('prepareSessionForStart', () => {
  it('on a ready day it is exactly the carried session', () => {
    const s = session(ladder())
    const history = [normalWorkout(ladder(), normalLog)]
    expect(prepareSessionForStart(s, history, 'p1', READY).items).toEqual(carrySessionForward(s.items, history, 'p1'))
  })

  it('D2 an easier day after a normal day stores the normal carried plan minus its top rung', () => {
    const s = session(ladder())
    const history = [normalWorkout(ladder(), normalLog)]

    const [item] = prepareSessionForStart(s, history, 'p1', EASIER).items as LadderPrescription[]

    expect(item.sets).toBe(3)
    expect(item.setPlan.map((r) => r.weightKg)).toEqual([13.75, 15.75, 17.75]) // the normal carried values
    expect(item.setPlan.map((r) => r.reps)).toEqual([12, 10, 8])
  })

  it('D3 a rep-range MAIN lift with history is unchanged on an easier day', () => {
    const s = session(repRangeMain())
    const history = [normalWorkout(repRangeMain(), [logged(0, 8, 10), logged(1, 8, 10), logged(2, 8, 10)])]

    const [item] = prepareSessionForStart(s, history, 'p1', EASIER).items
    const [normal] = prepareSessionForStart(s, history, 'p1', READY).items

    expect(item.sets).toBe(3)
    expect(item).toEqual(normal)
  })

  it('D4 a revised ladder on an easier day, with an old-structure normal basis, is 2 rungs, never 4', () => {
    // The coach cut 4 rungs to 3 and dropped the first: new rung i <- old rung i+1.
    const revised = ladder({
      sets: 3,
      setPlan: AUTHORED_RUNGS.slice(1).map((r) => ({ ...r })),
      revision: { id: 'rev-1', carryFrom: [1, 2, 3] },
    })
    const history = [normalWorkout(ladder(), normalLog)]

    const [item] = prepareSessionForStart(session(revised), history, 'p1', EASIER).items as LadderPrescription[]

    expect(item.sets).toBe(2)
    expect(item.setPlan.map((r) => r.weightKg)).toEqual([15.75, 17.75]) // old rungs 1 and 2, +2 kg
  })

  it('with only easier-day history the easier day eases the authored plan', () => {
    const eased: Workout = { ...normalWorkout(ladder({ sets: 3, setPlan: AUTHORED_RUNGS.slice(0, 3) }), normalLog.slice(0, 3)), readiness: { tier: 'easier', drivers: [] } }
    const s = session(ladder())
    const [item] = prepareSessionForStart(s, [eased], 'p1', EASIER).items
    expect(item).toEqual(applyReadiness(s, EASIER).session.items[0])
  })
})
