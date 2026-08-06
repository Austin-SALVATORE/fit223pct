import { describe, expect, it } from 'vitest'
import { nextSetTarget } from './nextSetTarget'
import type { LadderPrescription, LoggedSet, RepRangePrescription, SetTarget } from './types'

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

/**
 * docs/design/SessionSetCustomization.md §4 — a custom slot (`Add Set`) on
 * a ladder is never offered as a rung, even though the prescription has
 * one. `ladder.sets` (3) is where custom indices start, matching
 * workout.ts's `plannedSetIndices`.
 */
describe('a custom slot on a ladder carries, never offers a rung', () => {
  it('inherits the most recently logged set in this session', () => {
    const target = nextSetTarget(ladder, [set({ weightKg: 12.5, reps: 9 })], [], 3, 'steady')

    expect(target.weightKg).toBe(12.5)
    expect(target.reps).toBe(9)
    expect(target.source).toBe('carried')
    // Never the pyramid's own progression state — a custom set isn't part of it.
    expect(target.progressionType).toBeNull()
  })

  it('falls back to the first prescribed level when nothing has been logged yet this session', () => {
    const target = nextSetTarget(ladder, [], [], 3, 'steady')

    expect(target.weightKg).toBe(20) // ladder.setPlan[0].weightKg
    expect(target.reps).toBe(12) // ladder.setPlan[0].reps
  })

  it('never carries a variant chip — a custom set has no rung to read one from', () => {
    const withVariant: LadderPrescription = {
      ...ladder,
      setPlan: ladder.setPlan.map((rung) => ({ ...rung, variantKey: 'slow' as const })),
    }
    const target = nextSetTarget(withVariant, [set({ weightKg: 12.5, reps: 9 })], [], 3, 'steady')
    expect(target.variantKey).toBeUndefined()
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
      const target = nextSetTarget(ladder, [set({ weightKg: 99, reps: 99 })], [], setIndex, 'steady')
      expect(target.prescribed.weightKg, `set ${setIndex + 1}`).toBe(target.weightKg)
      expect(target.prescribed.reps, `set ${setIndex + 1}`).toBe(target.reps)
    }
  })

  it('still diverges from the offered value for rep-range work', () => {
    // Where the field earns its place: rep-range carrying means "what you were
    // told" and "what you are offered" are genuinely different numbers, and a
    // caption that wants the prescription cannot read the offered value.
    const target = nextSetTarget(repRange, [set({ weightKg: 18, reps: 10 })], [], 1, 'steady')

    expect(target.weightKg).toBe(18)
    expect(target.prescribed.weightKg).toBe(16)
    expect(target.prescribed.weightKg).not.toBe(target.weightKg)
  })
})

/**
 * The Yellow-day defect, docs/design/Mesocycle2Implementation.md §2.1/§4/
 * §12.1. `applyReadiness` (adjustments.ts) truncates a ladder's top rung
 * *before* `suggestLadderProgression` ever sees it, so the completion gate
 * only checks the rungs that survived truncation — it cannot see that the
 * removed rung is the one actually missed last week. The athlete who
 * missed the top rung (the single most likely reason to be on an eased day
 * this week) was being offered an *advance* on their worst day.
 *
 * **This has to be an end-to-end test through `nextSetTarget`, not just a
 * unit test on `suggestLadderProgression`.** The actual defect was a
 * missing argument at the call site (`nextSetTarget.ts:112` was not
 * forwarding `readinessTier`) — a domain-only test that constructs its own
 * call to `suggestLadderProgression` would stay green even if that call
 * site regressed. Negative control: comment out the third argument at
 * `nextSetTarget.ts:112` and both tests below must go red.
 */
describe('the Yellow-day fix — an eased day defers, never inflates, an offered ladder', () => {
  it("matches the plan's own cited example — Shoulder Press 6/8/10, rungs 1-2 complete, rung 3 missed last week: an eased day offers [6, 8], never [8, 10]", () => {
    // The eased prescription itself, as applyReadiness would have produced
    // it — top rung already dropped before nextSetTarget ever runs.
    const shoulderPress: LadderPrescription = {
      exerciseId: 'dumbbell-shoulder-press',
      sets: 2,
      mode: 'reps',
      setPlan: [
        { weightKg: 6, reps: 12 },
        { weightKg: 8, reps: 10 },
      ],
      restSeconds: 90,
      perSide: false,
      maxWeightKg: 15,
      weightStepKg: 2,
    }
    // Last week's full, untruncated 3-rung ladder: rungs 1-2 met their reps,
    // rung 3 (10kg x 8) fell short.
    const previousSets: LoggedSet[] = [
      set({ setIndex: 0, weightKg: 6, reps: 12 }),
      set({ setIndex: 1, weightKg: 8, reps: 10 }),
      set({ setIndex: 2, weightKg: 10, reps: 6 }),
    ]

    const rung1 = nextSetTarget(shoulderPress, [], previousSets, 0, 'easier')
    const rung2 = nextSetTarget(shoulderPress, [], previousSets, 1, 'easier')

    expect([rung1.weightKg, rung2.weightKg]).toEqual([6, 8])
    expect([rung1.weightKg, rung2.weightKg]).not.toEqual([8, 10])
    expect([rung1.reps, rung2.reps]).toEqual([12, 10])
  })

  /**
   * Table-drives the fix over every weighted pyramid named in the plan's
   * §2.1 sweep — the same measurement that found 7 of 14 inflating,
   * converted from a scratchpad script into a standing guard.
   *
   * **Weights are cited from §2.1's own published table; reps are not** —
   * the plan's table records weights only, and the Mesocycle 2 Build
   * program itself is not seeded yet (item 8/9 of the same plan, a
   * separate, later batch). Inventing real coach-authored rep counts here
   * would be asserting training content nobody has verified; a fixed
   * descending pattern is scaffolding to drive the mechanism, not a claim
   * about the coach's actual prescription. The real per-exercise
   * conformance test (§12.2) belongs with the seed that supplies real reps.
   *
   * `maxWeightKg: 999` is deliberate, not an oversight: production's real
   * 15kg ceiling happens to mask 3 of the four 4-rung pyramids here (§2.1),
   * which is what makes the defect dangerous rather than reassuring. This
   * sweep exists to prove the mechanism itself, independent of whichever
   * pyramids the ceiling happens to protect this tier.
   */
  it('table-drives the fix over every weighted pyramid in §2.1, for every rung count present (2, 3 and 4)', () => {
    const pyramids: { name: string; weights: number[] }[] = [
      { name: 'A1 Incline DB Bench Press', weights: [10, 12, 14, 15] },
      { name: 'A2 Single-arm DB Row', weights: [10, 12, 14, 15] },
      { name: 'A3 Dumbbell Fly', weights: [4, 6] },
      { name: 'A4 Chest-supported Row', weights: [10, 12] },
      { name: 'A6 DB Lateral Raise (Mon)', weights: [6, 8] },
      { name: 'B1 Bulgarian Split Squat', weights: [8, 10, 12] },
      { name: 'B2 DB Romanian Deadlift', weights: [10, 12, 14, 15] },
      { name: 'B4 Standing Calf Raise', weights: [8, 10, 12] },
      { name: 'B6 Dumbbell Pullover', weights: [8, 10] },
      { name: 'C1 DB Shoulder Press', weights: [6, 8, 10] },
      { name: 'C2 DB Lateral Raise (Fri)', weights: [4, 6, 8] },
      { name: 'C3 Rear Delt Fly', weights: [4, 6, 8] },
      { name: 'C4 Dumbbell Curl', weights: [8, 10, 12] },
      { name: 'C5 OH Triceps Extension', weights: [10, 12, 14] },
    ]
    const illustrativeReps = [12, 10, 8, 6] // descending, scaffolding only — see note above

    for (const { name, weights } of pyramids) {
      const authoredReps = illustrativeReps.slice(0, weights.length)
      const authored: SetTarget[] = weights.map((weightKg, i) => ({ weightKg, reps: authoredReps[i] }))
      const truncated = authored.slice(0, -1)
      const prescription: LadderPrescription = {
        exerciseId: name,
        sets: truncated.length,
        mode: 'reps',
        setPlan: truncated,
        restSeconds: 90,
        perSide: false,
        maxWeightKg: 999,
        weightStepKg: 2,
      }
      // Last week's full, untruncated ladder: every rung but the top met
      // its reps; the top rung — the one truncation just removed — fell
      // short by 2.
      const previousSets: LoggedSet[] = authored.map((rung, i) =>
        set({
          setIndex: i,
          weightKg: rung.weightKg,
          reps: i === authored.length - 1 ? rung.reps - 2 : rung.reps,
        }),
      )

      for (let setIndex = 0; setIndex < truncated.length; setIndex++) {
        const target = nextSetTarget(prescription, [], previousSets, setIndex, 'easier')
        expect(target.weightKg, `${name} rung ${setIndex + 1}`).toBe(truncated[setIndex].weightKg)
        expect(target.reps, `${name} rung ${setIndex + 1}`).toBe(truncated[setIndex].reps)
      }
    }
  })
})

/**
 * docs/design/Mesocycle2Implementation.md §6.1 — `SetTarget.variantKey`
 * has to reach the UI through this exact function, the same reason
 * `prescribed` and `progressionType` are exposed here rather than
 * recomputed by a screen: two screens calling `suggestLadderProgression`
 * independently could resolve two different variants for the same rung.
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
    const rung1 = nextSetTarget(withVariants, [], [], 0)
    const rung2 = nextSetTarget(withVariants, [], [], 1)

    expect(rung1.variantKey).toBe('normal')
    expect(rung2.variantKey).toBe('slow')
  })

  it('is undefined for a ladder whose rungs carry no variant — most rungs vary only by load', () => {
    const target = nextSetTarget(ladder, [], [], 0)
    expect(target.variantKey).toBeUndefined()
  })
})
