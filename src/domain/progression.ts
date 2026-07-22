import type { MessageDescriptor } from './message'
import type { ReadinessTier } from './readiness'
import type { ExercisePrescription, LadderPrescription, RepRangePrescription, SetTarget, LoggedSet } from './types'

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
  prescription: RepRangePrescription,
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

export type LadderProgressionResult =
  | { type: 'advance'; setPlan: SetTarget[] }
  | { type: 'repeat'; setPlan: SetTarget[] }
  | { type: 'at-equipment-max'; setPlan: SetTarget[] }

/**
 * Classical ascending pyramid (docs/PyramidProgression.md) — completion
 * only, no reserve gate. Every rung's target reps hit → the whole ladder
 * steps up by weightStepKg together; falling short on any rung → repeat
 * the same targets. At the equipment ceiling (the top rung can't take
 * another step), the whole ladder holds unchanged rather than partially
 * advancing the lower rungs — see docs/PyramidProgression.md's Question B
 * for why: it's the same "surface the ceiling honestly" philosophy
 * suggestProgression's add-technique branch already uses, and clamping the
 * top while raising the rest would quietly collapse the coach-authored
 * rung spacing into flat sets nobody decided to ship.
 */
export function suggestLadderProgression(
  prescription: LadderPrescription,
  lastSets: readonly LoggedSet[],
): LadderProgressionResult {
  const { setPlan, maxWeightKg, weightStepKg } = prescription

  if (lastSets.length === 0) {
    return { type: 'repeat', setPlan }
  }

  const completed = setPlan.every((rung, index) => {
    const logged = lastSets.find((set) => set.setIndex === index)
    return logged !== undefined && (logged.reps ?? 0) >= rung.reps
  })
  if (!completed) {
    return { type: 'repeat', setPlan }
  }

  const topRung = setPlan.at(-1)
  if (
    topRung === undefined ||
    weightStepKg === null ||
    maxWeightKg === null ||
    topRung.weightKg === null ||
    topRung.weightKg + weightStepKg > maxWeightKg
  ) {
    return { type: 'at-equipment-max', setPlan }
  }

  return {
    type: 'advance',
    setPlan: setPlan.map((rung) => ({
      ...rung,
      weightKg: rung.weightKg === null ? null : rung.weightKg + weightStepKg,
    })),
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
