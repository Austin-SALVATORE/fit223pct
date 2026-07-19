import { afterEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { programRepo, workoutRepo } from './repositories'
import type { Program, Workout } from '@/domain/types'

afterEach(async () => {
  await db.programs.clear()
  await db.workouts.clear()
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
