import { describe, expect, it } from 'vitest'
import { bodyFatTrend, consistencyTrend, strengthTrend, waistTrend, weightTrend } from './trends'
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
          restSeconds: 120,
          perSide: false,
          startWeightKg: weightKg,
          maxWeightKg: null,
          weightStepKg: null,
        },
        sets: [
          { setIndex: 0, weightKg, reps, seconds: null, completedAt: `${date}T09:10:00.000Z` },
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

  it('never lets the rate exceed 1 — a bonus session on an unscheduled day does not count toward it', () => {
    // Window: Mon 06 – Fri 10 (three scheduled days). Every scheduled day
    // trained, PLUS an extra session on Tuesday 07 (not a training day).
    const workouts = [
      workout('2026-07-06', 'goblet-squat', 14, 10), // Mon, scheduled
      workout('2026-07-07', 'goblet-squat', 14, 10), // Tue, bonus — not scheduled
      workout('2026-07-08', 'goblet-squat', 14, 10), // Wed, scheduled
      workout('2026-07-10', 'goblet-squat', 14, 10), // Fri, scheduled
    ]
    const trend = consistencyTrend(program, workouts, new Date(2026, 6, 11, 9, 0, 0))
    expect(trend.status).toBe('ok')
    if (trend.status === 'ok') {
      expect(trend.scheduledCount).toBe(3)
      expect(trend.completedCount).toBe(3)
      expect(trend.rate).toBeLessThanOrEqual(1)
    }
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

  it('never fabricates a 0 kg point for a session with no weight logged, on an otherwise weighted exercise', () => {
    const workouts = [
      workout('2026-07-06', 'goblet-squat', 16, 10),
      workout('2026-07-08', 'goblet-squat', null, 10), // weight not logged that day
      workout('2026-07-10', 'goblet-squat', 16, 10),
      workout('2026-07-12', 'goblet-squat', 16, 10),
    ]
    const trend = strengthTrend('goblet-squat', workouts)
    // The weightless session is excluded, not read as a collapse to 0 kg —
    // three real 16 kg points remain, so this is steady, not decreasing.
    expect(trend.status).toBe('steady')
    if (trend.status !== 'insufficient-data') {
      expect(trend.evidence.every((e) => e.value === 16)).toBe(true)
      expect(trend.evidence).toHaveLength(3)
    }
  })

  it('reports insufficient data, not a fabricated direction, when excluding weightless sessions drops below three', () => {
    const workouts = [
      workout('2026-07-06', 'goblet-squat', 16, 10),
      workout('2026-07-08', 'goblet-squat', null, 12),
      workout('2026-07-10', 'goblet-squat', 16, 8),
    ]
    const trend = strengthTrend('goblet-squat', workouts)
    expect(trend.status).toBe('insufficient-data')
  })

  it('is not thrown off by one noisy final reading — half-median beats a lone endpoint', () => {
    // Real progression across the middle sessions, but the LAST reading is
    // a one-off bad day back at the starting weight. Comparing only the
    // two endpoints (10 vs 10) would call this "steady" and hide the
    // genuine rise in between; half-median correctly reads it as increasing.
    const workouts = [
      workout('2026-07-06', 'goblet-squat', 10, 10),
      workout('2026-07-08', 'goblet-squat', 14, 10),
      workout('2026-07-10', 'goblet-squat', 16, 10),
      workout('2026-07-12', 'goblet-squat', 18, 10),
      workout('2026-07-14', 'goblet-squat', 10, 6), // an off day, not the trend
    ]
    const trend = strengthTrend('goblet-squat', workouts)
    expect(trend.status).toBe('increasing')
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


/**
 * weightTrend and bodyFatTrend (M10 phase 2) are waistTrend clones over
 * different fields, so they inherit its guards: three points minimum, and
 * enough calendar spread that a same-week cluster cannot claim a direction.
 *
 * The property worth guarding hardest is what `Trend` *cannot* express.
 * There is no field for a projection, so no amount of goal display can turn
 * a direction into a promised date — the predict-nothing rule comes from the
 * type, not from a convention.
 */
function measured(
  date: string,
  fields: { weightKg?: number | null; bodyFatPercent?: number | null },
): CheckIn {
  return {
    id: `m-${date}`,
    date,
    sleep: null,
    energy: null,
    soreness: null,
    stress: null,
    motivation: null,
    weightKg: fields.weightKg ?? null,
    waistCm: null,
    bodyFatPercent: fields.bodyFatPercent ?? null,
  }
}

describe('weightTrend', () => {
  it('reports insufficient data below three weigh-ins', () => {
    const trend = weightTrend([
      measured('2026-07-01', { weightKg: 82 }),
      measured('2026-07-15', { weightKg: 81 }),
    ])
    expect(trend.status).toBe('insufficient-data')
  })

  it('reports insufficient data when weigh-ins are clustered in one week', () => {
    const trend = weightTrend([
      measured('2026-07-01', { weightKg: 82 }),
      measured('2026-07-02', { weightKg: 82 }),
      measured('2026-07-03', { weightKg: 81 }),
    ])
    expect(trend.status).toBe('insufficient-data')
  })

  it('detects a decreasing trend across a spread-out series, in kg', () => {
    const trend = weightTrend([
      measured('2026-07-01', { weightKg: 84 }),
      measured('2026-07-10', { weightKg: 83 }),
      measured('2026-07-20', { weightKg: 82 }),
    ])
    expect(trend.status).toBe('decreasing')
    if (trend.status !== 'insufficient-data') {
      expect(trend.unit).toBe('kg')
      expect(trend.evidence).toHaveLength(3)
    }
  })

  it('ignores check-ins with no weight logged', () => {
    const trend = weightTrend([
      measured('2026-07-01', { weightKg: 84 }),
      measured('2026-07-05', {}),
      measured('2026-07-20', { weightKg: 82 }),
    ])
    expect(trend.status).toBe('insufficient-data')
  })

  it('carries no field that could express a projection', () => {
    const trend = weightTrend([
      measured('2026-07-01', { weightKg: 84 }),
      measured('2026-07-10', { weightKg: 83 }),
      measured('2026-07-20', { weightKg: 82 }),
    ])
    if (trend.status === 'insufficient-data') throw new Error('expected a direction')
    // Every date in the result is an observation. If a forecast field is ever
    // added to Trend, this fails and names the reason.
    expect(Object.keys(trend).sort()).toEqual(['evidence', 'status', 'unit'])
    for (const point of trend.evidence) {
      expect(Object.keys(point).sort()).toEqual(['date', 'value'])
    }
  })
})

describe('bodyFatTrend', () => {
  it('reports insufficient data below three readings', () => {
    const trend = bodyFatTrend([
      measured('2026-07-01', { bodyFatPercent: 22 }),
      measured('2026-07-20', { bodyFatPercent: 21 }),
    ])
    expect(trend.status).toBe('insufficient-data')
  })

  it('detects a decreasing trend across a spread-out series, in percent', () => {
    const trend = bodyFatTrend([
      measured('2026-07-01', { bodyFatPercent: 24 }),
      measured('2026-07-10', { bodyFatPercent: 23 }),
      measured('2026-07-20', { bodyFatPercent: 22 }),
    ])
    expect(trend.status).toBe('decreasing')
    if (trend.status !== 'insufficient-data') {
      expect(trend.unit).toBe('percent')
    }
  })

  it('treats an absent bodyFatPercent the same as an explicit null', () => {
    // Pre-v4 check-ins have no such field at all; both must be skipped.
    const withoutField = { ...measured('2026-07-05', {}) }
    delete (withoutField as { bodyFatPercent?: number | null }).bodyFatPercent

    const trend = bodyFatTrend([
      measured('2026-07-01', { bodyFatPercent: 24 }),
      withoutField,
      measured('2026-07-20', { bodyFatPercent: 22 }),
    ])
    expect(trend.status).toBe('insufficient-data')
  })
})
