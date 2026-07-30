import { describe, expect, it } from 'vitest'
import { bodyFatGoalProgress, weightGoalProgress } from './goals'
import type { ResolvedProfile } from './profile'
import type { Trend } from './trends'

function profile(overrides: Partial<ResolvedProfile> = {}): ResolvedProfile {
  return {
    heightCm: 178,
    age: 36,
    sex: 'male',
    activityLevel: null,
    currentWeightKg: 84,
    currentBodyFatPercent: null,
    targetWeightKg: null,
    targetBodyFatPercent: null,
    confirmed: true,
    ...overrides,
  }
}

const decreasing: Trend = {
  status: 'decreasing',
  unit: 'kg',
  evidence: [
    { date: '2026-07-01', value: 86 },
    { date: '2026-07-10', value: 85 },
    { date: '2026-07-20', value: 84 },
  ],
}

const notEnoughYet: Trend = {
  status: 'insufficient-data',
  reason: { key: 'domain:trends.needMoreWeightData' },
}

describe('goal progress is a distance', () => {
  it('reports the signed remaining distance in the measurement unit', () => {
    const progress = weightGoalProgress(profile({ targetWeightKg: 78 }), decreasing)

    expect(progress).toEqual({
      current: 84,
      target: 78,
      remaining: -6,
      direction: 'decreasing',
    })
  })

  it('signs the distance so above and below target are distinguishable', () => {
    const below = weightGoalProgress(profile({ currentWeightKg: 74, targetWeightKg: 78 }), decreasing)
    expect(below?.remaining).toBe(4)
  })

  it('carries no field that could hold a duration or a date', () => {
    const progress = weightGoalProgress(profile({ targetWeightKg: 78 }), decreasing)

    // The structural half of the predict-nothing rule, asserted at runtime as
    // well as by the guard test: there is nowhere to put "by March".
    expect(Object.keys(progress!).sort()).toEqual(['current', 'direction', 'remaining', 'target'])
  })
})

describe('direction comes from the measurements, not from the goal', () => {
  it('reports movement away from the target honestly', () => {
    // Gaining while trying to lose. Reporting direction from the goal would
    // say "decreasing" because that is the intent; the measurements say
    // otherwise and the user is entitled to know.
    const gaining: Trend = {
      status: 'increasing',
      unit: 'kg',
      evidence: [
        { date: '2026-07-01', value: 82 },
        { date: '2026-07-10', value: 83 },
        { date: '2026-07-20', value: 84 },
      ],
    }
    const progress = weightGoalProgress(profile({ targetWeightKg: 78 }), gaining)

    expect(progress?.direction).toBe('increasing')
    expect(progress?.remaining).toBe(-6)
  })

  it('has no direction at all until there is enough data to claim one', () => {
    const progress = weightGoalProgress(profile({ targetWeightKg: 78 }), notEnoughYet)

    // The distance is still real and still shown; only the direction is
    // withheld, which is the missing-data contract applied field by field.
    expect(progress?.remaining).toBe(-6)
    expect(progress?.direction).toBeNull()
  })
})

describe('no target, no progress', () => {
  it('returns null without a target', () => {
    expect(weightGoalProgress(profile(), decreasing)).toBeNull()
  })

  it('returns null without a current measurement', () => {
    expect(
      weightGoalProgress(profile({ currentWeightKg: null, targetWeightKg: 78 }), decreasing),
    ).toBeNull()
  })

  it('returns null for an unconfirmed profile, because the target is untrusted', () => {
    // resolveProfile already nulls the target when the profile has never been
    // confirmed, so this falls out of the contract rather than needing its own
    // check here — which is the point of gating in one place.
    expect(weightGoalProgress(profile({ targetWeightKg: null }), decreasing)).toBeNull()
  })
})

describe('body-fat goals work the same way', () => {
  it('reports a signed distance in percent', () => {
    const trend: Trend = {
      status: 'decreasing',
      unit: 'percent',
      evidence: [
        { date: '2026-07-01', value: 24 },
        { date: '2026-07-10', value: 23 },
        { date: '2026-07-20', value: 22 },
      ],
    }
    const progress = bodyFatGoalProgress(
      profile({ currentBodyFatPercent: 22, targetBodyFatPercent: 18 }),
      trend,
    )

    expect(progress?.remaining).toBe(-4)
    expect(progress?.direction).toBe('decreasing')
  })

  it('is null without a body-fat reading, however clear the target is', () => {
    expect(
      bodyFatGoalProgress(profile({ currentBodyFatPercent: null, targetBodyFatPercent: 18 }), decreasing),
    ).toBeNull()
  })
})
