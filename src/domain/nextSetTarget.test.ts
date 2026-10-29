import { describe, expect, it } from 'vitest'
import { nextSetTarget, weightPressStartKg } from './nextSetTarget'
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

/**
 * A substitute (coach Q4, CQ4, CC3). The slot's prescription belongs to the
 * exercise that was swapped out, so no weight in it is offered — and neither is
 * the weight the athlete just lifted: "do not automatically reuse the weight
 * from set 3 ... leave the weight for explicit athlete selection" (CC3). A
 * substitute's weight is its own suggested start and nothing else; reps, sets
 * and rest still follow the slot. Negative controls, run 29 Oct (mutation
 * applied, this file and `SetScreen.substitute.test.tsx` run, restored):
 *   drop the `substitute` branch of the offered weight (the rung is offered
 *     again)                      -> the first six tests below (not the last two)
 *   offer the rung as the start   -> "no history still has the control", "a
 *                                    suggested start is offered", "later sets
 *                                    never offer ...", "no weight change to
 *                                    report", "a set logged with no weight"
 *   re-introduce `carried ?? start` (the weight just lifted carries to the next
 *     set)                        -> "later sets never offer the weight just
 *                                    lifted", and the screen's T20b
 *   the delta computed as for an authored exercise (no substitute guard)
 *                                 -> "reports no weight change ...", and T20b
 *                                    (the Rest screen says "41.75 kg lighter")
 *   `loaded` always `weightKg !== null`
 *                                 -> "a loaded substitute with no history still
 *                                    has the control"
 */
describe('a substitute', () => {
  // The slot: a dumbbell ladder, 10/12/14 kg per hand.
  const slot: LadderPrescription = {
    exerciseId: 'single-arm-db-row',
    sets: 3,
    mode: 'reps',
    setPlan: [
      { weightKg: 10, reps: 12 },
      { weightKg: 12, reps: 10 },
      { weightKg: 14, reps: 8 },
    ],
    restSeconds: 90,
    perSide: true,
    maxWeightKg: 38,
    weightStepKg: 2,
  }

  it('an unloaded substitute is offered no weight, and no weight control, whatever the rung says', () => {
    const target = nextSetTarget(slot, [], 0, { loaded: false, startWeightKg: null })

    expect(target.loaded).toBe(false)
    expect(target.weightKg).toBeNull()
    expect(target.prescribed.weightKg).toBeNull()
    // The reps are still the slot's.
    expect(target.reps).toBe(12)
  })

  it('a loaded substitute with no history still has the control, and nothing to put in it', () => {
    const target = nextSetTarget(slot, [], 0, { loaded: true, startWeightKg: null })

    expect(target.loaded).toBe(true)
    expect(target.weightKg).toBeNull()
    expect(target.prescribed.weightKg).toBeNull()
    expect(target.reps).toBe(12)
  })

  it("a loaded substitute with a suggested start is offered that start, never the slot's rung", () => {
    // (No production path sets one while the suggestion is disabled; Phase 2b.1 will.)
    const target = nextSetTarget(slot, [], 0, { loaded: true, startWeightKg: 29.75 })

    expect(target.weightKg).toBe(29.75)
    expect(target.weightKg).not.toBe(10)
  })

  it('later sets never offer the weight just lifted — set 2 is blank after set 1 (CC3)', () => {
    const lifted = [set({ weightKg: 41.75, reps: 12 })]

    expect(nextSetTarget(slot, lifted, 1, { loaded: true, startWeightKg: null }).weightKg).toBeNull()
    // And with a start, it is the start that returns — not the 41.75 just lifted.
    expect(nextSetTarget(slot, lifted, 1, { loaded: true, startWeightKg: 29.75 }).weightKg).toBe(29.75)
  })

  it('reports no weight change when there is no weight to offer — the blank is not "lighter than" what was lifted', () => {
    const lifted = [set({ weightKg: 41.75, reps: 12 })]
    const target = nextSetTarget(slot, lifted, 1, { loaded: true, startWeightKg: null })

    expect(target.delta?.weightKg ?? 0).toBe(0)
  })

  it('a set logged with no weight changes nothing: the offered weight is the start, whatever was logged', () => {
    const noWeight = [set({ weightKg: null, reps: 12 })]
    expect(nextSetTarget(slot, noWeight, 1, { loaded: true, startWeightKg: 29.75 }).weightKg).toBe(29.75)
    expect(nextSetTarget(slot, noWeight, 1, { loaded: true, startWeightKg: null }).weightKg).toBeNull()
  })

  it("without a substitute, `loaded` is exactly \"there is a weight\" — today's rule, unchanged", () => {
    expect(nextSetTarget(slot, [], 0).loaded).toBe(true)
    expect(nextSetTarget(slot, [], 0).weightKg).toBe(10)

    const bodyweight: LadderPrescription = {
      ...slot,
      exerciseId: 'inverted-row',
      setPlan: slot.setPlan.map((rung) => ({ ...rung, weightKg: null })),
      maxWeightKg: null,
      weightStepKg: null,
    }
    expect(nextSetTarget(bodyweight, [], 0).loaded).toBe(false)
    expect(nextSetTarget(bodyweight, [], 0).weightKg).toBeNull()
  })

  it('an authored exercise still carries the weight just lifted on rep-range work (unchanged)', () => {
    // The CC3 rule is for substitutes only: the authored rules still apply.
    const target = nextSetTarget(repRange, [set({ weightKg: 18, reps: 10 })], 1)
    expect(target.weightKg).toBe(18)
    expect(target.source).toBe('carried')
  })
})

/**
 * Where a "+" or "−" press lands on a blank weight (owner, 29 Oct 17:02) — a
 * convenience that is not a recommendation (coach CC3). Only a loaded substitute
 * whose target weight is blank, and only from a weight logged this session.
 * Negative controls, run 29 Oct (mutation applied, this file and
 * `SetScreen.substitute.test.tsx` run, restored):
 *   the first logged set instead of the most recent (`findLast` -> `find`)
 *                       -> "the most recent, not the first" and, on the screen,
 *                          "the most recent set, not the first"
 *   the `target.weightKg !== null` condition dropped
 *                       -> "nothing when the target already has a weight"
 *   `findLast((set) => set.weightKg !== null)` -> `.at(-1)` (a blank set erases it)
 *                       -> "skips a set logged blank" and, on the screen, the
 *                          blank-set test
 * Not controls, and why: the `substitute === undefined` and `!target.loaded`
 * conditions cannot be seen by any test (both run: all green). For an authored
 * exercise `loaded` is defined as `weightKg !== null`, so a loaded authored
 * exercise never has a blank target and the weight condition already returns
 * nothing; an unloaded substitute has no weight control and logs no weight, so
 * `findLast` already finds none. A first attempt at the second one, a unit test
 * giving an unloaded substitute a logged 41.75, did turn red under the
 * mutation, and was discarded: that input cannot occur (nothing can log a
 * weight on an unloaded substitute), so it was a control invented to make the
 * condition look guarded. The conditions are kept because they state the
 * owner's scope (substitutes only, loaded only) rather than leave it to that
 * coincidence.
 */
describe('weightPressStartKg', () => {
  const blankLoaded = { loaded: true, weightKg: null }
  const loadedSub = { loaded: true }
  const lifted = (weightKg: number | null, setIndex = 0) => set({ weightKg, setIndex })

  it("is the last weight logged for this exercise this session", () => {
    expect(weightPressStartKg(blankLoaded, [lifted(41.75)], loadedSub)).toBe(41.75)
  })

  it('the most recent, not the first', () => {
    expect(weightPressStartKg(blankLoaded, [lifted(40, 0), lifted(42, 1)], loadedSub)).toBe(42)
    // ...and not the heaviest.
    expect(weightPressStartKg(blankLoaded, [lifted(44, 0), lifted(42, 1)], loadedSub)).toBe(42)
  })

  it('skips a set logged blank: the last weight is still the last weight', () => {
    expect(weightPressStartKg(blankLoaded, [lifted(41.75, 0), lifted(null, 1)], loadedSub)).toBe(41.75)
  })

  it('is nothing before any weight has been logged — no history, no rung, no pre-swap weight', () => {
    expect(weightPressStartKg(blankLoaded, [], loadedSub)).toBeUndefined()
    expect(weightPressStartKg(blankLoaded, [lifted(null)], loadedSub)).toBeUndefined()
  })

  it('is nothing when the target already has a weight', () => {
    expect(weightPressStartKg({ loaded: true, weightKg: 29.75 }, [lifted(41.75)], loadedSub)).toBeUndefined()
  })

  it('is nothing for an unloaded substitute, whose sets carry no weight', () => {
    expect(weightPressStartKg({ loaded: false, weightKg: null }, [lifted(null), lifted(null, 1)], { loaded: false })).toBeUndefined()
  })

  it('is nothing for an authored exercise, whatever it carries', () => {
    expect(weightPressStartKg({ loaded: true, weightKg: 12 }, [lifted(10)], undefined)).toBeUndefined()
    // The real target of an authored ladder: it has a weight, so no press start.
    const target = nextSetTarget(ladder, [lifted(20)], 1)
    expect(weightPressStartKg(target, [lifted(20)], undefined)).toBeUndefined()
  })
})

