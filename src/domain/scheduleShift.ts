import { addDays, isoWeekday, parseDateKey, toDateKey, type IsoWeekday } from '@/lib/dates'
import type { MessageDescriptor } from './message'
import type { ActivityTemplate, Program, ScheduleShift } from './types'

/**
 * Postpone semantics for one athlete-initiated shift within its own ISO
 * week (postpone-day plan §2). Pure, no React/i18next
 * (.claude/rules/architecture.md, Layers) — everything here is a
 * calendar-honesty computation, never a schedule-integrity mechanism
 * (§1): rotation already preserves session identity regardless of which
 * date a session lands on, so nothing here ever touches `sessionAt` or
 * `rotation`.
 */

/** ISO Monday of the week containing `date` — must match `PlanPage.tsx`'s `mondayOf` convention exactly; do not invent a second one. */
export function weekStartKey(date: Date): string {
  return toDateKey(addDays(date, -(isoWeekday(date) - 1)))
}

/** Every date in the ISO week starting `weekStart` (inclusive, 7 days) that `program.trainingWeekdays` schedules — the *unshifted* calendar, never adjusted by any shift. */
function trainingDatesInWeek(program: Program, weekStart: string): string[] {
  const dates: string[] = []
  for (let offset = 0; offset <= 6; offset += 1) {
    const candidate = addDays(parseDateKey(weekStart), offset)
    if (program.trainingWeekdays.includes(isoWeekday(candidate))) {
      dates.push(toDateKey(candidate))
    }
  }
  return dates
}

/** Whether `shift` even concerns this program and this week — a shift for a different program or a different (e.g. later) week is inert by construction (§3.1, next-week isolation). */
function isShiftApplicable(
  program: Program,
  weekStart: string,
  shift: ScheduleShift | null,
): shift is ScheduleShift {
  return shift !== null && shift.programId === program.id && shift.weekStart === weekStart
}

/**
 * Whether postponing `fromDate` (cascading every later training date in
 * its own week forward by one day, §2.3) stays inside the ISO week *and*
 * inside `program.endDate` — the two guards §2.6 measured. Only the last
 * (latest) cascaded date needs checking: cascaded effective dates rise
 * strictly with `fromDate`, so if the latest is in bounds every earlier
 * one is too.
 */
function isShiftMechanicallyValid(program: Program, weekStart: string, fromDate: string): boolean {
  const trainingDates = trainingDatesInWeek(program, weekStart)
  if (!trainingDates.includes(fromDate)) return false

  const cascaded = trainingDates.filter((date) => date >= fromDate)
  const weekEnd = toDateKey(addDays(parseDateKey(weekStart), 6))
  const lastEffective = toDateKey(addDays(parseDateKey(cascaded[cascaded.length - 1]), 1))

  if (lastEffective > weekEnd) return false
  if (program.endDate !== null && lastEffective > program.endDate) return false
  return true
}

/**
 * Every training date in `weekStart`'s week, mapped from where the
 * session now lands (effective date) back to where it was originally
 * scheduled (source date) — cardinality-preserving by construction (one
 * entry per naturally-scheduled training date, §8.1 test 8), and never
 * emits a key outside `[weekStart, weekStart+6]` (§2.6's guard, enforced
 * by `isShiftMechanicallyValid` before any cascade is applied).
 *
 * **Never throws** (R4): an inapplicable or mechanically invalid shift —
 * wrong program, wrong week, malformed `fromDate`, or one that would
 * cross the week or program-end boundary — degrades to the *unshifted*
 * map instead. A corrupted stored shift must read as "no shift", not
 * blank the render path.
 */
export function shiftedTrainingDates(
  program: Program,
  weekStart: string,
  shift: ScheduleShift | null,
): Map<string, string> {
  const trainingDates = trainingDatesInWeek(program, weekStart)
  const identity = new Map(trainingDates.map((date) => [date, date]))

  if (!isShiftApplicable(program, weekStart, shift)) return identity
  if (!isShiftMechanicallyValid(program, weekStart, shift.fromDate)) return identity

  const map = new Map<string, string>()
  for (const date of trainingDates) {
    if (date < shift.fromDate) {
      map.set(date, date)
    } else {
      map.set(toDateKey(addDays(parseDateKey(date), 1)), date)
    }
  }
  return map
}

/**
 * The *only* validity judge (R4) — called before a new shift is ever
 * written, never on the read path. Returns a message descriptor, never
 * prose (architecture.md), or `null` when postponing `fromDate` is
 * allowed. Order: is `fromDate` even a training day, is this week
 * already spoken for, then the two measured boundary guards (§2.6).
 */
export function postponeBlockedReason(
  program: Program,
  fromDate: string,
  existingShift: ScheduleShift | null,
): MessageDescriptor | null {
  const weekStart = weekStartKey(parseDateKey(fromDate))

  if (!program.trainingWeekdays.includes(isoWeekday(parseDateKey(fromDate)))) {
    return { key: 'domain:schedule.postponeBlockedNotTrainingDay' }
  }

  if (existingShift !== null && existingShift.weekStart === weekStart) {
    return { key: 'domain:schedule.postponeBlockedAlreadyShifted' }
  }

  if (!isShiftMechanicallyValid(program, weekStart, fromDate)) {
    const trainingDates = trainingDatesInWeek(program, weekStart)
    const cascaded = trainingDates.filter((date) => date >= fromDate)
    const weekEnd = toDateKey(addDays(parseDateKey(weekStart), 6))
    const lastEffective = toDateKey(
      addDays(parseDateKey(cascaded[cascaded.length - 1] ?? fromDate), 1),
    )
    if (lastEffective > weekEnd) return { key: 'domain:schedule.postponeBlockedWeekEnd' }
    if (program.endDate !== null && lastEffective > program.endDate) {
      return { key: 'domain:schedule.postponeBlockedProgramEnd' }
    }
    // Unreachable given the not-a-training-day check above, but a
    // defensive fallback is safer than returning null (= "allowed") for
    // a case this branch doesn't actually understand.
    return { key: 'domain:schedule.postponeBlockedNotTrainingDay' }
  }

  return null
}

/**
 * What does `dateKey` resolve to under `shift`? `'training'` covers both
 * an ordinary unshifted training day (`sourceDate === dateKey`) and a
 * shifted-in receiving day; `'vacated'` is the day a session moved away
 * from; `null` is an ordinary non-training day the shift never touches.
 */
export function resolveShiftForDate(
  program: Program,
  dateKey: string,
  shift: ScheduleShift | null,
): { role: 'training'; sourceDate: string } | { role: 'vacated'; movedTo: string } | null {
  const weekStart = weekStartKey(parseDateKey(dateKey))
  const map = shiftedTrainingDates(program, weekStart, shift)

  const sourceDate = map.get(dateKey)
  if (sourceDate !== undefined) return { role: 'training', sourceDate }

  if (isShiftApplicable(program, weekStart, shift) && isShiftMechanicallyValid(program, weekStart, shift.fromDate)) {
    const trainingDates = trainingDatesInWeek(program, weekStart)
    if (trainingDates.includes(dateKey) && dateKey >= shift.fromDate) {
      return { role: 'vacated', movedTo: toDateKey(addDays(parseDateKey(dateKey), 1)) }
    }
  }

  return null
}

/**
 * What weekday-authored activity content (`Program.weekdayActivities`)
 * applies to `dateKey`, honoring any active shift — the vacated day's
 * own content is suppressed (§2.4: it's post-strength cardio, a false
 * prescription on a day with no strength), a shifted-in day's content
 * travels from its source weekday (§2.5), and an ordinary date resolves
 * to its own weekday exactly as before. `activityWeekday` is always the
 * weekday whose locale key the content's title/items must resolve under
 * — the source weekday, never the rendered date's own (R1) — so every
 * caller can pass it straight to `useLocalizedActivity` without
 * re-deriving it.
 */
export function resolveActivityForDate(
  program: Program,
  dateKey: string,
  shift: ScheduleShift | null,
): { activity: ActivityTemplate | null; activityWeekday: IsoWeekday } {
  const resolution = resolveShiftForDate(program, dateKey, shift)
  const dateWeekday = isoWeekday(parseDateKey(dateKey))

  if (resolution?.role === 'vacated') {
    return { activity: null, activityWeekday: dateWeekday }
  }

  const sourceDate = resolution?.role === 'training' ? resolution.sourceDate : dateKey
  const activityWeekday = isoWeekday(parseDateKey(sourceDate))
  return { activity: program.weekdayActivities?.[activityWeekday] ?? null, activityWeekday }
}
