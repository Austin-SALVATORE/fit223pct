import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { activityRecordRepo } from '@/data/repositories'
import { CARD_SECTION } from '@/ui/cardSection'
import { Stepper } from '@/ui/Stepper'
import type { ActivityRecord } from '@/domain/types'

interface RideRecordCardProps {
  dateKey: string
  programId: string
  /** The day's existing ride record, if one has been saved — must be `kind: 'ride'` when present. */
  existing: ActivityRecord | undefined
}

const START_MINUTES = 20
const START_HEART_RATE = 130

/**
 * Records a completed ride — coach spec v2.11 §3/§12. Both fields are
 * required by `ActivityRecord`'s type before a save is even possible
 * (types.ts), so this form holds a draft in local state until both are
 * present rather than writing a partial record: "a duration-only entry
 * does not count as a completed ride" (§12) is enforced by the type, and a
 * half-filled form living only in component state is what keeps a draft
 * from ever reaching `activityRecordRepo`, matching §3's "saved records
 * survive reload, drafts do not."
 *
 * Zone is deliberately absent — §12 is explicit that zone is the
 * prescription, never a result field. No calories, distance, speed or
 * cadence, for the same reason.
 */
export function RideRecordCard({ dateKey, programId, existing }: RideRecordCardProps) {
  const { t } = useTranslation('today')
  const { t: tCommon } = useTranslation('common')
  const ride = existing?.kind === 'ride' ? existing : undefined
  const [editing, setEditing] = useState(false)
  const [minutesDraft, setMinutesDraft] = useState<number | null>(ride?.actualMinutes ?? null)
  const [heartRateDraft, setHeartRateDraft] = useState<number | null>(ride?.avgHeartRate ?? null)
  const headingId = useId()
  const expanded = editing || !ride

  async function save() {
    if (minutesDraft === null || heartRateDraft === null) return
    await activityRecordRepo.put({
      date: dateKey,
      programId,
      kind: 'ride',
      completedAt: new Date().toISOString(),
      actualMinutes: minutesDraft,
      avgHeartRate: heartRateDraft,
    })
    setEditing(false)
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`${CARD_SECTION} flex w-full items-baseline justify-between gap-4 text-left`}
      >
        <div className="min-w-0">
          <h2 className="eyebrow">{t('rideRecord.heading')}</h2>
          <p className="mt-2 text-ink" data-numeric>
            {ride.actualMinutes} {tCommon('unitMinutes')} · {ride.avgHeartRate} {t('rideRecord.bpm')}
          </p>
        </div>
        <span className="shrink-0 text-sm text-ink-tertiary">{tCommon('edit')}</span>
      </button>
    )
  }

  return (
    <section aria-labelledby={headingId} className={CARD_SECTION}>
      <h2 id={headingId} className="eyebrow">
        {t('rideRecord.heading')}
      </h2>
      <p className="mt-2 text-sm text-ink-secondary">{t('rideRecord.prompt')}</p>
      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4">
        <Stepper
          variant="form"
          label={t('rideRecord.durationLabel')}
          value={minutesDraft}
          startFrom={START_MINUTES}
          step={1}
          min={1}
          max={180}
          unit={tCommon('unitMinutes')}
          integer
          onChange={setMinutesDraft}
        />
        <Stepper
          variant="form"
          label={t('rideRecord.heartRateLabel')}
          value={heartRateDraft}
          startFrom={START_HEART_RATE}
          step={1}
          min={40}
          max={220}
          unit={t('rideRecord.bpm')}
          integer
          onChange={setHeartRateDraft}
        />
      </div>
      <button
        type="button"
        disabled={minutesDraft === null || heartRateDraft === null}
        onClick={() => void save()}
        className="mt-5 w-full rounded-card bg-amber py-3 text-center text-sm font-semibold text-bg transition-opacity disabled:opacity-40"
      >
        {t('rideRecord.save')}
      </button>
    </section>
  )
}
