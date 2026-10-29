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
  workoutExercise: Pick<WorkoutExercise, 'prescription' | 'substitutedForId'>,
  exercise: Pick<Exercise, 'isUnilateral'>,
): boolean {
  if (!workoutExercise.prescription.perSide) return false
  return workoutExercise.substitutedForId === undefined || exercise.isUnilateral
}

