import type { Exercise, MuscleGroup } from './types'

/**
 * The Library's grouping: an exercise belongs to the group of its **primary**
 * muscle (`muscles[0]`). One definition for everything that groups exercises —
 * the Library page and the swap sheet's "Other exercises" — so the two cannot
 * drift apart. The page's headings are `library:group.<key>`.
 */
export type ExerciseGroupKey = 'lower' | 'push' | 'pull' | 'core'

export const EXERCISE_GROUPS: readonly { key: ExerciseGroupKey; muscles: readonly MuscleGroup[] }[] = [
  { key: 'lower', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  { key: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
  { key: 'pull', muscles: ['back', 'biceps'] },
  { key: 'core', muscles: ['core'] },
]

/** The group of an exercise's primary muscle, or `null` for one whose primary muscle is in none. */
export function exerciseGroupOf(exercise: Pick<Exercise, 'muscles'>): ExerciseGroupKey | null {
  const primary = exercise.muscles[0]
  return EXERCISE_GROUPS.find((group) => group.muscles.includes(primary))?.key ?? null
}

/**
 * What the swap sheet's "Other exercises" lists: every Library exercise in the
 * **current** exercise's group, except the current one and the ones already
 * recommended above it. In Library order — the sheet sorts them for display.
 *
 * These are not suggestions. The coach-curated recommendations stay what they
 * were (coach Q2: "logging accuracy and equipment suitability should be treated
 * as separate concerns"); this is how an athlete records something real that no
 * list recommends, instead of logging it under the wrong exercise. Picking one
 * goes through the same swap as a recommended one, so a different implement
 * still starts from its own history (`substituteLoad.ts`).
 */
export function otherExercisesFor(
  current: Pick<Exercise, 'id' | 'muscles'>,
  library: readonly Exercise[],
  recommendedIds: readonly string[],
): Exercise[] {
  const group = exerciseGroupOf(current)
  if (group === null) return []
  const excluded = new Set([current.id, ...recommendedIds])
  return library.filter((exercise) => !excluded.has(exercise.id) && exerciseGroupOf(exercise) === group)
}
