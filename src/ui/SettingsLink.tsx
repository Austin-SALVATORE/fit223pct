import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { NavigationOrigin } from '@/lib/navigationOrigin'

interface SettingsLinkProps {
  /** Which AppShell page this is rendered on — carried so Back returns here, not a hardcoded page. */
  origin: Exclude<NavigationOrigin, 'workout' | 'plan-day'>
  /**
   * 'corner' (default): alone beside a large page heading (Plan, Progress,
   * Library) — fixed 44px box, negative margins align it flush with the
   * heading's top-right corner.
   * 'inline': a peer of Today's text-sm nav links — no box, no corner
   * offset. The 44px target comes from padding, then a matching negative
   * margin cancels that padding back out of layout so it doesn't push the
   * visual icon away from the last link; the touch area still bleeds into
   * the surrounding gap, which is the intended trade — visual size and
   * touch target are different things.
   */
  variant?: 'corner' | 'inline'
}

/**
 * The one shared Settings entry point (docs/DataPortability.md's Settings
 * entry section). Deliberately absent from Workout Mode, which renders
 * outside AppShell.
 */
export function SettingsLink({ origin, variant = 'corner' }: SettingsLinkProps) {
  const { t } = useTranslation('common')
  const reducedMotion = useReducedMotion()
  const className =
    variant === 'inline'
      ? '-m-3.5 flex items-center justify-center p-3.5 text-ink-tertiary transition-colors hover:text-ink-secondary'
      : '-mr-2.5 -mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:text-ink-secondary'

  return (
    <motion.div whileTap={reducedMotion ? undefined : { scale: 0.94 }}>
      <Link to="/settings" state={{ from: origin }} aria-label={t('settings')} className={className}>
        <GearIcon className={variant === 'inline' ? 'h-4 w-4' : 'h-5 w-5'} />
      </Link>
    </motion.div>
  )
}

function GearIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
