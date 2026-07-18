import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Exercise } from '@/domain/types'

interface SwapSheetProps {
  open: boolean
  exercise: Exercise
  exerciseById: Map<string, Exercise>
  onSelect: (exerciseId: string) => void
  onClose: () => void
}

export function SwapSheet({ open, exercise, exerciseById, onSelect, onClose }: SwapSheetProps) {
  const reducedMotion = useReducedMotion()
  const options = exercise.substitutionIds
    .map((id) => exerciseById.get(id))
    .filter((sub): sub is Exercise => sub !== undefined)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-10 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-label={`Swap ${exercise.name}`}
            className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md rounded-t-3xl border-t border-border bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            initial={reducedMotion ? { opacity: 0 } : { y: '100%' }}
            animate={reducedMotion ? { opacity: 1 } : { y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { y: '100%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow">Swap {exercise.name} for</p>
            {options.length === 0 ? (
              <p className="mt-4 text-sm text-ink-secondary">
                No substitutions for this one — it's already the fallback.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {options.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(option.id)}
                      className="flex w-full items-center justify-between gap-4 py-3.5 text-left transition-colors hover:text-amber"
                    >
                      <span className="font-medium text-ink">{option.name}</span>
                      <span className="text-sm capitalize text-ink-tertiary">
                        {option.equipment[0]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-card border border-border py-3 text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
            >
              Keep {exercise.name}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
