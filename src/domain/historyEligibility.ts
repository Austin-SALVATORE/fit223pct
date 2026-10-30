import type { Workout, WorkoutExercise } from './types'

/**
 * Which stored exposures may seed a **weight suggestion** for a swapped
 * exercise — the coach's rulings of 29 Oct 2026
 * (`docs/programs/coach-rulings-cq1-cq7-2026-10-29.md`, `coach-confirmation-cc1-cc4-2026-10-29.md`):
 * "the most recent valid, completed, normal-day performance within the current
 * compatible progression context", and "the displayed historical fact and the
 * suggested starting load are not necessarily the same thing".
 *
 * Layers, each a function so a consumer composes the ones its own rule needs and
 * no other rule is widened or narrowed:
 *
 *   L1  completed, and a normal day (CQ3: "exclude Easier Day logs")
 *   L2  not a known data issue (CQ1, CQ5) — a hook only; the list is a later phase
 *   L3  the same program (CC2: "exercise identity alone does not establish
 *       progression continuity across programs"; Mesocycle 2 with its approved
 *       revisions is one program, Phase 1 another)
 *   L4  an own-identity record (CC1, "Reading B"): not logged under a swap, or
 *       logged under a swap that carried a `substituteLoad` — proof it was
 *       recorded under the exercise-specific rules. Pre-fix substitute records
 *       (the corrupted 24 Oct bench among them) are excluded, and future valid
 *       substitute logs build the substitute's own history.
 *   L5  at least one set with a weight (CQ3: "if no valid performance exists, do
 *       not invent a historical suggestion")
 *
 * "Last time" does NOT use these (CQ3 lets it show the actual most recent
 * performance), and neither does carry-forward: this file changes no carry rule.
 */

/**
 * L2. Whether this exposure (the exercise at `exerciseIndex` of `workout`) is a
 * known data issue. Nothing is flagged yet — the list of records is a later
 * phase (2b.2) — so the default flags none. The hook is here so that phase
 * plugs in without reshaping the walk.
 */
export type DataIssueLookup = (workout: Workout, exerciseIndex: number) => boolean
const noKnownDataIssues: DataIssueLookup = () => false

/** L1. */
export function isNormalCompletedWorkout(workout: Workout): boolean {
  return workout.completedAt !== null && workout.readiness?.tier !== 'easier'
}

/**
 * TEMPORARY, inline: Phase 2b.3 replaces it with the one `isSubstitute` helper
 * in `substitutions.ts` that every reader of `substitutedForId` will share. It
 * is the same rule: a slot that has been swapped to something other than the
 * exercise it was prescribed for. (A record of the original exercise that was
 * swapped away and back, `substitutedForId === exerciseId`, is not a substitute
 * — CC4.)
 */
function isSubstitute(exercise: Pick<WorkoutExercise, 'exerciseId' | 'substitutedForId'>): boolean {
  return exercise.substitutedForId !== undefined && exercise.substitutedForId !== exercise.exerciseId
}

/** L4. */
export function isOwnIdentityRecord(
  exercise: Pick<WorkoutExercise, 'exerciseId' | 'substitutedForId' | 'substituteLoad'>,
): boolean {
  return !isSubstitute(exercise) || exercise.substituteLoad !== undefined
}

/** L5. */
function hasAWeight(exercise: WorkoutExercise): boolean {
  return exercise.sets.some((set) => set.weightKg !== null)
}

/**
 * The most recent **eligible** exposure to this exercise, with the workout it
 * came from — walking back past any workout that fails a layer, newest first
 * (by date, then by completion time). Not "the chronologically newest record":
 * an easier day or another program's session that is newer is skipped.
 *
 * One exposure, never a mixture: a caller that wants a weight per position reads
 * them all from this one.
 */
export function lastEligibleExposureFor(
  workouts: readonly Workout[],
  programId: string,
  exerciseId: string,
  hasDataIssue: DataIssueLookup = noKnownDataIssues,
): { workout: Workout; exposure: WorkoutExercise } | null {
  const candidates = workouts
    .filter((workout) => workout.programId === programId && isNormalCompletedWorkout(workout))
    .sort((a, b) => b.date.localeCompare(a.date) || (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))

  for (const workout of candidates) {
    const index = workout.exercises.findIndex(
      (exercise, i) =>
        exercise.exerciseId === exerciseId &&
        hasAWeight(exercise) &&
        isOwnIdentityRecord(exercise) &&
        !hasDataIssue(workout, i),
    )
    if (index >= 0) return { workout, exposure: workout.exercises[index] }
  }
  return null
}
