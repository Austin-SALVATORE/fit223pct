import { describe, expect, it } from 'vitest'
import { readinessFrom } from './readiness'
import type { CheckIn, Rating } from './types'

function checkIn(
  date: string,
  ratings: Partial<Record<'sleep' | 'energy' | 'soreness' | 'stress' | 'motivation', Rating>>,
): CheckIn {
  return {
    id: `c-${date}`,
    date,
    sleep: ratings.sleep ?? null,
    energy: ratings.energy ?? null,
    soreness: ratings.soreness ?? null,
    stress: ratings.stress ?? null,
    motivation: ratings.motivation ?? null,
    weightKg: null,
    waistCm: null,
  }
}

const allGood = { sleep: 4, energy: 4, soreness: 4, stress: 4, motivation: 4 } as const
const allBad = { sleep: 2, energy: 2, soreness: 2, stress: 2, motivation: 2 } as const

describe('readinessFrom', () => {
  it('is neutral (steady, no drivers) without a check-in — skipping is always fine', () => {
    const readiness = readinessFrom(null, [])
    expect(readiness.tier).toBe('steady')
    expect(readiness.drivers).toEqual([])
  })

  it('reports ready when signals are strong', () => {
    const readiness = readinessFrom(checkIn('2026-07-24', allGood), [])
    expect(readiness.tier).toBe('ready')
    expect(readiness.drivers).toEqual([])
  })

  it('reports easier when signals are broadly low, naming the drivers', () => {
    const readiness = readinessFrom(checkIn('2026-07-24', allBad), [])
    expect(readiness.tier).toBe('easier')
    expect(readiness.drivers.length).toBeGreaterThan(0)
  })

  it('treats one severe signal as enough — a terrible night overrides a decent average', () => {
    const readiness = readinessFrom(
      checkIn('2026-07-24', { ...allGood, sleep: 1 }),
      [],
    )
    expect(readiness.tier).toBe('easier')
    expect(readiness.drivers.map((d) => d.signal)).toContain('sleep')
  })

  it('handles a partial check-in using only the answered signals', () => {
    const readiness = readinessFrom(checkIn('2026-07-24', { sleep: 4, energy: 4 }), [])
    expect(readiness.tier).toBe('ready')
  })

  it('treats an entirely empty check-in as neutral', () => {
    const readiness = readinessFrom(checkIn('2026-07-24', {}), [])
    expect(readiness.tier).toBe('steady')
  })

  it('names low signals as human-readable drivers', () => {
    const readiness = readinessFrom(
      checkIn('2026-07-24', { ...allGood, sleep: 2, soreness: 2 }),
      [],
    )
    const signals = readiness.drivers.map((d) => d.signal)
    expect(signals).toContain('sleep')
    expect(signals).toContain('soreness')
    for (const driver of readiness.drivers) expect(driver.label.length).toBeGreaterThan(0)
  })

  it('counts consecutive low days including today for trend escalation', () => {
    const readiness = readinessFrom(checkIn('2026-07-24', allBad), [
      checkIn('2026-07-23', allBad),
      checkIn('2026-07-22', allGood),
    ])
    expect(readiness.tier).toBe('easier')
    expect(readiness.consecutiveLowDays).toBe(2)
  })

  it('breaks the low-day streak on a good day', () => {
    const readiness = readinessFrom(checkIn('2026-07-24', allBad), [
      checkIn('2026-07-23', allGood),
      checkIn('2026-07-22', allBad),
    ])
    expect(readiness.consecutiveLowDays).toBe(1)
  })

  it('does not bridge a gap in calendar days — a stale easier check-in from weeks ago does not count as a streak', () => {
    const readiness = readinessFrom(checkIn('2026-07-24', allBad), [
      checkIn('2026-06-01', allBad),
    ])
    expect(readiness.consecutiveLowDays).toBe(1)
  })

  it('does not bridge a one-day gap either — the day immediately before must exist and be low', () => {
    const readiness = readinessFrom(checkIn('2026-07-24', allBad), [
      checkIn('2026-07-22', allBad), // 07-23 is missing
    ])
    expect(readiness.consecutiveLowDays).toBe(1)
  })

  it('requires at least two answered signals before a single low rating can force easier', () => {
    const readiness = readinessFrom(checkIn('2026-07-24', { motivation: 1 }), [])
    expect(readiness.tier).toBe('steady')
  })

  it('still allows a lone severe signal (sleep or soreness) to force easier — that is a real red flag', () => {
    const readiness = readinessFrom(checkIn('2026-07-24', { sleep: 1 }), [])
    expect(readiness.tier).toBe('easier')
  })

  it('allows two low-but-not-severe signals to force easier together', () => {
    const readiness = readinessFrom(checkIn('2026-07-24', { energy: 1, motivation: 1 }), [])
    expect(readiness.tier).toBe('easier')
  })
})
