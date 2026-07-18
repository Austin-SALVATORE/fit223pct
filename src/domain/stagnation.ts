import type { Exercise, Workout } from './types'

export interface StagnationEvidencePoint {
  date: string
  weightKg: number | null
  effort: number
  /** How to read `effort` when there's no weight to report instead */
  effortMode: 'reps' | 'seconds'
}

export interface StagnationInsufficientData {
  status: 'insufficient-data'
}

export interface StagnationProgressing {
  status: 'progressing'
}

export interface StagnationDetected {
  status: 'stagnant'
  evidence: StagnationEvidencePoint[]
  /** Qualifying sessions excluded from consideration because they ran on an 'easier' readiness day */
  excludedForReadiness: number
  suggestedSubstitutionId: string | null
}

export type StagnationResult =
  | StagnationInsufficientData
  | StagnationProgressing
  | StagnationDetected

const REQUIRED_QUALIFYING_SESSIONS = 3

/**
 * Has this exercise's load stopped moving? Judged only across "qualifying"
 * sessions — ones NOT run on an 'easier' readiness day, since a deliberately
 * deferred load increase (docs/Readiness.md) is not a plateau. Every claim
 * carries the exact dated sessions it was built from; nothing is inferred
 * from data that isn't there.
 */
export function detectStagnation(
  exercise: Exercise,
  workouts: readonly Workout[],
): StagnationResult {
  const sessions = workouts
    .filter((w) => w.completedAt !== null)
    .flatMap((w) => {
      const entry = w.exercises.find((e) => e.exerciseId === exercise.id && e.sets.length > 0)
      if (!entry) return []
      return [
        {
          date: w.date,
          tier: w.readiness?.tier ?? 'steady',
          weightKg: maxOrNull(entry.sets, (s) => s.weightKg),
          effort: maxOf(entry.sets, (s) => s.reps ?? s.seconds),
          effortMode: entry.prescription.mode,
        },
      ]
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  const qualifying = sessions.filter((s) => s.tier !== 'easier')
  if (qualifying.length < REQUIRED_QUALIFYING_SESSIONS) {
    return { status: 'insufficient-data' }
  }

  const recent = qualifying.slice(-REQUIRED_QUALIFYING_SESSIONS)
  const scoreOf = (s: (typeof recent)[number]) => s.weightKg ?? s.effort

  const noIncrease =
    scoreOf(recent[1]) <= scoreOf(recent[0]) && scoreOf(recent[2]) <= scoreOf(recent[1])

  if (!noIncrease) {
    return { status: 'progressing' }
  }

  const excludedForReadiness = sessions.filter(
    (s) => s.tier === 'easier' && s.date >= recent[0].date && s.date <= recent[2].date,
  ).length

  return {
    status: 'stagnant',
    evidence: recent.map((s) => ({
      date: s.date,
      weightKg: s.weightKg,
      effort: s.effort,
      effortMode: s.effortMode,
    })),
    excludedForReadiness,
    suggestedSubstitutionId: exercise.substitutionIds[0] ?? null,
  }
}

function maxOf<T>(items: readonly T[], value: (item: T) => number | null): number {
  return items.reduce((max, item) => Math.max(max, value(item) ?? 0), 0)
}

function maxOrNull<T>(items: readonly T[], value: (item: T) => number | null): number | null {
  const values = items.map(value).filter((v): v is number => v !== null)
  return values.length > 0 ? Math.max(...values) : null
}
