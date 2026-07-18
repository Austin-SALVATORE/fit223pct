import { addDays, isoWeekday, toDateKey } from '@/lib/dates'
import type { CheckIn, Program, Workout } from './types'

export type TrendDirection = 'increasing' | 'steady' | 'decreasing'

export interface TrendEvidencePoint {
  date: string
  value: number
}

export interface InsufficientTrendData {
  status: 'insufficient-data'
  reason: string
}

export type TrendUnit = 'kg' | 'reps' | 'seconds' | 'cm'

export interface TrendResult {
  status: TrendDirection
  evidence: TrendEvidencePoint[]
  unit: TrendUnit
}

export type Trend = InsufficientTrendData | TrendResult

export interface InsufficientConsistencyData {
  status: 'insufficient-data'
  reason: string
}

export interface ConsistencyResult {
  status: 'ok'
  windowStart: string
  windowEnd: string
  scheduledCount: number
  completedCount: number
  /** 0–1; not shown as a bare percentage in the UI — the counts carry the honesty */
  rate: number
}

export type ConsistencyTrend = InsufficientConsistencyData | ConsistencyResult

const MAX_WINDOW_DAYS = 28
/** Minimum qualifying data points before a direction is claimed — three points make a trend, two make a coincidence. */
const MIN_TREND_POINTS = 3
/** Minimum spread for the waist trend specifically — two measurements a day apart are noise. */
const MIN_WAIST_SPAN_DAYS = 14
/** How many recent points a direction is judged across — keeps "trend" meaning recent, not all-time. */
const TREND_WINDOW_POINTS = 6

/**
 * Completion rate over a trailing window ending yesterday (today's session,
 * if any, may not be done yet — including it would understate consistency).
 * Never claims a rate before at least one full day has elapsed since the
 * program started.
 */
export function consistencyTrend(
  program: Program,
  workouts: readonly Workout[],
  today: Date,
): ConsistencyTrend {
  const windowEndDate = addDays(today, -1)
  const windowEndKey = toDateKey(windowEndDate)

  if (windowEndKey < program.startDate) {
    return {
      status: 'insufficient-data',
      reason: "Your first week is still in progress — check back once a few days have passed.",
    }
  }

  const earliestWindowStart = toDateKey(addDays(windowEndDate, -(MAX_WINDOW_DAYS - 1)))
  const windowStartKey =
    program.startDate > earliestWindowStart ? program.startDate : earliestWindowStart

  let scheduledCount = 0
  let cursor = parseDateKey(windowStartKey)
  const end = parseDateKey(windowEndKey)
  while (toDateKey(cursor) <= toDateKey(end)) {
    if (program.trainingWeekdays.includes(isoWeekday(cursor))) scheduledCount += 1
    cursor = addDays(cursor, 1)
  }

  if (scheduledCount === 0) {
    return {
      status: 'insufficient-data',
      reason: 'No scheduled sessions have fallen in this window yet.',
    }
  }

  const completedCount = workouts.filter(
    (w) =>
      w.programId === program.id &&
      w.completedAt !== null &&
      w.date >= windowStartKey &&
      w.date <= windowEndKey,
  ).length

  return {
    status: 'ok',
    windowStart: windowStartKey,
    windowEnd: windowEndKey,
    scheduledCount,
    completedCount,
    rate: completedCount / scheduledCount,
  }
}

/**
 * Strength direction for one exercise, judged across its most recent
 * qualifying sessions. Uses top weight when the exercise is loaded;
 * falls back to best effort (reps/seconds) for bodyweight/band work where
 * weight is never the lever. Every value is a named, dated data point —
 * nothing here is smoothed or estimated.
 */
export function strengthTrend(exerciseId: string, workouts: readonly Workout[]): Trend {
  const sessions = workouts
    .filter((w) => w.completedAt !== null)
    .flatMap((w) => {
      const exercise = w.exercises.find((e) => e.exerciseId === exerciseId && e.sets.length > 0)
      return exercise ? [{ date: w.date, sets: exercise.sets, mode: exercise.prescription.mode }] : []
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  if (sessions.length < MIN_TREND_POINTS) {
    return {
      status: 'insufficient-data',
      reason: 'Log this exercise a few more times to see a strength trend.',
    }
  }

  const usesWeight = sessions.some((s) => s.sets.some((set) => set.weightKg !== null))
  const unit: TrendUnit = usesWeight ? 'kg' : sessions.at(-1)!.mode
  const windowed = sessions.slice(-TREND_WINDOW_POINTS)
  const evidence: TrendEvidencePoint[] = windowed.map((session) => ({
    date: session.date,
    value: usesWeight ? maxOf(session.sets, (s) => s.weightKg) : maxOf(session.sets, (s) => s.reps ?? s.seconds),
  }))

  return { status: direction(evidence), evidence, unit }
}

/**
 * Waist direction from check-in measurements, requiring both enough points
 * and enough calendar spread — three measurements taken in the same week
 * are not a trend, they're noise.
 */
export function waistTrend(checkins: readonly CheckIn[]): Trend {
  const measurements = checkins
    .filter((c): c is CheckIn & { waistCm: number } => c.waistCm !== null)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (measurements.length < MIN_TREND_POINTS) {
    return {
      status: 'insufficient-data',
      reason: 'A few more waist measurements will show a trend.',
    }
  }

  const spanDays = daysBetween(measurements[0].date, measurements.at(-1)!.date)
  if (spanDays < MIN_WAIST_SPAN_DAYS) {
    return {
      status: 'insufficient-data',
      reason: 'Spread your measurements out over a couple of weeks to see a trend.',
    }
  }

  const windowed = measurements.slice(-TREND_WINDOW_POINTS)
  const evidence: TrendEvidencePoint[] = windowed.map((m) => ({ date: m.date, value: m.waistCm }))

  return { status: direction(evidence), evidence, unit: 'cm' }
}

function direction(evidence: readonly TrendEvidencePoint[]): TrendDirection {
  const first = evidence[0].value
  const last = evidence.at(-1)!.value
  if (last > first) return 'increasing'
  if (last < first) return 'decreasing'
  return 'steady'
}

function maxOf<T>(items: readonly T[], value: (item: T) => number | null): number {
  return items.reduce((max, item) => Math.max(max, value(item) ?? 0), 0)
}

function daysBetween(fromKey: string, toKey: string): number {
  return Math.round(
    (parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime()) / 86_400_000,
  )
}

function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`)
}
