import { previousSetsFor } from './workout'
import type { MessageDescriptor } from './message'
import type { ReadinessTier } from './readiness'
import type { LoggedSet, Workout } from './types'

export type HighlightKind = 'first' | 'load' | 'effort' | 'steady'

export interface Highlight {
  exerciseId: string
  kind: HighlightKind
  /** Short badge text, e.g. "+2 kg", "+3 reps", "First time" */
  label: MessageDescriptor
}

/**
 * What made this workout different from last time — one highlight per
 * performed exercise, computed against the most recent prior performance.
 * Honest by design: no progress is reported as "steady", never inflated.
 */
export function workoutHighlights(
  workout: Workout,
  history: readonly Workout[],
): Highlight[] {
  const priorWorkouts = history.filter((w) => w.id !== workout.id)

  return workout.exercises
    .filter((exercise) => exercise.sets.length > 0)
    .map((exercise) => {
      const { exerciseId } = exercise
      const previous = previousSetsFor(priorWorkouts, exerciseId)
      if (previous.length === 0) {
        return { exerciseId, kind: 'first' as const, label: { key: 'domain:highlight.first' } }
      }

      const seconds = exercise.prescription.mode === 'seconds'

      const topWeightNow = topWeight(exercise.sets)
      const topWeightBefore = topWeight(previous)
      if (topWeightNow !== null && topWeightBefore !== null && topWeightNow > topWeightBefore) {
        return {
          exerciseId,
          kind: 'load' as const,
          label: {
            key: 'domain:highlight.load',
            params: { delta: topWeightNow - topWeightBefore },
          },
        }
      }

      const effortNow = bestEffort(exercise.sets, topWeightNow, seconds)
      const effortBefore = bestEffort(previous, topWeightBefore, seconds)
      if (effortNow > effortBefore) {
        const delta = effortNow - effortBefore
        const label: MessageDescriptor = seconds
          ? { key: 'domain:highlight.effortSeconds', params: { delta } }
          : { key: 'domain:highlight.effortReps', params: { count: delta } }
        return { exerciseId, kind: 'effort' as const, label }
      }

      return { exerciseId, kind: 'steady' as const, label: { key: 'domain:highlight.steady' } }
    })
}

/** One quiet coaching sentence for the whole session. */
export function coachInsight(
  highlights: readonly Highlight[],
  readinessTier?: ReadinessTier,
): MessageDescriptor {
  if (readinessTier === 'easier') {
    return { key: 'domain:coachInsight.easier' }
  }

  const count = (kind: HighlightKind) => highlights.filter((h) => h.kind === kind).length
  const loads = count('load')
  const efforts = count('effort')
  const firsts = count('first')

  if (loads > 0) {
    return { key: 'domain:coachInsight.loadsUp', params: { count: loads } }
  }
  if (efforts > 0) {
    return { key: 'domain:coachInsight.effortsUp' }
  }
  if (firsts === highlights.length && firsts > 0) {
    return { key: 'domain:coachInsight.baselines' }
  }
  return { key: 'domain:coachInsight.consistent' }
}

function topWeight(sets: readonly LoggedSet[]): number | null {
  const weights = sets
    .map((s) => s.weightKg)
    .filter((w): w is number => w !== null)
  return weights.length > 0 ? Math.max(...weights) : null
}

/** Best reps (or seconds) achieved at the top weight — the honest comparison point. */
function bestEffort(
  sets: readonly LoggedSet[],
  atWeight: number | null,
  seconds: boolean,
): number {
  const relevant =
    atWeight === null ? sets : sets.filter((s) => s.weightKg === atWeight)
  return relevant.reduce(
    (best, s) => Math.max(best, (seconds ? s.seconds : s.reps) ?? 0),
    0,
  )
}
