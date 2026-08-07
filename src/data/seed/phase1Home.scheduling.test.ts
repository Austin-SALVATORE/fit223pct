import { describe, expect, it } from 'vitest'
import { seedProgram } from './program'
import { resolveDayPlan } from '@/domain/schedule'

/**
 * 7 Aug ruling (owner, ~17:45; lead go-ahead "Option A") — phase-1-home's
 * final weekend moves from Mon/Wed/Fri to Mon/Wed/Sat. Friday drops its
 * `weekdaySessions` pin and its `trainingWeekdays` membership; Saturday
 * gains both, pinned to the same `legs-core` session already pinned on
 * Wednesday. See seed/program.ts's dated comment beside `weekdaySessions`
 * for the full reasoning, including why this does not reopen the 6 Aug
 * "amendment A1" ruling (no Mesocycle 2 workout before Monday 10 Aug):
 * these guards make that invariant explicit at the scheduling-engine
 * level, independent of the UI (TodayPage.phaseBoundary.test.tsx covers
 * the UI-visible half of the same claim).
 */
describe('phase-1-home scheduling — the 7 Aug final-weekend amendment', () => {
  it('weekday 5 (Friday) has no pinned session — resolveDayPlan returns rest, not training', () => {
    const plan = resolveDayPlan(seedProgram, new Date(2026, 7, 7, 9, 0, 0), 10) // Fri 7 Aug
    expect(plan.kind).toBe('rest')
  })

  it('Friday 7 Aug previews Saturday\'s session as "next", and carries its own recovery activity', () => {
    const plan = resolveDayPlan(seedProgram, new Date(2026, 7, 7, 9, 0, 0), 10)
    if (plan.kind !== 'rest') throw new Error('expected rest')
    expect(plan.nextSession?.id).toBe('legs-core')
    expect(plan.nextDate).toBe('2026-08-08')
    expect(plan.activity?.title).toBe('Recovery day')
    expect(plan.activity?.items.some((i) => /40 min/.test(i.detail ?? ''))).toBe(true)
  })

  it('weekday 6 (Saturday) is a real training day pinned to legs-core — never an M2 session (the amendment-A1 invariant, made explicit)', () => {
    const plan = resolveDayPlan(seedProgram, new Date(2026, 7, 8, 9, 0, 0), 10) // Sat 8 Aug
    expect(plan.kind).toBe('training')
    if (plan.kind !== 'training') throw new Error('expected training')
    expect(plan.session.id).toBe('legs-core')
    expect(plan.session.id.startsWith('mesocycle2-')).toBe(false)
  })

  it('weekday 3 (Wednesday) and weekday 6 (Saturday) both pin legs-core — the scheduling engine tolerates one session id pinned to two weekdays', () => {
    const wed = resolveDayPlan(seedProgram, new Date(2026, 7, 5, 9, 0, 0), 10) // Wed 5 Aug
    const sat = resolveDayPlan(seedProgram, new Date(2026, 7, 8, 9, 0, 0), 10) // Sat 8 Aug
    expect(wed.kind).toBe('training')
    expect(sat.kind).toBe('training')
    if (wed.kind !== 'training' || sat.kind !== 'training') throw new Error('expected training')
    expect(wed.session.id).toBe('legs-core')
    expect(sat.session.id).toBe('legs-core')
  })

  it('weekday 7 (Sunday) is unaffected — still the phase\'s own final rest day, no training weekday left', () => {
    const plan = resolveDayPlan(seedProgram, new Date(2026, 7, 9, 9, 0, 0), 10) // Sun 9 Aug
    expect(plan.kind).toBe('rest')
    if (plan.kind !== 'rest') throw new Error('expected rest')
    // No training weekday remains on or before phase-1-home's own endDate
    // (9 Aug) once Sunday itself is spent — this is the lookahead branch
    // TodayPage.phaseBoundary.test.tsx's successor-preview guards depend on.
    expect(plan.nextSession).toBeNull()
    expect(plan.nextDate).toBeNull()
  })

  it('trainingWeekdays and weekdaySessions are the amendment, applied atomically', () => {
    expect(seedProgram.trainingWeekdays).toEqual([1, 3, 6])
    expect(seedProgram.weekdaySessions).toEqual({ 1: 'chest-back', 3: 'legs-core', 6: 'legs-core' })
  })
})
