import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { Fit223Database } from './db'

const TEST_DB_NAME = 'fit223pct-migration-test'

afterEach(async () => {
  await Dexie.delete(TEST_DB_NAME)
})

describe('Fit223Database version 1 → 2 migration', () => {
  it('upgrades a version-1 exercises store (indexed by name) without losing rows', async () => {
    // Simulate a real pre-Phase-5 install: version 1 only, exercises
    // indexed by name, records still carrying the old `name` field.
    const v1 = new Dexie(TEST_DB_NAME)
    v1.version(1).stores({
      exercises: 'id, name',
      programs: 'id, phase, startDate',
      workouts: 'id, date, sessionTemplateId, completedAt',
      checkins: 'id, date',
      settings: 'id',
    })
    await v1.open()
    await v1.table('exercises').bulkPut([
      { id: 'goblet-squat', name: 'Goblet squat', muscles: ['quads'], equipment: ['dumbbell'], cues: [], substitutionIds: [], isUnilateral: false },
      { id: 'bench-press', name: 'Barbell bench press', muscles: ['chest'], equipment: ['barbell'], cues: [], substitutionIds: [], isUnilateral: false },
    ])
    v1.close()

    // Opening the real Fit223Database (version 2) against the same
    // underlying database name exercises Dexie's actual upgrade path —
    // not just a fresh version-2 create.
    const upgraded = new Fit223Database(TEST_DB_NAME)
    await upgraded.open()

    const rows = await upgraded.exercises.toArray()
    expect(rows).toHaveLength(2)
    expect(rows.map((r) => r.id).sort()).toEqual(['bench-press', 'goblet-squat'])
    // Structural fields survive untouched — no data lost by the index drop.
    const squat = rows.find((r) => r.id === 'goblet-squat')
    expect(squat?.muscles).toEqual(['quads'])
    expect(squat?.equipment).toEqual(['dumbbell'])

    upgraded.close()
  })
})

describe('Fit223Database version 2 → 3 migration (RIR purge)', () => {
  it('irreversibly strips rir from logged sets and targetRir from prescription snapshots, in both workouts and programs', async () => {
    // Simulate a real pre-Phase-6 install: version 2, records still
    // carrying the pre-purge rir/targetRir fields (docs/PyramidProgression.md,
    // owner amendment 22 Jul: "forget RIR, reset all data about RIR").
    const v2 = new Dexie(TEST_DB_NAME)
    v2.version(1).stores({
      exercises: 'id, name',
      programs: 'id, phase, startDate',
      workouts: 'id, date, sessionTemplateId, completedAt',
      checkins: 'id, date',
      settings: 'id',
    })
    v2.version(2).stores({ exercises: 'id' })
    await v2.open()

    const legacyPrescription = {
      exerciseId: 'goblet-squat',
      sets: 3,
      mode: 'reps',
      range: { min: 8, max: 12 },
      targetRir: 2,
      restSeconds: 120,
      perSide: false,
      startWeightKg: 16,
      maxWeightKg: 20,
      weightStepKg: 2,
    }
    await v2.table('workouts').put({
      id: 'w1',
      programId: 'phase-1-home',
      sessionTemplateId: 'A',
      date: '2026-07-22',
      startedAt: '2026-07-22T09:00:00.000Z',
      completedAt: '2026-07-22T09:40:00.000Z',
      exercises: [
        {
          exerciseId: 'goblet-squat',
          prescription: legacyPrescription,
          sets: [
            { setIndex: 0, weightKg: 16, reps: 10, seconds: null, rir: 2, completedAt: '2026-07-22T09:10:00.000Z' },
            { setIndex: 1, weightKg: 16, reps: 9, seconds: null, rir: 1, completedAt: '2026-07-22T09:15:00.000Z' },
          ],
        },
      ],
    })
    await v2.table('programs').put({
      id: 'phase-1-home',
      name: 'Phase 1 — Home',
      phase: 1,
      startDate: '2026-07-21',
      endDate: '2026-08-09',
      trainingWeekdays: [1, 3, 5],
      rotation: ['A'],
      sessions: [{ id: 'A', name: 'Session A', focus: 'Squat & pull', items: [legacyPrescription] }],
    })
    v2.close()

    const upgraded = new Fit223Database(TEST_DB_NAME)
    await upgraded.open()

    const workout = await upgraded.workouts.get('w1')
    expect(workout?.exercises[0].sets.every((s) => !('rir' in s))).toBe(true)
    expect(workout?.exercises[0].prescription).not.toHaveProperty('targetRir')
    // Everything else survives untouched — this is a field deletion, not a data wipe.
    expect(workout?.exercises[0].sets[0].reps).toBe(10)
    expect(workout?.exercises[0].sets[1].reps).toBe(9)
    expect(workout?.exercises[0].prescription.startWeightKg).toBe(16)

    const program = await upgraded.programs.get('phase-1-home')
    expect(program?.sessions[0].items[0]).not.toHaveProperty('targetRir')
    expect(program?.sessions[0].items[0].startWeightKg).toBe(16)

    upgraded.close()
  })
})
