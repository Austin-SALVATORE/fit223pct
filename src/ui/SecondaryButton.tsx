import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

interface SecondaryButtonProps {
  onClick: () => void
  children: ReactNode
  className?: string
}

/**
 * The app's established secondary-control pattern (HoldTimer's "Start
 * hold", the early-start affordance) — bordered, text-ink-secondary,
 * never amber. whileTap mirrors Log set's press feedback exactly;
 * active:bg-raised (GroupedRow's own press tint) covers reduced-motion,
 * which drops whileTap entirely.
 */
export function SecondaryButton({ onClick, children, className = '' }: SecondaryButtonProps) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={reducedMotion ? undefined : { scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`rounded-full border border-border px-4 py-3 text-center text-sm font-medium text-ink-secondary transition-colors active:bg-raised hover:border-border-strong hover:text-ink ${className}`}
    >
      {children}
    </motion.button>
  )
}
