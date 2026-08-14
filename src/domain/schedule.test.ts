import { describe, expect, it } from 'vitest'
import { projectSchedule, resolveDayPlan } from './schedule'
import type { ActivityTemplate, Program, ScheduleShift, SessionTemplate, Workout } from './types'

const sessionA: SessionTemplate = {
  id: 'A',
  name: 'Session A',
  focus: 'Squat focus',
  items: [],
}
const sessionB: SessionTemplate = {
  id: 'B',
  name: 'Session B',
  focus: 'Hinge focus',
  items: [],
}

const program: Program = {
  id: 'phase-1',
  name: 'Phase 1 — Home',
  phase: 1,
  startDate: '2026-07-21',
  endDate: '2026-08-09',
  trainingWeekdays: [1, 3, 5],
  rotation: ['A', 'B'],
  sessions: [sessionA, sessionB],
}

const recoveryActivity: ActivityTemplate = {
  kind: 'recovery',
  title: 'Recovery walk & stretch',
  items: [{ label: '20-minute easy walk — conversational pace' }],
}

// Tuesday (2) carries an activity; Thursday (4) and Saturday (6) do not —
// exercises the "some non-training days have content, some stay bare" mix.
const programWithActivity: Program = {
  ...program,
  weekdayActivities: { 2: recoveryActivity },
}

describe('resolveDayPlan', () => {
  it('reports an upcoming program before its start date', () => {
    const plan = resolveDayPlan(program, new Date(2026, 6, 18), 0)
    expect(plan.kind).toBe('upcoming')
    if (plan.kind === 'upcoming') {
      expect(plan.daysUntilStart).toBe(3)
      expect(plan.firstSession.id).toBe('A')
    }
  })

  it('offers session A on the first scheduled training day', () => {
    // 21 Jul 2026 is a Tuesday — not in Mon/Wed/Fri; use Wed 22 Jul
    const plan = resolveDayPlan(program, new Date(2026, 6, 22), 0)
    expect(plan.kind).toBe('training')
    if (plan.kind === 'training') expect(plan.session.id).toBe('A')
  })

  it('advances the rotation by completed count, not by calendar', () => {
    const plan = resolveDayPlan(program, new Date(2026, 6, 24), 1)
    expect(plan.kind).toBe('training')
    if (plan.kind === 'training') expect(plan.session.id).toBe('B')
  })

  it('never skips a missed session — rotation position survives missed days', () => {
    // A full week has passed but nothing was completed
    const plan = resolveDayPlan(program, new Date(2026, 6, 29), 0)
    expect(plan.kind).toBe('training')
    if (plan.kind === 'training') expect(plan.session.id).toBe('A')
  })

  it('describes rest days with what comes next', () => {
    // Thursday 23 Jul
    const plan = resolveDayPlan(program, new Date(2026, 6, 23), 1)
    expect(plan.kind).toBe('rest')
    if (plan.kind === 'rest') {
      expect(plan.nextSession?.id).toBe('B')
      expect(plan.nextDate).toBe('2026-07-24')
    }
  })

  it('reports the program as ended after its end date', () => {
    const plan = resolveDayPlan(program, new Date(2026, 7, 10), 9)
    expect(plan.kind).toBe('ended')
  })

  it('attaches the weekday activity on a rest day that has one', () => {
    // Tuesday 21 Jul — a rest day with an authored activity.
    const plan = resolveDayPlan(programWithActivity, new Date(2026, 6, 21), 0)
    expect(plan.kind).toBe('rest')
    if (plan.kind === 'rest') expect(plan.activity).toEqual(recoveryActivity)
  })

  it('leaves activity null on a rest day with nothing authored for it', () => {
    // Thursday 23 Jul — a rest day, but no activity declared for weekday 4.
    const plan = resolveDayPlan(programWithActivity, new Date(2026, 6, 23), 1)
    expect(plan.kind).toBe('rest')
    if (plan.kind === 'rest') expect(plan.activity).toBeNull()
  })

  it('leaves activity null on a program with no weekdayActivities at all — unchanged behavior', () => {
    const plan = resolveDayPlan(program, new Date(2026, 6, 23), 1)
    expect(plan.kind).toBe('rest')
    if (plan.kind === 'rest') expect(plan.activity).toBeNull()
  })

  /**
   * docs/design/ActivityPrescriptionPhaseA.md §1/§3.2 — a training day now
   * reports its own weekday activity (post-strength cardio, display only)
   * rather than always returning null. Control: revert the training
   * branch to `{ kind: 'training', session }` with no activity/activation
   * fields → red.
   */
  it('a training day returns its own weekday activity', () => {
    const programWithTrainingDayRide: Program = {
      ...program,
      weekdayActivities: { 3: recoveryActivity }, // Wed 22 Jul is a training day
    }
    const plan = resolveDayPlan(programWithTrainingDayRide, new Date(2026, 6, 22), 0)
    expect(plan.kind).toBe('training')
    if (plan.kind === 'training') expect(plan.activity).toEqual(recoveryActivity)
  })

  it('leaves activity null on a training day with nothing authored for its weekday', () => {
    const plan = resolveDayPlan(programWithActivity, new Date(2026, 6, 22), 0) // Wed — programWithActivity only authors Tue
    expect(plan.kind).toBe('training')
    if (plan.kind === 'training') expect(plan.activity).toBeNull()
  })

  it('a training day returns the program-level morning activation, unkeyed by weekday', () => {
    const activation: ActivityTemplate = {
      kind: 'mobility',
      title: 'Morning Activation',
      items: [{ label: 'Cat-cow', detail: '6 controlled reps' }],
    }
    const programWithActivation: Program = { ...program, morningActivation: activation }
    const plan = resolveDayPlan(programWithActivation, new Date(2026, 6, 22), 0)
    expect(plan.kind).toBe('training')
    if (plan.kind === 'training') expect(plan.activation).toEqual(activation)
  })

  it('leaves activation null on a program with none set — unchanged behavior', () => {
    const plan = resolveDayPlan(program, new Date(2026, 6, 22), 0)
    expect(plan.kind).toBe('training')
    if (plan.kind === 'training') expect(plan.activation).toBeNull()
  })
})

/**
 * A phase's own final rest days — plan `final-rest-day-lookahead.md` §1/§4.
 * `nextTrainingDateOnOrAfter` used to search up to 6 days forward with no
 * regard to `program.endDate`, so a rest day inside the last week of a
 * program could "find" a training weekday that belongs to whatever
 * program starts next — a different roster entirely. Bounded by
 * `program.endDate`: no more training days left in *this* program means
 * `nextSession`/`nextDate` are null, not a borrowed answer.
 */
const finalWeekProgram: Program = {
  ...program,
  schedulingMode: 'weekday-pinned',
  weekdaySessions: { 1: 'A', 3: 'B', 5: 'A' },
  endDate: '2026-08-09', // Sunday — Friday 7 Aug is the last training day
}

describe('resolveDayPlan — bounded by program.endDate on a rest day', () => {
  it('G1: a final rest day has no next session inside its own program', () => {
    for (const date of [new Date(2026, 7, 8), new Date(2026, 7, 9)]) {
      // Sat 8 / Sun 9 Aug — no training weekday remains on or before endDate.
      const plan = resolveDayPlan(finalWeekProgram, date, 0)
      expect(plan.kind).toBe('rest')
      if (plan.kind === 'rest') {
        expect(plan.nextDate).toBeNull()
        expect(plan.nextSession).toBeNull()
      }
    }
  })

  it('G2: a mid-program rest day still resolves the next session (anti-over-clamp)', () => {
    // Thu 6 Aug — Fri 7 Aug is still inside the program's own range.
    const plan = resolveDayPlan(finalWeekProgram, new Date(2026, 7, 6), 0)
    expect(plan.kind).toBe('rest')
    if (plan.kind === 'rest') {
      expect(plan.nextDate).toBe('2026-08-07')
      expect(plan.nextSession?.id).toBe('A')
    }
  })

  it('G2b: the last training day itself is not eaten by the bound', () => {
    const plan = resolveDayPlan(finalWeekProgram, new Date(2026, 7, 7), 0) // Fri 7 Aug
    expect(plan.kind).toBe('training')
  })

  it('G2c: the rule, not the instance — a second, unrelated program\'s own final rest days bound the same way', () => {
    const secondProgram: Program = {
      ...program,
      id: 'phase-2',
      schedulingMode: 'weekday-pinned',
      weekdaySessions: { 1: 'A', 3: 'B', 5: 'A' },
      startDate: '2026-09-01', // Tuesday
      endDate: '2026-09-06', // Sunday — Friday 4 Sep is the last training day
    }
    for (const date of [new Date(2026, 8, 5), new Date(2026, 8, 6)]) {
      // Sat 5 / Sun 6 Sep
      const plan = resolveDayPlan(secondProgram, date, 0)
      expect(plan.kind).toBe('rest')
      if (plan.kind === 'rest') expect(plan.nextSession).toBeNull()
    }
  })
})

const pinnedProgram: Program = {
  ...program,
  schedulingMode: 'weekday-pinned',
  weekdaySessions: { 1: 'A', 3: 'B', 5: 'A' },
}

describe('resolveDayPlan — weekday-pinned scheduling', () => {
  it('offers the pinned session for a training day, independent of completedCount', () => {
    for (const completedCount of [0, 1, 5, 100]) {
      // Wednesday 22 Jul is pinned to B, regardless of how many sessions
      // have been completed elsewhere — the defining difference from
      // rotation mode.
      const plan = resolveDayPlan(pinnedProgram, new Date(2026, 6, 22), completedCount)
      expect(plan.kind).toBe('training')
      if (plan.kind === 'training') expect(plan.session.id).toBe('B')
    }
  })

  it('never skips a session — the pinned mapping survives a missed day even more strongly than rotation mode, since it never depends on completedCount at all', () => {
    for (const completedCount of [0, 1, 5, 100]) {
      const plan = resolveDayPlan(pinnedProgram, new Date(2026, 6, 24), completedCount) // Friday, pinned to A
      expect(plan.kind).toBe('training')
      if (plan.kind === 'training') expect(plan.session.id).toBe('A')
    }
  })

  it('describes rest days with the pinned session for the next date, resolved from that date\'s weekday, not today\'s', () => {
    // Tuesday 21 Jul (program start, not a training weekday) is a rest
    // day; the next training date is Wed 22 Jul, pinned to B.
    const plan = resolveDayPlan(pinnedProgram, new Date(2026, 6, 21), 0)
    expect(plan.kind).toBe('rest')
    if (plan.kind === 'rest') {
      expect(plan.nextSession?.id).toBe('B')
      expect(plan.nextDate).toBe('2026-07-22')
    }
  })

  it('resolves the upcoming first session from the first pinned training weekday on/after start, not from today\'s weekday', () => {
    // Program starts Tue 21 Jul, itself not a pinned weekday — the first
    // pinned training day is Wed 22 Jul (B). "Today" here (Sat 18 Jul) is
    // a Saturday, also not pinned — proving firstSession isn't read off
    // today's weekday either.
    const plan = resolveDayPlan(pinnedProgram, new Date(2026, 6, 18), 0)
    expect(plan.kind).toBe('upcoming')
    if (plan.kind === 'upcoming') {
      expect(plan.daysUntilStart).toBe(3)
      expect(plan.firstSession.id).toBe('B')
    }
  })
})

/**
 * Postpone-day plan §8.3 (resolveDayPlan half — the projectSchedule half
 * lives in Phase 3's own describe block below). Week of Mon 27 Jul 2026:
 * Mon 27 / Wed 29 / Fri 31, all inside `program`'s own [21 Jul, 9 Aug]
 * range — postponing Fri 31 → Sat 1 Aug.
 */
describe('resolveDayPlan — postpone shift', () => {
  const rideActivity: ActivityTemplate = {
    kind: 'recovery',
    title: 'Zone 2 ride',
    items: [{ label: 'Zone 2 ride', detail: '20 min after lifting', recordable: 'ride' }],
  }
  const shiftableProgram: Program = {
    ...program,
    weekdayActivities: { 5: rideActivity },
  }
  const fridayToSaturday: ScheduleShift = {
    programId: program.id,
    weekStart: '2026-07-27',
    fromDate: '2026-07-31',
    days: 1,
    createdAt: '2026-07-31T18:00:00.000Z',
  }

  it('vacates the postponed day: rest, activity suppressed, postponedTo set, no next-session preview', () => {
    const plan = resolveDayPlan(shiftableProgram, new Date(2026, 6, 31), 5, fridayToSaturday)
    expect(plan.kind).toBe('rest')
    if (plan.kind === 'rest') {
      expect(plan.activity).toBeNull()
      expect(plan.postponedTo).toBe('2026-08-01')
      expect(plan.nextSession).toBeNull()
      expect(plan.nextDate).toBeNull()
    }
  })

  it('the receiving day is training, with activityWeekday/shiftedFrom naming the source day, and the shifted-in activity object', () => {
    const plan = resolveDayPlan(shiftableProgram, new Date(2026, 7, 1), 5, fridayToSaturday)
    expect(plan.kind).toBe('training')
    if (plan.kind === 'training') {
      expect(plan.activityWeekday).toBe(5)
      expect(plan.shiftedFrom).toBe('2026-07-31')
      expect(plan.activity).toEqual(rideActivity)
    }
  })

  it('identity is untouched: the session for Saturday-with-shift === the session for Friday-without-shift, for the same completedCount', () => {
    const withoutShift = resolveDayPlan(program, new Date(2026, 6, 31), 5)
    const withShift = resolveDayPlan(program, new Date(2026, 7, 1), 5, fridayToSaturday)
    expect(withoutShift.kind).toBe('training')
    expect(withShift.kind).toBe('training')
    if (withoutShift.kind === 'training' && withShift.kind === 'training') {
      expect(withShift.session).toBe(withoutShift.session)
    }
  })

  it('an ordinary unshifted training day carries shiftedFrom: null and its own weekday', () => {
    const plan = resolveDayPlan(shiftableProgram, new Date(2026, 6, 29), 4, fridayToSaturday) // Wed 29 Jul
    expect(plan.kind).toBe('training')
    if (plan.kind === 'training') {
      expect(plan.shiftedFrom).toBeNull()
      expect(plan.activityWeekday).toBe(3)
    }
  })

  it('a shift belonging to a different week is inert — resolveDayPlan reads as if unshifted', () => {
    const plan = resolveDayPlan(program, new Date(2026, 6, 22), 0, fridayToSaturday) // Wed 22 Jul — a different week
    expect(plan.kind).toBe('training')
    if (plan.kind === 'training') expect(plan.shiftedFrom).toBeNull()
  })
})

describe('projectSchedule — weekday-pinned scheduling', () => {
  it('early-starting a pinned day\'s session on an earlier date does not change what that pinned weekday independently offers when it later arrives', () => {
    // Tuesday 21 Jul isn't a pinned training day; completing Session B
    // there early must not consume or otherwise affect Wednesday's own
    // (still-future) B identity — the accepted, tested risk from Question
    // A consequence #5.
    const earlyWorkout = makeWorkout('2026-07-21', 'B')
    const days = projectSchedule(pinnedProgram, [earlyWorkout], new Date(2026, 6, 20))

    const tuesday = byDate(days, '2026-07-21')
    expect(tuesday.workout).not.toBeNull()
    expect(tuesday.isTrainingDay).toBe(false)

    const wednesday = byDate(days, '2026-07-22')
    expect(wednesday.session?.id).toBe('B')
    expect(wednesday.projected).toBe(true)
  })
})

function makeWorkout(date: string, sessionTemplateId: string, completed = true): Workout {
  return {
    id: `w-${date}`,
    programId: program.id,
    sessionTemplateId,
    date,
    startedAt: `${date}T09:00:00.000Z`,
    completedAt: completed ? `${date}T09:30:00.000Z` : null,
    exercises: [],
  }
}

function byDate(days: ReturnType<typeof projectSchedule>, date: string) {
  const day = days.find((d) => d.date === date)
  if (!day) throw new Error(`No schedule day for ${date}`)
  return day
}

describe('projectSchedule', () => {
  it('shifts the rotation across an unlogged scheduled day — nothing is skipped or repeated', () => {
    // Wed 22 Jul done (A). Fri 24 Jul skipped. Today: Mon 27 Jul, not yet trained.
    const workouts = [makeWorkout('2026-07-22', 'A')]
    const days = projectSchedule(program, workouts, new Date(2026, 6, 27))

    expect(byDate(days, '2026-07-22').session?.id).toBe('A')
    expect(byDate(days, '2026-07-22').projected).toBe(false)

    const skipped = byDate(days, '2026-07-24')
    expect(skipped.session).toBeNull()
    expect(skipped.isTrainingDay).toBe(true)
    expect(skipped.workout).toBeNull()

    // completedCount is still 1 (only 22 Jul completed) — today gets slot 1 = B,
    // not a naive calendar-position A, proving the skip shifted nothing else.
    const todayEntry = byDate(days, '2026-07-27')
    expect(todayEntry.isToday).toBe(true)
    expect(todayEntry.session?.id).toBe('B')
    expect(todayEntry.projected).toBe(false)

    // Future days continue seamlessly from where today's (unfinished) slot leaves off.
    expect(byDate(days, '2026-07-29').session?.id).toBe('A')
    expect(byDate(days, '2026-07-29').projected).toBe(true)
    expect(byDate(days, '2026-07-31').session?.id).toBe('B')
  })

  it('never includes a date outside the phase boundaries', () => {
    const days = projectSchedule(program, [], new Date(2026, 6, 25))
    const dates = days.map((d) => d.date)

    expect(dates[0]).toBe('2026-07-22') // first Mon/Wed/Fri on/after startDate (21 Jul is a Tue)
    expect(dates.every((d) => d >= program.startDate)).toBe(true)
    expect(dates.every((d) => d <= program.endDate!)).toBe(true)
    expect(dates).not.toContain('2026-08-10')
  })

  it('surfaces an early-started (unscheduled-day) workout on its actual date', () => {
    // Thursday is not a training weekday for this program.
    const workouts = [makeWorkout('2026-07-23', 'B')]
    const days = projectSchedule(program, workouts, new Date(2026, 6, 25))

    const early = byDate(days, '2026-07-23')
    expect(early.isTrainingDay).toBe(false)
    expect(early.session?.id).toBe('B')
    expect(early.workout).not.toBeNull()
    expect(early.projected).toBe(false)
  })

  it('lands today in the right bucket, and only today', () => {
    const days = projectSchedule(program, [], new Date(2026, 6, 24))
    const todays = days.filter((d) => d.isToday)

    expect(todays).toHaveLength(1)
    expect(todays[0].date).toBe('2026-07-24')
  })

  it('never projects readiness — projected days carry no workout data to adjust from', () => {
    const days = projectSchedule(program, [], new Date(2026, 6, 22))
    const future = byDate(days, '2026-07-24')
    expect(future.projected).toBe(true)
    expect(future.workout).toBeNull()
  })

  it('includes an activity weekday in the day list even though it is not a training day', () => {
    const days = projectSchedule(programWithActivity, [], new Date(2026, 6, 25))
    // Tuesdays in range: 21 and 28 Jul.
    const tuesday = byDate(days, '2026-07-21')
    expect(tuesday.isTrainingDay).toBe(false)
    expect(tuesday.session).toBeNull()
    expect(tuesday.activity).toEqual(recoveryActivity)
  })

  it('leaves a plain rest day (no training, no activity) out of the list — unchanged', () => {
    const days = projectSchedule(programWithActivity, [], new Date(2026, 6, 25))
    // Thursday 23 Jul: not a training day, no activity authored for it.
    expect(days.some((d) => d.date === '2026-07-23')).toBe(false)
  })

  it('leaves activity null on a training day with nothing authored for its weekday — unchanged behavior', () => {
    const days = projectSchedule(program, [], new Date(2026, 6, 25))
    const monday = byDate(days, '2026-07-27')
    expect(monday.isTrainingDay).toBe(true)
    expect(monday.activity).toBeNull()
  })

  /**
   * docs/design/ActivityPrescriptionPhaseA.md §1/§3.2 — reverses the old
   * "never attaches an activity to a training day" rule this test used to
   * assert. A training day's weekday activity is now its own post-strength
   * cardio, display only, not a rejected overlap. Control: restore the
   * `isTrainingDay ? null :` guard in projectSchedule's activity line →
   * red.
   */
  it('a training day surfaces its own weekday activity, same as a rest day does', () => {
    const programWithTrainingDayRide: Program = {
      ...program,
      weekdayActivities: { 1: recoveryActivity }, // Monday is a training weekday
    }
    const days = projectSchedule(programWithTrainingDayRide, [], new Date(2026, 6, 25))
    const monday = byDate(days, '2026-07-27')
    expect(monday.isTrainingDay).toBe(true)
    expect(monday.session).not.toBeNull()
    expect(monday.activity).toEqual(recoveryActivity)
  })

  it('carries the activity on a past date the same as a future one — nothing here is projected', () => {
    const days = projectSchedule(programWithActivity, [], new Date(2026, 6, 25))
    const pastTuesday = byDate(days, '2026-07-21') // before "today" (25 Jul)
    const futureTuesday = byDate(days, '2026-07-28') // after "today"
    expect(pastTuesday.activity).toEqual(recoveryActivity)
    expect(futureTuesday.activity).toEqual(recoveryActivity)
    expect(pastTuesday.projected).toBe(false)
    expect(futureTuesday.projected).toBe(true)
  })
})

/**
 * Postpone-day plan §8.3 (projectSchedule half). Same week as the
 * `resolveDayPlan — postpone shift` block above: Mon 27 / Wed 29 / Fri 31
 * Jul 2026, postponing Fri 31 → Sat 1 Aug. "Today" is Thu 30 Jul — the
 * day right before the vacated Friday — so Saturday is the very next
 * future training date the walk encounters, isolating the
 * `completedCount + 0` / `+ 1` claim from any earlier-in-the-week
 * futureIndex bookkeeping.
 */
describe('projectSchedule — postpone shift', () => {
  const rideActivity: ActivityTemplate = {
    kind: 'recovery',
    title: 'Zone 2 ride',
    items: [{ label: 'Zone 2 ride' }],
  }
  const shiftableProgram: Program = { ...program, weekdayActivities: { 5: rideActivity } }
  const fridayToSaturday: ScheduleShift = {
    programId: program.id,
    weekStart: '2026-07-27',
    fromDate: '2026-07-31',
    days: 1,
    createdAt: '2026-07-31T18:00:00.000Z',
  }

  it('Saturday is the next future training date and gets completedCount + 0; the next Monday gets +1', () => {
    const days = projectSchedule(program, [], new Date(2026, 6, 30), fridayToSaturday) // Thu 30 Jul
    const saturday = byDate(days, '2026-08-01')
    expect(saturday.isTrainingDay).toBe(true)
    expect(saturday.session?.id).toBe('A')
    expect(saturday.projected).toBe(true)

    const monday = byDate(days, '2026-08-03')
    expect(monday.session?.id).toBe('B')
  })

  it('the vacated Friday reads as not-a-training-day, with postponedTo set and activity suppressed', () => {
    const days = projectSchedule(shiftableProgram, [], new Date(2026, 6, 30), fridayToSaturday)
    const friday = byDate(days, '2026-07-31')
    expect(friday.isTrainingDay).toBe(false)
    expect(friday.session).toBeNull()
    expect(friday.activity).toBeNull()
    expect(friday.postponedTo).toBe('2026-08-01')
  })

  it('the receiving Saturday carries the shifted-in activity and names its source', () => {
    const days = projectSchedule(shiftableProgram, [], new Date(2026, 6, 30), fridayToSaturday)
    const saturday = byDate(days, '2026-08-01')
    expect(saturday.activity).toEqual(rideActivity)
    expect(saturday.activityWeekday).toBe(5)
    expect(saturday.shiftedFrom).toBe('2026-07-31')
  })

  it('a date outside the shifted week is unaffected — no shiftedFrom/postponedTo leak into the next week', () => {
    const days = projectSchedule(program, [], new Date(2026, 6, 30), fridayToSaturday)
    const nextMonday = byDate(days, '2026-08-03')
    expect(nextMonday.shiftedFrom).toBeNull()
    expect(nextMonday.postponedTo).toBeNull()
  })
})

/**
 * The `:196` fallback used to hardcode `workout: null, session: null` for
 * every past scheduled day with no *completed* workout — discarding a
 * workout that was started and had sets logged but never finished. That
 * contradicts `ScheduleDay`'s own contract above (`:84-85`): "the actual
 * workout on this date, if any — including early-started (unscheduled-day)
 * sessions". Fixed by carrying the workout (and the session it actually
 * started, read from `sessionTemplateId`, a stored fact) whenever one
 * exists and has logged sets. A genuine skip — no workout row at all, or
 * one with zero logged sets — keeps the old `workout: null, session: null`
 * answer; `session: null` there is correct and must stay (`:86-91`):
 * skipping never consumes a rotation slot, so there is no honest answer to
 * what would have happened.
 *
 * Control (proven red before this fix, at `af468f4`): reverting this block
 * to the hardcoded `workout: null, session: null` return makes "carries
 * the workout" fail with `expected undefined to be 'w-abandoned'` and
 * "names the session that was actually attempted" fail with `expected
 * undefined to be 'A'`.
 */
describe('projectSchedule — an abandoned-but-logged past day is reachable', () => {
  // Wednesday 22 Jul 2026 — a training day. Started, three sets logged,
  // never completed, closed by closeStaleWorkouts (abandonedAt set,
  // completedAt left null).
  const abandonedWorkout: Workout = {
    id: 'w-abandoned',
    programId: program.id,
    sessionTemplateId: 'A',
    date: '2026-07-22',
    startedAt: '2026-07-22T07:00:00.000Z',
    completedAt: null,
    abandonedAt: '2026-07-23T03:00:00.000Z',
    exercises: [
      {
        exerciseId: 'goblet-squat',
        prescription: {
          exerciseId: 'goblet-squat',
          sets: 3,
          mode: 'reps',
          restSeconds: 90,
          perSide: false,
          range: { min: 8, max: 12 },
          startWeightKg: 20,
          maxWeightKg: 30,
          weightStepKg: 2,
        },
        sets: [
          { setIndex: 0, weightKg: 20, reps: 12, seconds: null, completedAt: '2026-07-22T07:05:00.000Z' },
          { setIndex: 1, weightKg: 20, reps: 11, seconds: null, completedAt: '2026-07-22T07:08:00.000Z' },
          { setIndex: 2, weightKg: 20, reps: 9, seconds: null, completedAt: '2026-07-22T07:11:00.000Z' },
        ],
      },
    ],
  }

  it('carries the workout, so the logged sets are reachable from the Plan', () => {
    const days = projectSchedule(program, [abandonedWorkout], new Date(2026, 6, 27))
    expect(byDate(days, '2026-07-22').workout?.id).toBe('w-abandoned')
  })

  it('names the session that was actually attempted, from the stored template id', () => {
    const days = projectSchedule(program, [abandonedWorkout], new Date(2026, 6, 27))
    expect(byDate(days, '2026-07-22').session?.id).toBe('A')
  })

  it('is not projected — what happened is a fact, not an assumption', () => {
    const days = projectSchedule(program, [abandonedWorkout], new Date(2026, 6, 27))
    expect(byDate(days, '2026-07-22').projected).toBe(false)
  })

  /**
   * Edge case named in the plan: a workout row can exist with zero logged
   * sets (started, left immediately, closed at next boot). "You started
   * this and logged nothing" is a different fact from "you logged sets and
   * stopped" — a row promising logged work that doesn't exist would be a
   * new dishonesty, so this falls through to the ordinary skip answer.
   */
  it('a workout with zero logged sets renders as a genuine skip, not an attempted day', () => {
    const zeroSetWorkout: Workout = {
      ...abandonedWorkout,
      id: 'w-zero-set',
      date: '2026-07-24', // Friday, also a training day
      exercises: [{ ...abandonedWorkout.exercises[0], sets: [] }],
    }
    const days = projectSchedule(program, [zeroSetWorkout], new Date(2026, 6, 27))
    const day = byDate(days, '2026-07-24')
    expect(day.workout).toBeNull()
    expect(day.session).toBeNull()
  })

  it('a genuinely skipped day (no workout row at all) still yields workout: null, session: null — unchanged', () => {
    const days = projectSchedule(program, [], new Date(2026, 6, 27))
    const day = byDate(days, '2026-07-24') // Friday, a training day, nothing logged
    expect(day.workout).toBeNull()
    expect(day.session).toBeNull()
  })

  it('a completed day still takes the completed branch, unaffected by this change', () => {
    const completedWorkout = makeWorkout('2026-07-22', 'A') // completed: true (default)
    const days = projectSchedule(program, [completedWorkout], new Date(2026, 6, 27))
    const day = byDate(days, '2026-07-22')
    expect(day.workout?.id).toBe(completedWorkout.id)
    expect(day.session?.id).toBe('A')
    expect(day.projected).toBe(false)
  })
})
