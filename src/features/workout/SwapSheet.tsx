import { useEffect, useRef, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { effectiveSubstitutions } from '@/domain/substitutions'
import { useEquipmentLabel } from '@/lib/equipmentLabel'
import { useExerciseName } from '@/i18n/seedExercise'
import type { Exercise, ExercisePrescription } from '@/domain/types'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

interface SwapSheetProps {
  open: boolean
  exercise: Exercise
  prescription: Pick<ExercisePrescription, 'substitutionIds'>
  exerciseById: Map<string, Exercise>
  onSelect: (exerciseId: string) => void
  onClose: () => void
}

export function SwapSheet({
  open,
  exercise,
  prescription,
  exerciseById,
  onSelect,
  onClose,
}: SwapSheetProps) {
  const { t } = useTranslation('workout')
  const exerciseName = useExerciseName(exercise.id)
  const reducedMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const options = effectiveSubstitutions(prescription, exercise)
    .map((id) => exerciseById.get(id))
    .filter((sub): sub is Exercise => sub !== undefined)

  // A sheet is a modal: it must take focus on open, trap it while open, and
  // return it to whatever opened the sheet on close — otherwise a keyboard
  // user can Tab straight through to controls hidden behind the backdrop.
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus()
    } else {
      triggerRef.current?.focus()
    }
  }, [open])

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !panelRef.current) return

    const focusable = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label={t('swapSheet.closeAriaLabel')}
            className="fixed inset-0 z-10 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('swapSheet.dialogAriaLabel', { exerciseName })}
            onKeyDown={handleKeyDown}
            className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md rounded-t-3xl border-t border-border bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            initial={reducedMotion ? { opacity: 0 } : { y: '100%' }}
            animate={reducedMotion ? { opacity: 1 } : { y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { y: '100%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow">{t('swapSheet.heading', { exerciseName })}</p>
            {options.length === 0 ? (
              <p className="mt-4 text-sm text-ink-secondary">{t('swapSheet.noSubstitutions')}</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {options.map((option) => (
                  <SubstitutionRow key={option.id} option={option} onSelect={onSelect} />
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-card border border-border py-3 text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
            >
              {t('swapSheet.keep', { exerciseName })}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
