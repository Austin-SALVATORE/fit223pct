import { describe, expect, it } from 'vitest'
import { detectStagnation } from './stagnation'
import type { Exercise, Workout } from './types'

const squat: Exercise = {
  id: 'goblet-squat',
  muscles: ['quads'],
  equipment: ['dumbbell'],
  substitutionIds: ['split-squat'],
  isUnilateral: false,
}

const noSubs: Exercise = { ...squat, id: 'band-curl', substitutionIds: [] }

function workout(
  date: string,
  weightKg: number,
  reps: number,
  readinessTier?: 'ready' | 'steady' | 'easier',
  exerciseId = 'goblet-squat',
): Workout {
  return {
    id: `w-${date}`,
    programId: 'phase-1-home',
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
    ...(readinessTier ? { readiness: { tier: readinessTier, drivers: [] } } : {}),
  }
}

describe('detectStagnation', () => {
  it('reports insufficient data with fewer than three qualifying sessions', () => {
    const result = detectStagnation(squat, [workout('2026-07-06', 14, 10), workout('2026-07-08', 14, 10)])
    expect(result.status).toBe('insufficient-data')
  })

  it('reports progressing when the most recent sessions show improvement', () => {
    const result = detectStagnation(squat, [
      workout('2026-07-06', 14, 10),
      workout('2026-07-08', 14, 12),
      workout('2026-07-10', 16, 8),
    ])
    expect(result.status).toBe('progressing')
  })

  it('reports stagnant with named evidence when three sessions show no increase', () => {
    const result = detectStagnation(squat, [
      workout('2026-07-06', 16, 10),
      workout('2026-07-10', 16, 10),
      workout('2026-07-13', 16, 9),
    ])
    expect(result.status).toBe('stagnant')
    if (result.status === 'stagnant') {
      expect(result.evidence).toHaveLength(3)
      expect(result.evidence.map((e) => e.date)).toEqual(['2026-07-06', '2026-07-10', '2026-07-13'])
      expect(result.evidence[0].weightKg).toBe(16)
    }
  })

  it('suggests the exercise\'s first substitution when stagnant', () => {
    const result = detectStagnation(squat, [
      workout('2026-07-06', 16, 10),
      workout('2026-07-10', 16, 10),
      workout('2026-07-13', 16, 9),
    ])
    expect(result.status).toBe('stagnant')
    if (result.status === 'stagnant') expect(result.suggestedSubstitutionId).toBe('split-squat')
  })

  it('prefers a program-defined substitution over the Library generic when both are given', () => {
    const result = detectStagnation(
      squat,
      [
        workout('2026-07-06', 16, 10),
        workout('2026-07-10', 16, 10),
        workout('2026-07-13', 16, 9),
      ],
      { substitutionIds: ['bulgarian-split-squat'] },
    )
    expect(result.status).toBe('stagnant')
    if (result.status === 'stagnant') expect(result.suggestedSubstitutionId).toBe('bulgarian-split-squat')
  })

  it('offers no suggestion when the exercise has no substitutions', () => {
    const result = detectStagnation(noSubs, [
      workout('2026-07-06', 8, 15, undefined, 'band-curl'),
      workout('2026-07-10', 8, 15, undefined, 'band-curl'),
      workout('2026-07-13', 8, 14, undefined, 'band-curl'),
    ])
    expect(result.status).toBe('stagnant')
    if (result.status === 'stagnant') expect(result.suggestedSubstitutionId).toBeNull()
  })

  it('excludes easier-readiness sessions from the stall count — deferred progress is not a plateau', () => {
    const result = detectStagnation(squat, [
      workout('2026-07-06', 14, 10),
      workout('2026-07-08', 14, 10, 'easier'), // rough day, deferred on purpose
      workout('2026-07-10', 14, 10, 'easier'), // another rough day
      workout('2026-07-13', 16, 8), // genuine jump once recovered
    ])
    // Only two qualifying (non-easier) sessions exist — insufficient data,
    // not a false stagnation claim built on days that were deliberately eased.
    expect(result.status).toBe('insufficient-data')
  })

  it('still detects a genuine plateau once enough qualifying sessions exist, ignoring easier days along the way', () => {
    const result = detectStagnation(squat, [
      workout('2026-07-06', 16, 10),
      workout('2026-07-08', 16, 10, 'easier'),
      workout('2026-07-10', 16, 10),
      workout('2026-07-13', 16, 9),
    ])
    expect(result.status).toBe('stagnant')
    if (result.status === 'stagnant') {
      expect(result.excludedForReadiness).toBe(1)
      expect(result.evidence.map((e) => e.date)).toEqual(['2026-07-06', '2026-07-10', '2026-07-13'])
    }
  })

  it('never flags double progression as stagnant — flat weight with climbing reps is the program working as designed', () => {
    // Exactly the fill-the-rep-range stage docs/Training.md describes:
    // weight holds at 16 kg for weeks while reps climb toward the top of range.
    const result = detectStagnation(squat, [
      workout('2026-07-06', 16, 9),
      workout('2026-07-08', 16, 11),
      workout('2026-07-10', 16, 12),
    ])
    expect(result.status).toBe('progressing')
  })

  it('still flags a genuine plateau where weight AND reps both hold flat', () => {
    const result = detectStagnation(squat, [
      workout('2026-07-06', 16, 10),
      workout('2026-07-08', 16, 10),
      workout('2026-07-10', 16, 10),
    ])
    expect(result.status).toBe('stagnant')
  })

  it('counts a reps improvement even on the transition where weight also happens to be flat', () => {
    // Weight flat 06→08, but reps climbed — that transition alone should
    // be enough to call it progressing, regardless of what 08→10 does.
    const result = detectStagnation(squat, [
      workout('2026-07-06', 16, 8),
      workout('2026-07-08', 16, 12),
      workout('2026-07-10', 16, 10),
    ])
    expect(result.status).toBe('progressing')
  })

  it('ignores sessions for other exercises', () => {
    const result = detectStagnation(squat, [
      workout('2026-07-06', 16, 10),
      workout('2026-07-08', 20, 10, undefined, 'bench-press'),
      workout('2026-07-10', 16, 10),
      workout('2026-07-13', 16, 9),
    ])
    expect(result.status).toBe('stagnant')
  })
})
