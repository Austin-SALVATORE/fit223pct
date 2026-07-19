import type { ReactNode } from 'react'
import type { Trend } from '@/domain/trends'
import { useTranslatedMessage } from '@/i18n/useTranslatedMessage'
import { DIRECTION_PHRASE, formatValue } from './formatTrend'

export function WaistCard({ trend }: { trend: Trend }) {
  if (trend.status === 'insufficient-data') {
    return <InsufficientDataCard trend={trend} />
  }

  const first = trend.evidence[0]
  const last = trend.evidence.at(-1)!

  return (
    <Card>
      <p className="text-ink" data-numeric>
        {formatValue(last.value, trend.unit)} — {DIRECTION_PHRASE[trend.status]}
      </p>
      <p className="mt-1 text-sm text-ink-tertiary" data-numeric>
        {formatValue(first.value, trend.unit)} on {first.date} → {formatValue(last.value, trend.unit)} on{' '}
        {last.date}
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
