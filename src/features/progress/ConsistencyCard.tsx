import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { ConsistencyTrend } from '@/domain/trends'
import { useTranslatedMessage } from '@/i18n/useTranslatedMessage'

export function ConsistencyCard({ trend }: { trend: ConsistencyTrend | null }) {
  const { t } = useTranslation('progress')

  if (!trend) {
    return (
      <Card>
        <p className="text-ink-secondary">{t('consistency.noProgram')}</p>
      </Card>
    )
  }

  if (trend.status === 'insufficient-data') {
    return <InsufficientDataCard trend={trend} />
  }

  const windowDays =
    Math.round((Date.parse(trend.windowEnd) - Date.parse(trend.windowStart)) / 86_400_000) + 1

  return (
    <Card>
      <p className="text-ink" data-numeric>
        {t('consistency.summary', {
          completedCount: trend.completedCount,
          scheduledCount: trend.scheduledCount,
        })}
      </p>
      <p className="mt-1 text-sm text-ink-tertiary">
        {t('consistency.windowLine', { days: windowDays })}
      </p>
    </Card>
  )
}

function InsufficientDataCard({ trend }: { trend: Extract<ConsistencyTrend, { status: 'insufficient-data' }> }) {
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
