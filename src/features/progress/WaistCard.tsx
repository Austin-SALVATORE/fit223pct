import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Trend } from '@/domain/trends'
import { useTranslatedMessage } from '@/i18n/useTranslatedMessage'
import { formatValue, useDirectionPhrase } from './formatTrend'

export function WaistCard({ trend }: { trend: Trend }) {
  const { t } = useTranslation('progress')
  const directionPhrase = useDirectionPhrase(trend.status === 'insufficient-data' ? 'steady' : trend.status)

  if (trend.status === 'insufficient-data') {
    return <InsufficientDataCard trend={trend} />
  }

  const first = trend.evidence[0]
  const last = trend.evidence.at(-1)!

  return (
    <Card>
      <p className="text-ink" data-numeric>
        {formatValue(last.value, trend.unit)} — {directionPhrase}
      </p>
      <p className="mt-1 text-sm text-ink-tertiary" data-numeric>
        {t('waist.rangeLine', {
          firstValue: formatValue(first.value, trend.unit),
          firstDate: first.date,
          lastValue: formatValue(last.value, trend.unit),
          lastDate: last.date,
        })}
      </p>
    </Card>
  )
}

function InsufficientDataCard({ trend }: { trend: Extract<Trend, { status: 'insufficient-data' }> }) {
  const reason = useTranslatedMessage(trend.reason)
  return (
    <Card>
      <p className="text-ink-secondary">{reason}</p>
    </Card>
  )
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-card border border-border bg-surface p-5">{children}</div>
}
