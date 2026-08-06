import { describe, expect, it } from 'vitest'
import { suggestLadderProgression, suggestProgression } from './progression'
import type { LadderPrescription, LoggedSet, RepRangePrescription } from './types'

const prescription: RepRangePrescription = {
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

function set(reps: number, weightKg: number): LoggedSet {
  return {
    setIndex: 0,
    reps,
    weightKg,
    seconds: null,
    completedAt: '2026-07-22T18:00:00.000Z',
  }
}

describe('suggestProgression', () => {
  it('starts from the prescribed weight when there is no history', () => {
    const s = suggestProgression(prescription, [])
    expect(s.type).toBe('start')
    expect(s.weightKg).toBe(16)
    expect(s.targetReps).toBe(8)
  })

  it('adds load when every set hits the top of the range', () => {
    const s = suggestProgression(prescription, [
      set(12, 16),
      set(12, 16),
      set(12, 16),
    ])
    expect(s.type).toBe('increase-load')
    expect(s.weightKg).toBe(18)
    expect(s.targetReps).toBe(8)
  })

  it('adds reps when the range is not yet filled', () => {
    const s = suggestProgression(prescription, [
      set(12, 16),
      set(10, 16),
      set(9, 16),
    ])
    expect(s.type).toBe('add-reps')
    expect(s.weightKg).toBe(16)
    expect(s.targetReps).toBe(10)
  })

  it('switches to technique progression at the equipment ceiling', () => {
    const s = suggestProgression(prescription, [
      set(12, 20),
      set(12, 20),
      set(12, 20),
    ])
    expect(s.type).toBe('add-technique')
    expect(s.weightKg).toBe(20)
  })

  it('never suggests adding load on an easier readiness day — consolidates instead', () => {
    const s = suggestProgression(
      prescription,
      [set(12, 16), set(12, 16), set(12, 16)],
      'easier',
    )
    expect(s.type).toBe('consolidate')
    expect(s.weightKg).toBe(16)
  })

  it('still allows adding reps within the range on an easier day', () => {
    const s = suggestProgression(prescription, [set(10, 16), set(9, 16)], 'easier')
    expect(s.type).toBe('add-reps')
  })

  it('progresses band/bodyweight work through reps then technique', () => {
    const bandWork: RepRangePrescription = {
      ...prescription,
      exerciseId: 'band-pull-apart',
      range: { min: 15, max: 20 },
      startWeightKg: null,
      maxWeightKg: null,
      weightStepKg: null,
    }
    const below = suggestProgression(bandWork, [set(16, 0), set(15, 0)])
    expect(below.type).toBe('add-reps')

    const topped = suggestProgression(bandWork, [set(20, 0), set(20, 0)])
    expect(topped.type).toBe('add-technique')
  })
})

describe('suggestLadderProgression', () => {
  const ladder: LadderPrescription = {
    exerciseId: 'bench-press',
    sets: 3,
    mode: 'reps',
    restSeconds: 120,
    perSide: false,
    setPlan: [
      { weightKg: 8, reps: 12 },
      { weightKg: 10, reps: 10 },
      { weightKg: 12, reps: 8 },
    ],
    maxWeightKg: 14,
    weightStepKg: 2,
  }

  function ladderSet(setIndex: number, reps: number, weightKg: number): LoggedSet {
    return { setIndex, reps, weightKg, seconds: null, completedAt: '2026-07-22T18:00:00.000Z' }
  }

  it('repeats the same targets with no history', () => {
    const result = suggestLadderProgression(ladder, [])
    expect(result).toEqual({ type: 'repeat', setPlan: ladder.setPlan })
  })

  it('repeats unchanged when any rung falls short of its target reps', () => {
    const result = suggestLadderProgression(ladder, [
      ladderSet(0, 12, 8),
      ladderSet(1, 9, 10), // short of 10
      ladderSet(2, 8, 12),
    ])
    expect(result).toEqual({ type: 'repeat', setPlan: ladder.setPlan })
  })

  it('advances every rung by weightStepKg when every rung hits its target', () => {
    const result = suggestLadderProgression(ladder, [
      ladderSet(0, 12, 8),
      ladderSet(1, 10, 10),
      ladderSet(2, 8, 12),
    ])
    expect(result).toEqual({
      type: 'advance',
      setPlan: [
        { weightKg: 10, reps: 12 },
        { weightKg: 12, reps: 10 },
        { weightKg: 14, reps: 8 },
      ],
    })
  })

  it('holds the whole ladder unchanged at the equipment ceiling — never a partial advance', () => {
    const atCap: LadderPrescription = { ...ladder, maxWeightKg: 12 }
    const result = suggestLadderProgression(atCap, [
      ladderSet(0, 12, 8),
      ladderSet(1, 10, 10),
      ladderSet(2, 8, 12),
    ])
    expect(result.type).toBe('at-equipment-max')
    // The whole ladder holds — rungs 1 and 2 do NOT advance just because
    // they individually had room; only the top rung's cap decides.
    expect(result.setPlan).toEqual(atCap.setPlan)
  })

  it('treats a null maxWeightKg/weightStepKg as at the ceiling, same as rep-range add-technique', () => {
    const noStep: LadderPrescription = { ...ladder, weightStepKg: null }
    const result = suggestLadderProgression(noStep, [
      ladderSet(0, 12, 8),
      ladderSet(1, 10, 10),
      ladderSet(2, 8, 12),
    ])
    expect(result.type).toBe('at-equipment-max')
  })

  /**
   * docs/design/Mesocycle2Implementation.md §2.1/§4 — the Yellow-day
   * defect. `applyReadiness` truncates a ladder's top rung *before*
   * `suggestLadderProgression` ever sees it, so the completion gate above
   * only checks the rungs that survived — it never learns the removed rung
   * is the one that was actually missed. Without forwarding `readinessTier`
   * here, every rung that DID survive truncation reads as "completed" and
   * the ceiling/advance branch below fires, offering a heavier ladder on
   * the athlete's worst day.
   */
  it('defers an earned advance on an easier day, even when every surviving rung was completed', () => {
    const result = suggestLadderProgression(
      ladder,
      [ladderSet(0, 12, 8), ladderSet(1, 10, 10), ladderSet(2, 8, 12)],
      'easier',
    )
    expect(result).toEqual({ type: 'repeat', setPlan: ladder.setPlan })
  })

  it('still repeats on an easier day when a surviving rung was NOT completed — both paths land on repeat, not just the happy one', () => {
    const result = suggestLadderProgression(
      ladder,
      [ladderSet(0, 12, 8), ladderSet(1, 9, 10), ladderSet(2, 8, 12)], // short of 10
      'easier',
    )
    expect(result).toEqual({ type: 'repeat', setPlan: ladder.setPlan })
  })

  it('still advances on a steady day — the fix only changes the easier-tier branch', () => {
    const result = suggestLadderProgression(
      ladder,
      [ladderSet(0, 12, 8), ladderSet(1, 10, 10), ladderSet(2, 8, 12)],
      'steady',
    )
    expect(result.type).toBe('advance')
  })

  it('still advances with no readinessTier argument at all — the default stays backward-compatible', () => {
    const result = suggestLadderProgression(ladder, [
      ladderSet(0, 12, 8),
      ladderSet(1, 10, 10),
      ladderSet(2, 8, 12),
    ])
    expect(result.type).toBe('advance')
  })

  /**
   * §4.1's claim, verified rather than trusted: "the earned increase is
   * deferred, not lost." Composed from the plain shipped mechanics, not a
   * new branch — a Yellow week's workout snapshot carries only the
   * *truncated* ladder, so the athlete only ever logs sets for the rungs
   * that were offered. The following week's prescription is the full,
   * untruncated ladder again (each session snapshots its own prescription
   * independently), so its completion gate finds no logged set at the
   * restored top-rung index and returns 'repeat' — same as any other
   * incomplete ladder. No stored "deferred" flag, no special case.
   */
  it('resumes the deferred increase once a full ladder is logged again — never lost, never invented', () => {
    // Yellow week: only the two surviving rungs were ever offered, so only
    // two sets exist in history — there is nothing logged at index 2.
    const lastWeeksTruncatedHistory = [ladderSet(0, 12, 8), ladderSet(1, 10, 10)]

    // This week's prescription is the full, untruncated 3-rung ladder
    // (today isn't eased, or applyReadiness would truncate it again before
    // this ever runs) — checked against last week's incomplete history.
    const result = suggestLadderProgression(ladder, lastWeeksTruncatedHistory)

    // Not lost: still the same full 3-rung ladder, not silently dropped to
    // two rungs forever.
    expect(result).toEqual({ type: 'repeat', setPlan: ladder.setPlan })
  })

  /**
   * The owner's rung-floor ruling (docs/design/Mesocycle2Implementation.md
   * §5, adjustments.ts's MIN_LADDER_RUNGS: 2 -> 1) named two conditions,
   * and this is the first: "progression is disabled for that exercise on
   * that day." Composes both changes together rather than trusting either
   * one to imply the other — a two-rung ladder eased down to its single
   * surviving rung, that one rung completed, must still not advance.
   * Without this item's fix, `suggestLadderProgression` would see a
   * "completed" one-rung ladder and offer a heavier single rung on the
   * athlete's worst day — the exact defect this item exists to close,
   * now also proven at the new one-rung floor the other item introduces.
   */
  it('a two-rung ladder eased to one rung, and that rung completed, still does not advance on an easier day', () => {
    const twoRungLadder: LadderPrescription = {
      exerciseId: 'lateral-raise',
      sets: 2,
      mode: 'reps',
      setPlan: [
        { weightKg: 6, reps: 15 },
        { weightKg: 8, reps: 12 },
      ],
      restSeconds: 60,
      perSide: false,
      maxWeightKg: 15,
      weightStepKg: 2,
    }
    // applyReadiness has already truncated this to its one surviving rung
    // by the time suggestLadderProgression ever sees it.
    const eased: LadderPrescription = { ...twoRungLadder, setPlan: [twoRungLadder.setPlan[0]], sets: 1 }
    // That single rung was completed last time it was offered.
    const previousSets = [ladderSet(0, 15, 6)]

    const result = suggestLadderProgression(eased, previousSets, 'easier')

    expect(result).toEqual({ type: 'repeat', setPlan: eased.setPlan })
  })
})
