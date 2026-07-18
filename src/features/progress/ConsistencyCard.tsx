import type { ReactNode } from 'react'
import type { ConsistencyTrend } from '@/domain/trends'

export function ConsistencyCard({ trend }: { trend: ConsistencyTrend | null }) {
  if (!trend) {
    return (
      <Card>
        <p className="text-ink-secondary">
          No training program is set up yet. Consistency will appear here once one begins.
        </p>
      </Card>
    )
  }

  if (trend.status === 'insufficient-data') {
    return (
      <Card>
        <p className="text-ink-secondary">{trend.reason}</p>
      </Card>
    )
  }

  const windowDays =
    Math.round((Date.parse(trend.windowEnd) - Date.parse(trend.windowStart)) / 86_400_000) + 1

  return (
    <Card>
      <p className="text-ink" data-numeric>
        {trend.completedCount} of {trend.scheduledCount} scheduled sessions completed
      </p>
      <p className="mt-1 text-sm text-ink-tertiary">Over the last {windowDays} days</p>
    </Card>
  )
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-card border border-border bg-surface p-5">{children}</div>
}
