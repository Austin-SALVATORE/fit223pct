import { useEffect } from 'react'
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
  const { weekStart, scheduledCount, completedCount, totalSets, volumeKg, readinessTierCounts } =
    review

  useEffect(() => {
    void settingsRepo.markWeeklyReviewSeen(weekStart)
  }, [weekStart])

  return (
    <section
      aria-label="Last week"
      className="mt-8 rounded-card border border-border bg-surface p-5"
    >
      <p className="eyebrow">Last week</p>
      <p className="mt-2 text-ink">{headline(scheduledCount, completedCount)}</p>

      {completedCount > 0 && (
        <>
          <dl className="mt-4 flex gap-8">
            <Stat label="Sessions" value={`${completedCount}/${scheduledCount}`} />
            <Stat label="Sets" value={String(totalSets)} />
            <Stat label="Volume" value={`${formatVolume(volumeKg)} kg`} />
          </dl>
          <p className="mt-3 text-sm text-ink-tertiary">{readinessLine(readinessTierCounts)}</p>
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

function headline(scheduledCount: number, completedCount: number): string {
  if (scheduledCount === 0) return 'No sessions were scheduled last week.'
  if (completedCount === 0) return 'A quiet week — no sessions logged.'
  if (completedCount === scheduledCount) return 'Every scheduled session, done.'
  return `${completedCount} of ${scheduledCount} scheduled sessions completed.`
}

function readinessLine(counts: Record<'ready' | 'steady' | 'easier', number>): string {
  const parts: string[] = []
  if (counts.ready > 0) parts.push(`${counts.ready} ready`)
  if (counts.steady > 0) parts.push(`${counts.steady} steady`)
  if (counts.easier > 0) parts.push(`${counts.easier} eased back`)
  return parts.length > 0 ? parts.join(' · ') : 'No readiness check-ins recorded.'
}

function formatVolume(volume: number): string {
  return volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : String(Math.round(volume))
}
