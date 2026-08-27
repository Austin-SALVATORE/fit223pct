import { describe, expect, it } from 'vitest'
import { resolveDayPlan, projectSchedule, sessionForDay } from '@/domain/schedule'
import { buildWeeklyReview, type WeeklyReview } from '@/domain/weeklyReview'
import { readinessFrom, type Readiness } from '@/domain/readiness'
import { postureResetIsActive } from '@/domain/postureReset'
import { mesocycle2Build } from '@/data/seed/program'
import { addDays } from '@/lib/dates'
import type { DayPlan, ScheduleDay } from '@/domain/schedule'
import type { CheckIn, UserSettings, Workout } from '@/domain/types'

/**
 * Layer 1 — the differential guard (plan §7.2). Doc 20 §3, "INDEPENDENCE
 * FROM A/B/C" — nine "must never" clauses (advance/delay A/B/C, alter the
 * next session, modify readiness or progression, change loads, count
 * toward weekly volume, count as a completed workout, replace a warm-up).
 * Most of that holds by construction: `DailyRoutineStep` carries none of
 * the fields the strength side reads. This guard makes the construction
 * *checkable* — every strength-side observable computed with the flag
 * absent and with it set must be identical, so a future change that
 * quietly threads the flag into one of them fails loudly.
 *
 * **Weaker than the records-based guard revision 1 prototyped, and says so
 * on purpose.** v1 stores nothing, so there is less that *could* couple —
 * this guard proves a smaller claim than a differential over records
 * would. It is kept anyway because it is where the records dimension goes
 * back in once daily-`unavailable` (§2.4) lands — a guard that grows,
 * rather than one invented late.
 *
 * **Per-observable assertions, not one bundled `toEqual`.** A single
 * `toStrictEqual` over the whole bundle fails with `expected {
 * dayPlans: […], …(5) } to strictly equal { … }` and does not name which
 * clause broke — the lesson revision 1's own prototype recorded. Each
 * observable gets its own assertion and its own message.
 *
 * **Every one of the six observables has its own falsifiability proof, not
 * just the two (`resolveDayPlan`/`sessionForDay`) that share a poison with
 * `completedCount` for free.** A first pass poisoned only `completedCount`
 * and reddened three of six — correct as far as it went, but the other
 * three (`projectSchedule`, `buildWeeklyReview`, `readinessFrom`) had
 * never been shown to be falsifiable in this harness at all, which makes
 * them indistinguishable from `expect(true).toBe(true)`. `computeBundle`'s
 * `poisonTarget` now names each of the four independently-poisonable
 * observables; `resolveDayPlan`/`sessionForDay` share `'completedCount'`
 * since both are literally functions of it. Each is exercised on its own
 * below, quoted in the phase report, then reverted — never `true`/set in a
 * committed run.
 *
 * **Non-vacuity is mandatory, not decorative, precisely because the claim
 * is small.** The final block proves the observables genuinely vary with
 * `completedCount` outside the flag at all, so the equality assertions
 * above are not trivially true for a harness computing nothing.
 */

const PROGRAM = mesocycle2Build
// Monday 17 Aug 2026 — inside mesocycle2Build's active window
// (2026-08-10 to 2026-09-06), a Monday so the seven-day walk crosses a
// full training/rest cycle. Also inside the buildWeeklyReview window this
// date resolves to (Sun 2026-08-10 – Sat 2026-08-16 is the *previous*
// week from Monday 17's own perspective — see WEEKLY_REVIEW_POISON_DATE).
const TODAY = new Date(2026, 7, 17, 9, 0, 0)
const SEVEN_DATES = Array.from({ length: 7 }, (_, i) => addDays(TODAY, i))

function settings(activated: boolean): UserSettings {
  return {
    id: 'user',
    name: 'Test',
    weeklyGoal: 3,
    lastSeenWeeklyReviewWeekStart: null,
    morningPostureResetActivatedAt: activated ? '2026-08-27' : null,
  }
}

function completedWorkouts(count: 0 | 1): Workout[] {
  if (count === 0) return []
  return [
    {
      id: 'w-completed-1',
      programId: PROGRAM.id,
      sessionTemplateId: PROGRAM.rotation[0],
      date: '2026-08-10',
      startedAt: '2026-08-10T09:00:00.000Z',
      completedAt: '2026-08-10T09:40:00.000Z',
      exercises: [],
    },
  ]
}

/** Tuesday 11 Aug — not a mesocycle2Build training weekday (Mon/Wed/Fri). `projectSchedule`'s own "early-started workouts land on a date the loop never schedules" clause adds it as an extra row when present. */
const SCHEDULE_POISON_WORKOUT: Workout = {
  id: 'w-schedule-poison',
  programId: PROGRAM.id,
  sessionTemplateId: PROGRAM.rotation[0],
  date: '2026-08-11',
  startedAt: '2026-08-11T09:00:00.000Z',
  completedAt: '2026-08-11T09:40:00.000Z',
  exercises: [],
}

/** Wednesday 12 Aug — inside buildWeeklyReview's window for TODAY (Sun 2026-08-10 – Sat 2026-08-16). */
const WEEKLY_REVIEW_POISON_WORKOUT: Workout = {
  id: 'w-weekly-review-poison',
  programId: PROGRAM.id,
  sessionTemplateId: PROGRAM.rotation[1],
  date: '2026-08-12',
  startedAt: '2026-08-12T09:00:00.000Z',
  completedAt: '2026-08-12T09:40:00.000Z',
  exercises: [],
}

/** `sleep: 1` is a SEVERE_SIGNAL at `readiness.ts`'s own threshold (`rating <= 1`) — moves `dayTier` from the null-input baseline `'steady'` to `'easier'`, not a marginal nudge. */
const READINESS_POISON_CHECKIN: CheckIn = {
  id: 'checkin-readiness-poison',
  date: '2026-08-17',
  sleep: 1,
  energy: null,
  soreness: null,
  stress: null,
  motivation: null,
  weightKg: null,
  waistCm: null,
}

interface Bundle {
  dayPlans: DayPlan[]
  sessionIds: string[]
  schedule: ScheduleDay[]
  weeklyReview: WeeklyReview | null
  readiness: Readiness
  completedCount: number
}

type PoisonTarget = 'completedCount' | 'schedule' | 'weeklyReview' | 'readiness'

/**
 * The flag is read here — `postureResetIsActive(userSettings)` — and
 * nowhere else in this function feeds it into any observable, matching
 * what v1's real code actually does. `poisonTarget` exists only for the
 * negative controls (see docblock above); it is never set in a committed
 * run.
 */
function computeBundle(userSettings: UserSettings, workouts: readonly Workout[], poisonTarget?: PoisonTarget): Bundle {
  const active = postureResetIsActive(userSettings)
  const poison = active ? poisonTarget : undefined

  let completedCount = workouts.filter((w) => w.programId === PROGRAM.id && w.completedAt !== null).length
  if (poison === 'completedCount') completedCount += 1

  const scheduleWorkouts = poison === 'schedule' ? [...workouts, SCHEDULE_POISON_WORKOUT] : workouts
  const weeklyReviewWorkouts =
    poison === 'weeklyReview' ? [...workouts, WEEKLY_REVIEW_POISON_WORKOUT] : workouts
  const todayCheckIn = poison === 'readiness' ? READINESS_POISON_CHECKIN : null

  return {
    dayPlans: SEVEN_DATES.map((date) => resolveDayPlan(PROGRAM, date, completedCount)),
    sessionIds: SEVEN_DATES.map((date) => sessionForDay(PROGRAM, date, completedCount).id),
    schedule: projectSchedule(PROGRAM, scheduleWorkouts, TODAY),
    weeklyReview: buildWeeklyReview(PROGRAM, weeklyReviewWorkouts, TODAY),
    readiness: readinessFrom(todayCheckIn, []),
    completedCount,
  }
}

describe('Layer 1 — independence differential (flag absent vs flag set)', () => {
  const workouts = completedWorkouts(0)
  const off = computeBundle(settings(false), workouts)
  const on = computeBundle(settings(true), workouts)

  it('resolveDayPlan is identical across seven days', () => {
    expect(on.dayPlans, 'resolveDayPlan').toEqual(off.dayPlans)
  })

  it('sessionForDay ids are identical across seven days', () => {
    expect(on.sessionIds, 'sessionForDay').toEqual(off.sessionIds)
  })

  it('projectSchedule is identical', () => {
    expect(on.schedule, 'projectSchedule').toEqual(off.schedule)
  })

  it('buildWeeklyReview is identical', () => {
    expect(on.weeklyReview, 'buildWeeklyReview').toEqual(off.weeklyReview)
  })

  it('readinessFrom is identical', () => {
    expect(on.readiness, 'readinessFrom').toEqual(off.readiness)
  })

  it('completedCount is identical', () => {
    expect(on.completedCount, 'completedCount').toBe(off.completedCount)
  })

  it('non-vacuity: these observables genuinely vary with completedCount, so the equality above is not trivially true', () => {
    const zeroCompleted = computeBundle(settings(false), completedWorkouts(0))
    const oneCompleted = computeBundle(settings(false), completedWorkouts(1))
    expect(zeroCompleted.sessionIds).not.toEqual(oneCompleted.sessionIds)
    expect(zeroCompleted.completedCount).not.toBe(oneCompleted.completedCount)
  })
})
