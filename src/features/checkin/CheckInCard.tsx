import { useState, type ReactNode, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { checkinRepo } from '@/data/repositories'
import { describeDrivers, type Readiness, type ReadinessSignal } from '@/domain/readiness'
import { useFocusOnChange } from '@/lib/useFocusOnChange'
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
  // Rating the fifth signal makes the card complete, which unmounts the
  // expanded branch out from under the button the user just pressed —
  // focus would fall to <body>, and the readiness tier, the payoff of the
  // whole flow, would render into a region nothing announced
  // (docs/review-backlog.md A2). Focus the collapsed control instead: its
  // accessible name is its own content, so the tier is read out as part of
  // it. Edge-triggered, so a page that loads already-collapsed — the
  // common case — never steals focus.
  const collapsedRef = useFocusOnChange<HTMLButtonElement>(!expanded)

  /**
   * **Merges through the repository rather than rebuilding the row here.**
   *
   * The old version spread the `checkIn` prop into a fresh object and wrote
   * the whole thing back. That prop is one `useLiveQuery` frame old, so two
   * ratings tapped inside a single frame both started from the same snapshot
   * and the second silently dropped the first — a lost answer, invisible at
   * the moment it happens. Five rating rows one tap apart is the most likely
   * place in the app to hit it, not the least.
   *
   * The blank row lives in `checkinRepo.mergeByDate` for the same reason it
   * did for `MeasurementCard`: this literal had already drifted, omitting
   * `bodyFatPercent`, so a row created here differed from one created there.
   */
  async function rate(signal: ReadinessSignal, value: Rating) {
    await checkinRepo.mergeByDate(dateKey, { [signal]: value })
    // Deliberately still derived from the prop plus the tap just made, which
    // is exactly what the old code computed — so the moment the card
    // collapses, and therefore the A2 focus move, is unchanged.
    const nowComplete = SIGNAL_ROWS.every(({ signal: s }) => s === signal || checkIn?.[s] != null)
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
        <CollapsedRow ref={collapsedRef} locked={locked} onEdit={() => setEditing(true)}>
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
  ref,
}: {
  locked: boolean
  onEdit: () => void
  children: ReactNode
  /** Focus target for the expanded→collapsed transition — see CheckInCard's collapsedRef. */
  ref?: Ref<HTMLButtonElement>
}) {
  const { t } = useTranslation('checkin')
  const { t: tCommon } = useTranslation('common')
  // A locked card is collapsed from its first render and can never make the
  // transition, so it needs no focus target.
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
      ref={ref}
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
