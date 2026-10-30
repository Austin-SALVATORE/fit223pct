import { describe, expect, it } from 'vitest'
import {
  buildFullDataExport,
  toFullDataExportJson,
  fullDataExportFilename,
} from './dataExport'
import { seedProgram } from '@/data/seed/program'
import type { ActivityRecord, CheckIn, UserSettings, Workout } from './types'

const workout: Workout = {
  id: 'w1',
  programId: seedProgram.id,
  sessionTemplateId: 'A',
  date: '2026-07-22',
  startedAt: '2026-07-22T09:00:00.000Z',
  completedAt: '2026-07-22T09:40:00.000Z',
  exercises: [],
}

const checkIn: CheckIn = {
  id: 'c1',
  date: '2026-07-22',
  sleep: 4,
  energy: 4,
  soreness: 2,
  stress: 2,
  motivation: 4,
  weightKg: null,
  waistCm: null,
}

const settings: UserSettings = {
  id: 'user',
  name: 'Austin',
  heightCm: 180,
  weeklyGoal: 3,
  lastSeenWeeklyReviewWeekStart: null,
}

const rideRecord: ActivityRecord = {
  id: '2026-07-22-ride',
  date: '2026-07-22',
  programId: seedProgram.id,
  kind: 'ride',
  completedAt: '2026-07-22T18:00:00.000Z',
  actualMinutes: 20,
  avgHeartRate: 132,
}

// origin is bookkeeping the app keeps about itself, never a portable
// field — buildFullDataExport strips it, same as the single-program export.
const { origin: _seedOrigin, ...seedProgramContent } = seedProgram

describe('buildFullDataExport', () => {
  it('bundles programs, workouts, checkins, settings, and activity records, but never the Library', () => {
    const data = buildFullDataExport({
      programs: [seedProgram],
      workouts: [workout],
      checkins: [checkIn],
      settings,
      activityRecords: [rideRecord],
      exportedAt: '2026-07-19T12:00:00.000Z',
    })
    expect(data).toEqual({
      exportedAt: '2026-07-19T12:00:00.000Z',
      programs: [seedProgramContent],
      workouts: [workout],
      checkins: [checkIn],
      settings,
      activityRecords: [rideRecord],
    })
    expect(data).not.toHaveProperty('exercises')
    expect(data).not.toHaveProperty('library')
    expect(data.programs[0]).not.toHaveProperty('origin')
  })

  it('falls back to null settings when none exist yet', () => {
    const data = buildFullDataExport({
      programs: [],
      workouts: [],
      checkins: [],
      settings: undefined,
      activityRecords: [],
      exportedAt: '2026-07-19T12:00:00.000Z',
    })
    expect(data.settings).toBeNull()
  })
})

describe('toFullDataExportJson / fullDataExportFilename', () => {
  it('produces valid, re-parseable JSON', () => {
    const data = buildFullDataExport({
      programs: [seedProgram],
      workouts: [workout],
      checkins: [checkIn],
      settings,
      activityRecords: [rideRecord],
      exportedAt: '2026-07-19T12:00:00.000Z',
    })
    expect(JSON.parse(toFullDataExportJson(data))).toEqual(data)
  })

  it('dates the filename', () => {
    expect(fullDataExportFilename('2026-08-01')).toBe('fit223-export-2026-08-01.json')
  })
})

/**
 * Sets a swap cleared are kept as a record on the slot (`priorAttempts`, owner
 * OD-d, 29 Oct) and travel with the workout in the backup. The export hands over
 * stored workouts untouched, so this is the guard that stays true if anyone ever
 * adds a field whitelist or a sanitiser to it.
 *
 * Negative control, run 30 Oct: mapping each exercise to drop `priorAttempts`
 * in `buildFullDataExport` turns both tests red.
 */
describe('a workout with sets kept from before a swap', () => {
  const swapped: Workout = {
    ...workout,
    id: 'w-swapped',
    exercises: [
      {
        exerciseId: 'split-squat',
        prescription: seedProgram.sessions[1].items[0],
        substitutedForId: 'goblet-squat',
        sets: [],
        priorAttempts: [
          {
            exerciseId: 'goblet-squat',
            sets: [{ setIndex: 0, weightKg: 20, reps: 10, seconds: null, completedAt: '2026-07-22T09:10:00.000Z' }],
          },
        ],
      },
    ],
  }
  const build = () =>
    buildFullDataExport({
      programs: [],
      workouts: [swapped],
      checkins: [],
      settings: undefined,
      activityRecords: [],
      exportedAt: '2026-07-19T12:00:00.000Z',
    })

  it('exports the record with the workout', () => {
    expect(build().workouts[0].exercises[0].priorAttempts).toEqual(swapped.exercises[0].priorAttempts)
  })

  it('and it survives the JSON the backup is written as', () => {
    const parsed = JSON.parse(toFullDataExportJson(build())) as { workouts: Workout[] }
    expect(parsed.workouts[0].exercises[0].priorAttempts?.[0]).toMatchObject({
      exerciseId: 'goblet-squat',
      sets: [{ weightKg: 20, reps: 10 }],
    })
  })
})
