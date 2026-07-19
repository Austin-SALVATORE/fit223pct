import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { MessageDescriptor } from '@/domain/message'
import type { StagnationEvidencePoint, StagnationResult } from '@/domain/stagnation'
import type { Trend } from '@/domain/trends'
import type { Exercise } from '@/domain/types'
import { useTranslatedMessage } from '@/i18n/useTranslatedMessage'
import { formatValue, useDirectionPhrase } from './formatTrend'

interface StrengthCardProps {
  exercise: Exercise
  trend: Trend
  stagnation: StagnationResult
  substitution: Exercise | undefined
}

export function StrengthCard({ exercise, trend, stagnation, substitution }: StrengthCardProps) {
  const { t } = useTranslation('progress')
  const directionPhrase = useDirectionPhrase(trend.status === 'insufficient-data' ? 'steady' : trend.status)

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
        <InsufficientTrend reason={trend.reason} />
      ) : (
        <p className="mt-1.5 text-sm text-ink-secondary" data-numeric>
          {formatValue(trend.evidence.at(-1)!.value, trend.unit)} — {directionPhrase}
        </p>
      )}

      {stagnation.status === 'stagnant' && (
        <div className="mt-3 rounded-lg border border-border-strong/60 bg-raised p-3.5">
          <p className="text-sm leading-relaxed text-ink-secondary">
            {t('strength.stagnation.noIncreasePrefix')}{' '}
            <span data-numeric>
              {t('strength.stagnation.sessionCount', { count: stagnation.evidence.length })}
            </span>
            {' — '}
            {stagnation.evidence.map((point) => formatEvidence(point)).join(' → ')}
            {stagnation.excludedForReadiness > 0 &&
              t('strength.stagnation.excluded', { count: stagnation.excludedForReadiness })}
            .
          </p>
          {substitution && (
            <p className="mt-2 text-sm text-ink-tertiary">
              {t('strength.stagnation.worthChange')}{' '}
              <Link
                to={`/library/${substitution.id}`}
                state={{ from: 'progress' }}
                className="text-amber transition-colors hover:text-amber-deep"
              >
                {t('strength.stagnation.trySubstitution', { name: substitution.name })}
              </Link>
              .
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function InsufficientTrend({ reason }: { reason: MessageDescriptor }) {
  return <p className="mt-1.5 text-sm text-ink-tertiary">{useTranslatedMessage(reason)}</p>
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
