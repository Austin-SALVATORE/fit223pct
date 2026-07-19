import { useTranslation } from 'react-i18next'
import type { TrendDirection, TrendUnit } from '@/domain/trends'

export function formatValue(value: number, unit: TrendUnit): string {
  switch (unit) {
    case 'kg':
      return `${value} kg`
    case 'cm':
      return `${value} cm`
    case 'seconds':
      return `${value}s`
    case 'reps':
      return `${value} reps`
  }
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
