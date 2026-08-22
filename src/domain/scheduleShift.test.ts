import { describe, expect, it } from 'vitest'
import {
  postponeBlockedReason,
  resolveShiftForDate,
  shiftedTrainingDates,
  weekStartKey,
} from './scheduleShift'
import type { Program, ScheduleShift, SessionTemplate } from './types'

const sessionA: SessionTemplate = { id: 'A', name: 'Session A', focus: 'Squat', items: [] }
const sessionB: SessionTemplate = { id: 'B', name: 'Session B', focus: 'Hinge', items: [] }
const sessionC: SessionTemplate = { id: 'C', name: 'Session C', focus: 'Hip ext', items: [] }

// Mon/Wed/Fri, week of Mon 10 Aug 2026 — the driving case, and the exact
// dates the plan's prototype (§2.2) measured.
const program: Program = {
  id: 'mesocycle-2-build',
  name: 'Mesocycle 2 — Build',
  phase: 2,
  startDate: '2026-08-10',
  endDate: '2026-09-06',
  trainingWeekdays: [1, 3, 5],
  schedulingMode: 'rotation',
  rotation: ['A', 'B', 'C'],
  sessions: [sessionA, sessionB, sessionC],
}

function shift(overrides: Partial<ScheduleShift> = {}): ScheduleShift {
  return {
    programId: program.id,
    weekStart: '2026-08-10',
    fromDate: '2026-08-14',
    days: 1,
    createdAt: '2026-08-14T18:00:00.000Z',
    ...overrides,
  }
}

describe('shiftedTrainingDates', () => {
  it('1. Fri→Sat: Friday vacated, Saturday training with sourceDate Friday', () => {
    const map = shiftedTrainingDates(program, '2026-08-10', shift())
    expect(map.has('2026-08-14')).toBe(false)
    expect(map.get('2026-08-15')).toBe('2026-08-14')
    expect(map.get('2026-08-10')).toBe('2026-08-10')
    expect(map.get('2026-08-12')).toBe('2026-08-12')
  })

  it('2. Wed→Thu cascade: Wed and Fri both vacated, Thu and Sat both training', () => {
    const map = shiftedTrainingDates(program, '2026-08-10', shift({ fromDate: '2026-08-12' }))
    expect(map.has('2026-08-12')).toBe(false)
    expect(map.has('2026-08-14')).toBe(false)
    expect(map.get('2026-08-13')).toBe('2026-08-12')
    expect(map.get('2026-08-15')).toBe('2026-08-14')
    expect(map.get('2026-08-10')).toBe('2026-08-10')
  })

  it('3. Mon→Tue cascade: all three move', () => {
    const map = shiftedTrainingDates(program, '2026-08-10', shift({ fromDate: '2026-08-10' }))
    expect(map.has('2026-08-10')).toBe(false)
    expect(map.has('2026-08-12')).toBe(false)
    expect(map.has('2026-08-14')).toBe(false)
    expect(map.get('2026-08-11')).toBe('2026-08-10')
    expect(map.get('2026-08-13')).toBe('2026-08-12')
    expect(map.get('2026-08-15')).toBe('2026-08-14')
  })

  /**
   * Measured 14 Aug 2026 (claim-verifier finding): this test's name claims
   * it isolates `isShiftApplicable`'s weekStart check, but it doesn't —
   * it's doubly defended. `fromDate` ('2026-08-14') can never be a
   * training date of the *queried* week ('2026-08-17's week is
   * 17/19/21), so `isShiftMechanicallyValid`'s own `trainingDates.includes
   * (fromDate)` check would reject this fixture on its own even if
   * `isShiftApplicable`'s weekStart comparison were deleted entirely —
   * this test cannot tell the two guards apart. What actually isolates
   * the applicability predicate is test 9's `foreignWeek` case above
   * (R4 control): there `fromDate` ('2026-08-14') genuinely IS a training
   * date of the *queried* week ('2026-08-10'), so only the weekStart
   * mismatch defends it — if `isShiftApplicable` were broken, test 9
   * would go red; this test would not. Left in place as a real (if
   * redundant) assertion of next-week isolation's outcome, not deleted
   * — but the isolation claim belongs to test 9, not here.
   */
  it('4. next-week isolation: the same stored shift resolved against a later week returns the unshifted map, key-for-key', () => {
    const unshifted = shiftedTrainingDates(program, '2026-08-17', shift())
    expect([...unshifted.entries()]).toEqual([
      ['2026-08-17', '2026-08-17'],
      ['2026-08-19', '2026-08-19'],
      ['2026-08-21', '2026-08-21'],
    ])
  })

  it('5. week boundary: a [3,7] program is blocked both directly and via cascade', () => {
    const sundayProgram: Program = { ...program, trainingWeekdays: [3, 7] }
    // Week of Mon 10 Aug 2026: Wed 12, Sun 16.
    const viaCascade = shiftedTrainingDates(sundayProgram, '2026-08-10', shift({ fromDate: '2026-08-12' }))
    expect([...viaCascade.entries()]).toEqual([
      ['2026-08-12', '2026-08-12'],
      ['2026-08-16', '2026-08-16'],
    ])
    const direct = shiftedTrainingDates(sundayProgram, '2026-08-10', shift({ fromDate: '2026-08-16' }))
    expect([...direct.entries()]).toEqual([
      ['2026-08-12', '2026-08-12'],
      ['2026-08-16', '2026-08-16'],
    ])
  })

  it('6. program end: blocked when the effective date passes endDate, allowed when it does not', () => {
    const blocked: Program = { ...program, endDate: '2026-09-04' }
    const blockedMap = shiftedTrainingDates(blocked, '2026-08-31', shift({ weekStart: '2026-08-31', fromDate: '2026-09-04' }))
    expect([...blockedMap.entries()]).toEqual([
      ['2026-08-31', '2026-08-31'],
      ['2026-09-02', '2026-09-02'],
      ['2026-09-04', '2026-09-04'],
    ])

    const allowedMap = shiftedTrainingDates(program, '2026-08-31', shift({ weekStart: '2026-08-31', fromDate: '2026-09-04' }))
    expect(allowedMap.get('2026-09-05')).toBe('2026-09-04')
  })

  it('9. R4 control: a malformed/foreign-program/foreign-week shift returns the unshifted map and does not throw', () => {
    const foreignProgram = shiftedTrainingDates(program, '2026-08-10', shift({ programId: 'other-program' }))
    expect([...foreignProgram.entries()]).toEqual([
      ['2026-08-10', '2026-08-10'],
      ['2026-08-12', '2026-08-12'],
      ['2026-08-14', '2026-08-14'],
    ])

    const foreignWeek = shiftedTrainingDates(program, '2026-08-10', shift({ weekStart: '2026-08-03' }))
    expect([...foreignWeek.entries()]).toEqual([
      ['2026-08-10', '2026-08-10'],
      ['2026-08-12', '2026-08-12'],
      ['2026-08-14', '2026-08-14'],
    ])

    expect(() => shiftedTrainingDates(program, '2026-08-10', shift({ fromDate: 'not-a-date' }))).not.toThrow()
    const malformed = shiftedTrainingDates(program, '2026-08-10', shift({ fromDate: 'not-a-date' }))
    expect([...malformed.entries()]).toEqual([
      ['2026-08-10', '2026-08-10'],
      ['2026-08-12', '2026-08-12'],
      ['2026-08-14', '2026-08-14'],
    ])
  })

  it('8. cardinality invariance: map.size is identical with and without the shift, for every affected week', () => {
    const unshiftedSize = shiftedTrainingDates(program, '2026-08-10', null).size
    for (const fromDate of ['2026-08-10', '2026-08-12', '2026-08-14']) {
      expect(shiftedTrainingDates(program, '2026-08-10', shift({ fromDate })).size).toBe(unshiftedSize)
    }
  })
})

describe('postponeBlockedReason', () => {
  it('7. non-training day → not-a-training-day', () => {
    const reason = postponeBlockedReason(program, '2026-08-13', null)
    expect(reason).toEqual({ key: 'domain:schedule.postponeBlockedNotTrainingDay' })
  })

  it('7. second postpone in the same week → already-shifted', () => {
    const reason = postponeBlockedReason(program, '2026-08-14', shift({ fromDate: '2026-08-12' }))
    expect(reason).toEqual({ key: 'domain:schedule.postponeBlockedAlreadyShifted' })
  })

  it('5. week boundary blocks a Sunday-training program', () => {
    const sundayProgram: Program = { ...program, trainingWeekdays: [3, 7] }
    expect(postponeBlockedReason(sundayProgram, '2026-08-12', null)).toEqual({
      key: 'domain:schedule.postponeBlockedWeekEnd',
    })
    expect(postponeBlockedReason(sundayProgram, '2026-08-16', null)).toEqual({
      key: 'domain:schedule.postponeBlockedWeekEnd',
    })
  })

  it('6. program end blocks the driving case only when endDate lands on the source date', () => {
    const blocked: Program = { ...program, endDate: '2026-09-04' }
    expect(postponeBlockedReason(blocked, '2026-09-04', null)).toEqual({
      key: 'domain:schedule.postponeBlockedProgramEnd',
    })
    expect(postponeBlockedReason(program, '2026-09-04', null)).toBeNull()
  })

  it('allows the driving case with no blockers', () => {
    expect(postponeBlockedReason(program, '2026-08-14', null)).toBeNull()
  })
})

describe('resolveShiftForDate', () => {
  it('reports vacated for the source date and training for the receiving date', () => {
    const s = shift()
    expect(resolveShiftForDate(program, '2026-08-14', s)).toEqual({
      role: 'vacated',
      movedTo: '2026-08-15',
    })
    expect(resolveShiftForDate(program, '2026-08-15', s)).toEqual({
      role: 'training',
      sourceDate: '2026-08-14',
    })
  })

  it('reports training with sourceDate === dateKey for an ordinary unshifted training day', () => {
    expect(resolveShiftForDate(program, '2026-08-10', null)).toEqual({
      role: 'training',
      sourceDate: '2026-08-10',
    })
  })

  it('reports null for an ordinary non-training day the shift never touches', () => {
    expect(resolveShiftForDate(program, '2026-08-11', shift())).toBeNull()
  })
})

describe('weekStartKey', () => {
  it('matches the ISO Monday for any day in the week', () => {
    expect(weekStartKey(new Date(2026, 7, 14))).toBe('2026-08-10')
    expect(weekStartKey(new Date(2026, 7, 16))).toBe('2026-08-10')
    expect(weekStartKey(new Date(2026, 7, 10))).toBe('2026-08-10')
  })
})
