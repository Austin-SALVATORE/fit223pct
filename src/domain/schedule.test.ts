import { describe, expect, it } from 'vitest'
import { resolveDayPlan } from './schedule'
import type { Program, SessionTemplate } from './types'

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
