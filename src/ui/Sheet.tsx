import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

interface SheetProps {
  open: boolean
  /** Accessible name for the dialog. */
  label: string
  /** Accessible name for the backdrop's dismiss control. */
  closeLabel: string
  onClose: () => void
  children: ReactNode
}

/**
 * A bottom sheet that behaves as a modal: takes focus on open, traps it
 * while open, returns it to whatever opened the sheet on close, and closes
 * on Escape.
 *
 * Extracted from SwapSheet so a second sheet doesn't hand-roll a second
 * focus trap — which is precisely how backlog A1 (focus escaping an
 * aria-modal dialog) would recur. Owns no copy: callers pass resolved
 * strings, same contract as ConfirmAction.
 */
export function Sheet({ open, label, closeLabel, onClose, children }: SheetProps) {
  const reducedMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

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
            aria-label={closeLabel}
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
            aria-label={label}
            onKeyDown={handleKeyDown}
            className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md rounded-t-3xl border-t border-border bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            initial={reducedMotion ? { opacity: 0 } : { y: '100%' }}
            animate={reducedMotion ? { opacity: 1 } : { y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { y: '100%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
