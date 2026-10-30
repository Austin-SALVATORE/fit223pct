import { describe, expect, it } from 'vitest'
import { mesocycle2Build } from '@/data/seed/program'
import { resolveDayPlan, projectSchedule } from './schedule'
import { resolveActivityForDate } from './scheduleShift'
import { activityForSession, cooldownLabelFor } from './sessionCooldown'
import type { ActivityTemplate, Program, ScheduleShift, SessionTemplate, Workout } from './types'

/**
 * Each session has its own named cooldown and it travels with the session (the
 * coach's ruling; QA Q34). Mesocycle 2 Build authors the stretching by WEEKDAY
 * (Monday "Full Body A Stretching", Wednesday B, Friday C) but runs in `rotation`
 * mode, where the session follows the completed count, so after a missed session a
 * Monday is session C and "Also today" listed A's stretching. The program is
 * frozen (`mesocycle2Build.frozen.test.ts`); the app picks the cooldown of the
 * session shown.
 *
 * Three days in M2's range: Mon 2 Nov, Wed 4 Nov, Fri 6 Nov 2026. `completedCount`
 * 0, 1, 2 is session A, B, C.
 *
 * Negative controls, run 30 Oct (mutation applied, the whole suite run, restored
 * and `cmp`ed):
 *   `activityForSession` returns the activity it was given
 *                         -> the six off-diagonal cells of the matrix (the diagonal stays
 *                            green: the case that always worked), "the detail is the
 *                            session's own text", the three Plan cases, the seed
 *                            scheduling test, two Plan screen tests and four Today
 *                            screen tests (21 red at the tip: 17 when this was written,
 *                            plus the four postponed-receiving-day tests of 2c8d0ae)
 *   `resolveDayPlan` does not pass the session
 *                         -> the six off-diagonal cells, "the detail ...", the seed
 *                            scheduling test and the three Today screen tests (11 red;
 *                            the done-today test is not among them: that path does not
 *                            go through `resolveDayPlan`)
 *   `projectSchedule` does not pass the session
 *                         -> the three Plan cases and the two Plan screen tests (5 red)
 *   the swapped-in item loses its `source`, or the localization hook ignores it
 *                         -> two Plan and four Today screen tests each (6 red), English
 *                            included: without `source` the item resolves under Monday's
 *                            keys, and A's label sits there in every locale
 *   the done-today path does not pass the session (TodayPage)
 *                         -> "Today, after the session is done" (1 red)
 *   (first version, a postponed receiving day left alone behind `&& sourceDate ===
 *     dateKey`: removing that restriction was 3 red; the lead then ruled the receiving
 *     day follows the same rule, so the restriction is gone and these tests flipped)
 *   the shift restriction (`&& sourceDate === dateKey`) put back
 *                         -> both "a day a postpone shifted a session into" tests here
 *                            (the Today plan and the Plan) and both TodayPage.postponeLocale
 *                            tests, which now expect the shown session's cooldown (4 red)
 */

const MON = new Date(2026, 10, 2)
const WED = new Date(2026, 10, 4)
const FRI = new Date(2026, 10, 6)
const DAYS = [
  ['Monday', MON, 1],
  ['Wednesday', WED, 3],
  ['Friday', FRI, 5],
] as const

const SESSION = {
  A: mesocycle2Build.sessions[0],
  B: mesocycle2Build.sessions[1],
  C: mesocycle2Build.sessions[2],
}
const COMPLETED_FOR = { A: 0, B: 1, C: 2 } as const

const authored = (weekday: 1 | 3 | 5): ActivityTemplate => mesocycle2Build.weekdayActivities![weekday]!
const stretching = (activity: ActivityTemplate | null) =>
  activity?.items.find((item) => item.label.endsWith(' Stretching'))
const rideOf = (activity: ActivityTemplate | null) => activity?.items.find((item) => item.recordable === 'ride')

describe('the cooldown convention the app relies on, pinned for the seeded program', () => {
  it('every session has exactly one cooldown, authored on a training weekday', () => {
    for (const session of mesocycle2Build.sessions) {
      const label = cooldownLabelFor(session)
      const homes = ([1, 2, 3, 4, 5, 6, 7] as const).filter((weekday) =>
        mesocycle2Build.weekdayActivities?.[weekday]?.items.some((item) => item.label === label),
      )
      expect(homes, `${session.name}: "${label}" must be authored on exactly one weekday`).toHaveLength(1)
      expect(mesocycle2Build.trainingWeekdays).toContain(homes[0])
    }
  })

  it('a weekday carries at most one session cooldown', () => {
    const labels = new Set(mesocycle2Build.sessions.map(cooldownLabelFor))
    for (const [weekday, activity] of Object.entries(mesocycle2Build.weekdayActivities ?? {})) {
      const cooldowns = activity.items.filter((item) => labels.has(item.label))
      expect(cooldowns.length, `weekday ${weekday}`).toBeLessThanOrEqual(1)
    }
  })
})

describe('Today: the stretching that belongs to the session shown', () => {
  describe.each(Object.entries(COMPLETED_FOR))('session %s is next', (letter, completed) => {
    const session = SESSION[letter as 'A' | 'B' | 'C']

    it.each(DAYS)('on a %s', (_name, date) => {
      const plan = resolveDayPlan(mesocycle2Build, date, completed)
      expect(plan.kind).toBe('training')
      if (plan.kind !== 'training') return
      expect(plan.session.id).toBe(session.id)

      expect(stretching(plan.activity)?.label).toBe(cooldownLabelFor(session))
    })
  })

  it('the detail is the session\'s own text, and the ride beside it is untouched', () => {
    // Monday, session C: C's stretching, taken from Friday's activity.
    const plan = resolveDayPlan(mesocycle2Build, MON, COMPLETED_FOR.C)
    if (plan.kind !== 'training') throw new Error('expected a training day')
    expect(stretching(plan.activity)).toMatchObject({
      label: 'Full Body C Stretching',
      detail: stretching(authored(5))?.detail,
    })
    expect(rideOf(plan.activity)).toEqual(rideOf(authored(1)))
    expect(plan.activity?.title).toBe(authored(1).title)
    expect(plan.activity?.items).toHaveLength(authored(1).items.length)
  })

  it('when the weekday already brought the right one, nothing changes (the same object)', () => {
    const plan = resolveDayPlan(mesocycle2Build, MON, COMPLETED_FOR.A)
    if (plan.kind !== 'training') throw new Error('expected a training day')
    expect(plan.activity).toBe(authored(1))
  })

  it('the activity weekday stays the weekday it was authored under (its other items resolve there)', () => {
    const plan = resolveDayPlan(mesocycle2Build, MON, COMPLETED_FOR.C)
    if (plan.kind !== 'training') throw new Error('expected a training day')
    expect(plan.activityWeekday).toBe(1)
  })
})

describe('what is left alone, and the postponed receiving day', () => {
  it('a rest day: its activity is generic stretching, not any session\'s, and comes back as authored', () => {
    const tuesday = new Date(2026, 10, 3)
    const plan = resolveDayPlan(mesocycle2Build, tuesday, COMPLETED_FOR.C)
    expect(plan.kind).toBe('rest')
    if (plan.kind !== 'rest') return
    expect(plan.activity).toBe(mesocycle2Build.weekdayActivities![2])
    expect(activityForSession(mesocycle2Build, mesocycle2Build.weekdayActivities![2]!, SESSION.C)).toBe(
      mesocycle2Build.weekdayActivities![2],
    )
  })

  it('a program with no cooldown for the session shown: nothing is invented or removed', () => {
    const withoutC: Program = {
      ...mesocycle2Build,
      weekdayActivities: {
        ...mesocycle2Build.weekdayActivities,
        5: {
          ...authored(5),
          items: authored(5).items.filter((item) => item.label !== 'Full Body C Stretching'),
        },
      },
    }
    // Monday brings A's, session C has none anywhere: the activity is not changed.
    expect(activityForSession(withoutC, authored(1), SESSION.C)).toBe(authored(1))
  })

  it('items that are not another session\'s cooldown are never touched', () => {
    const activity: ActivityTemplate = {
      kind: 'recovery',
      title: 'Rest',
      items: [{ label: 'Optional gentle stretching', routineId: 'recovery-stretch-v1' }, { label: 'Zone 2 ride' }],
    }
    expect(activityForSession(mesocycle2Build, activity, SESSION.C)).toBe(activity)
  })

  it('does not mutate the program', () => {
    const before = JSON.stringify(mesocycle2Build)
    activityForSession(mesocycle2Build, authored(1), SESSION.C)
    expect(JSON.stringify(mesocycle2Build)).toBe(before)
  })

  it('a day a postpone shifted a session into: the stretching is the session shown, and the rest still travels from the source weekday', () => {
    // Monday 2 Nov postponed to Tuesday 3 Nov, two sessions done, so the session is C.
    // Tuesday carries Monday's activity (its ride, its title, the locale keys it resolves
    // under) but the cooldown is C's, not Monday's A. Rotation decides the session.
    const shift: ScheduleShift = {
      programId: mesocycle2Build.id,
      weekStart: '2026-11-02',
      fromDate: '2026-11-02',
      days: 1,
      createdAt: '2026-11-01T09:00:00.000Z',
    }
    const result = resolveActivityForDate(mesocycle2Build, '2026-11-03', shift, SESSION.C)
    expect(result.activityWeekday).toBe(1)
    expect(stretching(result.activity)).toMatchObject({
      label: 'Full Body C Stretching',
      detail: stretching(authored(5))?.detail,
    })
    expect(rideOf(result.activity)).toEqual(rideOf(authored(1)))
    expect(result.activity?.title).toBe(authored(1).title)

    // Today's plan says the same, with the receiving day marked as shifted.
    const plan = resolveDayPlan(mesocycle2Build, new Date(2026, 10, 3), COMPLETED_FOR.C, shift)
    expect(plan.kind).toBe('training')
    if (plan.kind !== 'training') return
    expect(plan.shiftedFrom).toBe('2026-11-02')
    expect(plan.session.id).toBe(SESSION.C.id)
    expect(plan.activityWeekday).toBe(1)
    expect(stretching(plan.activity)?.label).toBe('Full Body C Stretching')
  })

  it('a shifted-in day whose session already has the right cooldown comes back as authored', () => {
    const shift: ScheduleShift = {
      programId: mesocycle2Build.id,
      weekStart: '2026-11-02',
      fromDate: '2026-11-02',
      days: 1,
      createdAt: '2026-11-01T09:00:00.000Z',
    }
    // Nothing done: session A, Monday's own cooldown.
    expect(resolveActivityForDate(mesocycle2Build, '2026-11-03', shift, SESSION.A).activity).toBe(authored(1))
  })
})

describe('the Plan: the same rule on past, today and future days', () => {
  const completed = (id: string, date: string, session: SessionTemplate): Workout => ({
    id,
    programId: mesocycle2Build.id,
    sessionTemplateId: session.id,
    date,
    startedAt: `${date}T09:00:00.000Z`,
    completedAt: `${date}T09:40:00.000Z`,
    exercises: [],
  })
  // Two sessions done (A, B): the next is C.
  const history = [completed('a', '2026-10-28', SESSION.A), completed('b', '2026-10-30', SESSION.B)]
  const days = projectSchedule(mesocycle2Build, history, MON)
  const day = (date: string) => days.find((d) => d.date === date)!

  it('today (Monday, session C): C\'s stretching', () => {
    expect(day('2026-11-02').session?.id).toBe(SESSION.C.id)
    expect(stretching(day('2026-11-02').activity)?.label).toBe('Full Body C Stretching')
  })

  it('a future Monday: the session the rotation projects, its own stretching', () => {
    // Wed 4 Nov is A, Fri 6 Nov is B, Mon 9 Nov is C again...
    expect(day('2026-11-04').session?.id).toBe(SESSION.A.id)
    expect(stretching(day('2026-11-04').activity)?.label).toBe('Full Body A Stretching')
    expect(day('2026-11-06').session?.id).toBe(SESSION.B.id)
    expect(stretching(day('2026-11-06').activity)?.label).toBe('Full Body B Stretching')
    expect(day('2026-11-09').session?.id).toBe(SESSION.C.id)
    expect(stretching(day('2026-11-09').activity)?.label).toBe('Full Body C Stretching')
  })

  it('a day a postpone shifted a session into: the projected session\'s own cooldown', () => {
    const shift: ScheduleShift = {
      programId: mesocycle2Build.id,
      weekStart: '2026-11-02',
      fromDate: '2026-11-02',
      days: 1,
      createdAt: '2026-11-01T09:00:00.000Z',
    }
    // Monday is vacated, Tuesday receives it: the next session is C, Monday's content is A's.
    const shifted = projectSchedule(mesocycle2Build, history, MON, shift).find((d) => d.date === '2026-11-03')!
    expect(shifted.shiftedFrom).toBe('2026-11-02')
    expect(shifted.session?.id).toBe(SESSION.C.id)
    expect(shifted.activityWeekday).toBe(1)
    expect(stretching(shifted.activity)?.label).toBe('Full Body C Stretching')
  })

  it('a completed day: the cooldown of the session that was trained, whatever its weekday', () => {
    // Wed 28 Oct was session A.
    expect(stretching(day('2026-10-28').activity)?.label).toBe('Full Body A Stretching')
    // Fri 30 Oct was session B: Friday's weekday content is C's, the workout's own session is B.
    expect(stretching(day('2026-10-30').activity)?.label).toBe('Full Body B Stretching')
  })
})
