import { useTranslation } from 'react-i18next'
import { useExerciseName } from '@/i18n/seedExercise'

interface UndoRemovalButtonProps {
  /** Library id of the exercise the removal was on. */
  exerciseId: string
  /** Which kind of removal this undoes — a skipped prescribed level, or an unfilled custom slot. */
  kind: 'skip' | 'customSlot'
  onUndo: () => void
}

/**
 * Coach spec §4: "provide immediate Undo after any removal." Its own
 * component for the same reason as `UndoLastSetButton` — WorkoutPage
 * early-returns before it knows the workout, so `useExerciseName` cannot be
 * called there without breaking the Rules of Hooks.
 *
 * A separate mechanism from `UndoLastSetButton` on purpose (design doc §4:
 * "Undo is a separate mechanism"): `undoLastSet` is positional and
 * last-in-session, which assumes exercises fill strictly in order —
 * skipping breaks that assumption. `undoSkip`/`undoCustomSlot` restore
 * exactly the one field a removal changed, never `exercise.sets`, so this
 * undo can never lose logged work.
 */
export function UndoRemovalButton({ exerciseId, kind, onUndo }: UndoRemovalButtonProps) {
  const { t } = useTranslation('workout')
  const exerciseName = useExerciseName(exerciseId)
  return (
    <button
      type="button"
      onClick={onUndo}
      aria-label={t(
        kind === 'skip' ? 'undo.removalSkipAriaLabel' : 'undo.removalCustomSlotAriaLabel',
        { exerciseName },
      )}
      className="inline-flex min-h-11 shrink-0 items-center rounded-full px-2 text-sm text-ink-tertiary transition-colors hover:text-ink"
    >
      {t('undo.label')}
    </button>
  )
}
