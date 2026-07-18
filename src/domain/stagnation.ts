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

  // Double progression (docs/Training.md) means weight is EXPECTED to hold
  // flat for weeks while reps climb — that is the program working, not a
  // plateau. Progress on either dimension counts; only when neither weight
  // nor effort moved across the whole window is it a genuine stall.
  const progressed = improved(recent[0], recent[1]) || improved(recent[1], recent[2])

  if (progressed) {
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

interface Session {
  weightKg: number | null
  effort: number
}

/**
 * True if `b` beat `a` on either weight or effort. Never collapses the two
 * into one scalar — a flat weight with climbing reps is real progress
 * (double progression), not noise to discard.
 */
function improved(a: Session, b: Session): boolean {
  const weightUp = a.weightKg !== null && b.weightKg !== null && b.weightKg > a.weightKg
  const effortUp = b.effort > a.effort
  return weightUp || effortUp
}

function maxOf<T>(items: readonly T[], value: (item: T) => number | null): number {
  return items.reduce((max, item) => Math.max(max, value(item) ?? 0), 0)
}

function maxOrNull<T>(items: readonly T[], value: (item: T) => number | null): number | null {
  const values = items.map(value).filter((v): v is number => v !== null)
  return values.length > 0 ? Math.max(...values) : null
}
