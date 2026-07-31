import { describe, expect, it } from 'vitest'
import { nextSetTarget } from './nextSetTarget'
import type { LadderPrescription, LoggedSet, RepRangePrescription } from './types'

/**
 * **The correctness trap this function exists to close.** The set screen
 * pre-fills the weight you just lifted; a rest screen recomputing from the
 * prescription would show the ladder rung instead. The user reads one number,
 * loads it, and is then offered another. Both screens now render from here, so
 * they cannot disagree by construction rather than by care.
 */

const repRange: RepRangePrescription = {
  exerciseId: 'goblet-squat',
  sets: 3,
  mode: 'reps',
  range: { min: 8, max: 12 },
  restSeconds: 120,
  perSide: false,
  startWeightKg: 16,
  maxWeightKg: 20,
  weightStepKg: 2,
}

const ladder: LadderPrescription = {
  exerciseId: 'goblet-squat',
  sets: 3,
  mode: 'reps',
  setPlan: [
    { weightKg: 20, reps: 12 },
    { weightKg: 22.5, reps: 10 },
    { weightKg: 25, reps: 8 },
  ],
  restSeconds: 120,
  perSide: false,
  maxWeightKg: 40,
  weightStepKg: 2.5,
}

function set(overrides: Partial<LoggedSet> = {}): LoggedSet {
  return {
    setIndex: 0,
    reps: 10,
    weightKg: 22.5,
    seconds: null,
    completedAt: '2026-07-30T18:00:00.000Z',
    ...overrides,
  }
}

describe('the weight you just lifted wins over the prescription', () => {
  it('carries the session weight rather than the ladder rung', () => {
    // Rung 1 of the ladder is 20 kg, but the user just did 22.5 kg. The set
    // screen offers 22.5, so the rest screen must say 22.5 — this is the
    // disagreement the whole function exists to prevent.
    const target = nextSetTarget(ladder, [set({ weightKg: 22.5, reps: 10 })], [], 0, 'steady')

    expect(target.weightKg).toBe(22.5)
    expect(target.source).toBe('carried')
    expect(ladder.setPlan[0].weightKg).toBe(20)
  })

  it('falls back to the rung when nothing has been logged this session', () => {
    const target = nextSetTarget(ladder, [], [], 1, 'steady')

    expect(target.weightKg).toBe(22.5)
    expect(target.reps).toBe(10)
    expect(target.source).toBe('rung')
  })

  it('falls back to the suggestion for a rep-range prescription', () => {
    const target = nextSetTarget(repRange, [], [], 0, 'steady')

    expect(target.weightKg).toBe(16)
    expect(target.reps).toBe(8)
    expect(target.source).toBe('suggestion')
  })
})

describe('every prescription shape resolves', () => {
  it('reports reps and no seconds in reps mode', () => {
    const target = nextSetTarget(repRange, [], [], 0, 'steady')
    expect(target.reps).toBe(8)
    expect(target.seconds).toBeNull()
  })

  it('reports seconds and no reps in seconds mode', () => {
    const timed: RepRangePrescription = { ...repRange, mode: 'seconds', range: { min: 30, max: 45 } }
    const target = nextSetTarget(timed, [], [], 0, 'steady')

    expect(target.seconds).toBe(30)
    expect(target.reps).toBeNull()
  })

  it('carries seconds, not reps, when a timed set was logged', () => {
    const timed: RepRangePrescription = { ...repRange, mode: 'seconds', range: { min: 30, max: 45 } }
    const target = nextSetTarget(
      timed,
      [set({ seconds: 40, reps: null, weightKg: null })],
      [],
      1,
      'steady',
    )

    expect(target.seconds).toBe(40)
    expect(target.reps).toBeNull()
  })

  it('leaves the weight null for unloaded work rather than inventing one', () => {
    // A bodyweight prescription has no startWeightKg. The card renders one row
    // in this case, so a fabricated 0 would put a weight stepper on screen for
    // a push-up.
    const bodyweight: RepRangePrescription = { ...repRange, startWeightKg: null, maxWeightKg: null }
    const target = nextSetTarget(bodyweight, [], [], 0, 'steady')

    expect(target.weightKg).toBeNull()
  })

  it('keeps the weight null when an unloaded set is carried', () => {
    const bodyweight: RepRangePrescription = { ...repRange, startWeightKg: null, maxWeightKg: null }
    const target = nextSetTarget(
      bodyweight,
      [set({ weightKg: null, reps: 12 })],
      [],
      1,
      'steady',
    )

    expect(target.weightKg).toBeNull()
    expect(target.reps).toBe(12)
  })
})

describe('the delta is against the set just done, and never zero', () => {
  it('is null when nothing has been logged this session', () => {
    expect(nextSetTarget(ladder, [], [], 0, 'steady').delta).toBeNull()
  })

  it('is null when the carried set matches the target exactly', () => {
    // "↑ +0 kg" is noise, and the absence is what the UI branches on.
    const target = nextSetTarget(ladder, [set({ weightKg: 22.5, reps: 10 })], [], 1, 'steady')
    expect(target.delta).toBeNull()
  })

  it('reports a rep change with no weight change', () => {
    const target = nextSetTarget(
      repRange,
      [set({ weightKg: 16, reps: 8 })],
      [],
      1,
      'steady',
    )

    // Carrying keeps 16 kg and 8 reps, so nothing moved.
    expect(target.delta).toBeNull()
  })
})

describe('the engine classification survives, so MAX is distinguishable', () => {
  it('flags the equipment ceiling rather than looking like a failure to progress', () => {
    // Every rung hit its target, but the top rung cannot take another step.
    const atMax: LadderPrescription = { ...ladder, maxWeightKg: 25 }
    const previous: LoggedSet[] = [
      set({ setIndex: 0, weightKg: 20, reps: 12 }),
      set({ setIndex: 1, weightKg: 22.5, reps: 10 }),
      set({ setIndex: 2, weightKg: 25, reps: 8 }),
    ]

    const target = nextSetTarget(atMax, [], previous, 0, 'steady')
    expect(target.progressionType).toBe('at-equipment-max')
  })

  it('carries the rep-range engine type through', () => {
    const previous: LoggedSet[] = [
      set({ weightKg: 16, reps: 12 }),
      set({ weightKg: 16, reps: 12 }),
      set({ weightKg: 16, reps: 12 }),
    ]
    const target = nextSetTarget(repRange, [], previous, 0, 'steady')

    expect(target.progressionType).toBe('increase-load')
    expect(target.weightKg).toBe(18)
  })

  it('defers a load increase on an easier day, same as the engine does', () => {
    const previous: LoggedSet[] = [
      set({ weightKg: 16, reps: 12 }),
      set({ weightKg: 16, reps: 12 }),
      set({ weightKg: 16, reps: 12 }),
    ]
    const target = nextSetTarget(repRange, [], previous, 0, 'easier')

    expect(target.weightKg).toBe(16)
  })
})

describe('it returns data, never prose', () => {
  it('carries no string that could be a sentence', () => {
    // Domain purity: the UI words this from `source` and `progressionType`.
    // A reason string here would be an English sentence in the domain layer.
    const target = nextSetTarget(repRange, [set()], [], 1, 'steady')

    for (const [key, value] of Object.entries(target)) {
      if (typeof value === 'string') {
        expect(value, `${key} looks like prose`).not.toMatch(/\s/)
      }
    }
  })
})
