import { describe, expect, it } from 'vitest'
import { consistencyTrend, strengthTrend, waistTrend } from './trends'
import type { CheckIn, Program, Workout } from './types'

const program: Program = {
  id: 'phase-1-home',
  name: 'Phase 1 — Home',
  phase: 1,
  startDate: '2026-07-06', // Monday
  endDate: null,
  trainingWeekdays: [1, 3, 5],
  rotation: ['A', 'B'],
  sessions: [
    { id: 'A', name: 'A', focus: 'f', items: [] },
    { id: 'B', name: 'B', focus: 'f', items: [] },
  ],
}

function workout(
  date: string,
  exerciseId: string,
  weightKg: number | null,
  reps: number,
  overrides: Partial<Workout> = {},
): Workout {
  return {
    id: `w-${date}`,
    programId: program.id,
    sessionTemplateId: 'A',
    date,
    startedAt: `${date}T09:00:00.000Z`,
    completedAt: `${date}T10:00:00.000Z`,
    exercises: [
      {
        exerciseId,
        prescription: {
          exerciseId,
          sets: 3,
          mode: 'reps',
          range: { min: 8, max: 12 },
          targetRir: 2,
          restSeconds: 120,
          perSide: false,
          startWeightKg: weightKg,
          maxWeightKg: null,
          weightStepKg: null,
        },
        sets: [
          { setIndex: 0, weightKg, reps, seconds: null, rir: 2, completedAt: `${date}T09:10:00.000Z` },
        ],
      },
    ],
    ...overrides,
  }
}

function checkIn(date: string, waistCm: number | null): CheckIn {
  return {
    id: `c-${date}`,
    date,
    sleep: null,
    energy: null,
    soreness: null,
    stress: null,
    motivation: null,
    weightKg: null,
    waistCm,
  }
}

describe('consistencyTrend', () => {
  it('reports insufficient data before a full day has elapsed since program start', () => {
    const trend = consistencyTrend(program, [], new Date(2026, 6, 6, 9, 0, 0))
    expect(trend.status).toBe('insufficient-data')
  })

  it('reports a completion rate once a window exists', () => {
    // Window is [program start, yesterday]. Today is Saturday 07-11, so the
    // window runs Mon 06 – Fri 10: three scheduled days (Mon/Wed/Fri), one completed.
    const workouts = [workout('2026-07-06', 'goblet-squat', 14, 10)]
    const trend = consistencyTrend(program, workouts, new Date(2026, 6, 11, 9, 0, 0))
    expect(trend.status).toBe('ok')
    if (trend.status === 'ok') {
      expect(trend.scheduledCount).toBe(3)
      expect(trend.completedCount).toBe(1)
    }
  })

  it('only counts scheduled days from the program start date, not before', () => {
    const trend = consistencyTrend(program, [], new Date(2026, 6, 7, 9, 0, 0))
    expect(trend.status).toBe('ok')
    if (trend.status === 'ok') expect(trend.scheduledCount).toBe(1) // just Monday
  })
})

describe('strengthTrend', () => {
  it('reports insufficient data with fewer than three qualifying sessions', () => {
    const workouts = [
      workout('2026-07-06', 'goblet-squat', 14, 10),
      workout('2026-07-08', 'goblet-squat', 14, 11),
    ]
    const trend = strengthTrend('goblet-squat', workouts)
    expect(trend.status).toBe('insufficient-data')
  })

  it('detects an increasing trend from rising top weight, with named evidence', () => {
    const workouts = [
      workout('2026-07-06', 'goblet-squat', 14, 10),
      workout('2026-07-08', 'goblet-squat', 14, 12),
      workout('2026-07-10', 'goblet-squat', 16, 8),
    ]
    const trend = strengthTrend('goblet-squat', workouts)
    expect(trend.status).toBe('increasing')
    if (trend.status !== 'insufficient-data') {
      expect(trend.evidence).toHaveLength(3)
      expect(trend.evidence[0].date).toBe('2026-07-06')
      expect(trend.evidence.at(-1)?.value).toBe(16)
    }
  })

  it('detects a steady trend when top weight is unchanged', () => {
    const workouts = [
      workout('2026-07-06', 'goblet-squat', 14, 10),
      workout('2026-07-08', 'goblet-squat', 14, 10),
      workout('2026-07-10', 'goblet-squat', 14, 11),
    ]
    const trend = strengthTrend('goblet-squat', workouts)
    expect(trend.status).toBe('steady')
  })

  it('detects a decreasing trend when top weight falls', () => {
    const workouts = [
      workout('2026-07-06', 'goblet-squat', 18, 8),
      workout('2026-07-08', 'goblet-squat', 16, 10),
      workout('2026-07-10', 'goblet-squat', 14, 10),
    ]
    const trend = strengthTrend('goblet-squat', workouts)
    expect(trend.status).toBe('decreasing')
  })

  it('falls back to effort (reps/seconds) when the exercise has no weight data', () => {
    const workouts = [
      workout('2026-07-06', 'dead-bug', null, 8),
      workout('2026-07-08', 'dead-bug', null, 9),
      workout('2026-07-10', 'dead-bug', null, 10),
    ]
    const trend = strengthTrend('dead-bug', workouts)
    expect(trend.status).toBe('increasing')
  })

  it('ignores workouts for other exercises', () => {
    const workouts = [
      workout('2026-07-06', 'goblet-squat', 14, 10),
      workout('2026-07-08', 'bench-press', 20, 10),
      workout('2026-07-10', 'goblet-squat', 14, 10),
    ]
    const trend = strengthTrend('goblet-squat', workouts)
    expect(trend.status).toBe('insufficient-data')
  })
})

describe('waistTrend', () => {
  it('reports insufficient data with fewer than three measurements', () => {
    const trend = waistTrend([checkIn('2026-07-01', 92), checkIn('2026-07-08', 91)])
    expect(trend.status).toBe('insufficient-data')
  })

  it('reports insufficient data when measurements are not spread over enough time', () => {
    const trend = waistTrend([
      checkIn('2026-07-01', 92),
      checkIn('2026-07-02', 92),
      checkIn('2026-07-03', 91),
    ])
    expect(trend.status).toBe('insufficient-data')
  })

  it('detects a decreasing trend across a spread-out set of measurements', () => {
    const trend = waistTrend([
      checkIn('2026-07-01', 94),
      checkIn('2026-07-10', 92.5),
      checkIn('2026-07-20', 91),
    ])
    expect(trend.status).toBe('decreasing')
    if (trend.status !== 'insufficient-data') {
      expect(trend.evidence).toHaveLength(3)
    }
  })

  it('ignores check-ins without a waist measurement', () => {
    const trend = waistTrend([
      checkIn('2026-07-01', 94),
      checkIn('2026-07-05', null),
      checkIn('2026-07-10', 93),
    ])
    expect(trend.status).toBe('insufficient-data')
  })
})
