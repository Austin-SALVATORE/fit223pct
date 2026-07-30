import { addDays, isoWeekday, toDateKey } from '@/lib/dates'
import type { MessageDescriptor } from './message'
import type { CheckIn, Program, Workout } from './types'

export type TrendDirection = 'increasing' | 'steady' | 'decreasing'

export interface TrendEvidencePoint {
  date: string
  value: number
}

export interface InsufficientTrendData {
  status: 'insufficient-data'
  reason: MessageDescriptor
}

export type TrendUnit = 'kg' | 'reps' | 'seconds' | 'cm' | 'percent'

export interface TrendResult {
  status: TrendDirection
  evidence: TrendEvidencePoint[]
  unit: TrendUnit
}

export type Trend = InsufficientTrendData | TrendResult

export interface InsufficientConsistencyData {
  status: 'insufficient-data'
  reason: MessageDescriptor
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
/**
 * Minimum spread for the body-measurement trends — two readings a day apart
 * are noise regardless of which measurement they are. Shared by waist,
 * weight and body fat: all three move slowly enough that a same-week cluster
 * says nothing about direction.
 */
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
      reason: { key: 'domain:trends.firstWeekInProgress' },
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
      reason: { key: 'domain:trends.noScheduledSessions' },
    }
  }

  // Only completions that land on a scheduled day count toward the rate —
  // an extra unscheduled session is real effort, but it isn't "more of the
  // schedule than the schedule has," so it must never push the rate past
  // 1. It simply doesn't move this number either way.
  const completedCount = workouts.filter(
    (w) =>
      w.programId === program.id &&
      w.completedAt !== null &&
      w.date >= windowStartKey &&
      w.date <= windowEndKey &&
      program.trainingWeekdays.includes(isoWeekday(parseDateKey(w.date))),
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
  const allSessions = workouts
    .filter((w) => w.completedAt !== null)
    .flatMap((w) => {
      const exercise = w.exercises.find((e) => e.exerciseId === exerciseId && e.sets.length > 0)
      return exercise ? [{ date: w.date, sets: exercise.sets, mode: exercise.prescription.mode }] : []
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  if (allSessions.length < MIN_TREND_POINTS) {
    return {
      status: 'insufficient-data',
      reason: { key: 'domain:trends.needMoreStrengthData' },
    }
  }

  const usesWeight = allSessions.some((s) => s.sets.some((set) => set.weightKg !== null))

  // A kg-unit trend can only be built from sessions that actually logged a
  // weight — a weightless session (a bodyweight swap, a forgotten field)
  // is not a real "0 kg" data point, and fabricating one can flip the
  // direction on invented data.
  const sessions = usesWeight
    ? allSessions.filter((s) => s.sets.some((set) => set.weightKg !== null))
    : allSessions

  if (sessions.length < MIN_TREND_POINTS) {
    return {
      status: 'insufficient-data',
      reason: { key: 'domain:trends.needMoreStrengthData' },
    }
  }

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
      reason: { key: 'domain:trends.needMoreWaistData' },
    }
  }

  const spanDays = daysBetween(measurements[0].date, measurements.at(-1)!.date)
  if (spanDays < MIN_WAIST_SPAN_DAYS) {
    return {
      status: 'insufficient-data',
      reason: { key: 'domain:trends.spreadWaistMeasurements' },
    }
  }

  const windowed = measurements.slice(-TREND_WINDOW_POINTS)
  const evidence: TrendEvidencePoint[] = windowed.map((m) => ({ date: m.date, value: m.waistCm }))

  return { status: direction(evidence), evidence, unit: 'cm' }
}

/**
 * Weight direction from check-in measurements. A clone of waistTrend with a
 * different field, deliberately rather than a generalisation: the two
 * differ only in field and unit today, and a shared abstraction would have
 * to carry the per-measurement reason keys anyway.
 *
 * It inherits the property that matters most here — `Trend` has **nowhere to
 * put a projection**. There is no field for "you will reach 78kg by March",
 * so the predict-nothing rule is obtained from the type rather than from a
 * rule someone has to remember. A target weight beside a direction is
 * exactly the shape that invites a promised date, and CLAUDE.md forbids
 * promising body-transformation outcomes.
 */
export function weightTrend(checkins: readonly CheckIn[]): Trend {
  const measurements = checkins
    .filter((c): c is CheckIn & { weightKg: number } => c.weightKg !== null)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (measurements.length < MIN_TREND_POINTS) {
    return { status: 'insufficient-data', reason: { key: 'domain:trends.needMoreWeightData' } }
  }

  const spanDays = daysBetween(measurements[0].date, measurements.at(-1)!.date)
  if (spanDays < MIN_WAIST_SPAN_DAYS) {
    return { status: 'insufficient-data', reason: { key: 'domain:trends.spreadWeightMeasurements' } }
  }

  const windowed = measurements.slice(-TREND_WINDOW_POINTS)
  const evidence: TrendEvidencePoint[] = windowed.map((m) => ({ date: m.date, value: m.weightKg }))

  return { status: direction(evidence), evidence, unit: 'kg' }
}

/**
 * Body-fat direction, same shape and same guards. Body fat is measured far
 * less often than weight, so the insufficient-data state is the normal one
 * for a long time — that is the state doing its job, not a gap to fill.
 */
export function bodyFatTrend(checkins: readonly CheckIn[]): Trend {
  const measurements = checkins
    .filter((c): c is CheckIn & { bodyFatPercent: number } => c.bodyFatPercent != null)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (measurements.length < MIN_TREND_POINTS) {
    return { status: 'insufficient-data', reason: { key: 'domain:trends.needMoreBodyFatData' } }
  }

  const spanDays = daysBetween(measurements[0].date, measurements.at(-1)!.date)
  if (spanDays < MIN_WAIST_SPAN_DAYS) {
    return { status: 'insufficient-data', reason: { key: 'domain:trends.spreadBodyFatMeasurements' } }
  }

  const windowed = measurements.slice(-TREND_WINDOW_POINTS)
  const evidence: TrendEvidencePoint[] = windowed.map((m) => ({ date: m.date, value: m.bodyFatPercent }))

  return { status: direction(evidence), evidence, unit: 'percent' }
}

/**
 * Compares the median of the first half of the window against the median
 * of the second half, rather than just the first and last point — a single
 * noisy reading (measurement error, an off day) at either end shouldn't
 * flip the whole verdict. With exactly three points (the minimum) this is
 * mathematically identical to comparing the two endpoints — there is no
 * more robust option with that little data.
 */
function direction(evidence: readonly TrendEvidencePoint[]): TrendDirection {
  const values = evidence.map((e) => e.value)
  const halfSize = Math.floor(values.length / 2)
  const firstHalf = values.slice(0, halfSize)
  const secondHalf = values.slice(values.length - halfSize)

  const before = median(firstHalf)
  const after = median(secondHalf)
  if (after > before) return 'increasing'
  if (after < before) return 'decreasing'
  return 'steady'
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
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
