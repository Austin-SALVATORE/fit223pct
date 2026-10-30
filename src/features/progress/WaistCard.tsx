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
  const range = {
    firstValue: formatValue(t, first.value, trend.unit),
    firstDate: first.date,
    lastValue: formatValue(t, last.value, trend.unit),
    lastDate: last.date,
  }

  return (
    <Card>
      <p className="text-ink" data-numeric>
        {formatValue(t, last.value, trend.unit)} — {directionPhrase}
      </p>
      {/*
        A14 leftover (batch A3). "84 cm on 2026-09-14 → 82.5 cm on 2026-10-26" is read
        "... right arrow ...", and the arrow is the only thing that says the second
        reading came after the first. It stays on screen, hidden from assistive
        technology, with "From 84 cm on ... to 82.5 cm on ..." beside it. The dates
        are spoken as the line prints them (ISO), the same string in both.
      */}
      <p className="mt-1 text-sm text-ink-tertiary" data-numeric aria-hidden="true">
        {t('waist.rangeLine', range)}
      </p>
      <p className="sr-only">{t('waist.rangeLineSpoken', range)}</p>
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
