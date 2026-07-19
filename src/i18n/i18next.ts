import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'

export const SUPPORTED_LOCALES = ['en', 'fr', 'zh-CN'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const NAMESPACES = [
  'common',
  'domain',
  'today',
  'workout',
  'progress',
  'library',
  'checkin',
  'seed',
] as const

/** `fr-FR` → `fr`, `zh-Hans`/`zh-CN` → `zh-CN`, anything else → `en`. */
export function mapNavigatorLanguageToSupported(navigatorLanguage: string): SupportedLocale {
  const lower = navigatorLanguage.toLowerCase()
  if (lower.startsWith('fr')) return 'fr'
  if (lower.startsWith('zh')) return 'zh-CN'
  return 'en'
}

i18next
  .use(initReactI18next)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`../locales/${language}/${namespace}.json`),
    ),
  )
  .init({
    lng: mapNavigatorLanguageToSupported(
      typeof navigator === 'undefined' ? 'en' : navigator.language,
    ),
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LOCALES,
    ns: NAMESPACES,
    defaultNS: 'common',
    interpolation: {
      // React already escapes rendered text.
      escapeValue: false,
    },
    returnNull: false,
    // Bundled local JSON resolves in a microtask, not a network round-trip —
    // no Suspense boundary needed; useTranslation() re-renders once ready.
    react: { useSuspense: false },
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: import.meta.env.DEV
      ? (languages: readonly string[], namespace: string, key: string) => {
          console.error(`[i18n] missing key: ${namespace}:${key} (${languages.join(',')})`)
        }
      : undefined,
  })
  .catch((error: unknown) => {
    console.error('[i18n] init failed', error)
  })

// Locale-aware decimals (French uses a comma separator) for `{{delta, number}}`.
i18next.services.formatter?.add('number', (value: number, lng?: string) =>
  new Intl.NumberFormat(lng, { maximumFractionDigits: 1 }).format(value),
)

export default i18next
