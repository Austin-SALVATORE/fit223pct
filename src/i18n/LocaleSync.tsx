import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { settingsRepo } from '@/data/repositories'
import type { SupportedLocale } from '@/domain/types'

/**
 * Dexie's UserSettings.locale is the single source of truth — the
 * language switcher (src/ui/LanguageSwitcher.tsx) only ever writes to it,
 * never calls i18n.changeLanguage() directly. This component is the one
 * place that reads the live value and applies it, the same
 * render-immediately-then-react-to-the-live-query pattern already used
 * for seeded exercises/programs elsewhere in the app — no render-blocking
 * await, no first-paint flash.
 */
export function LocaleSync() {
  const { i18n } = useTranslation()
  const settings = useLiveQuery(() => settingsRepo.get(), [])

  useEffect(() => {
    if (!settings) return
    if (settings.locale) {
      if (settings.locale !== i18n.language) void i18n.changeLanguage(settings.locale)
      return
    }
    // First launch, or a pre-M7 record: nothing stored yet — persist the
    // navigator-derived guess i18next already booted with, so next launch
    // (and the Settings switcher) has a concrete stored value.
    void settingsRepo.update({ locale: i18n.language as SupportedLocale })
  }, [settings, i18n])

  useEffect(() => {
    document.documentElement.lang = i18n.language
    const onLanguageChanged = (language: string) => {
      document.documentElement.lang = language
    }
    i18n.on('languageChanged', onLanguageChanged)
    return () => {
      i18n.off('languageChanged', onLanguageChanged)
    }
  }, [i18n])

  return null
}
