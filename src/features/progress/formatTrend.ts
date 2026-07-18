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

export const DIRECTION_PHRASE: Record<TrendDirection, string> = {
  increasing: 'trending up',
  steady: 'holding steady',
  decreasing: 'trending down',
}
