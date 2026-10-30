import type { Exercise, ExercisePrescription, WorkoutExercise } from './types'

/**
 * The single merge of program-defined and Library substitutions — nothing
 * else may re-derive this. Program-defined fallbacks come first (they're
 * the contextual ones, e.g. "the rack's taken"), then the Library's generic
 * list, deduped, with the exercise itself always excluded even if it were
 * ever mistakenly listed as its own substitution.
 */
export function effectiveSubstitutions(
  prescription: Pick<ExercisePrescription, 'substitutionIds'> | undefined,
  exercise: Exercise,
): string[] {
  const merged = [...(prescription?.substitutionIds ?? []), ...exercise.substitutionIds]
  const seen = new Set<string>()
  const result: string[] = []
  for (const id of merged) {
    if (id === exercise.id || seen.has(id)) continue
    seen.add(id)
    result.push(id)
  }
  return result
}

/**
 * Whether the "⇄ each side" pill is shown for the exercise on screen. The one
 * place that decides it — the Set screen's caption and the Rest screen's
 * new-exercise caption both read it, so they cannot disagree.
 *
 * The pill is a claim about how the reps are counted, made by the slot's
 * prescription (`perSide`). A swap changes the exercise but keeps the
 * prescription, so on a substitute that claim holds only if the substitute is
 * itself unilateral in the Library: **a swap may hide the pill, never add it.**
 * A unilateral substitute of a bilateral slot (goblet squat -> split squat,
 * plank -> dead bug) does not make the reps per side — what the reps mean is
 * not ours to decide (Phase 2 plan, DD-A3d) — so the slot's silence stands.
 */
export function showsPerSidePill(
  workoutExercise: Pick<WorkoutExercise, 'prescription'> & SwapState,
  exercise: Pick<Exercise, 'isUnilateral'>,
): boolean {
  if (!workoutExercise.prescription.perSide) return false
  return !isSubstitute(workoutExercise) || exercise.isUnilateral
}


/**
 * The fields a swap reads and writes on a slot. Everything outside this file
 * that needs to ask "is this slot a substitute?" takes this shape and calls
 * {@link isSubstitute}, never the stored field.
 */
export type SwapState = Pick<WorkoutExercise, 'exerciseId' | 'substitutedForId'>

/**
 * Whether this slot is performing an exercise **other than the one it was
 * prescribed for** (CC4, coach 29 Oct: "the governing information is the
 * actual exercise performed and logged, not whether the athlete interacted
 * with the swap control"). A slot swapped away and back is the original
 * exercise again, so `substitutedForId` equal to the slot's own `exerciseId` is
 * NOT a substitute.
 *
 * **The one reader of `substitutedForId`.** New swaps no longer write the
 * swapped-for-itself shape (`swapExercise` drops the field on a genuine
 * return), but records stored before CC4 still hold it, and this reads both
 * correctly with no migration. `substitutions.guard.test.ts` fails any other
 * module that reads the field.
 */
export function isSubstitute(exercise: SwapState): boolean {
  return exercise.substitutedForId !== undefined && exercise.substitutedForId !== exercise.exerciseId
}

/**
 * The exercise this slot was prescribed for — the one its prescription's loads,
 * note and ceiling describe — however many swaps have happened since.
 */
export function authoredExerciseIdOf(exercise: SwapState): string {
  return exercise.substitutedForId ?? exercise.exerciseId
}

/**
 * The slot without any swap state: no `substitutedForId`, no `substituteLoad`.
 * What an unswapped slot looks like, so a genuine return to the authored
 * exercise leaves exactly that — never a stored "substituted for itself".
 */
export function withoutSwapState(exercise: WorkoutExercise): WorkoutExercise {
  const { substitutedForId: _substitutedFor, substituteLoad: _load, ...rest } = exercise
  return rest
}
