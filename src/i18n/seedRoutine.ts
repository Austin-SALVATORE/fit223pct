import { useTranslation } from 'react-i18next'

/**
 * Routine step prose, resolved from the step id.
 *
 * Routines carry no prose in the domain at all (see `src/domain/routine.ts`),
 * so unlike sessions and activities there is no stored-literal fallback and
 * no origin rule to apply: routines are app content, always locale-keyed,
 * never verbatim. User-authored routines are out of scope per the spec.
 *
 * That produces one combination worth stating plainly, because it looks like
 * an inconsistency until you see why: an *imported* program may name a
 * built-in routine, and then the activity item shows the owner's own words
 * (via `useLocalizedActivity`'s origin rule) while the player inside shows
 * the app's translated words. Both are correct — the item is the user's
 * content, the routine is the app's.
 */
export function useRoutineStepName(stepId: string): string {
  const { t } = useTranslation('seed')
  // Same empty-id guard as seedExercise's hooks: callers may hold a
  // placeholder before their real id is known, and an empty id would
  // otherwise log a permanently unresolvable 'routineStep..name'.
  if (stepId === '') return ''
  return t(`routineStep.${stepId}.name`)
}

/** The one-line instruction shown with the pose. Absent is legitimate — not every step needs one. */
export function useRoutineStepCue(stepId: string): string | undefined {
  const { t, i18n } = useTranslation('seed')
  if (stepId === '') return undefined
  const key = `routineStep.${stepId}.cue`
  return i18n.exists(`seed:${key}`) ? t(key) : undefined
}
