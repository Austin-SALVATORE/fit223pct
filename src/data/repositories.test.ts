import { afterEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { activityRecordRepo, programRepo, settingsRepo, workoutRepo } from './repositories'
import { resolveDayPlan } from '@/domain/schedule'
import { parseDateKey } from '@/lib/dates'
import type { ActivityRecord, Program, UserSettings, Workout } from '@/domain/types'

afterEach(async () => {
  await db.programs.clear()
  await db.workouts.clear()
  await db.settings.clear()
  await db.activityRecords.clear()
})

function makeProgram(overrides: Partial<Program>): Program {
  return {
    id: 'p',
    name: 'Test program',
    phase: 1,
    startDate: '2026-07-21',
    endDate: '2026-08-09',
    trainingWeekdays: [1, 3, 5],
    rotation: ['A'],
    sessions: [{ id: 'A', name: 'Session A', focus: 'Full body', items: [] }],
    ...overrides,
  }
}

describe('programRepo.getActive', () => {
  it('returns the program whose date range covers today', async () => {
    await db.programs.put(makeProgram({ id: 'phase-1' }))
    const active = await programRepo.getActive('2026-07-25')
    expect(active?.id).toBe('phase-1')
  })

  it('returns the next upcoming program before any program has started', async () => {
    await db.programs.put(
      makeProgram({ id: 'phase-1', startDate: '2026-07-21', endDate: '2026-08-09' }),
    )
    const active = await programRepo.getActive('2026-07-18')
    expect(active?.id).toBe('phase-1')
  })

  it('falls back to the most recently ended program when nothing is active or upcoming', async () => {
    await db.programs.put(
      makeProgram({ id: 'phase-1', startDate: '2026-07-21', endDate: '2026-08-09' }),
    )
    // Phase 2 not authored yet — the day after Phase 1 ends must still
    // resolve to Phase 1 so resolveDayPlan can reach its 'ended' state,
    // instead of reading as if no program had ever existed.
    const active = await programRepo.getActive('2026-08-10')
    expect(active?.id).toBe('phase-1')
  })

  it('prefers a genuinely active program over a past one once the next phase begins', async () => {
    await db.programs.put(
      makeProgram({ id: 'phase-1', startDate: '2026-07-21', endDate: '2026-08-09' }),
    )
    await db.programs.put(
      makeProgram({ id: 'phase-2', phase: 2, startDate: '2026-08-10', endDate: null }),
    )
    const active = await programRepo.getActive('2026-08-10')
    expect(active?.id).toBe('phase-2')
  })

  it('returns undefined when no programs exist at all', async () => {
    const active = await programRepo.getActive('2026-07-25')
    expect(active).toBeUndefined()
  })
})

describe('programRepo.getById / put', () => {
  it('put upserts, getById reads it back', async () => {
    const program = makeProgram({ id: 'phase-2' })
    await programRepo.put(program)
    expect(await programRepo.getById('phase-2')).toEqual(program)
  })

  it('put replaces an existing program by id — import overwrite', async () => {
    await programRepo.put(makeProgram({ id: 'phase-2', name: 'Old name' }))
    await programRepo.put(makeProgram({ id: 'phase-2', name: 'New name' }))
    const all = await programRepo.getAll()
    expect(all.filter((p) => p.id === 'phase-2')).toHaveLength(1)
    expect((await programRepo.getById('phase-2'))?.name).toBe('New name')
  })
})

function makeWorkout(overrides: Partial<Workout>): Workout {
  return {
    id: 'w1',
    programId: 'p',
    sessionTemplateId: 'A',
    date: '2026-07-22',
    startedAt: '2026-07-22T09:00:00.000Z',
    completedAt: null,
    exercises: [],
    ...overrides,
  }
}

describe('workoutRepo.getAll', () => {
  it('returns every workout, completed or not', async () => {
    await db.workouts.put(makeWorkout({ id: 'done', completedAt: '2026-07-22T10:00:00.000Z' }))
    await db.workouts.put(makeWorkout({ id: 'open', date: '2026-07-24' }))
    const all = await workoutRepo.getAll()
    expect(all.map((w) => w.id).sort()).toEqual(['done', 'open'])
  })
})

/**
 * docs/design/MissedDayDeferral.md Phase 0 — an abandoned workout must stop
 * presenting as "in progress" without ever looking like it finished.
 */
describe('workoutRepo.getActive excludes abandoned workouts', () => {
  it('returns undefined for a workout with abandonedAt set, even though completedAt is still null', async () => {
    await db.workouts.put(
      makeWorkout({ id: 'stale', date: '2026-07-20', abandonedAt: '2026-07-22T00:00:00.000Z' }),
    )
    expect(await workoutRepo.getActive()).toBeUndefined()
  })

  it('still returns a workout that was never abandoned', async () => {
    await db.workouts.put(makeWorkout({ id: 'open', date: '2026-07-22' }))
    expect((await workoutRepo.getActive())?.id).toBe('open')
  })
})

describe('workoutRepo.closeStaleWorkouts', () => {
  it('closes a workout dated before today, without marking it complete', async () => {
    await db.workouts.put(makeWorkout({ id: 'stale', date: '2026-07-20' }))

    await workoutRepo.closeStaleWorkouts('2026-07-22')

    const stored = await db.workouts.get('stale')
    expect(stored?.abandonedAt).toBeTruthy()
    // completedAt stays null — closing is not finishing (ruling 2).
    expect(stored?.completedAt).toBeNull()
    expect(await workoutRepo.getActive()).toBeUndefined()
  })

  it('does not touch a same-day in-progress workout — resuming across a lunch break still works', async () => {
    await db.workouts.put(makeWorkout({ id: 'today', date: '2026-07-22' }))

    await workoutRepo.closeStaleWorkouts('2026-07-22')

    const stored = await db.workouts.get('today')
    expect(stored?.abandonedAt).toBeFalsy()
    expect((await workoutRepo.getActive())?.id).toBe('today')
  })

  it('is idempotent — a second call finds nothing left to close', async () => {
    await db.workouts.put(makeWorkout({ id: 'stale', date: '2026-07-20' }))
    await workoutRepo.closeStaleWorkouts('2026-07-22')
    const firstPass = await db.workouts.get('stale')

    await workoutRepo.closeStaleWorkouts('2026-07-22')
    const secondPass = await db.workouts.get('stale')

    expect(secondPass?.abandonedAt).toBe(firstPass?.abandonedAt)
  })

  it("never advances the plan pointer — countCompleted and resolveDayPlan's session are unchanged by closing", async () => {
    const program = makeProgram({
      id: 'p',
      rotation: ['A', 'B'],
      sessions: [
        { id: 'A', name: 'Session A', focus: 'Full body', items: [] },
        { id: 'B', name: 'Session B', focus: 'Full body', items: [] },
      ],
    })
    await db.workouts.put(makeWorkout({ id: 'stale', programId: 'p', date: '2026-07-20' }))

    const countBefore = await workoutRepo.countCompleted('p')
    const planBefore = resolveDayPlan(program, parseDateKey('2026-07-22'), countBefore)

    await workoutRepo.closeStaleWorkouts('2026-07-22')

    const countAfter = await workoutRepo.countCompleted('p')
    const planAfter = resolveDayPlan(program, parseDateKey('2026-07-22'), countAfter)

    expect(countAfter).toBe(countBefore)
    expect(planAfter).toEqual(planBefore)
  })
})

function makeSettings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    id: 'user',
    name: 'Austin',
    heightCm: 180,
    weeklyGoal: 3,
    lastSeenWeeklyReviewWeekStart: null,
    ...overrides,
  }
}

describe('settingsRepo.update', () => {
  it('patches an existing record and persists it', async () => {
    await db.settings.put(makeSettings())
    await settingsRepo.update({ locale: 'fr' })
    expect((await settingsRepo.get())?.locale).toBe('fr')
  })

  it('is a no-op when no settings record exists yet', async () => {
    await settingsRepo.update({ locale: 'fr' })
    expect(await settingsRepo.get()).toBeUndefined()
  })

  it('reads back a pre-M7 record with no locale field at all — get() never throws on the old shape', async () => {
    const { locale: _unused, ...preM7Shape } = makeSettings()
    await db.settings.put(preM7Shape as UserSettings)
    const settings = await settingsRepo.get()
    expect(settings?.locale).toBeUndefined()
    expect(settings?.name).toBe('Austin')
  })

  it('markWeeklyReviewSeen still works, now routed through update()', async () => {
    await db.settings.put(makeSettings())
    await settingsRepo.markWeeklyReviewSeen('2026-07-20')
    expect((await settingsRepo.get())?.lastSeenWeeklyReviewWeekStart).toBe('2026-07-20')
  })
})

describe('activityRecordRepo', () => {
  /**
   * docs/design/SessionSetCustomization.md §2 — the id is built by the
   * repo (`${date}-${kind}`), never by the caller, so saving twice for the
   * same day edits one row instead of creating a duplicate. Negative
   * control: if `put` used a fresh id per call (a UUID, say) instead of
   * this deterministic one, saving twice would leave two rows — proving
   * the assertion below is actually checking the id scheme, not just that
   * *a* write happened.
   */
  it('saving twice for the same date and kind edits one row, never creates two', async () => {
    await activityRecordRepo.put({
      date: '2026-08-10',
      programId: 'mesocycle-2-build',
      kind: 'ride',
      completedAt: '2026-08-10T18:00:00.000Z',
      actualMinutes: 18,
      avgHeartRate: 128,
    })
    await activityRecordRepo.put({
      date: '2026-08-10',
      programId: 'mesocycle-2-build',
      kind: 'ride',
      completedAt: '2026-08-10T18:05:00.000Z',
      actualMinutes: 20,
      avgHeartRate: 132,
    })

    const records = await activityRecordRepo.getByDate('2026-08-10')
    expect(records).toHaveLength(1)
    const ride = records[0] as Extract<ActivityRecord, { kind: 'ride' }>
    expect(ride.actualMinutes).toBe(20)
    expect(ride.avgHeartRate).toBe(132)
  })

  it('a ride and an activation on the same date are independent rows, both retained', async () => {
    await activityRecordRepo.put({
      date: '2026-08-10',
      programId: 'mesocycle-2-build',
      kind: 'ride',
      completedAt: '2026-08-10T18:00:00.000Z',
      actualMinutes: 20,
      avgHeartRate: 130,
    })
    await activityRecordRepo.put({
      date: '2026-08-10',
      programId: 'mesocycle-2-build',
      kind: 'activation',
      completedAt: '2026-08-10T07:00:00.000Z',
    })

    const records = await activityRecordRepo.getByDate('2026-08-10')
    expect(records.map((r) => r.kind).sort()).toEqual(['activation', 'ride'])
  })

  /**
   * §3's hardest requirement — recording one activity must never create,
   * overwrite or complete another. Asserted here at the boundary the
   * design names as the one that makes it structural: `activityRecords` is
   * its own table, so a ride write literally cannot reach `Workout` or
   * `CheckIn`. Control: if a future call site threaded activity state
   * through `Workout` "because it was convenient" (the plan's own worry),
   * this would go red the moment it did.
   */
  it('recording a ride touches no Workout and no CheckIn', async () => {
    const workout: Workout = {
      id: 'w1',
      programId: 'mesocycle-2-build',
      sessionTemplateId: 'mesocycle2-chest-back',
      date: '2026-08-10',
      startedAt: '2026-08-10T09:00:00.000Z',
      completedAt: '2026-08-10T09:40:00.000Z',
      exercises: [],
    }
    await db.workouts.put(workout)

    await activityRecordRepo.put({
      date: '2026-08-10',
      programId: 'mesocycle-2-build',
      kind: 'ride',
      completedAt: '2026-08-10T18:00:00.000Z',
      actualMinutes: 20,
      avgHeartRate: 130,
    })

    const storedWorkout = await db.workouts.get('w1')
    expect(storedWorkout).toEqual(workout)
    const checkIn = await db.checkins.where('date').equals('2026-08-10').first()
    expect(checkIn).toBeUndefined()
  })

  it('getByDate returns nothing for a date with no records', async () => {
    expect(await activityRecordRepo.getByDate('2026-08-11')).toEqual([])
  })
})
