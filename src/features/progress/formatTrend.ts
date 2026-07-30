import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { TrendDirection, TrendUnit } from '@/domain/trends'

const UNIT_KEY: Record<TrendUnit, string> = {
  kg: 'progress:unit.kg',
  cm: 'progress:unit.cm',
  seconds: 'progress:unit.seconds',
  reps: 'progress:unit.reps',
  percent: 'progress:unit.percent',
}

/**
 * "12 reps" / "30s" used to be built here from English literals, so a zh-CN
 * user read Latin units on a fully translated screen (docs/review-backlog.md
 * I3). Units are now keyed and pluralised per locale, and the number goes
 * through the locale's own formatter — French wants a comma, and zh-CN
 * groups differently.
 *
 * Takes `t` rather than calling useTranslation, because two of its four call
 * sites are inside `.map()` where a hook cannot run.
 */
export function formatValue(t: TFunction, value: number, unit: TrendUnit): string {
  return t(UNIT_KEY[unit], { count: value, value: formatNumber(t, value) })
}

function formatNumber(t: TFunction, value: number): string {
  return new Intl.NumberFormat(t('common:intlLocale')).format(value)
}

const DIRECTION_MESSAGE_KEY: Record<TrendDirection, string> = {
  increasing: 'progress:direction.increasing',
  steady: 'progress:direction.steady',
  decreasing: 'progress:direction.decreasing',
}

export function useDirectionPhrase(direction: TrendDirection): string {
  const { t } = useTranslation()
  return t(DIRECTION_MESSAGE_KEY[direction])
}
