import { describe, expect, it } from 'vitest'
import {
  carryForwardPrescription,
  isCompleteExposure,
  isLoadCarryForwardExcluded,
  carrySessionForward,
  mostRecentCompleteExposureFor,
  projectExposureAcrossRevision,
} from './carryForward'
import type { ExercisePrescription, LadderPrescription, LoggedSet, RepRangePrescription, Workout, WorkoutExercise } from './types'

/**
 * Progression replacement, Phase 2 (`~/.claude/plans/
 * progression-carry-forward.md` §1/§2/§8) — the §0.3 prototype table as
 * fixtures, plus the three Q1 edge cases and the technique-gate, per the
 * coach's 28 Aug follow-up ruling. Nothing here is wired into the app —
 * `carryForward.ts`'s own docblock states why.
 */

function ladderPrescription(overrides: Partial<LadderPrescription> = {}): LadderPrescription {
  return {
    exerciseId: 'goblet-squat',
    sets: 3,
    mode: 'reps',
    restSeconds: 120,
    perSide: false,
    setPlan: [
      { weightKg: 14, reps: 12 },
      { weightKg: 16, reps: 10 },
      { weightKg: 18, reps: 8 },
    ],
    maxWeightKg: 38,
    weightStepKg: 2,
    ...overrides,
  }
}

function repRangePrescription(overrides: Partial<RepRangePrescription> = {}): RepRangePrescription {
  return {
    exerciseId: 'reverse-lunge',
    sets: 3,
    mode: 'reps',
    restSeconds: 90,
    perSide: true,
    range: { min: 10, max: 14 },
    startWeightKg: 10,
    maxWeightKg: 20,
    weightStepKg: 2,
    ...overrides,
  }
}

function loggedSet(
  setIndex: number,
  weightKg: number | null,
  reps: number | null,
  seconds: number | null = null,
  custom?: true,
): LoggedSet {
  return {
    setIndex,
    weightKg,
    reps,
    seconds,
    completedAt: '2026-07-22T18:10:00.000Z',
    ...(custom ? { custom } : {}),
  }
}

function exposure(
  prescription: ExercisePrescription,
  sets: LoggedSet[],
  overrides: Partial<WorkoutExercise> = {},
): WorkoutExercise {
  return { exerciseId: prescription.exerciseId, prescription, sets, ...overrides }
}

function workout(
  id: string,
  programId: string,
  date: string,
  completedAt: string | null,
  exercises: WorkoutExercise[],
): Workout {
  return {
    id,
    programId,
    sessionTemplateId: 'session-1',
    date,
    startedAt: `${date}T09:00:00.000Z`,
    completedAt,
    exercises,
  }
}

describe('carryForwardPrescription', () => {
  it('no history returns the authored prescription unchanged', () => {
    const authored = ladderPrescription()
    expect(carryForwardPrescription(authored, null)).toBe(authored)
  })

  it('an exactly-executed three-rung ladder returns an identical setPlan (identity)', () => {
    const authored = ladderPrescription()
    const previous = exposure(authored, [loggedSet(0, 14, 12), loggedSet(1, 16, 10), loggedSet(2, 18, 8)])

    const result = carryForwardPrescription(authored, previous) as LadderPrescription
    expect(result.setPlan).toEqual(authored.setPlan)
    expect(result.sets).toBe(result.setPlan.length)
  })

  it('over-performance in load carries — one rung logged 2 kg heavier than authored', () => {
    const authored = ladderPrescription()
    const previous = exposure(authored, [loggedSet(0, 16, 12), loggedSet(1, 16, 10), loggedSet(2, 18, 8)])

    const result = carryForwardPrescription(authored, previous) as LadderPrescription
    expect(result.setPlan[0]).toEqual({ weightKg: 16, reps: 12 })
  })

  it('over-performance in reps carries — one rung logged 2 reps over authored', () => {
    const authored = ladderPrescription()
    const previous = exposure(authored, [loggedSet(0, 14, 14), loggedSet(1, 16, 10), loggedSet(2, 18, 8)])

    const result = carryForwardPrescription(authored, previous) as LadderPrescription
    expect(result.setPlan[0]).toEqual({ weightKg: 14, reps: 14 })
  })

  it('over-performance in set count carries — a completed custom 4th set becomes a permanent 4th rung (coach ruling, superseding the earlier "custom sets never affect progression" text)', () => {
    const authored = ladderPrescription() // sets: 3
    const previous = exposure(
      authored,
      [loggedSet(0, 14, 12), loggedSet(1, 16, 10), loggedSet(2, 18, 8), loggedSet(3, 18, 8, null, true)],
      { customSlots: 1 },
    )

    const result = carryForwardPrescription(authored, previous) as LadderPrescription
    expect(result.sets).toBe(4)
    expect(result.setPlan).toHaveLength(4)
    expect(result.setPlan[3]).toEqual({ weightKg: 18, reps: 8 })
  })

  it('a seconds-mode ladder carries seconds, not reps — the defect class that shipped once already', () => {
    const authored = ladderPrescription({
      exerciseId: 'plank',
      mode: 'seconds',
      setPlan: [
        { weightKg: null, reps: 40 },
        { weightKg: null, reps: 50 },
        { weightKg: null, reps: 60 },
      ],
    })
    const previous = exposure(authored, [
      loggedSet(0, null, null, 45),
      loggedSet(1, null, null, 55),
      loggedSet(2, null, null, 65),
    ])

    const result = carryForwardPrescription(authored, previous) as LadderPrescription
    expect(result.setPlan).toEqual([
      { weightKg: null, reps: 45 },
      { weightKg: null, reps: 55 },
      { weightKg: null, reps: 65 },
    ])
  })

  it("a skipped level survives at authored values while the other two carry over-performance — the coach's own worked example, confirmed 28 Aug 2026 (his four named failure modes: the skip must not permanently remove the middle set, must not make it inherit zero, must not disqualify the exposure, and must not force the system to ignore valid performance from the other two)", () => {
    const authored = ladderPrescription() // 14×12 / 16×10 / 18×8
    const previous = exposure(authored, [loggedSet(0, 16, 13), loggedSet(2, 20, 9)], { skippedLevels: [1] })

    const result = carryForwardPrescription(authored, previous) as LadderPrescription
    expect(result.setPlan).toEqual([
      { weightKg: 16, reps: 13 }, // over-performed, carries
      { weightKg: 16, reps: 10 }, // skipped — authored rung 1, untouched: not zero, not deleted, not inherited
      { weightKg: 20, reps: 9 }, // over-performed, carries — the skip did not disqualify the exposure
    ])
    expect(result.setPlan).toHaveLength(3)
  })

  it('technique-gated lifts carry reps and sets but not load — weight is always the authored rung, even when the logged weight is heavier', () => {
    const authored = ladderPrescription({
      exerciseId: 'dumbbell-lateral-raise',
      sets: 2,
      setPlan: [
        { weightKg: 6, reps: 15 },
        { weightKg: 8, reps: 12 },
      ],
    })
    const previous = exposure(authored, [loggedSet(0, 8, 15), loggedSet(1, 10, 14)])

    const result = carryForwardPrescription(authored, previous) as LadderPrescription
    expect(result.setPlan).toEqual([
      { weightKg: 6, reps: 15 }, // authored weight, not the logged 8
      { weightKg: 8, reps: 14 }, // authored weight, not the logged 10 — reps still carry
    ])
    expect(isLoadCarryForwardExcluded('dumbbell-lateral-raise')).toBe(true)
    expect(isLoadCarryForwardExcluded('rear-delt-fly')).toBe(true)
    expect(isLoadCarryForwardExcluded('goblet-squat')).toBe(false)
  })

  it('a technique-gated lift with an added, completed custom set pins the new rung to the LAST AUTHORED rung — never the logged weight, even when logged heavier than any authored rung (lead ruling, 28 Aug 2026, applying the coach\'s technique-gate rather than extending it — the earlier version of this code carried the logged weight here, which was the bypass the gate exists to close)', () => {
    const authored = ladderPrescription({
      exerciseId: 'rear-delt-fly',
      sets: 2,
      setPlan: [
        { weightKg: 6, reps: 15 },
        { weightKg: 8, reps: 12 },
      ],
    })
    const previous = exposure(
      authored,
      [loggedSet(0, 6, 15), loggedSet(1, 8, 12), loggedSet(2, 12, 10, null, true)], // 12 kg logged — heavier than the last authored rung's 8
      { customSlots: 1 },
    )

    const result = carryForwardPrescription(authored, previous) as LadderPrescription
    expect(result.sets).toBe(3)
    expect(result.setPlan[2]).toEqual({ weightKg: 8, reps: 10 }) // pinned to the last authored rung's weight (8), not the logged 12
  })

  it('a rep-range authored prescription (no setPlan) still carries per-set, becoming a setPlan on first exposure — the ladder/rep-range collapse the ruling asks for', () => {
    const authored = repRangePrescription()
    const previous = exposure(authored, [loggedSet(0, 12, 12), loggedSet(1, 12, 11), loggedSet(2, 12, 14)])

    const result = carryForwardPrescription(authored, previous) as LadderPrescription
    expect(result.setPlan).toEqual([
      { weightKg: 12, reps: 12 },
      { weightKg: 12, reps: 11 },
      { weightKg: 12, reps: 14 },
    ])
    expect(result.sets).toBe(result.setPlan.length)
  })
})

describe('carryForwardPrescription — a null logged load must not erase a loaded rung', () => {
  // Owner report 20 Oct: "in a movement I can no more change the kg". A logged
  // `weightKg: null` (the exercise was bodyweight/unloaded when last performed)
  // was copied verbatim onto the rung, and SetScreen renders the weight
  // Stepper only when the target weight is non-null — so the control vanished,
  // and the next exposure (also logged null) re-carried the null forever.
  it('keeps the authored rung weight when the logged set carried no load', () => {
    const authored = ladderPrescription()
    const previous = exposure(authored, [loggedSet(0, null, 12), loggedSet(1, null, 10), loggedSet(2, null, 8)])

    const result = carryForwardPrescription(authored, previous) as LadderPrescription
    expect(result.setPlan.map((r) => r.weightKg)).toEqual([14, 16, 18])
    expect(result.setPlan.map((r) => r.reps)).toEqual([12, 10, 8])
  })

  it('keeps the last authored rung weight for a custom set logged without a load', () => {
    const authored = ladderPrescription()
    const previous = exposure(
      authored,
      [loggedSet(0, 14, 12), loggedSet(1, 16, 10), loggedSet(2, 18, 8), loggedSet(3, null, 8, null, true)],
      { customSlots: 1 },
    )
    const result = carryForwardPrescription(authored, previous) as LadderPrescription
    expect(result.setPlan[3].weightKg).toBe(18)
  })

  it('still carries null when the authored rung is itself unloaded (bodyweight)', () => {
    const authored = ladderPrescription({
      setPlan: [{ weightKg: null, reps: 10 }, { weightKg: null, reps: 10 }, { weightKg: null, reps: 10 }],
    })
    const previous = exposure(authored, [loggedSet(0, null, 12), loggedSet(1, null, 10), loggedSet(2, null, 8)])
    const result = carryForwardPrescription(authored, previous) as LadderPrescription
    expect(result.setPlan.map((r) => r.weightKg)).toEqual([null, null, null])
  })
})

describe('carrySessionForward', () => {
  it('re-applying carry over the same exposure changes nothing (the render-time carry stays safe over a stored carried plan)', () => {
    const authored = ladderPrescription()
    const previous = exposure(
      authored,
      [loggedSet(0, 16, 12), loggedSet(1, 16, 10), loggedSet(2, 18, 8), loggedSet(3, 18, 8, null, true)],
      { customSlots: 1 },
    )
    const history = [workout('w1', 'p1', '2026-07-15', '2026-07-15T10:00:00.000Z', [previous])]

    const [once] = carrySessionForward([authored], history, 'p1')
    const [twice] = carrySessionForward([once], history, 'p1')
    expect(once.sets).toBe(4)
    expect(twice).toEqual(once)
  })
})

/**
 * Revision boundary, Phase 1 (`~/.claude/plans/m2-optimization-revision-
 * boundary.md` §2 C, §6). Fixture: an overhead-press-shaped 4-rung ladder
 * the coach then cuts to 3. Old structure logged 4 sets at distinct loads so
 * every assertion can say *which* old rung a new rung came from.
 */
describe('projectExposureAcrossRevision', () => {
  const OLD = [
    { weightKg: 11.75, reps: 12 },
    { weightKg: 13.75, reps: 10 },
    { weightKg: 15.75, reps: 8 },
    { weightKg: 17.75, reps: 6 },
  ]
  const oldAuthored = () => ladderPrescription({ exerciseId: 'overhead-press', setPlan: OLD, sets: 4, role: 'main' })
  const oldLogged = [loggedSet(0, 12.5, 12), loggedSet(1, 14.5, 10), loggedSet(2, 16.5, 8), loggedSet(3, 18.5, 6)]
  const newAuthored = (carryFrom: (number | null)[], extra: Partial<LadderPrescription> = {}) =>
    ladderPrescription({
      exerciseId: 'overhead-press',
      role: 'main',
      sets: 3,
      setPlan: OLD.slice(1).map((r) => ({ ...r })),
      revision: { id: 'rev-1', carryFrom },
      ...extra,
    })
  const history = (ex: WorkoutExercise) => [workout('w-old', 'p1', '2026-07-15', '2026-07-15T10:00:00.000Z', [ex])]
  const carry = (authored: ExercisePrescription, ex: WorkoutExercise | null, past?: Workout[]) =>
    carrySessionForward([authored], ex === null ? [] : (past ?? history(ex)), 'p1')[0] as LadderPrescription

  it('T1 drop-last: 3 sets, the old 4th set is not recreated', () => {
    const authored = newAuthored([0, 1, 2], { setPlan: OLD.slice(0, 3).map((r) => ({ ...r })) })
    const result = carry(authored, exposure(oldAuthored(), oldLogged))
    expect(result.sets).toBe(3)
    expect(result.setPlan.map((r) => r.weightKg)).toEqual([12.5, 14.5, 16.5])
  })

  it('T2 drop-first: new rungs take the load of old rungs 1..3, not rung 0..', () => {
    const result = carry(newAuthored([1, 2, 3]), exposure(oldAuthored(), oldLogged))
    expect(result.sets).toBe(3)
    expect(result.setPlan.map((r) => r.weightKg)).toEqual([14.5, 16.5, 18.5])
    expect(result.setPlan.map((r) => r.reps)).toEqual([10, 8, 6])
  })

  it('T3 an old-structure custom 5th set is dropped across the boundary', () => {
    const previous = exposure(oldAuthored(), [...oldLogged, loggedSet(4, 20, 5, null, true)], { customSlots: 1 })
    const result = carry(newAuthored([1, 2, 3]), previous)
    expect(result.sets).toBe(3)
    expect(result.setPlan.map((r) => r.weightKg)).toEqual([14.5, 16.5, 18.5])
  })

  it('T4 the second exposure after the revision carries normally (marker persisted, non-identity map)', () => {
    const authored = newAuthored([1, 2, 3])
    const first = carry(authored, exposure(oldAuthored(), oldLogged))
    expect(first.revision).toEqual(authored.revision)

    // Athlete trains the stored snapshot, logging each rung 1 kg heavier.
    const secondLogged = first.setPlan.map((r, i) => loggedSet(i, (r.weightKg ?? 0) + 1, r.reps))
    const past = [
      ...history(exposure(oldAuthored(), oldLogged)),
      workout('w-new', 'p1', '2026-07-22', '2026-07-22T10:00:00.000Z', [exposure(first, secondLogged)]),
    ]
    const second = carrySessionForward([authored], past, 'p1')[0] as LadderPrescription
    // Positional, no re-projection: rung i <- logged i of the post-revision exposure.
    expect(second.setPlan.map((r) => r.weightKg)).toEqual([15.5, 17.5, 19.5])
  })

  it('T5 technique gate across a revision: load pinned to the new authored rungs, reps carry', () => {
    const gated = (carryFrom: (number | null)[]) =>
      newAuthored(carryFrom, { exerciseId: 'dumbbell-lateral-raise', role: 'accessory' })
    const old = ladderPrescription({ exerciseId: 'dumbbell-lateral-raise', setPlan: OLD, sets: 4 })
    const result = carry(gated([1, 2, 3]), exposure(old, oldLogged.map((l) => ({ ...l, weightKg: (l.weightKg ?? 0) + 4 }))))
    expect(result.setPlan.map((r) => r.weightKg)).toEqual([13.75, 15.75, 17.75])
    expect(result.setPlan.map((r) => r.reps)).toEqual([10, 8, 6])
  })

  it('T6 an all-null map restates the authored values', () => {
    const authored = newAuthored([null, null, null])
    const result = carry(authored, exposure(oldAuthored(), oldLogged))
    expect(result.setPlan).toEqual(authored.setPlan)
  })

  it('T7 no marker on either side: identical to carryForwardPrescription alone', () => {
    const authored = ladderPrescription()
    const previous = exposure(authored, [loggedSet(0, 16, 12), loggedSet(1, 16, 10), loggedSet(2, 18, 8)])
    expect(projectExposureAcrossRevision(authored, previous)).toBe(previous)
    expect(carrySessionForward([authored], history(previous), 'p1')[0]).toEqual(carryForwardPrescription(authored, previous))
  })

  it('T8 an incomplete post-revision exposure walks back and projects the old complete one', () => {
    const authored = newAuthored([1, 2, 3])
    const first = carry(authored, exposure(oldAuthored(), oldLogged))
    // Post-revision session abandoned after one set: incomplete, so not eligible.
    const partial = exposure(first, [loggedSet(0, 99, 10)])
    const past = [
      ...history(exposure(oldAuthored(), oldLogged)),
      workout('w-new', 'p1', '2026-07-22', '2026-07-22T10:00:00.000Z', [partial]),
    ]
    const result = carrySessionForward([authored], past, 'p1')[0] as LadderPrescription
    expect(result.setPlan.map((r) => r.weightKg)).toEqual([14.5, 16.5, 18.5])
  })

  it('returns null when nothing maps, and for no history', () => {
    expect(projectExposureAcrossRevision(newAuthored([null, null, null]), exposure(oldAuthored(), oldLogged))).toBeNull()
    expect(projectExposureAcrossRevision(newAuthored([1, 2, 3]), null)).toBeNull()
  })

  it('ignores a source index at or past the old structure (an old custom set)', () => {
    const previous = exposure(oldAuthored(), [...oldLogged, loggedSet(4, 20, 5, null, true)], { customSlots: 1 })
    const projected = projectExposureAcrossRevision(newAuthored([4, null, null]), previous)
    expect(projected).toBeNull()
  })
})

describe('isCompleteExposure', () => {
  const authored = ladderPrescription() // sets: 3

  it('true when every prescribed level is logged', () => {
    const full = exposure(authored, [loggedSet(0, 14, 12), loggedSet(1, 16, 10), loggedSet(2, 18, 8)])
    expect(isCompleteExposure(full)).toBe(true)
  })

  it('true when every prescribed level is logged or explicitly skipped, and at least one is logged', () => {
    const mixed = exposure(authored, [loggedSet(0, 14, 12), loggedSet(2, 18, 8)], { skippedLevels: [1] })
    expect(isCompleteExposure(mixed)).toBe(true)
  })

  it('false when a prescribed level is neither logged nor skipped', () => {
    const partial = exposure(authored, [loggedSet(0, 14, 12)]) // levels 1, 2 unaccounted for
    expect(isCompleteExposure(partial)).toBe(false)
  })

  it('false when every prescribed level is skipped and none is logged', () => {
    const allSkipped = exposure(authored, [], { skippedLevels: [0, 1, 2] })
    expect(isCompleteExposure(allSkipped)).toBe(false)
  })

  it('an unfilled custom slot does not count against completeness — only prescribed levels do', () => {
    const full = exposure(authored, [loggedSet(0, 14, 12), loggedSet(1, 16, 10), loggedSet(2, 18, 8)], {
      customSlots: 1, // opened, never logged
    })
    expect(isCompleteExposure(full)).toBe(true)
  })
})

describe('mostRecentCompleteExposureFor', () => {
  const authored = ladderPrescription()
  const complete = exposure(authored, [loggedSet(0, 14, 12), loggedSet(1, 16, 10), loggedSet(2, 18, 8)])
  const partial = exposure(authored, [loggedSet(0, 14, 12)])

  it('returns null with no history at all', () => {
    expect(mostRecentCompleteExposureFor([], 'phase-1-home', 'goblet-squat')).toBeNull()
  })

  it('skips a partial most-recent exposure in favour of an earlier complete one', () => {
    const older = workout('w-complete', 'phase-1-home', '2026-07-20', '2026-07-20T19:00:00.000Z', [complete])
    const newer = workout('w-partial', 'phase-1-home', '2026-07-22', '2026-07-22T19:00:00.000Z', [partial])

    const result = mostRecentCompleteExposureFor([older, newer], 'phase-1-home', 'goblet-squat')
    expect(result?.sets).toEqual(complete.sets)
  })

  it('returns null when a partial exposure exists but no complete one does — distinct from no history at all', () => {
    const onlyPartial = workout('w-partial-only', 'phase-1-home', '2026-07-22', '2026-07-22T19:00:00.000Z', [
      partial,
    ])
    expect(mostRecentCompleteExposureFor([onlyPartial], 'phase-1-home', 'goblet-squat')).toBeNull()
  })

  it('ignores a different program, same as previousExposureFor', () => {
    const otherProgram = workout('w-other', 'mesocycle-2-build', '2026-07-20', '2026-07-20T19:00:00.000Z', [
      complete,
    ])
    expect(mostRecentCompleteExposureFor([otherProgram], 'phase-1-home', 'goblet-squat')).toBeNull()
  })
})
