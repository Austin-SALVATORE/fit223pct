import type { ExercisePrescription, LoggedSet } from './types'

export type ProgressionType =
  | 'start'
  | 'increase-load'
  | 'add-reps'
  | 'consolidate'
  | 'add-technique'

export interface ProgressionSuggestion {
  type: ProgressionType
  weightKg: number | null
  targetReps: number
  reason: string
}

/**
 * Double progression, equipment-aware (see docs/Training.md).
 * Fill the rep range first; add load once every set tops the range with
 * reps in reserve; at the home-equipment ceiling, progress through
 * technique (tempo, pauses, range of motion, unilateral work) instead.
 */
export function suggestProgression(
  prescription: ExercisePrescription,
  lastSets: readonly LoggedSet[],
): ProgressionSuggestion {
  const { range, targetRir } = prescription

  if (lastSets.length === 0) {
    return {
      type: 'start',
      weightKg: prescription.startWeightKg,
      targetReps: range.min,
      reason: 'First session — start at the prescribed weight and own the range.',
    }
  }

  const efforts = lastSets.map((set) => effortOf(set, prescription))
  const lastWeight = maxWeight(lastSets) ?? prescription.startWeightKg
  const toppedOut = efforts.every((reps) => reps >= range.max)
  const hadReserve = lastSets.every((set) => set.rir !== null && set.rir >= targetRir - 1)

  if (!toppedOut) {
    const weakest = Math.min(...efforts)
    return {
      type: 'add-reps',
      weightKg: lastWeight,
      targetReps: Math.min(weakest + 1, range.max),
      reason: 'Same weight — add a rep to your weakest set.',
    }
  }

  if (!hadReserve) {
    return {
      type: 'consolidate',
      weightKg: lastWeight,
      targetReps: range.max,
      reason: 'Top of the range, but too close to failure — own it once more.',
    }
  }

  const { maxWeightKg, weightStepKg } = prescription
  if (
    maxWeightKg === null ||
    weightStepKg === null ||
    lastWeight === null ||
    lastWeight + weightStepKg > maxWeightKg
  ) {
    return {
      type: 'add-technique',
      weightKg: lastWeight,
      targetReps: range.min,
      reason:
        'Load is maxed for this setup — progress with a slower eccentric, a pause, or more range.',
    }
  }

  return {
    type: 'increase-load',
    weightKg: lastWeight + weightStepKg,
    targetReps: range.min,
    reason: 'Every set topped the range with reps in reserve — time to add load.',
  }
}

function effortOf(set: LoggedSet, prescription: ExercisePrescription): number {
  const value = prescription.mode === 'seconds' ? set.seconds : set.reps
  return value ?? 0
}

function maxWeight(sets: readonly LoggedSet[]): number | null {
  const weights = sets
    .map((set) => set.weightKg)
    .filter((weight): weight is number => weight !== null)
  return weights.length > 0 ? Math.max(...weights) : null
}
