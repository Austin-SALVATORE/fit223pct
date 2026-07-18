import { previousSetsFor } from './workout'
import type { LoggedSet, Workout } from './types'

export type HighlightKind = 'first' | 'load' | 'effort' | 'steady'

export interface Highlight {
  exerciseId: string
  kind: HighlightKind
  /** Short badge text, e.g. "+2 kg", "+3 reps", "First time" */
  label: string
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
        return { exerciseId, kind: 'first' as const, label: 'First time' }
      }

      const seconds = exercise.prescription.mode === 'seconds'

      const topWeightNow = topWeight(exercise.sets)
      const topWeightBefore = topWeight(previous)
      if (topWeightNow !== null && topWeightBefore !== null && topWeightNow > topWeightBefore) {
        return {
          exerciseId,
          kind: 'load' as const,
          label: `+${formatKg(topWeightNow - topWeightBefore)} kg`,
        }
      }

      const effortNow = bestEffort(exercise.sets, topWeightNow, seconds)
      const effortBefore = bestEffort(previous, topWeightBefore, seconds)
      if (effortNow > effortBefore) {
        const delta = effortNow - effortBefore
        return {
          exerciseId,
          kind: 'effort' as const,
          label: seconds ? `+${delta}s` : `+${delta} ${delta === 1 ? 'rep' : 'reps'}`,
        }
      }

      return { exerciseId, kind: 'steady' as const, label: 'Held steady' }
    })
}

/** One quiet coaching sentence for the whole session. */
export function coachInsight(highlights: readonly Highlight[]): string {
  const count = (kind: HighlightKind) => highlights.filter((h) => h.kind === kind).length
  const loads = count('load')
  const efforts = count('effort')
  const firsts = count('first')

  if (loads > 0) {
    return loads === 1
      ? 'Load went up on one exercise — double progression is doing its job.'
      : `Load went up on ${loads} exercises — double progression is doing its job.`
  }
  if (efforts > 0) {
    return 'You beat last time on reps — when the range is full, load comes next.'
  }
  if (firsts === highlights.length && firsts > 0) {
    return 'Baselines set. Everything from here is progress.'
  }
  return 'Consistent work at the same numbers — that is what compounds.'
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

function formatKg(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
