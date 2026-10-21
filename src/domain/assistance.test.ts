import { describe, expect, it } from 'vitest'
import { carryForwardPrescription, carrySessionForward } from './carryForward'
import { workoutHighlights } from './highlights'
import { nextSetTarget } from './nextSetTarget'
import { validateProgramImport } from './programImport'
import { detectStagnation } from './stagnation'
import { strengthTrend } from './trends'
import type { Exercise, LadderPrescription, LoggedSet, RepRangePrescription, Workout } from './types'

/**
 * Per-set dip assistance (ruling 21 Oct 2026,
 * `docs/programs/dip-assistance-ruling-2026-10-21.md`; addendum 2 §2). A set
 * can be logged `assisted`; the flag carries by rung position; and no effort
 * comparison treats assisted and unassisted reps as the same thing. Yes/no
 * only — nothing here computes a load.
 */

const DIP = 'parallel-bar-dip'

const dip = (overrides: Partial<RepRangePrescription> = {}): RepRangePrescription => ({
  exerciseId: DIP,
  sets: 2,
  mode: 'reps',
  restSeconds: 120,
  perSide: false,
  range: { min: 5, max: 8 },
  startWeightKg: null,
  maxWeightKg: null,
  weightStepKg: null,
  assistable: true,
  ...overrides,
})

function logged(setIndex: number, reps: number, assisted = false): LoggedSet {
  return {
    setIndex,
    weightKg: null,
    reps,
    seconds: null,
    completedAt: '2026-07-15T10:00:00.000Z',
    ...(assisted ? { assisted: true as const } : {}),
  }
}

function dipWorkout(id: string, date: string, sets: LoggedSet[], prescription = dip()): Workout {
  return {
    id,
    programId: 'p1',
    sessionTemplateId: 'C',
    date,
    startedAt: `${date}T09:00:00.000Z`,
    completedAt: `${date}T10:00:00.000Z`,
    exercises: [{ exerciseId: DIP, prescription, sets }],
  }
}

const dipExercise: Exercise = {
  id: DIP,
  muscles: ['chest', 'triceps'],
  equipment: ['parallel-bars'],
  substitutionIds: [],
  isUnilateral: false,
}

const carried = (history: Workout[]) => carrySessionForward([dip()], history, 'p1')[0] as LadderPrescription

describe('A2/A6 the flag carries by rung position', () => {
  it('A2 an assisted set carries as an assisted rung, with its reps', () => {
    const result = carried([dipWorkout('w1', '2026-07-15', [logged(0, 8, true), logged(1, 8, true)])])
    expect(result.setPlan).toEqual([
      { weightKg: null, reps: 8, assisted: true },
      { weightKg: null, reps: 8, assisted: true },
    ])
  })

  it('A2 persists `assistable` onto the carried prescription (the carry literal is built field by field)', () => {
    const previous = dipWorkout('w1', '2026-07-15', [logged(0, 6), logged(1, 6)]).exercises[0]
    expect(carryForwardPrescription(dip(), previous).assistable).toBe(true)
  })

  it('A6 a mixed previous session carries each set\'s own state by position', () => {
    const result = carried([dipWorkout('w1', '2026-07-15', [logged(0, 5), logged(1, 7, true)])])
    expect(result.setPlan.map((r) => r.assisted)).toEqual([undefined, true])
    expect(result.setPlan.map((r) => r.reps)).toEqual([5, 7])
  })

  it('carry never converts assisted to unassisted, and never invents assistance', () => {
    const allAssisted = carried([dipWorkout('w1', '2026-07-15', [logged(0, 12, true), logged(1, 12, true)])])
    expect(allAssisted.setPlan.every((r) => r.assisted === true)).toBe(true) // 12 reps does not "graduate" it
    const none = carried([dipWorkout('w1', '2026-07-15', [logged(0, 6), logged(1, 6)])])
    expect(none.setPlan.some((r) => 'assisted' in r)).toBe(false)
  })
})

describe('A5 the set screen\'s pre-set (nextSetTarget)', () => {
  it('first exposure: no assisted pre-set — Unassisted', () => {
    expect(nextSetTarget(dip(), [], 0).assisted).toBeUndefined()
  })

  it('a carried assisted rung pre-sets Assisted; its neighbour stays Unassisted', () => {
    const result = carried([dipWorkout('w1', '2026-07-15', [logged(0, 5), logged(1, 7, true)])])
    expect(nextSetTarget(result, [], 0).assisted).toBeUndefined()
    expect(nextSetTarget(result, [], 1).assisted).toBe(true)
  })

  it('within a first-ever session the set just logged carries its state, like reps do', () => {
    expect(nextSetTarget(dip(), [logged(0, 6, true)], 1).assisted).toBe(true)
    expect(nextSetTarget(dip(), [logged(0, 6)], 1).assisted).toBeUndefined()
  })
})

describe('A3 highlights do not compare assisted with unassisted reps', () => {
  // The assisted session has MORE reps than the unassisted one: a guard-less
  // comparison would report "+3 reps" across the change, which is the lie.
  it('unassisted -> assisted reads steady, not "+3 reps"', () => {
    const previous = dipWorkout('w1', '2026-07-15', [logged(0, 5), logged(1, 5)])
    const current = dipWorkout('w2', '2026-07-22', [logged(0, 8, true), logged(1, 8, true)])
    expect(workoutHighlights(current, [previous])[0].kind).toBe('steady')
  })

  it('assisted -> unassisted with more reps reads steady too', () => {
    const previous = dipWorkout('w1', '2026-07-15', [logged(0, 5, true), logged(1, 5, true)])
    const current = dipWorkout('w2', '2026-07-22', [logged(0, 8), logged(1, 8)])
    expect(workoutHighlights(current, [previous])[0].kind).toBe('steady')
  })

  it('same assistance state still reports a real effort gain', () => {
    const previous = dipWorkout('w1', '2026-07-15', [logged(0, 5, true), logged(1, 5, true)])
    const current = dipWorkout('w2', '2026-07-22', [logged(0, 8, true), logged(1, 8, true)])
    expect(workoutHighlights(current, [previous])[0].kind).toBe('effort')
  })
})

describe('A4 stagnation and strength trend ignore assisted sets', () => {
  const sessions = (assisted: boolean) => [
    dipWorkout('w1', '2026-07-01', [logged(0, 5, assisted)]),
    dipWorkout('w2', '2026-07-08', [logged(0, 6, assisted)]),
    dipWorkout('w3', '2026-07-15', [logged(0, 7, assisted)]),
  ]

  it('climbing ASSISTED reps alone never produces a progressing verdict', () => {
    expect(detectStagnation(dipExercise, sessions(true)).status).toBe('insufficient-data')
  })

  it('the same climb unassisted is progress (the guard, not the fixture, is what differs)', () => {
    expect(detectStagnation(dipExercise, sessions(false)).status).toBe('progressing')
  })

  it('strengthTrend has no unassisted evidence to trend over', () => {
    expect(strengthTrend(DIP, sessions(true)).status).toBe('insufficient-data')
    expect(strengthTrend(DIP, sessions(false)).status).not.toBe('insufficient-data')
  })
})

describe('import', () => {
  it('keeps `assistable` on a prescription', () => {
    const result = validateProgramImport(
      {
        id: 'x',
        name: 'X',
        phase: 2,
        startDate: '2026-08-10',
        endDate: null,
        trainingWeekdays: [1, 3, 5],
        rotation: ['A'],
        sessions: [
          {
            id: 'A',
            name: 'A',
            focus: 'f',
            items: [{ ...dip(), exerciseId: 'goblet-squat' }],
          },
        ],
      },
      new Set(['goblet-squat']),
    )
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.program.sessions[0].items[0].assistable).toBe(true)
  })
})
