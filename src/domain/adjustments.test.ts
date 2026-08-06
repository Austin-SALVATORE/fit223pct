import { describe, expect, it } from 'vitest'
import { applyReadiness } from './adjustments'
import type { Readiness } from './readiness'
import type { LadderPrescription, RepRangePrescription, SessionTemplate } from './types'

function prescription(
  exerciseId: string,
  overrides: Partial<RepRangePrescription> = {},
): RepRangePrescription {
  return {
    exerciseId,
    sets: 3,
    mode: 'reps',
    range: { min: 8, max: 12 },
    restSeconds: 120,
    perSide: false,
    role: 'main',
    startWeightKg: 14,
    maxWeightKg: 20,
    weightStepKg: 2,
    ...overrides,
  }
}

function ladder(
  exerciseId: string,
  setPlan: LadderPrescription['setPlan'],
  overrides: Partial<LadderPrescription> = {},
): LadderPrescription {
  return {
    exerciseId,
    sets: setPlan.length,
    mode: 'reps',
    restSeconds: 120,
    perSide: false,
    role: 'main',
    setPlan,
    maxWeightKg: 20,
    weightStepKg: 2,
    ...overrides,
  }
}

const threeRungLadder = () => ladder('bench-press', [
  { weightKg: 8, reps: 12 },
  { weightKg: 10, reps: 10 },
  { weightKg: 12, reps: 8 },
])

const session: SessionTemplate = {
  id: 'A',
  name: 'Session A',
  focus: 'Squat & pull',
  items: [
    prescription('goblet-squat'),
    prescription('band-pull-apart', { role: 'accessory', sets: 2, restSeconds: 60 }),
    prescription('dead-bug', { role: 'accessory', sets: 1, restSeconds: 60 }),
  ],
}

function readiness(tier: Readiness['tier'], consecutiveLowDays = tier === 'easier' ? 1 : 0): Readiness {
  return {
    tier,
    drivers: tier === 'easier' ? [{ signal: 'sleep' }] : [],
    consecutiveLowDays,
  }
}

describe('applyReadiness', () => {
  it('leaves the session untouched on ready and steady days — silence is calm', () => {
    for (const tier of ['ready', 'steady'] as const) {
      const result = applyReadiness(session, readiness(tier))
      expect(result.session).toEqual(session)
      expect(result.adjustments).toEqual([])
    }
  })

  it('drops the last set of accessories only — never rep-range main lifts, never below one set', () => {
    const result = applyReadiness(session, readiness('easier'))
    const [main, accessory, singleSetAccessory] = result.session.items
    expect(main.sets).toBe(3)
    expect(accessory.sets).toBe(1)
    expect(singleSetAccessory.sets).toBe(1)
  })

  it('treats prescriptions without a role as main lifts (older snapshots)', () => {
    const legacy: SessionTemplate = {
      ...session,
      items: [prescription('goblet-squat', { role: undefined })],
    }
    const result = applyReadiness(legacy, readiness('easier'))
    expect(result.session.items[0].sets).toBe(3)
  })

  it('drops the top rung of a ladder on an easier day', () => {
    const withLadder: SessionTemplate = { ...session, items: [threeRungLadder()] }
    const result = applyReadiness(withLadder, readiness('easier'))
    const item = result.session.items[0]
    expect(item.setPlan).toEqual([
      { weightKg: 8, reps: 12 },
      { weightKg: 10, reps: 10 },
    ])
    expect(item.sets).toBe(2)
  })

  /**
   * docs/design/Mesocycle2Implementation.md §5/§12.3 — owner ruling: the
   * floor moved from two rungs to one, so §15's "a two-level Pyramid
   * becomes one" is representable. The floor itself did not disappear —
   * a one-rung ladder is still a floor, just a lower one.
   */
  it('never drops a ladder below one rung', () => {
    const oneRung = ladder('bench-press', [{ weightKg: 8, reps: 12 }])
    const result = applyReadiness({ ...session, items: [oneRung] }, readiness('easier'))
    const item = result.session.items[0]
    expect(item.setPlan).toHaveLength(1)
    expect(item.sets).toBe(1)
  })

  // Negative control for the floor itself, run and watched red before this
  // landed: setting MIN_LADDER_RUNGS to 0 let a one-rung ladder's own
  // (only) rung be sliced away, leaving `setPlan` empty — this test caught
  // it immediately (`toHaveLength(1)` received 0).

  /**
   * The inverse of the retired "reports zero adjustments" assertion —
   * proof this is a floor *move*, not a deletion. A two-rung ladder used
   * to be the floor and reported nothing; now it eases the same way a
   * three-rung ladder always has.
   */
  it('now eases a two-rung ladder to one rung and reports an adjustment — the old floor case, inverted', () => {
    const twoRung = ladder('bench-press', [
      { weightKg: 8, reps: 12 },
      { weightKg: 10, reps: 10 },
    ])
    const result = applyReadiness({ ...session, items: [twoRung] }, readiness('easier'))
    const item = result.session.items[0]
    expect(item.setPlan).toEqual([{ weightKg: 8, reps: 12 }])
    expect(item.sets).toBe(1)
    expect(result.adjustments).toHaveLength(1)
  })

  it('reports one adjustment line for a session with only ladder items', () => {
    const result = applyReadiness({ ...session, items: [threeRungLadder()] }, readiness('easier'))
    expect(result.adjustments).toHaveLength(1)
  })

  it('reports zero adjustments — honestly — when nothing in the session actually changes', () => {
    // A ladder already at the new 1-rung floor and no accessories: nothing
    // left for readiness to ease off. The tier itself still displays
    // elsewhere; this only governs the session-specific "Adjusted" badge.
    const oneRung = ladder('bench-press', [{ weightKg: 8, reps: 12 }])
    const result = applyReadiness({ ...session, items: [oneRung] }, readiness('easier'))
    expect(result.adjustments).toEqual([])
  })

  it('explains every adjustment with a driver-derived reason, keyed by signal — never a label', () => {
    const result = applyReadiness(session, readiness('easier'))
    expect(result.adjustments.length).toBeGreaterThan(0)
    for (const adjustment of result.adjustments) {
      expect(adjustment.reason.params?.driversKey).toBe('domain:readiness.drivers.one')
      expect(adjustment.reason.params?.signal).toBe('sleep')
    }
  })

  it('does not mutate the input session', () => {
    const before = JSON.parse(JSON.stringify(session)) as SessionTemplate
    applyReadiness(session, readiness('easier'))
    expect(session).toEqual(before)
  })
})
