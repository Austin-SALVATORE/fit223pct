import type { CheckIn, Rating } from './types'

export type ReadinessTier = 'ready' | 'steady' | 'easier'

export type ReadinessSignal = 'sleep' | 'energy' | 'soreness' | 'stress' | 'motivation'

export interface ReadinessDriver {
  signal: ReadinessSignal
  label: string
}

export interface Readiness {
  tier: ReadinessTier
  drivers: ReadinessDriver[]
  /** Trailing run of 'easier' days ending today — feeds trend escalation */
  consecutiveLowDays: number
}

/**
 * Categorical readiness from subjective signals (Hooper-style wellness
 * items; all rated 1 = worst … 5 = best, including soreness and stress).
 *
 * Deliberately a tier, never a number — a percentage would be false
 * precision. Thresholds are coaching heuristics, not clinical claims
 * (docs/Readiness.md). No check-in means neutral: skipping is always fine.
 */
export function readinessFrom(
  today: CheckIn | null,
  recent: readonly CheckIn[],
): Readiness {
  const tier = dayTier(today)
  const drivers = today ? driversOf(today) : []

  let consecutiveLowDays = 0
  if (tier === 'easier') {
    consecutiveLowDays = 1
    const past = [...recent]
      .filter((c) => today === null || c.date < today.date)
      .sort((a, b) => b.date.localeCompare(a.date))
    for (const checkIn of past) {
      if (dayTier(checkIn) !== 'easier') break
      consecutiveLowDays += 1
    }
  }

  return { tier, drivers, consecutiveLowDays }
}

/** Weights favor the best-supported signals: sleep and soreness. */
const WEIGHTS: Record<ReadinessSignal, number> = {
  sleep: 0.3,
  soreness: 0.25,
  energy: 0.2,
  stress: 0.15,
  motivation: 0.1,
}

const SIGNALS = Object.keys(WEIGHTS) as ReadinessSignal[]

/** A single terrible signal is enough to ease off, whatever the average. */
const SEVERE_SIGNALS: ReadinessSignal[] = ['sleep', 'soreness']

const DRIVER_LABELS: Record<ReadinessSignal, string> = {
  sleep: 'short sleep',
  soreness: 'sore muscles',
  energy: 'low energy',
  stress: 'a stressful stretch',
  motivation: 'low motivation',
}

function dayTier(checkIn: CheckIn | null): ReadinessTier {
  if (!checkIn) return 'steady'

  const answered = SIGNALS.filter((signal) => checkIn[signal] !== null)
  if (answered.length === 0) return 'steady'

  for (const signal of SEVERE_SIGNALS) {
    const rating = checkIn[signal]
    if (rating !== null && rating <= 1) return 'easier'
  }

  const totalWeight = answered.reduce((sum, signal) => sum + WEIGHTS[signal], 0)
  const score = answered.reduce(
    (sum, signal) => sum + WEIGHTS[signal] * normalize(checkIn[signal] as Rating),
    0,
  )
  const average = score / totalWeight

  if (average >= 0.7) return 'ready'
  if (average >= 0.45) return 'steady'
  return 'easier'
}

function driversOf(checkIn: CheckIn): ReadinessDriver[] {
  return SIGNALS.filter((signal) => {
    const rating = checkIn[signal]
    return rating !== null && rating <= 2
  }).map((signal) => ({ signal, label: DRIVER_LABELS[signal] }))
}

function normalize(rating: Rating): number {
  return (rating - 1) / 4
}

/**
 * Human phrasing of the drivers, capped to avoid a symptom dump:
 * one or two get named; three or more collapse to a single honest phrase.
 */
export function describeDrivers(drivers: readonly ReadinessDriver[]): string {
  if (drivers.length === 0) return 'readiness is low'
  if (drivers.length <= 2) return drivers.map((d) => d.label).join(' and ')
  return 'a rough day all around'
}
