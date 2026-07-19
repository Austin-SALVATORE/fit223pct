import type { MessageDescriptor } from './message'
import type { ReadinessTier } from './readiness'
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
  reason: MessageDescriptor
}

/**
 * Double progression, equipment-aware (see docs/Training.md).
 * Fill the rep range first; add load once every set tops the range with
 * reps in reserve; at the home-equipment ceiling, progress through
 * technique (tempo, pauses, range of motion, unilateral work) instead.
 *
 * On an 'easier' readiness day, load increases are deferred (never lost —
 * the same earned increase is suggested next time), while filling the rep
 * range remains allowed.
 */
export function suggestProgression(
  prescription: ExercisePrescription,
  lastSets: readonly LoggedSet[],
  readinessTier?: ReadinessTier,
): ProgressionSuggestion {
  const { range, targetRir } = prescription

  if (lastSets.length === 0) {
    return {
      type: 'start',
      weightKg: prescription.startWeightKg,
      targetReps: range.min,
      reason: { key: 'domain:progression.start' },
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
      reason: { key: 'domain:progression.addReps' },
    }
  }

  if (!hadReserve) {
    return {
      type: 'consolidate',
      weightKg: lastWeight,
      targetReps: range.max,
      reason: { key: 'domain:progression.consolidateNoReserve' },
    }
  }

  if (readinessTier === 'easier') {
    return {
      type: 'consolidate',
      weightKg: lastWeight,
      targetReps: range.max,
      reason: { key: 'domain:progression.consolidateEasier' },
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
      reason: { key: 'domain:progression.addTechnique' },
    }
  }

  return {
    type: 'increase-load',
    weightKg: lastWeight + weightStepKg,
    targetReps: range.min,
    reason: { key: 'domain:progression.increaseLoad' },
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
