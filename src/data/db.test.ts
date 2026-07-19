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
