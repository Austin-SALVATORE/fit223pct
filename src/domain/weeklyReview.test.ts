import { describe, expect, it } from 'vitest'
import { buildWeeklyReview, reviewIsUnseen } from './weeklyReview'
import type { Program, Workout } from './types'

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
  tier?: 'ready' | 'steady' | 'easier',
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
        exerciseId: 'goblet-squat',
        prescription: {
          exerciseId: 'goblet-squat',
          sets: 2,
          mode: 'reps',
          range: { min: 8, max: 12 },
          targetRir: 2,
          restSeconds: 120,
          perSide: false,
          startWeightKg: 14,
          maxWeightKg: null,
          weightStepKg: null,
        },
        sets: [
          { setIndex: 0, weightKg: 14, reps: 10, seconds: null, rir: 2, completedAt: `${date}T09:10:00.000Z` },
          { setIndex: 1, weightKg: 14, reps: 10, seconds: null, rir: 2, completedAt: `${date}T09:20:00.000Z` },
        ],
      },
    ],
    ...(tier ? { readiness: { tier, drivers: [] } } : {}),
  }
}

describe('reviewIsUnseen', () => {
  it('is true for a real review that has never been marked seen', () => {
    const review = buildWeeklyReview(program, [], new Date(2026, 6, 13, 9, 0, 0))
    expect(reviewIsUnseen(review, null)).toBe(true)
  })

  it('is true any day of the week, not just Monday — attendance should not gate it', () => {
    const review = buildWeeklyReview(program, [], new Date(2026, 6, 16, 9, 0, 0)) // Thursday
    expect(reviewIsUnseen(review, null)).toBe(true)
  })

  it('is false once that exact week has been marked seen', () => {
    const review = buildWeeklyReview(program, [], new Date(2026, 6, 13, 9, 0, 0))
    expect(reviewIsUnseen(review, review?.weekStart ?? null)).toBe(false)
  })

  it('is true again for a new week even if a previous week was seen', () => {
    const review = buildWeeklyReview(program, [], new Date(2026, 6, 20, 9, 0, 0)) // the following Monday
    expect(reviewIsUnseen(review, '2026-07-06')).toBe(true)
  })

  it('is false when there is no review to show', () => {
    expect(reviewIsUnseen(null, null)).toBe(false)
  })
})

describe('buildWeeklyReview', () => {
  it('returns null when the program had not started before that week', () => {
    // Reviewing the week of 06-29–07-05, but the program starts 07-06
    const review = buildWeeklyReview(program, [], new Date(2026, 6, 6, 9, 0, 0))
    expect(review).toBeNull()
  })

  it('summarizes the just-completed week with only observed counts', () => {
    // Monday 07-13: review the week of Mon 07-06 – Sun 07-12
    const workouts = [workout('2026-07-06'), workout('2026-07-08')]
    const review = buildWeeklyReview(program, workouts, new Date(2026, 6, 13, 9, 0, 0))
    expect(review).not.toBeNull()
    if (review) {
      expect(review.weekStart).toBe('2026-07-06')
      expect(review.weekEnd).toBe('2026-07-12')
      expect(review.scheduledCount).toBe(3) // Mon/Wed/Fri
      expect(review.completedCount).toBe(2)
      expect(review.totalSets).toBe(4) // 2 sets × 2 workouts
      expect(review.volumeKg).toBe(4 * 14 * 10)
    }
  })

  it('tallies the readiness tiers of the week\'s completed sessions', () => {
    const workouts = [
      workout('2026-07-06', 'ready'),
      workout('2026-07-08', 'easier'),
      workout('2026-07-10'), // no readiness recorded — defaults to steady
    ]
    const review = buildWeeklyReview(program, workouts, new Date(2026, 6, 13, 9, 0, 0))
    expect(review?.readinessTierCounts).toEqual({ ready: 1, steady: 1, easier: 1 })
  })

  it('reports zero, not insufficient data, for a quiet week — a fact, not a trend claim', () => {
    const review = buildWeeklyReview(program, [], new Date(2026, 6, 13, 9, 0, 0))
    expect(review).not.toBeNull()
    expect(review?.completedCount).toBe(0)
  })

  it('does not count workouts from outside the reviewed week', () => {
    const workouts = [workout('2026-07-06'), workout('2026-07-13')] // next week
    const review = buildWeeklyReview(program, workouts, new Date(2026, 6, 13, 9, 0, 0))
    expect(review?.completedCount).toBe(1)
  })
})
