import { Link } from 'react-router'
import type { StagnationEvidencePoint, StagnationResult } from '@/domain/stagnation'
import type { Trend } from '@/domain/trends'
import type { Exercise } from '@/domain/types'
import { DIRECTION_PHRASE, formatValue } from './formatTrend'

interface StrengthCardProps {
  exercise: Exercise
  trend: Trend
  stagnation: StagnationResult
  substitution: Exercise | undefined
}

export function StrengthCard({ exercise, trend, stagnation, substitution }: StrengthCardProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <Link
        to={`/library/${exercise.id}`}
        state={{ from: 'progress' }}
        className="font-medium text-ink transition-colors hover:text-amber"
      >
        {exercise.name}
      </Link>

      {trend.status === 'insufficient-data' ? (
        <p className="mt-1.5 text-sm text-ink-tertiary">{trend.reason}</p>
      ) : (
        <p className="mt-1.5 text-sm text-ink-secondary" data-numeric>
          {formatValue(trend.evidence.at(-1)!.value, trend.unit)} — {DIRECTION_PHRASE[trend.status]}
        </p>
      )}

      {stagnation.status === 'stagnant' && (
        <div className="mt-3 rounded-lg border border-border-strong/60 bg-raised p-3.5">
          <p className="text-sm leading-relaxed text-ink-secondary">
            No increase in <span data-numeric>{stagnation.evidence.length} sessions</span> —{' '}
            {stagnation.evidence.map((point) => formatEvidence(point)).join(' → ')}
            {stagnation.excludedForReadiness > 0 && (
              <>
                {' '}
                ({stagnation.excludedForReadiness} easier{' '}
                {stagnation.excludedForReadiness === 1 ? 'day' : 'days'} not counted)
              </>
            )}
            .
          </p>
          {substitution && (
            <p className="mt-2 text-sm text-ink-tertiary">
              Worth a change of stimulus —{' '}
              <Link
                to={`/library/${substitution.id}`}
                state={{ from: 'progress' }}
                className="text-amber transition-colors hover:text-amber-deep"
              >
                try {substitution.name}
              </Link>
              .
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** Shows both dimensions when weight is present — a session's reps still
 * moved even when its weight didn't, and hiding that is exactly what let
 * double progression read as a plateau. */
function formatEvidence(point: StagnationEvidencePoint): string {
  if (point.weightKg !== null) {
    return `${formatValue(point.weightKg, 'kg')} × ${formatValue(point.effort, point.effortMode)}`
  }
  return formatValue(point.effort, point.effortMode)
}
