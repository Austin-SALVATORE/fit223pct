import { addDays, isoWeekday, toDateKey } from '@/lib/dates'
import type { ReadinessTier } from './readiness'
import type { Program, Workout } from './types'

export interface WeeklyReview {
  weekStart: string
  weekEnd: string
  scheduledCount: number
  completedCount: number
  totalSets: number
  volumeKg: number
  readinessTierCounts: Record<ReadinessTier, number>
}

/**
 * A Monday-only trigger makes the review attendance-dependent — miss
 * opening the app that one day and it never appears. Instead, the review
 * for a given week stays available on every open until the user has seen
 * it once; after that it is gone, whichever day it happened to be seen on.
 * "Seen" is the caller's job to persist (a single write, on display) —
 * this function only answers the pure question of whether today's
 * candidate review is a new one.
 */
export function reviewIsUnseen(
  review: WeeklyReview | null,
  lastSeenWeekStart: string | null,
): boolean {
  return review !== null && review.weekStart !== lastSeenWeekStart
}

/**
 * A factual recap of the most recently completed calendar week (Mon–Sun).
 * Deliberately not a trend: it reports only what happened in that one week,
 * so there is no "insufficient data" case to guard — zero sessions is a
 * true, reportable fact, not a claim that needs evidence to back it up.
 * Returns null only when the program did not exist yet during that week.
 */
export function buildWeeklyReview(
  program: Program,
  workouts: readonly Workout[],
  today: Date,
): WeeklyReview | null {
  const mostRecentSunday = addDays(today, -isoWeekday(today))
  const weekStartDate = addDays(mostRecentSunday, -6)
  const weekStart = toDateKey(weekStartDate)
  const weekEnd = toDateKey(mostRecentSunday)

  if (weekEnd < program.startDate) return null

  const effectiveStart = weekStart > program.startDate ? weekStart : program.startDate

  let scheduledCount = 0
  let cursor = parseDateKey(effectiveStart)
  const end = parseDateKey(weekEnd)
  while (toDateKey(cursor) <= toDateKey(end)) {
    if (program.trainingWeekdays.includes(isoWeekday(cursor))) scheduledCount += 1
    cursor = addDays(cursor, 1)
  }

  const weekWorkouts = workouts.filter(
    (w) =>
      w.programId === program.id &&
      w.completedAt !== null &&
      w.date >= weekStart &&
      w.date <= weekEnd,
  )

  const readinessTierCounts: Record<ReadinessTier, number> = { ready: 0, steady: 0, easier: 0 }
  let totalSets = 0
  let volumeKg = 0
  for (const workout of weekWorkouts) {
    const tier = workout.readiness?.tier ?? 'steady'
    readinessTierCounts[tier] += 1
    for (const exercise of workout.exercises) {
      totalSets += exercise.sets.length
      for (const set of exercise.sets) {
        volumeKg += (set.weightKg ?? 0) * (set.reps ?? 0)
      }
    }
  }

  return {
    weekStart,
    weekEnd,
    scheduledCount,
    completedCount: weekWorkouts.length,
    totalSets,
    volumeKg,
    readinessTierCounts,
  }
}

function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`)
}
