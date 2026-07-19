import { describe, expect, it } from 'vitest'
import {
  buildFullDataExport,
  toFullDataExportJson,
  fullDataExportFilename,
} from './dataExport'
import { seedProgram } from '@/data/seed/program'
import type { CheckIn, UserSettings, Workout } from './types'

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

// origin is bookkeeping the app keeps about itself, never a portable
// field — buildFullDataExport strips it, same as the single-program export.
const { origin: _seedOrigin, ...seedProgramContent } = seedProgram

describe('buildFullDataExport', () => {
  it('bundles programs, workouts, checkins, and settings, but never the Library', () => {
    const data = buildFullDataExport({
      programs: [seedProgram],
      workouts: [workout],
      checkins: [checkIn],
      settings,
      exportedAt: '2026-07-19T12:00:00.000Z',
    })
    expect(data).toEqual({
      exportedAt: '2026-07-19T12:00:00.000Z',
      programs: [seedProgramContent],
      workouts: [workout],
      checkins: [checkIn],
      settings,
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
      exportedAt: '2026-07-19T12:00:00.000Z',
    })
    expect(JSON.parse(toFullDataExportJson(data))).toEqual(data)
  })

  it('dates the filename', () => {
    expect(fullDataExportFilename('2026-08-01')).toBe('fit223-export-2026-08-01.json')
  })
})
