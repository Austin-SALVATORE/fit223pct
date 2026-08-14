import { addDays, isoWeekday, parseDateKey, toDateKey, type IsoWeekday } from '@/lib/dates'
import { resolveActivityForDate, resolveShiftForDate, shiftedTrainingDates } from './scheduleShift'
import type { ActivityTemplate, Program, ScheduleShift, SessionTemplate, Workout } from './types'

export type DayPlan =
  | { kind: 'upcoming'; daysUntilStart: number; firstSession: SessionTemplate }
  | {
      kind: 'training'
      session: SessionTemplate
      /** Post-strength cardio for this weekday, display only (docs/design/ActivityPrescriptionPhaseA.md §1). */
      activity: ActivityTemplate | null
      /** The one preparation round, shown before the session on every training day (§2). */
      activation: ActivityTemplate | null
      /**
       * The weekday whose locale key `activity`'s title/items resolve
       * under — the *source* weekday when a postpone shifted this session
       * in, never this day's own rendered weekday (postpone-day plan §5
       * R1: the activity travels but its locale key must travel with it).
       */
      activityWeekday: IsoWeekday
      /** Source date this session was postponed from, when a shift moved it here; null for an ordinary unshifted training day. */
      shiftedFrom: string | null
    }
  | {
      kind: 'rest'
      /**
       * Null when this program has no training day left on or before its
       * own `endDate` — a rest day inside the phase's own final week has
       * nothing honest to preview from *this* program (final-rest-day-
       * lookahead.md §1: the unbounded lookahead used to borrow whatever
       * training weekday came next, which could belong to a different
       * program with a different roster entirely).
       */
      nextSession: SessionTemplate | null
      nextDate: string | null
      activity: ActivityTemplate | null
      /** The date this rest day's session was postponed to, when this day is a vacated training day (postpone-day plan §2.4); null otherwise. */
      postponedTo: string | null
    }
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
  shift?: ScheduleShift | null,
): DayPlan {
  const dateKey = toDateKey(date)

  if (program.endDate !== null && dateKey > program.endDate) {
    return { kind: 'ended' }
  }

  if (dateKey < program.startDate) {
    const firstTrainingDate = parseDateKey(
      nextTrainingDateOnOrAfter(program, parseDateKey(program.startDate)),
    )
    return {
      kind: 'upcoming',
      daysUntilStart: daysBetween(dateKey, program.startDate),
      firstSession: sessionForDay(program, firstTrainingDate, completedCount),
    }
  }

  const shiftResolution = resolveShiftForDate(program, dateKey, shift ?? null)

  if (shiftResolution?.role === 'training') {
    const { activity, activityWeekday } = resolveActivityForDate(program, dateKey, shift ?? null)
    return {
      kind: 'training',
      session: sessionForDay(program, date, completedCount),
      activity,
      activation: program.morningActivation ?? null,
      activityWeekday,
      shiftedFrom: shiftResolution.sourceDate === dateKey ? null : shiftResolution.sourceDate,
    }
  }

  if (shiftResolution?.role === 'vacated') {
    // The session moved to movedTo — this day's own post-strength content
    // would be a false prescription on a day with no strength (§2.4), so
    // it's suppressed rather than shown, and there is nothing honest to
    // preview as "next" here either.
    return { kind: 'rest', nextSession: null, nextDate: null, activity: null, postponedTo: shiftResolution.movedTo }
  }

  const nextDateKey = nextTrainingDateInRange(program, addDays(date, 1), program.endDate)
  return {
    kind: 'rest',
    nextSession:
      nextDateKey === null ? null : sessionForDay(program, parseDateKey(nextDateKey), completedCount),
    nextDate: nextDateKey,
    activity: resolveActivityForDate(program, dateKey, shift ?? null).activity,
    postponedTo: null,
  }
}

export interface ScheduleDay {
  date: string
  isToday: boolean
  /**
   * Whether this date is scheduled for training — distinguishes a rest
   * day from a skipped one when session is null. As adjusted by any
   * active postpone shift (postpone-day plan): a vacated day reads
   * false, a shifted-in receiving day reads true, exactly mirroring what
   * the effective schedule now says rather than the calendar-only one.
   */
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
  /** The weekday whose locale key `activity` resolves under — the source weekday when a shift moved it here (postpone-day plan §5 R1). */
  activityWeekday: IsoWeekday
  /** Source date this date's session was postponed from, when a shift moved it here; null otherwise. */
  shiftedFrom: string | null
  /** The date this date's session was postponed to, when this date is a vacated training day; null otherwise. */
  postponedTo: string | null
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
  shift?: ScheduleShift | null,
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
  // A postponed session's receiving day may carry no weekdayActivities
  // entry of its own and isn't a natural training weekday either — the
  // loop above would never schedule it otherwise. Add every date the
  // active shift's own week resolves as training, so a shifted-in day
  // with no authored content of its own still gets a row.
  if (shift) {
    for (const effectiveDate of shiftedTrainingDates(program, shift.weekStart, shift).keys()) {
      if (effectiveDate >= program.startDate && effectiveDate <= lastKey) {
        dates.add(effectiveDate)
      }
    }
  }

  const sortedDates = [...dates].sort()
  // Today, if it's a training day not yet completed, is shown deterministically
  // (below) but still occupies the next rotation slot — the future walk must
  // start one past it, or the next projected day would repeat today's session.
  const todayIsUnfinishedTrainingDay =
    todayKey >= program.startDate &&
    todayKey <= lastKey &&
    resolveShiftForDate(program, todayKey, shift ?? null)?.role === 'training' &&
    workoutByDate.get(todayKey)?.completedAt == null
  let futureIndex = todayIsUnfinishedTrainingDay ? 1 : 0

  return sortedDates.map((date): ScheduleDay => {
    const workout = workoutByDate.get(date) ?? null
    const isToday = date === todayKey
    const shiftResolution = resolveShiftForDate(program, date, shift ?? null)
    // As adjusted by any active shift, not the calendar-only weekday
    // (ScheduleDay.isTrainingDay's own doc) — a vacated day reads false,
    // a shifted-in receiving day reads true.
    const isTrainingDay = shiftResolution?.role === 'training'
    // No longer mutually exclusive with isTrainingDay (docs/design/
    // ActivityPrescriptionPhaseA.md §1) — a training day's entry is its
    // post-strength cardio, display only; import validation used to
    // reject a weekday claimed by both, but that guard is gone.
    const { activity, activityWeekday } = resolveActivityForDate(program, date, shift ?? null)
    const shiftedFrom =
      shiftResolution?.role === 'training' && shiftResolution.sourceDate !== date
        ? shiftResolution.sourceDate
        : null
    const postponedTo = shiftResolution?.role === 'vacated' ? shiftResolution.movedTo : null

    if (workout && workout.completedAt !== null) {
      const session = program.sessions.find((s) => s.id === workout.sessionTemplateId) ?? null
      return { date, isToday, isTrainingDay, workout, session, projected: false, activity, activityWeekday, shiftedFrom, postponedTo }
    }

    if (date > todayKey) {
      const session = isTrainingDay ? sessionForDay(program, parseDateKey(date), completedCount + futureIndex) : null
      if (isTrainingDay) futureIndex += 1
      return { date, isToday, isTrainingDay, workout: null, session, projected: true, activity, activityWeekday, shiftedFrom, postponedTo }
    }

    // Today (not yet trained) is deterministic, not projected — there is
    // nothing between now and today to assume completion of.
    if (isToday && isTrainingDay) {
      return {
        date,
        isToday,
        isTrainingDay,
        workout: null,
        session: sessionForDay(program, parseDateKey(date), completedCount),
        projected: false,
        activity,
        activityWeekday,
        shiftedFrom,
        postponedTo,
      }
    }

    // A past scheduled day with no completed workout. If it was started
    // and something was logged, it was attempted, not skipped — carry the
    // workout and the session actually attempted, read from the stored
    // `sessionTemplateId` (a fact, not a projection; the completed branch
    // above already reads it the same way). A workout with zero logged
    // sets (started, left immediately, closed at next boot) has nothing
    // to reach, so it falls through to the skip return below rather than
    // promising logged work that doesn't exist.
    if (workout && workout.exercises.some((exercise) => exercise.sets.length > 0)) {
      const session = program.sessions.find((s) => s.id === workout.sessionTemplateId) ?? null
      return { date, isToday, isTrainingDay, workout, session, projected: false, activity, activityWeekday, shiftedFrom, postponedTo }
    }

    // A genuine skip — no workout row, or one with nothing logged — and a
    // non-training day both land here. `session: null` is deliberate: a
    // skipped day never consumed a rotation slot, so there is no honest
    // answer to what would have happened. A non-training day still
    // carries its activity, if any — there is no "skipped" state for an
    // activity, since there's nothing to complete.
    return { date, isToday, isTrainingDay, workout: null, session: null, projected: false, activity, activityWeekday, shiftedFrom, postponedTo }
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

/**
 * What session does this specific day offer? Delegates to `sessionAt`
 * (rotation, driven by completedCount) unless the program is
 * weekday-pinned, in which case session identity is read straight off
 * `date`'s weekday — it never depends on how many sessions have been
 * completed, which is exactly what makes skipping a pinned day harmless
 * to every other day (see docs/PyramidProgression.md's scheduling
 * section, Question A consequence #4).
 */
export function sessionForDay(
  program: Program,
  date: Date,
  completedCount: number,
): SessionTemplate {
  if (program.schedulingMode !== 'weekday-pinned') {
    return sessionAt(program, completedCount)
  }
  const sessionId = program.weekdaySessions?.[isoWeekday(date)]
  const session = sessionId ? program.sessions.find((s) => s.id === sessionId) : undefined
  if (!session) {
    throw new Error(
      `Program "${program.id}" is weekday-pinned but has no session for weekday ${isoWeekday(date)}`,
    )
  }
  return session
}

/**
 * First date on or after `from` (inclusive) whose weekday is a training
 * weekday, never later than `until` (inclusive) — null when none exists
 * in range. `until: null` means unbounded, which is what keeps the
 * `upcoming` branch's own lookahead byte-for-byte unaffected by this
 * split (final-rest-day-lookahead.md §4 Phase 1a).
 */
function nextTrainingDateInRange(program: Program, from: Date, until: string | null): string | null {
  for (let offset = 0; offset <= 6; offset += 1) {
    const candidate = addDays(from, offset)
    const candidateKey = toDateKey(candidate)
    if (until !== null && candidateKey > until) return null
    if (program.trainingWeekdays.includes(isoWeekday(candidate))) {
      return candidateKey
    }
  }
  return null
}

/** First date on or after `from` (inclusive) whose weekday is a training weekday, unbounded. */
function nextTrainingDateOnOrAfter(program: Program, from: Date): string {
  const found = nextTrainingDateInRange(program, from, null)
  if (found === null) throw new Error(`Program "${program.id}" has no training weekdays`)
  return found
}

function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00`)
  const to = new Date(`${toKey}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}
