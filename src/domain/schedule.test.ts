import { describe, expect, it } from 'vitest'
import { projectSchedule, resolveDayPlan } from './schedule'
import type { Program, SessionTemplate, Workout } from './types'

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
      expect(plan.nextSession.id).toBe('B')
      expect(plan.nextDate).toBe('2026-07-24')
    }
  })

  it('reports the program as ended after its end date', () => {
    const plan = resolveDayPlan(program, new Date(2026, 7, 10), 9)
    expect(plan.kind).toBe('ended')
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
})
