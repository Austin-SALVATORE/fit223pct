import { describe, expect, it } from 'vitest'
import { applyReadiness } from './adjustments'
import type { Readiness } from './readiness'
import type { ExercisePrescription, SessionTemplate } from './types'

function prescription(
  exerciseId: string,
  overrides: Partial<ExercisePrescription> = {},
): ExercisePrescription {
  return {
    exerciseId,
    sets: 3,
    mode: 'reps',
    range: { min: 8, max: 12 },
    targetRir: 2,
    restSeconds: 120,
    perSide: false,
    role: 'main',
    startWeightKg: 14,
    maxWeightKg: 20,
    weightStepKg: 2,
    ...overrides,
  }
}

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

  it('adds one rep in reserve to every exercise on an easier day', () => {
    const result = applyReadiness(session, readiness('easier'))
    for (const item of result.session.items) {
      expect(item.targetRir).toBe(3)
    }
  })

  it('caps target RIR at 4', () => {
    const highRir: SessionTemplate = {
      ...session,
      items: [prescription('goblet-squat', { targetRir: 4 })],
    }
    const result = applyReadiness(highRir, readiness('easier'))
    expect(result.session.items[0].targetRir).toBe(4)
  })

  it('drops the last set of accessories only — never main lifts, never below one set', () => {
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
