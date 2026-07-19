import type { Exercise, ExercisePrescription } from './types'

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
