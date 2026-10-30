import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { MessageDescriptor } from '@/domain/message'
import type { StagnationEvidencePoint, StagnationResult } from '@/domain/stagnation'
import type { Trend } from '@/domain/trends'
import type { Exercise } from '@/domain/types'
import { useTranslatedMessage } from '@/i18n/useTranslatedMessage'
import { useExerciseName } from '@/i18n/seedExercise'
import type { TFunction } from 'i18next'
import { spokenSequence } from '@/features/today/spokenPrescription'
import { spokenSet } from '@/features/today/spokenSet'
import { formatNumber, formatValue, useDirectionPhrase } from './formatTrend'

interface StrengthCardProps {
  exercise: Exercise
  trend: Trend
  stagnation: StagnationResult
  substitution: Exercise | undefined
}

export function StrengthCard({ exercise, trend, stagnation, substitution }: StrengthCardProps) {
  const { t } = useTranslation('progress')
  const directionPhrase = useDirectionPhrase(trend.status === 'insufficient-data' ? 'steady' : trend.status)
  const exerciseName = useExerciseName(exercise.id)
  const substitutionName = useExerciseName(substitution?.id ?? exercise.id)

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <Link
        to={`/library/${exercise.id}`}
        state={{ from: 'progress' }}
        className="font-medium text-ink transition-colors hover:text-amber"
      >
        {exerciseName}
      </Link>

      {trend.status === 'insufficient-data' ? (
        <InsufficientTrend reason={trend.reason} />
      ) : (
        <p className="mt-1.5 text-sm text-ink-secondary" data-numeric>
          {formatValue(t, trend.evidence.at(-1)!.value, trend.unit)} — {directionPhrase}
        </p>
      )}

      {stagnation.status === 'stagnant' && (
        <div className="mt-3 rounded-lg border border-border-strong/60 bg-raised p-3.5">
          <p className="text-sm leading-relaxed text-ink-secondary">
            {t('strength.stagnation.noIncreasePrefix')}{' '}
            <span data-numeric>
              {t('strength.stagnation.sessionCount', { count: stagnation.evidence.length })}
            </span>
            {/*
              A14 remainder (batch A2). The evidence is "16 kg × 10 reps → 16 kg × 10
              reps → 16 kg × 9 reps", which a reader voices as "times" and "right
              arrow", and the dash before it as a pause or the word "dash". It stays on
              screen, hidden from assistive technology, and the sentence it stands for
              follows in a visually hidden span: "10 reps at 16 kg, 10 reps at 16 kg,
              then 9 reps at 16 kg". Inline, so the sentence still reads as one.
            */}
            <span aria-hidden="true">
              {' — '}
              {stagnation.evidence.map((point) => formatEvidence(t, point)).join(' → ')}
            </span>
            <span className="sr-only">
              {t('strength.stagnation.spokenEvidence', { list: spokenEvidence(t, stagnation.evidence) })}
            </span>
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
                {t('strength.stagnation.trySubstitution', { name: substitutionName })}
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

/**
 * The evidence as a sentence: each session's best set as "10 reps at 16 kg", in
 * order, joined "a, b, then c". The numbers go through the same formatter
 * as the visible line (`formatNumber`), so the two never disagree.
 */
function spokenEvidence(t: TFunction, evidence: readonly StagnationEvidencePoint[]): string {
  return spokenSequence(
    t,
    evidence.map((point) =>
      spokenSet(t, {
        weight: point.weightKg !== null ? formatNumber(t, point.weightKg) : null,
        effort: formatNumber(t, point.effort),
        effortCount: point.effort,
        mode: point.effortMode,
      }),
    ),
  )
}

/** Shows both dimensions when weight is present — a session's reps still
 * moved even when its weight didn't, and hiding that is exactly what let
 * double progression read as a plateau. */
function formatEvidence(t: TFunction, point: StagnationEvidencePoint): string {
  if (point.weightKg !== null) {
    return `${formatValue(t, point.weightKg, 'kg')} × ${formatValue(t, point.effort, point.effortMode)}`
  }
  return formatValue(t, point.effort, point.effortMode)
}
