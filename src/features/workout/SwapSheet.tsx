import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { otherExercisesFor } from '@/domain/exerciseGroups'
import { effectiveSubstitutions } from '@/domain/substitutions'
import { useEquipmentLabel } from '@/lib/equipmentLabel'
import { useFocusOnChange } from '@/lib/useFocusOnChange'
import { useExerciseName } from '@/i18n/seedExercise'
import { useLocale } from '@/i18n/useLocale'
import { ConfirmAction } from '@/ui/ConfirmAction'
import { Sheet } from '@/ui/Sheet'
import type { Exercise, ExercisePrescription } from '@/domain/types'

interface SwapSheetProps {
  open: boolean
  exercise: Exercise
  prescription: Pick<ExercisePrescription, 'substitutionIds'>
  exerciseById: Map<string, Exercise>
  /** Sets already logged against the exercise being swapped away from — swapExercise (domain/workout.ts) resets them, so a non-zero count needs a chosen, not discovered, confirmation. */
  loggedSetsCount: number
  onSelect: (exerciseId: string) => void
  onClose: () => void
}

export function SwapSheet({
  open,
  exercise,
  prescription,
  exerciseById,
  loggedSetsCount,
  onSelect,
  onClose,
}: SwapSheetProps) {
  const { t } = useTranslation('workout')
  const { t: tSeed } = useTranslation('seed')
  const locale = useLocale()
  const exerciseName = useExerciseName(exercise.id)
  const recommendedIds = effectiveSubstitutions(prescription, exercise)
  const options = recommendedIds
    .map((id) => exerciseById.get(id))
    .filter((sub): sub is Exercise => sub !== undefined)
  // Not recommendations: the rest of this exercise's Library group, so
  // something the athlete really did can be recorded as itself. Sorted for
  // display the way the Library page sorts, by the resolved name in this
  // language, not an id or an English order.
  const collator = new Intl.Collator(locale)
  const otherOptions = otherExercisesFor(exercise, [...exerciseById.values()], recommendedIds)
    .map((other) => ({ exercise: other, name: tSeed(`exercise.${other.id}.name`) }))
    .sort((a, b) => collator.compare(a.name, b.name))
    .map(({ exercise: other }) => other)
  const [otherOpen, setOtherOpen] = useState(false)
  const otherPanelId = useId()

  // Set only when the tapped option would clear logged sets — the sheet
  // shows a confirm step instead of swapping immediately. Reset whenever
  // the sheet opens/closes so a stale pending choice never survives.
  const [pendingExerciseId, setPendingExerciseId] = useState<string | null>(null)
  const pendingExercise = pendingExerciseId ? exerciseById.get(pendingExerciseId) : undefined
  // Cancelling the confirm step swaps the option list back in, unmounting
  // the button that was focused. Without a focus move, focus lands on
  // <body> — outside an aria-modal dialog that has hidden the rest of the
  // page, with Escape dead because its handler is bound to the panel
  // (docs/review-backlog.md A1).
  //
  // This flag names the *cause* — a cancel — rather than deriving the
  // moment from state. It previously read `open && pendingExerciseId ===
  // null`, which is also true when the sheet simply opens, so it fired
  // there too and was silently overruled by the open-focus effect that
  // happened to run afterwards. That made a focus behaviour depend on the
  // declaration order of two effects, which is invisible at the call site
  // and survives only until someone moves one of them.
  const [justCancelled, setJustCancelled] = useState(false)
  const optionsHeadingRef = useFocusOnChange<HTMLHeadingElement>(justCancelled)

  function chooseOption(id: string) {
    if (loggedSetsCount > 0) {
      // Entering the confirm re-arms the flag, so a later cancel is a fresh
      // false→true edge rather than a no-op.
      setJustCancelled(false)
      setPendingExerciseId(id)
    } else {
      onSelect(id)
    }
  }

  // Resets only this component's own step state; the focus/trap/Escape
  // behaviour that used to sit here is Sheet's now. A stale pending choice
  // must never survive the sheet opening or closing.
  useEffect(() => {
    setPendingExerciseId(null)
    setJustCancelled(false)
    setOtherOpen(false)
  }, [open])

  return (
    <Sheet
      open={open}
      label={t('swapSheet.dialogAriaLabel', { exerciseName })}
      closeLabel={t('swapSheet.closeAriaLabel')}
      onClose={onClose}
    >
      {pendingExercise ? (
        <ConfirmClear
          exerciseName={exerciseName}
          newExerciseId={pendingExercise.id}
          loggedSetsCount={loggedSetsCount}
          onConfirm={() => onSelect(pendingExercise.id)}
          onCancel={() => {
            setPendingExerciseId(null)
            setJustCancelled(true)
          }}
        />
      ) : (
        // The sheet has no height of its own, so the whole options view
        // scrolls inside the viewport: an expanded "Other exercises" is
        // 7 to 19 rows, and without a cap it ran off the top of the screen.
        <div className="max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain">
          <h2 ref={optionsHeadingRef} tabIndex={-1} className="eyebrow">
            {t('swapSheet.heading', { exerciseName })}
          </h2>
          {options.length === 0 ? (
            <p className="mt-4 text-sm text-ink-secondary">{t('swapSheet.noSubstitutions')}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {options.map((option) => (
                <SubstitutionRow key={option.id} option={option} onSelect={chooseOption} />
              ))}
            </ul>
          )}
          {otherOptions.length > 0 && (
            /*
              Collapsed, below the recommendations, under one line that says
              these are not recommendations (coach Q2 / owner, 29 Oct: the
              barbell bench press leaves every recommended list but must stay
              recordable, so there is never a gap where the athlete has to log
              it as something else). The disclosure is the same button-in-a-
              heading pattern as the Program page's months; its panel is hidden,
              never unmounted, so `aria-controls` always resolves.
            */
            <section className="mt-4 border-t border-border">
              <h3>
                <button
                  type="button"
                  aria-expanded={otherOpen}
                  aria-controls={otherPanelId}
                  onClick={() => setOtherOpen((value) => !value)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
                >
                  <span>{t('swapSheet.otherHeading')}</span>
                  <span aria-hidden="true" className="shrink-0 text-ink-tertiary">
                    {otherOpen ? '⌃' : '⌄'}
                  </span>
                </button>
              </h3>
              <div id={otherPanelId} hidden={!otherOpen}>
                <p className="text-sm leading-relaxed text-ink-tertiary">{t('swapSheet.otherNote')}</p>
                <ul className="mt-1 divide-y divide-border">
                  {otherOptions.map((option) => (
                    <SubstitutionRow key={option.id} option={option} onSelect={chooseOption} />
                  ))}
                </ul>
              </div>
            </section>
          )}
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-card border border-border py-3 text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
          >
            {t('swapSheet.keep', { exerciseName })}
          </button>
        </div>
      )}
    </Sheet>
  )
}

function ConfirmClear({
  exerciseName,
  newExerciseId,
  loggedSetsCount,
  onConfirm,
  onCancel,
}: {
  exerciseName: string
  newExerciseId: string
  loggedSetsCount: number
  onConfirm: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation('workout')
  const newExerciseName = useExerciseName(newExerciseId)
  // The focus and announcement behaviour this step needs now lives in
  // ConfirmAction — same pattern, three callers. This component keeps only
  // what is genuinely swap-specific: which strings to resolve.
  return (
    <ConfirmAction
      heading={t('swapSheet.confirmHeading', { exerciseName, newExerciseName })}
      warning={t('swapSheet.confirmWarning', { count: loggedSetsCount })}
      confirmLabel={t('swapSheet.confirmSwap')}
      cancelLabel={t('swapSheet.confirmCancel')}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

function SubstitutionRow({
  option,
  onSelect,
}: {
  option: Exercise
  onSelect: (exerciseId: string) => void
}) {
  const equipmentLabel = useEquipmentLabel(option.equipment[0])
  const name = useExerciseName(option.id)
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(option.id)}
        className="flex w-full items-center justify-between gap-4 py-3.5 text-left transition-colors hover:text-amber"
      >
        <span className="font-medium text-ink">{name}</span>
        <span className="text-sm text-ink-tertiary">{equipmentLabel}</span>
      </button>
    </li>
  )
}
