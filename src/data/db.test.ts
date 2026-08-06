import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { Fit223Database } from './db'
import { resolveProfile, restingEnergyExpenditure } from '@/domain/profile'

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


/**
 * M10's v4 is additive and **defaultless**. The point of these tests is not
 * that the upgrade runs — it is that it writes nothing. A migration that
 * helpfully filled in a height, a sex or a target would manufacture a fact
 * about the user that nothing asked them to confirm, which is exactly the
 * defect the seeded `heightCm: 180` already is. Recreating it in a second
 * place would make it harder to remove, not easier.
 */
describe('Fit223Database version 3 → 4 migration', () => {
  const v3Settings = {
    id: 'user',
    name: 'Owner',
    heightCm: 180,
    weeklyGoal: 3,
    lastSeenWeeklyReviewWeekStart: null,
    locale: 'en',
  }

  async function openV3AndUpgrade() {
    const v3 = new Dexie(TEST_DB_NAME)
    v3.version(1).stores({
      exercises: 'id, name',
      programs: 'id, phase, startDate',
      workouts: 'id, date, sessionTemplateId, completedAt',
      checkins: 'id, date',
      settings: 'id',
    })
    v3.version(2).stores({ exercises: 'id' })
    v3.version(3).stores({})
    await v3.open()
    await v3.table('settings').put(v3Settings)
    await v3.table('checkins').bulkPut([
      { id: 'c-1', date: '2026-07-01', sleep: 4, energy: 4, soreness: 3, stress: 3, motivation: 4, weightKg: 82, waistCm: 92 },
      { id: 'c-2', date: '2026-07-15', sleep: 4, energy: 4, soreness: 3, stress: 3, motivation: 4, weightKg: 81, waistCm: null },
    ])
    v3.close()

    const upgraded = new Fit223Database(TEST_DB_NAME)
    await upgraded.open()
    return upgraded
  }

  it('preserves every v3 record, and reaches the current version', async () => {
    const db4 = await openV3AndUpgrade()

    // Deliberately not hardcoded past the version this describe block
    // exercises — later empty-diff versions (v5's abandonedAt, Phase 0)
    // still carry a v3 record forward through this same path, and pinning
    // an exact number here just breaks this test every time one lands.
    expect(db4.verno).toBeGreaterThanOrEqual(4)
    const checkins = await db4.checkins.toArray()
    expect(checkins).toHaveLength(2)
    expect(checkins.find((c) => c.id === 'c-1')?.weightKg).toBe(82)
    expect(checkins.find((c) => c.id === 'c-1')?.waistCm).toBe(92)
  })

  it('leaves the new settings fields ABSENT, not defaulted', async () => {
    const db4 = await openV3AndUpgrade()
    const settings = await db4.settings.get('user')

    // Absent, not null-with-a-value and certainly not populated: the profile
    // layer reads absence as missing and declines to compute a baseline.
    expect(settings).toBeDefined()
    expect('birthDate' in settings!).toBe(false)
    expect('sex' in settings!).toBe(false)
    expect('targetWeightKg' in settings!).toBe(false)
    expect('targetBodyFatPercent' in settings!).toBe(false)
    // The pre-existing fields are untouched — including the seeded height,
    // which stays as it was rather than being cleared. Phase 3 asks for it.
    expect(settings!.heightCm).toBe(180)
    expect(settings!.weeklyGoal).toBe(3)
  })

  it('leaves bodyFatPercent absent on existing check-ins', async () => {
    const db4 = await openV3AndUpgrade()
    const checkins = await db4.checkins.toArray()

    for (const checkin of checkins) {
      expect('bodyFatPercent' in checkin).toBe(false)
    }
  })

  it('resolves a migrated v3 record as missing rather than defaulted', async () => {
    // The migration and the missing-data contract have to agree, so this
    // asserts the pair rather than either half.
    const db4 = await openV3AndUpgrade()
    const settings = await db4.settings.get('user')
    const checkins = await db4.checkins.toArray()

    const resolved = resolveProfile(settings!, checkins)

    // The record still HOLDS the seeded 180 — the migration does not clear
    // it — but it resolves as missing, because nothing ever asked the owner
    // to confirm it and there is no confirmation marker on a v3 record. That
    // gap between "stored" and "confirmed" is the whole reason the marker
    // exists.
    expect(settings!.heightCm).toBe(180)
    expect(resolved.confirmed).toBe(false)
    expect(resolved.heightCm).toBeNull()
    expect(resolved.age).toBeNull()
    expect(resolved.sex).toBeNull()
    expect(resolved.targetWeightKg).toBeNull()
    expect(resolved.currentBodyFatPercent).toBeNull()
    // The weight is the user's own — they logged it themselves.
    expect(resolved.currentWeightKg).toBe(81)
    // No trusted inputs, so no baseline — not a partial one.
    expect(restingEnergyExpenditure(resolved)).toBeNull()
  })
})

/**
 * docs/design/MissedDayDeferral.md Phase 0. Additive and defaultless, same
 * shape as v3→v4: the point is not that the upgrade runs, it's that it
 * writes nothing — an existing workout must not be silently marked
 * abandoned just because the schema now has room to.
 */
describe('Fit223Database version 4 → 5 migration', () => {
  it('preserves a v4 workout with abandonedAt absent, and it reads as not-abandoned', async () => {
    // Simulate a real pre-Phase-0 install: version 4, a workout in
    // progress, no abandonedAt field at all.
    const v4 = new Dexie(TEST_DB_NAME)
    v4.version(1).stores({
      exercises: 'id, name',
      programs: 'id, phase, startDate',
      workouts: 'id, date, sessionTemplateId, completedAt',
      checkins: 'id, date',
      settings: 'id',
    })
    v4.version(2).stores({ exercises: 'id' })
    v4.version(3).stores({})
    v4.version(4).stores({})
    await v4.open()
    await v4.table('workouts').put({
      id: 'w1',
      programId: 'phase-1-home',
      sessionTemplateId: 'A',
      date: '2026-07-20',
      startedAt: '2026-07-20T09:00:00.000Z',
      completedAt: null,
      exercises: [],
    })
    v4.close()

    const upgraded = new Fit223Database(TEST_DB_NAME)
    await upgraded.open()

    expect(upgraded.verno).toBeGreaterThanOrEqual(5)
    const workout = await upgraded.workouts.get('w1')
    expect(workout).toBeDefined()
    // Absent, not defaulted to null or false — closeStaleWorkouts' own
    // filter (`!w.abandonedAt`) treats absence and null identically, so
    // this is a genuine choice, not an oversight worth "fixing" later.
    expect('abandonedAt' in workout!).toBe(false)
    expect(workout?.completedAt).toBeNull()

    upgraded.close()
  })
})
