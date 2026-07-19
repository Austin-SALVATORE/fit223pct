import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/domain/types'

interface LanguageSwitcherProps {
  value: SupportedLocale
  onChange: (locale: SupportedLocale) => void
  /** Accessible name for the button group — pass the section's own heading text. */
  groupLabel: string
}

/**
 * Same bordered-pill/whileTap language as SecondaryButton, but this one
 * tracks a "currently selected" state (RatingPicker's honest-about-what-
 * it-does approach: plain toggle buttons with aria-pressed, not a fake
 * ARIA radio group promising arrow-key navigation this doesn't implement).
 */
export function LanguageSwitcher({ value, onChange, groupLabel }: LanguageSwitcherProps) {
  const { t } = useTranslation('common')
  const reducedMotion = useReducedMotion()

  return (
    <div role="group" aria-label={groupLabel} className="flex gap-2">
      {SUPPORTED_LOCALES.map((locale) => {
        const selected = locale === value
        return (
          <motion.button
            key={locale}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(locale)}
            whileTap={reducedMotion ? undefined : { scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`rounded-full border px-4 py-3 text-center text-sm font-medium transition-colors ${
              selected
                ? 'border-amber bg-amber/15 text-amber'
                : 'border-border text-ink-secondary hover:border-border-strong hover:text-ink'
            }`}
          >
            {t(`language.${locale}`)}
          </motion.button>
        )
      })}
    </div>
  )
}
