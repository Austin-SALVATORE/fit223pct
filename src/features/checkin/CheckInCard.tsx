import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { checkinRepo } from '@/data/repositories'
import { describeDrivers, type Readiness, type ReadinessSignal } from '@/domain/readiness'
import type { CheckIn, Rating } from '@/domain/types'
import { RatingPicker } from '@/ui/RatingPicker'

/**
 * The readiness check-in: five taps, under ten seconds, zero typing.
 * Auto-saves per tap. Skipping is always fine (no badge, no streak) —
 * an unanswered check-in simply means the plan is the plan.
 * Labels are phrased so 5 is always the good end.
 */

const SIGNAL_ROWS: { signal: ReadinessSignal; labelKey: string }[] = [
  { signal: 'sleep', labelKey: 'signalLabel.sleep' },
  { signal: 'energy', labelKey: 'signalLabel.energy' },
  { signal: 'soreness', labelKey: 'signalLabel.soreness' },
  { signal: 'stress', labelKey: 'signalLabel.stress' },
  { signal: 'motivation', labelKey: 'signalLabel.motivation' },
]

const RATING_OPTIONS = [1, 2, 3, 4, 5].map((value) => ({ value, display: String(value) }))

interface CheckInCardProps {
  dateKey: string
  checkIn: CheckIn | undefined
  readiness: Readiness
  /**
   * Today's session has already started (or finished) on this readiness —
   * further edits can't change what already happened, so the card becomes
   * read-only rather than silently inert.
   */
  locked?: boolean
}

export function CheckInCard({ dateKey, checkIn, readiness, locked = false }: CheckInCardProps) {
  const { t } = useTranslation('checkin')
  const complete = SIGNAL_ROWS.every(({ signal }) => checkIn?.[signal] != null)
  const [editing, setEditing] = useState(false)
  const expanded = !locked && (editing || !complete)
  const tierPhrase = useTierPhrase(readiness)

  async function rate(signal: ReadinessSignal, value: Rating) {
    const next: CheckIn = {
      id: `checkin-${dateKey}`,
      date: dateKey,
      sleep: null,
      energy: null,
      soreness: null,
      stress: null,
      motivation: null,
      weightKg: null,
      waistCm: null,
      ...checkIn,
      [signal]: value,
    }
    await checkinRepo.put(next)
    const nowComplete = SIGNAL_ROWS.every(({ signal: s }) => next[s] != null)
    if (nowComplete) setEditing(false)
  }

  return (
    <section
      aria-label={t('sectionLabel')}
      className="mt-8 rounded-card border border-border bg-surface p-5"
    >
      {expanded ? (
        <>
          <div className="flex items-baseline justify-between">
            <h2 className="eyebrow">{t('heading')}</h2>
            <p className="text-xs text-ink-tertiary">{t('hint')}</p>
          </div>
          <div className="mt-4 space-y-4">
            {SIGNAL_ROWS.map(({ signal, labelKey }) => {
              const label = t(labelKey)
              return (
                <div key={signal}>
                  <span className="text-sm text-ink-secondary">{label}</span>
                  <div className="mt-1.5">
                    <RatingPicker
                      label={label}
                      options={RATING_OPTIONS}
                      value={checkIn?.[signal] ?? null}
                      onChange={(value) => void rate(signal, value as Rating)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <CollapsedRow locked={locked} onEdit={() => setEditing(true)}>
          <h2 className="eyebrow">{t('heading')}</h2>
          <p className="mt-2 text-ink">
            {locked && !complete ? t('notRecorded') : tierPhrase}
          </p>
          {locked && <p className="mt-1 text-sm text-ink-tertiary">{t('lockedNote')}</p>}
        </CollapsedRow>
      )}
    </section>
  )
}

function CollapsedRow({
  locked,
  onEdit,
  children,
}: {
  locked: boolean
  onEdit: () => void
  children: ReactNode
}) {
  const { t } = useTranslation('checkin')
  const { t: tCommon } = useTranslation('common')
  if (locked) {
    return (
      <div className="flex w-full items-baseline justify-between gap-4">
        <div className="min-w-0">{children}</div>
        <span className="shrink-0 text-sm text-ink-tertiary">{t('locked')}</span>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full items-baseline justify-between gap-4 text-left"
    >
      <div className="min-w-0">{children}</div>
      <span className="shrink-0 text-sm text-ink-tertiary">{tCommon('edit')}</span>
    </button>
  )
}

function useTierPhrase(readiness: Readiness): string {
  const { t } = useTranslation('checkin')
  switch (readiness.tier) {
    case 'ready':
      return t('tierPhrase.ready')
    case 'steady':
      return t('tierPhrase.steady')
    case 'easier': {
      const because = describeDrivers(readiness.drivers)
      return t('tierPhrase.easier', { driversKey: because.key, ...because.params })
    }
  }
}
