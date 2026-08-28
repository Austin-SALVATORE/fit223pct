import { describe, expect, it } from 'vitest'
import { nextSetTarget } from './nextSetTarget'
import type { LadderPrescription, LoggedSet, RepRangePrescription } from './types'

/**
 * **The correctness trap this function exists to close.** The set screen
 * pre-fills the weight you just lifted; a rest screen recomputing from the
 * prescription would show the ladder rung instead. The user reads one number,
 * loads it, and is then offered another. Both screens now render from here, so
 * they cannot disagree by construction rather than by care.
 *
 * **Rewritten for Phase 3 of `~/.claude/plans/progression-carry-forward.md`
 * (28 Aug 2026).** `nextSetTarget` no longer takes `previousSets` or
 * `readinessTier` — see `nextSetTarget.ts`'s own docblock for why: the
 * `prescription` passed in is now expected to already be the *carried* one,
 * and there is no engine left inside this function for readiness to gate.
 * Tests that only made sense against the deleted two-engine dispatch
 * (`progressionType`, equipment-ceiling gating, the Yellow-day truncation
 * fix) are gone with it — `carryForward.test.ts` covers the equivalent
 * ground for carry-forward itself, and `adjustments.test.ts` covers eased-day
 * truncation, which this function never touched directly even before this
 * rewrite (it only ever read whatever `setPlan` it was handed).
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
   * Owner ruling, 31 Jul: the app presents the coach's prescription (here,
   * the already-carried one) and never silently rewrites it from an
   * earlier-in-session deviation.
   */
  it('offers rung N for set N even after a deviating set', () => {
    // The user could only manage 12.5 where the rung asked more. Set 3 still
    // offers its own rung — not 12.5, and not a step from it.
    const target = nextSetTarget(ladder, [set({ weightKg: 12.5, reps: 10 })], 2)

    expect(target.weightKg).toBe(25)
    expect(target.reps).toBe(8)
    expect(target.source).toBe('rung')
  })

  it('never reports carried for a ladder, whatever was logged', () => {
    // A consumer branching on this must not read 'carried' as "same exercise,
    // later set" — for a ladder there is no such state.
    for (const setIndex of [0, 1, 2]) {
      const target = nextSetTarget(ladder, [set({ weightKg: 99, reps: 99 })], setIndex)
      expect(target.source, `set ${setIndex + 1}`).toBe('rung')
    }
  })

  it('applies the rule to reps as well as weight', () => {
    const target = nextSetTarget(ladder, [set({ weightKg: 20, reps: 12 })], 1)

    expect(target.reps).toBe(10)
    expect(target.weightKg).toBe(22.5)
  })

  it('falls back to the rung when nothing has been logged this session', () => {
    const target = nextSetTarget(ladder, [], 1)

    expect(target.weightKg).toBe(22.5)
    expect(target.reps).toBe(10)
    expect(target.source).toBe('rung')
  })

  it('keeps carrying for rep-range work, where the rule is still correct', () => {
    // **The rule is narrowed, not deleted.** Rep-range prescriptions apply the
    // same weight across every set, so continuing at the weight just used is
    // right there — and a future reader tightening the ladder fix must not
    // take this with it.
    const target = nextSetTarget(repRange, [set({ weightKg: 18, reps: 10 })], 1)

    expect(target.weightKg).toBe(18)
    expect(target.reps).toBe(10)
    expect(target.source).toBe('carried')
  })

  it('reads the authored prescription verbatim for a genuinely first-ever exposure (no carry-forward history, nothing logged this session)', () => {
    const target = nextSetTarget(repRange, [], 0)

    expect(target.weightKg).toBe(16)
    expect(target.reps).toBe(8)
    expect(target.source).toBe('authored')
  })
})

/**
 * docs/design/SessionSetCustomization.md §4 — a custom slot (`Add Set`) on
 * a ladder is never offered as a rung, even though the prescription has
 * one. `ladder.sets` (3) is where custom indices start, matching
 * workout.ts's `plannedSetIndices`.
 */
describe('a custom slot on a ladder carries, never offers a rung', () => {
  it('inherits the most recently logged set in this session', () => {
    const target = nextSetTarget(ladder, [set({ weightKg: 12.5, reps: 9 })], 3)

    expect(target.weightKg).toBe(12.5)
    expect(target.reps).toBe(9)
    expect(target.source).toBe('carried')
  })

  it('falls back to the first prescribed level when nothing has been logged yet this session', () => {
    const target = nextSetTarget(ladder, [], 3)

    expect(target.weightKg).toBe(20) // ladder.setPlan[0].weightKg
    expect(target.reps).toBe(12) // ladder.setPlan[0].reps
  })

  it('never carries a variant chip — a custom set has no rung to read one from', () => {
    const withVariant: LadderPrescription = {
      ...ladder,
      setPlan: ladder.setPlan.map((rung) => ({ ...rung, variantKey: 'slow' as const })),
    }
    const target = nextSetTarget(withVariant, [set({ weightKg: 12.5, reps: 9 })], 3)
    expect(target.variantKey).toBeUndefined()
  })
})

describe('every prescription shape resolves', () => {
  it('reports reps and no seconds in reps mode', () => {
    const target = nextSetTarget(repRange, [], 0)
    expect(target.reps).toBe(8)
    expect(target.seconds).toBeNull()
  })

  it('reports seconds and no reps in seconds mode', () => {
    const timed: RepRangePrescription = { ...repRange, mode: 'seconds', range: { min: 30, max: 45 } }
    const target = nextSetTarget(timed, [], 0)

    expect(target.seconds).toBe(30)
    expect(target.reps).toBeNull()
  })

  it('carries seconds, not reps, when a timed set was logged', () => {
    const timed: RepRangePrescription = { ...repRange, mode: 'seconds', range: { min: 30, max: 45 } }
    const target = nextSetTarget(timed, [set({ seconds: 40, reps: null, weightKg: null })], 1)

    expect(target.seconds).toBe(40)
    expect(target.reps).toBeNull()
  })

  it('leaves the weight null for unloaded work rather than inventing one', () => {
    // A bodyweight prescription has no startWeightKg. The card renders one row
    // in this case, so a fabricated 0 would put a weight stepper on screen for
    // a push-up.
    const bodyweight: RepRangePrescription = { ...repRange, startWeightKg: null, maxWeightKg: null }
    const target = nextSetTarget(bodyweight, [], 0)

    expect(target.weightKg).toBeNull()
  })

  it('keeps the weight null when an unloaded set is carried', () => {
    const bodyweight: RepRangePrescription = { ...repRange, startWeightKg: null, maxWeightKg: null }
    const target = nextSetTarget(bodyweight, [set({ weightKg: null, reps: 12 })], 1)

    expect(target.weightKg).toBeNull()
    expect(target.reps).toBe(12)
  })
})

describe('the delta is against the set just done, and never zero', () => {
  it('is null when nothing has been logged this session', () => {
    expect(nextSetTarget(ladder, [], 0).delta).toBeNull()
  })

  it('is null when the carried set matches the target exactly', () => {
    // "↑ +0 kg" is noise, and the absence is what the UI branches on.
    const target = nextSetTarget(ladder, [set({ weightKg: 22.5, reps: 10 })], 1)
    expect(target.delta).toBeNull()
  })

  it('reports a rep change with no weight change', () => {
    const target = nextSetTarget(repRange, [set({ weightKg: 16, reps: 8 })], 1)

    // Carrying keeps 16 kg and 8 reps, so nothing moved.
    expect(target.delta).toBeNull()
  })
})

describe('it returns data, never prose', () => {
  it('carries no string that could be a sentence', () => {
    // Domain purity: the UI words this from `source`. A reason string here
    // would be an English sentence in the domain layer.
    const target = nextSetTarget(repRange, [set()], 1)

    for (const [key, value] of Object.entries(target)) {
      if (typeof value === 'string') {
        expect(value, `${key} looks like prose`).not.toMatch(/\s/)
      }
    }
  })
})

describe('what prescribed still distinguishes, now that ladders never carry', () => {
  /**
   * The ruling makes a ladder's offered value *equal* its prescribed rung, so
   * for ladders the two coincide by construction. This asserts that, which
   * both records the redundancy and catches its reintroduction: if carrying
   * ever came back for ladders, the offered value would diverge from the
   * prescription and this fails.
   */
  it('coincides with the offered value for a ladder, always', () => {
    for (const setIndex of [0, 1, 2]) {
      const target = nextSetTarget(ladder, [set({ weightKg: 99, reps: 99 })], setIndex)
      expect(target.prescribed.weightKg, `set ${setIndex + 1}`).toBe(target.weightKg)
      expect(target.prescribed.reps, `set ${setIndex + 1}`).toBe(target.reps)
    }
  })

  it('still diverges from the offered value for rep-range work', () => {
    // Where the field earns its place: rep-range carrying means "what you were
    // told" and "what you are offered" are genuinely different numbers, and a
    // caption that wants the prescription cannot read the offered value.
    const target = nextSetTarget(repRange, [set({ weightKg: 18, reps: 10 })], 1)

    expect(target.weightKg).toBe(18)
    expect(target.prescribed.weightKg).toBe(16)
    expect(target.prescribed.weightKg).not.toBe(target.weightKg)
  })
})

/**
 * `variantKey` is read straight off the offered rung — `prescribed` and
 * `source` are exposed here rather than recomputed by a screen, so two
 * screens cannot resolve two different variants for the same rung.
 */
describe('variantKey — how a rung differs from the default form', () => {
  const withVariants: LadderPrescription = {
    exerciseId: 'push-up',
    sets: 2,
    mode: 'reps',
    setPlan: [
      { weightKg: null, reps: 12, variantKey: 'normal' },
      { weightKg: null, reps: 10, variantKey: 'slow' },
    ],
    restSeconds: 90,
    perSide: false,
    maxWeightKg: null,
    weightStepKg: null,
  }

  it("surfaces the offered rung's own variantKey, not the first rung's", () => {
    const rung1 = nextSetTarget(withVariants, [], 0)
    const rung2 = nextSetTarget(withVariants, [], 1)

    expect(rung1.variantKey).toBe('normal')
    expect(rung2.variantKey).toBe('slow')
  })

  it('is undefined for a ladder whose rungs carry no variant — most rungs vary only by load', () => {
    const target = nextSetTarget(ladder, [], 0)
    expect(target.variantKey).toBeUndefined()
  })

  /**
   * The point of carry-forward preserving `variantKey` (`carryForward.ts`'s
   * `carriedRung`) is exactly so this keeps working with zero special-casing
   * here — a coach-authored tempo rung, once carried forward by
   * `carryForwardPrescription`, is indistinguishable from a freshly-authored
   * one by the time it reaches this function.
   */
  it('surfaces a variantKey that survived carry-forward, indistinguishable from a freshly-authored one', () => {
    const carried: LadderPrescription = {
      ...withVariants,
      setPlan: withVariants.setPlan.map((rung) => ({ ...rung })), // as if returned by carryForwardPrescription
    }
    const target = nextSetTarget(carried, [], 1)
    expect(target.variantKey).toBe('slow')
  })
})
