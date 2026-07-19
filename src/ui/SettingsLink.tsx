import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { NavigationOrigin } from '@/lib/navigationOrigin'

interface SettingsLinkProps {
  /** Which AppShell page this is rendered on — carried so Back returns here, not a hardcoded page. */
  origin: Exclude<NavigationOrigin, 'workout' | 'plan-day'>
}

/**
 * The one shared Settings entry point — icon-only gear, top-right of every
 * AppShell page header (docs/DataPortability.md's Settings entry section).
 * Deliberately absent from Workout Mode, which renders outside AppShell.
 */
export function SettingsLink({ origin }: SettingsLinkProps) {
  const { t } = useTranslation('common')
  const reducedMotion = useReducedMotion()
  return (
    <motion.div whileTap={reducedMotion ? undefined : { scale: 0.94 }}>
      <Link
        to="/settings"
        state={{ from: origin }}
        aria-label={t('settings')}
        className="-mr-2.5 -mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:text-ink-secondary"
      >
        <GearIcon />
      </Link>
    </motion.div>
  )
}

function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
