import { useTranslation } from 'react-i18next'

/** The active i18next language, for passing into `Intl`/date-formatting calls. */
export function useLocale(): string {
  const { i18n } = useTranslation()
  return i18n.language
}
