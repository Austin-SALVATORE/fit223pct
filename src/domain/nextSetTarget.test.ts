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

describe('a ladder always offers its prescribed rung', () => {
  /**
   * **This inverts an earlier assertion, and the inversion is the fix.** The
   * old test asserted the carried weight beat the rung — captured accurately
   * from code that was already wrong. A ladder ascends by design, so letting
   * the last logged set win meant the pyramid never climbed and the owner had
   * been raising every load by hand since M8.
   *
   * Owner ruling: the app presents the coach's prescription and never
   * silently rewrites it from an earlier deviation.
   */
  it('offers rung N for set N even after a deviating set', () => {
    // The user could only manage 12.5 where the rung asked more. Set 3 still
    // offers its own rung — not 12.5, and not a step from it.
    const target = nextSetTarget(ladder, [set({ weightKg: 12.5, reps: 10 })], [], 2, 'steady')

    expect(target.weightKg).toBe(25)
    expect(target.reps).toBe(8)
    expect(target.source).toBe('rung')
  })

  it('never reports carried for a ladder, whatever was logged', () => {
    // A consumer branching on this must not read 'carried' as "same exercise,
    // later set" — for a ladder there is no such state.
    for (const setIndex of [0, 1, 2]) {
      const target = nextSetTarget(ladder, [set({ weightKg: 99, reps: 99 })], [], setIndex, 'steady')
      expect(target.source, `set ${setIndex + 1}`).toBe('rung')
    }
  })

  it('applies the rule to reps as well as weight', () => {
    // Effort carried too, with the same defect: set 2 offered set 1's reps.
    const target = nextSetTarget(ladder, [set({ weightKg: 20, reps: 12 })], [], 1, 'steady')

    expect(target.reps).toBe(10)
    expect(target.weightKg).toBe(22.5)
  })

  it('falls back to the rung when nothing has been logged this session', () => {
    const target = nextSetTarget(ladder, [], [], 1, 'steady')

    expect(target.weightKg).toBe(22.5)
    expect(target.reps).toBe(10)
    expect(target.source).toBe('rung')
  })

  it('keeps carrying for rep-range work, where the rule is still correct', () => {
    // **The rule is narrowed, not deleted.** Rep-range prescriptions apply the
    // same weight across every set, so continuing at the weight just used is
    // right there — and a future reader tightening the ladder fix must not
    // take this with it.
    const target = nextSetTarget(repRange, [set({ weightKg: 18, reps: 10 })], [], 1, 'steady')

    expect(target.weightKg).toBe(18)
    expect(target.reps).toBe(10)
    expect(target.source).toBe('carried')
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

describe('a ladder that advances reads as an increased load', () => {
  it('maps advance onto the same discriminant the rep-range engine uses', () => {
    // Otherwise a stepped-up ladder shows no delta on the caption while an
    // identical rep-range step-up shows one — the same event, told two ways.
    const previous: LoggedSet[] = [
      set({ setIndex: 0, weightKg: 20, reps: 12 }),
      set({ setIndex: 1, weightKg: 22.5, reps: 10 }),
      set({ setIndex: 2, weightKg: 25, reps: 8 }),
    ]
    const target = nextSetTarget(ladder, [], previous, 0, 'steady')

    expect(target.progressionType).toBe('increase-load')
    expect(target.weightKg).toBe(22.5)
  })

  it('reports nothing to caption when the ladder repeats', () => {
    const previous: LoggedSet[] = [set({ setIndex: 0, weightKg: 20, reps: 8 })]
    expect(nextSetTarget(ladder, [], previous, 0, 'steady').progressionType).toBeNull()
  })
})
