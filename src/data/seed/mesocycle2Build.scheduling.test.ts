import { describe, expect, it } from 'vitest'
import { mesocycle2Build } from './program'
import { resolveDayPlan, sessionAt } from '@/domain/schedule'
import type { LadderPrescription } from '@/domain/types'

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
    if (plan.kind === 'rest') expect(plan.nextSession?.id).toBe('mesocycle2-fullbody-squat')
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
    expect(got).toEqual(['mesocycle2-fullbody-squat', 'mesocycle2-fullbody-hinge', 'mesocycle2-fullbody-hipext-shoulder'])
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

/**
 * The 11 Aug 2026 Build Prescription Revision's calendar changes (§9's
 * cardio removal on ordinary recovery days, Sunday's new dedicated ride,
 * Saturday's Option A content) — additions only, per lead ruling D2:
 * the three tests above assert rotation identity, session ids and
 * weekday-fixed activities, none of which this revision changes, so they
 * stay green untouched.
 */
describe('mesocycle2Build scheduling — 11 Aug revision calendar changes', () => {
  it('Sunday 16 Aug resolves kind: rest and carries an activity with the dedicated ride', () => {
    const plan = resolveDayPlan(mesocycle2Build, new Date('2026-08-16T12:00:00'), 4)
    expect(plan.kind).toBe('rest')
    if (plan.kind === 'rest') {
      expect(plan.activity?.items.some((i) => i.recordable === 'ride')).toBe(true)
    }
  })

  it('Saturday 15 Aug is a rest day with an activity and no ride item (Option A: same content as Tue/Thu)', () => {
    const plan = resolveDayPlan(mesocycle2Build, new Date('2026-08-15T12:00:00'), 3)
    expect(plan.kind).toBe('rest')
    if (plan.kind === 'rest') {
      expect(plan.activity).not.toBeNull()
      expect(plan.activity?.items.some((i) => i.recordable === 'ride')).toBe(false)
    }
  })

  it('Tue 11 / Thu 13 Aug carry a recovery activity with no ride item — §9 cardio removal', () => {
    for (const date of ['2026-08-11', '2026-08-13']) {
      const plan = resolveDayPlan(mesocycle2Build, new Date(`${date}T12:00:00`), 0)
      expect(plan.kind).toBe('rest')
      if (plan.kind === 'rest') {
        expect(plan.activity?.items.some((i) => i.recordable === 'ride')).toBe(false)
      }
    }
  })
})

/**
 * The owner's mid-mesocycle continuity requirement (plan §0b) — Austin
 * completed Session A on Mon 10 Aug under the old prescription, so both
 * directions must hold once the revision deploys: the rotation position
 * must survive the content rewrite (R-A), and the revision must apply
 * immediately, every time Session A comes round, never deferred (R-B).
 * Each gets its own assertion so a failure names which direction broke.
 */
describe('mesocycle2Build scheduling — mid-mesocycle continuity (owner requirement §0b)', () => {
  it('R-A: rotation position survives the content rewrite — one completed workout on 12 Aug offers Full Body B', () => {
    const plan = resolveDayPlan(mesocycle2Build, new Date('2026-08-12T12:00:00'), 1)
    expect(plan.kind).toBe('training')
    if (plan.kind === 'training') expect(plan.session.id).toBe('mesocycle2-fullbody-hinge')
  })

  it('R-A both-directions: the same date under 0/2 completed offers the neighbouring sessions, not a hard-coded Wednesday', () => {
    const zero = resolveDayPlan(mesocycle2Build, new Date('2026-08-12T12:00:00'), 0)
    const two = resolveDayPlan(mesocycle2Build, new Date('2026-08-12T12:00:00'), 2)
    expect(zero.kind).toBe('training')
    expect(two.kind).toBe('training')
    if (zero.kind === 'training') expect(zero.session.id).toBe('mesocycle2-fullbody-squat')
    if (two.kind === 'training') expect(two.session.id).toBe('mesocycle2-fullbody-hipext-shoulder')
  })

  it('R-B: sessionAt returns the revised Session A content one full cycle on from Monday', () => {
    const session = sessionAt(mesocycle2Build, 3)
    expect(session.id).toBe('mesocycle2-fullbody-squat')
    expect(session.items).toHaveLength(6)
    const squat = session.items[0]
    // 13 Aug Full Body Restructure: Session A now opens with goblet-squat,
    // not incline-dumbbell-press — the top rung (18) is goblet-squat's
    // own, a coincidence with the pre-restructure incline-press top rung,
    // not evidence this assertion still describes the old exercise.
    expect(squat.exerciseId).toBe('goblet-squat')
    expect((squat as LadderPrescription).setPlan.at(-1)?.weightKg).toBe(18)
    const exerciseIds = session.items.map((i) => i.exerciseId)
    expect(exerciseIds).toContain('bent-over-row')
    expect(exerciseIds).toContain('plank')
  })

  it('R-B: Session A prescription is identical every time it comes round — the revision is not deferred', () => {
    const sessions = [0, 3, 6].map((completedCount) => sessionAt(mesocycle2Build, completedCount))
    for (const session of sessions) expect(session.id).toBe('mesocycle2-fullbody-squat')
    const [first, ...rest] = sessions
    for (const session of rest) expect(session.items).toEqual(first.items)
  })
})
