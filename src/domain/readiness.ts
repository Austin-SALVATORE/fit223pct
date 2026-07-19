import { addDays, parseDateKey, toDateKey } from '@/lib/dates'
import type { MessageDescriptor } from './message'
import type { CheckIn, Rating } from './types'

export type ReadinessTier = 'ready' | 'steady' | 'easier'

export type ReadinessSignal = 'sleep' | 'energy' | 'soreness' | 'stress' | 'motivation'

export interface ReadinessDriver {
  signal: ReadinessSignal
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
  const consecutiveLowDays =
    tier === 'easier' && today ? countConsecutiveLowDays(today, recent) : 0

  return { tier, drivers, consecutiveLowDays }
}

/**
 * Trailing run of 'easier' days ending today, where each prior day must be
 * exactly one calendar day before the one after it — a gap (a missed
 * check-in, or an old record) breaks the streak. Counting check-in
 * *records* instead of adjacent *days* would let a stale easier check-in
 * from weeks ago falsely read as "still going", which is exactly the kind
 * of unearned claim this feature must never make.
 */
function countConsecutiveLowDays(today: CheckIn, recent: readonly CheckIn[]): number {
  const byDate = new Map(recent.map((checkIn) => [checkIn.date, checkIn]))
  let count = 1
  let cursorDate = today.date

  // Bounded walk — a year is far more than any real streak will ever reach.
  for (let i = 0; i < 365; i += 1) {
    const previousDateKey = toDateKey(addDays(parseDateKey(cursorDate), -1))
    const candidate = byDate.get(previousDateKey)
    if (!candidate || dayTier(candidate) !== 'easier') break
    count += 1
    cursorDate = previousDateKey
  }

  return count
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

function dayTier(checkIn: CheckIn | null): ReadinessTier {
  if (!checkIn) return 'steady'

  const answered = SIGNALS.filter((signal) => checkIn[signal] !== null)
  if (answered.length === 0) return 'steady'

  for (const signal of SEVERE_SIGNALS) {
    const rating = checkIn[signal]
    if (rating !== null && rating <= 1) return 'easier'
  }

  // A single answered signal — sleep/soreness severity aside — is too thin
  // a sample to move off neutral; one lonely low rating (e.g. motivation,
  // the least-weighted signal) should not carry full authority.
  if (answered.length < 2) return 'steady'

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
  }).map((signal) => ({ signal }))
}

function normalize(rating: Rating): number {
  return (rating - 1) / 4
}

/**
 * Human phrasing of the drivers, capped to avoid a symptom dump: one or two
 * get named; three or more collapse to a single honest phrase. Descriptor
 * params carry signal keys, never pre-composed labels — the UI resolves
 * each signal's label via nested `$t()` lookups in domain.json, so wording
 * can change per locale without touching this function.
 */
export function describeDrivers(drivers: readonly ReadinessDriver[]): MessageDescriptor {
  return describeDriverSignals(drivers.map((d) => d.signal))
}

/**
 * Reconstructs the same phrasing from stored signal keys — the persisted
 * shape (e.g. `Workout.readiness.drivers`) keeps only keys, never copy, so
 * wording can change without invalidating history.
 */
export function describeDriverSignals(signals: readonly ReadinessSignal[]): MessageDescriptor {
  if (signals.length === 0) return { key: 'domain:readiness.drivers.none' }
  if (signals.length === 1) return { key: 'domain:readiness.drivers.one', params: { signal: signals[0] } }
  if (signals.length === 2) {
    return {
      key: 'domain:readiness.drivers.two',
      params: { signal1: signals[0], signal2: signals[1] },
    }
  }
  return { key: 'domain:readiness.drivers.many' }
}
