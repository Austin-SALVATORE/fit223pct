import { useTranslation } from 'react-i18next'
import { useExerciseName } from '@/i18n/seedExercise'

interface UndoLastSetButtonProps {
  /** Library id of the exercise the undo would take a set from. */
  exerciseId: string
  /** 1-based, for display. */
  setIndex: number
  totalSets: number
  onUndo: () => void
}

/**
 * Its own component, not inline in WorkoutPage, for two reasons that both
 * matter: WorkoutPage early-returns before it knows the workout, so calling
 * `useExerciseName` up there would break the Rules of Hooks — and the name
 * must come from that hook rather than `exercise.name`, which the seed-field
 * guard rejects by design (the exercise name is locale-keyed content).
 *
 * The visible label stays a word rather than an icon because the accessible
 * name is doing real work here: after a swap has cleared the current
 * exercise, undo correctly reaches back into the *previous* exercise, which
 * surprises anyone expecting "undo the swap". Naming the target before the
 * tap is what makes that legible in advance instead of after.
 */
export function UndoLastSetButton({
  exerciseId,
  setIndex,
  totalSets,
  onUndo,
}: UndoLastSetButtonProps) {
  const { t } = useTranslation('workout')
  const exerciseName = useExerciseName(exerciseId)
  return (
    <button
      type="button"
      onClick={onUndo}
      aria-label={t('undo.ariaLabel', { exerciseName, setIndex, totalSets })}
      className="shrink-0 rounded-full px-2 py-1 text-sm text-ink-tertiary transition-colors hover:text-ink"
    >
      {t('undo.label')}
    </button>
  )
}
