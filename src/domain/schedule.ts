import { addDays, isoWeekday, parseDateKey, toDateKey } from '@/lib/dates'
import type { ActivityTemplate, Program, SessionTemplate, Workout } from './types'

export type DayPlan =
  | { kind: 'upcoming'; daysUntilStart: number; firstSession: SessionTemplate }
  | { kind: 'training'; session: SessionTemplate }
  | { kind: 'rest'; nextSession: SessionTemplate; nextDate: string; activity: ActivityTemplate | null }
  | { kind: 'ended' }

/**
 * What does this program ask of the given day?
 *
 * The session identity is driven by how many workouts have been completed,
 * not by the calendar — a missed day never skips a session and never
 * generates guilt. The calendar only decides *whether* today is a
 * scheduled training day.
 */
export function resolveDayPlan(
  program: Program,
  date: Date,
  completedCount: number,
): DayPlan {
  const dateKey = toDateKey(date)

  if (program.endDate !== null && dateKey > program.endDate) {
    return { kind: 'ended' }
  }

  const nextSession = sessionAt(program, completedCount)

  if (dateKey < program.startDate) {
    return {
      kind: 'upcoming',
      daysUntilStart: daysBetween(dateKey, program.startDate),
      firstSession: nextSession,
    }
  }

  if (program.trainingWeekdays.includes(isoWeekday(date))) {
    return { kind: 'training', session: nextSession }
  }

  return {
    kind: 'rest',
    nextSession,
    nextDate: nextTrainingDate(program, date),
    activity: program.weekdayActivities?.[isoWeekday(date)] ?? null,
  }
}

export interface ScheduleDay {
  date: string
  isToday: boolean
  /** Whether this date is a normally-scheduled training weekday — distinguishes a rest day from a skipped one when session is null */
  isTrainingDay: boolean
  /** The actual workout on this date, if any — including early-started (unscheduled-day) sessions */
  workout: Workout | null
  /**
   * null when no session identity is knowable for this date: a scheduled
   * day that was skipped (skipping never consumes a rotation slot, so
   * there is no honest answer to "what would have happened here"), or a
   * non-training day with no workout.
   */
  session: SessionTemplate | null
  /** True only for a future date's session — an assumption that every scheduled day between now and then gets completed, never a stated fact */
  projected: boolean
  /** Authored content for this weekday, on a non-training day only — never projected/actual, it's the same fixed content regardless of date */
  activity: ActivityTemplate | null
}

/** No endDate set (an open-ended phase) still needs a projection horizon. */
const OPEN_ENDED_PROJECTION_DAYS = 90

/**
 * Every day the phase has an opinion about, past through the projection
 * horizon: scheduled training days (rotation-driven, never calendar-
 * driven) plus any date an actual workout exists on — including a day
 * training happened outside the schedule (see TodayPage's early-start
 * affordance). Past days state what happened; future days project what
 * the rotation implies assuming nothing between now and then is missed —
 * see docs/Plan.md's honesty rule for why that distinction must survive
 * into the UI, not just this function.
 */
export function projectSchedule(
  program: Program,
  workouts: readonly Workout[],
  today: Date,
): ScheduleDay[] {
  const todayKey = toDateKey(today)
  const programWorkouts = workouts.filter((w) => w.programId === program.id)
  const workoutByDate = new Map(programWorkouts.map((w) => [w.date, w]))
  const completedCount = programWorkouts.filter((w) => w.completedAt !== null).length

  const horizonKey =
    program.endDate ??
    toDateKey(addDays(today, OPEN_ENDED_PROJECTION_DAYS))
  const lastKey = program.endDate !== null ? program.endDate : horizonKey

  const dates = new Set<string>()
  for (
    let cursor = parseDateKey(program.startDate);
    toDateKey(cursor) <= lastKey;
    cursor = addDays(cursor, 1)
  ) {
    const dateKey = toDateKey(cursor)
    const weekday = isoWeekday(cursor)
    if (program.trainingWeekdays.includes(weekday) || program.weekdayActivities?.[weekday]) {
      dates.add(dateKey)
    }
  }
  // Early-started workouts land on a date the loop above never schedules.
  for (const workout of programWorkouts) {
    if (workout.date >= program.startDate && workout.date <= lastKey) {
      dates.add(workout.date)
    }
  }

  const sortedDates = [...dates].sort()
  // Today, if it's a training day not yet completed, is shown deterministically
  // (below) but still occupies the next rotation slot — the future walk must
  // start one past it, or the next projected day would repeat today's session.
  const todayIsUnfinishedTrainingDay =
    todayKey >= program.startDate &&
    todayKey <= lastKey &&
    program.trainingWeekdays.includes(isoWeekday(today)) &&
    workoutByDate.get(todayKey)?.completedAt == null
  let futureIndex = todayIsUnfinishedTrainingDay ? 1 : 0

  return sortedDates.map((date): ScheduleDay => {
    const workout = workoutByDate.get(date) ?? null
    const isToday = date === todayKey
    const weekday = isoWeekday(parseDateKey(date))
    const isTrainingDay = program.trainingWeekdays.includes(weekday)
    // Mutually exclusive with isTrainingDay by construction (import
    // validation rejects a weekday claimed by both).
    const activity = isTrainingDay ? null : (program.weekdayActivities?.[weekday] ?? null)

    if (workout && workout.completedAt !== null) {
      const session = program.sessions.find((s) => s.id === workout.sessionTemplateId) ?? null
      return { date, isToday, isTrainingDay, workout, session, projected: false, activity }
    }

    if (date > todayKey) {
      const session = isTrainingDay ? sessionAt(program, completedCount + futureIndex) : null
      if (isTrainingDay) futureIndex += 1
      return { date, isToday, isTrainingDay, workout: null, session, projected: true, activity }
    }

    // Today (not yet trained) is deterministic, not projected — there is
    // nothing between now and today to assume completion of.
    if (isToday && isTrainingDay) {
      return {
        date,
        isToday,
        isTrainingDay,
        workout: null,
        session: sessionAt(program, completedCount),
        projected: false,
        activity,
      }
    }

    // A past scheduled day with no completed workout: skipped. A non-
    // training day still carries its activity, if any — there is no
    // "skipped" state for an activity, since there's nothing to complete.
    return { date, isToday, isTrainingDay, workout: null, session: null, projected: false, activity }
  })
}

export function sessionAt(program: Program, completedCount: number): SessionTemplate {
  const sessionId = program.rotation[completedCount % program.rotation.length]
  const session = program.sessions.find((s) => s.id === sessionId)
  if (!session) {
    throw new Error(
      `Program "${program.id}" rotation references unknown session "${sessionId}"`,
    )
  }
  return session
}

function nextTrainingDate(program: Program, from: Date): string {
  for (let offset = 1; offset <= 7; offset += 1) {
    const candidate = addDays(from, offset)
    if (program.trainingWeekdays.includes(isoWeekday(candidate))) {
      return toDateKey(candidate)
    }
  }
  throw new Error(`Program "${program.id}" has no training weekdays`)
}

function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00`)
  const to = new Date(`${toKey}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}
