import { describe, expect, it } from 'vitest'
import { mesocycle2Build } from './program'
import { resolveDayPlan } from '@/domain/schedule'

/**
 * Coach ruling, 7 Aug (`~/.claude/plans/m2-rotation-switch.md`) — sessions
 * run sequentially A→B→C on whichever weekdays the athlete actually
 * trains; the weekly calendar (`trainingWeekdays`) is rhythm only, never
 * identity. `mesocycle2Build.schedulingMode` moved from `'weekday-pinned'`
 * to `'rotation'` to carry that out.
 *
 * `identityFollowsCompletions` (`MissedDayDeferral.md` §10.3) is
 * deliberately not reused here — it passes in both the pinned and the
 * rotation trees, so it cannot fail for the reason this batch cares
 * about. These guards assert the coach's rule directly: a Tuesday start
 * (off the old Mon/Wed/Fri pin) must offer Session A, not whatever the
 * calendar used to say Tuesday's neighbor was.
 */
describe('mesocycle2Build scheduling — identity follows completed count, not the calendar', () => {
  it('a Tuesday start with nothing completed offers Session A', () => {
    const plan = resolveDayPlan(mesocycle2Build, new Date('2026-08-11T12:00:00'), 0)
    expect(plan.kind).toBe('rest')
    if (plan.kind === 'rest') expect(plan.nextSession?.id).toBe('mesocycle2-chest-back')
  })

  it('sessions run sequentially across off-pin days', () => {
    const seq = [
      ['2026-08-11', 0],
      ['2026-08-13', 1],
      ['2026-08-15', 2],
    ] as const
    const got = seq.map(([d, n]) => {
      const p = resolveDayPlan(mesocycle2Build, new Date(`${d}T12:00:00`), n)
      return p.kind === 'rest' ? p.nextSession?.id : null
    })
    expect(got).toEqual(['mesocycle2-chest-back', 'mesocycle2-legs-core', 'mesocycle2-shoulders-arms'])
  })

  it('an activity is fixed to its weekday, not to session identity', () => {
    const a = resolveDayPlan(mesocycle2Build, new Date('2026-08-12T12:00:00'), 0)
    const b = resolveDayPlan(mesocycle2Build, new Date('2026-08-12T12:00:00'), 7)
    if (a.kind === 'training' && b.kind === 'training') {
      expect(a.activity).toEqual(b.activity)
      expect(a.session.id).not.toBe(b.session.id)
    }
  })
})
