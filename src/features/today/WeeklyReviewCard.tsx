import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { settingsRepo } from '@/data/repositories'
import type { WeeklyReview } from '@/domain/weeklyReview'

/**
 * Reviewing the week just finished — a moment, not a permanent dashboard
 * tile (see docs/Progress.md). Reports only what was observed that week;
 * never extrapolates a claim from it. Shown on the first open after the
 * week ends, any day of the week — marks itself seen once displayed, so it
 * never reappears for this same week (TodayPage locks the decision to show
 * it for the rest of this session, so it won't vanish the moment that write commits).
 */
export function WeeklyReviewCard({ review }: { review: WeeklyReview }) {
  const { t } = useTranslation('today')
  const { weekStart, scheduledCount, completedCount, totalSets, volumeKg, readinessTierCounts } =
    review

  useEffect(() => {
    void settingsRepo.markWeeklyReviewSeen(weekStart)
  }, [weekStart])

  const heading = t('weeklyReview.heading')

  return (
    <section
      aria-label={heading}
      className="mt-8 rounded-card border border-border bg-surface p-5"
    >
      <p className="eyebrow">{heading}</p>
      <p className="mt-2 text-ink">{headline(t, scheduledCount, completedCount)}</p>

      {completedCount > 0 && (
        <>
          <dl className="mt-4 flex gap-8">
            <Stat label={t('weeklyReview.statSessions')} value={`${completedCount}/${scheduledCount}`} />
            <Stat label={t('weeklyReview.statSets')} value={String(totalSets)} />
            <Stat label={t('weeklyReview.statVolume')} value={`${formatVolume(volumeKg)} kg`} />
          </dl>
          <p className="mt-3 text-sm text-ink-tertiary">{readinessLine(t, readinessTierCounts)}</p>
        </>
      )}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-ink" data-numeric>
        {value}
      </dd>
    </div>
  )
}

type Translate = (key: string, options?: Record<string, unknown>) => string

function headline(t: Translate, scheduledCount: number, completedCount: number): string {
  if (scheduledCount === 0) return t('weeklyReview.noSessionsScheduled')
  if (completedCount === 0) return t('weeklyReview.quietWeek')
  if (completedCount === scheduledCount) return t('weeklyReview.allDone')
  return t('weeklyReview.partial', { completedCount, scheduledCount })
}

function readinessLine(t: Translate, counts: Record<'ready' | 'steady' | 'easier', number>): string {
  const parts: string[] = []
  if (counts.ready > 0) parts.push(t('weeklyReview.readinessReady', { count: counts.ready }))
  if (counts.steady > 0) parts.push(t('weeklyReview.readinessSteady', { count: counts.steady }))
  if (counts.easier > 0) parts.push(t('weeklyReview.readinessEased', { count: counts.easier }))
  return parts.length > 0 ? parts.join(' · ') : t('weeklyReview.readinessNone')
}

function formatVolume(volume: number): string {
  return volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : String(Math.round(volume))
}
