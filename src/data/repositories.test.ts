import { afterEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { programRepo, settingsRepo, workoutRepo } from './repositories'
import { resolveDayPlan } from '@/domain/schedule'
import { parseDateKey } from '@/lib/dates'
import type { Program, UserSettings, Workout } from '@/domain/types'

afterEach(async () => {
  await db.programs.clear()
  await db.workouts.clear()
  await db.settings.clear()
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
