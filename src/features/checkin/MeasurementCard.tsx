import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { checkinRepo } from '@/data/repositories'
import { Stepper } from '@/ui/Stepper'
import type { CheckIn } from '@/domain/types'

interface MeasurementCardProps {
  dateKey: string
  checkIn: CheckIn | undefined
}

const DEFAULT_WEIGHT_KG = 70
const DEFAULT_WAIST_CM = 80

/**
 * Checkpoint-day input — the only surface that ever writes
 * CheckIn.weightKg / waistCm (the columns have existed since M3 with no UI
 * to fill them). No photos, no meal language (see docs/DailyProgram.md).
 * Auto-saves per adjustment, same as the readiness check-in — no separate
 * save step, and nothing here tracks whether "today's" checkpoint was done.
 */
export function MeasurementCard({ dateKey, checkIn }: MeasurementCardProps) {
  const { t } = useTranslation('checkin')
  const { t: tCommon } = useTranslation('common')
  const [editing, setEditing] = useState(false)
  const complete = checkIn?.weightKg != null && checkIn?.waistCm != null
  const expanded = editing || !complete

  async function save(field: 'weightKg' | 'waistCm', value: number) {
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
      [field]: value,
    }
    await checkinRepo.put(next)
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-8 flex w-full items-baseline justify-between gap-4 rounded-card border border-border bg-surface p-5 text-left"
      >
        <div className="min-w-0">
          <h2 className="eyebrow">{t('measurement.heading')}</h2>
          <p className="mt-2 text-ink" data-numeric>
            {checkIn!.weightKg} kg · {checkIn!.waistCm} cm
          </p>
        </div>
        <span className="shrink-0 text-sm text-ink-tertiary">{tCommon('edit')}</span>
      </button>
    )
  }

  return (
    <section
      aria-label={t('measurement.sectionLabel')}
      className="mt-8 rounded-card border border-border bg-surface p-5"
    >
      <h2 className="eyebrow">{t('measurement.heading')}</h2>
      <div className="mt-4 flex justify-center gap-8">
        <Stepper
          label={t('measurement.weightLabel')}
          value={checkIn?.weightKg ?? DEFAULT_WEIGHT_KG}
          step={0.1}
          min={20}
          unit="kg"
          onChange={(value) => void save('weightKg', value)}
        />
        <Stepper
          label={t('measurement.waistLabel')}
          value={checkIn?.waistCm ?? DEFAULT_WAIST_CM}
          step={0.5}
          min={30}
          unit="cm"
          onChange={(value) => void save('waistCm', value)}
        />
      </div>
      {complete && (
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mt-4 w-full text-center text-sm text-ink-tertiary transition-colors hover:text-ink-secondary"
        >
          {tCommon('done')}
        </button>
      )}
    </section>
  )
}
