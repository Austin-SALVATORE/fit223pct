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
const DEFAULT_BODY_FAT_PERCENT = 20

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
  /**
   * **Revealing the body-fat stepper is not entering a reading.**
   *
   * This tap used to write `DEFAULT_BODY_FAT_PERCENT` straight to the
   * database — 20%, indistinguishable from a measurement, and feeding the
   * lean-mass REE — directly under a comment saying body fat should be
   * "entered by someone who has a method, not defaulted into by everyone".
   * Same class as the seeded `heightCm: 180` and the old `DEFAULT_PAL`: a
   * guess made load-bearing, in code whose own comment forbids it.
   *
   * Now it only reveals the control, matching what weight and waist have
   * always done — their defaults are display values handed to a Stepper and
   * nothing persists until `onChange` fires.
   */
  const [bodyFatRevealed, setBodyFatRevealed] = useState(false)
  // Body fat is deliberately NOT part of "complete": it is measured far less
  // often than weight and waist, and requiring it would leave the card
  // permanently expanded for anyone without a way to measure it.
  const complete = checkIn?.weightKg != null && checkIn?.waistCm != null
  const expanded = editing || !complete

  /**
   * Writes one measurement. **Every rating stays null** — a measurement-only
   * row is not a check-in, and verified not to read as one anywhere: readiness
   * treats zero answered signals exactly like no record (`dayTier`), the
   * consistency rate and the weekly review take workouts rather than check-ins,
   * and `CheckInCard`'s completeness needs all five signals. Locked in by
   * `MeasurementCard.test.tsx`.
   *
   * Merging through the repository rather than rebuilding the row from the
   * `checkIn` prop: the prop is one `useLiveQuery` frame old, so two writes
   * inside a frame would both start from the same snapshot and the second
   * would drop the first. Reachable from one card by adjusting two steppers
   * quickly, and more so now that Settings writes the same row.
   */
  async function save(field: 'weightKg' | 'waistCm' | 'bodyFatPercent', value: number) {
    await checkinRepo.mergeByDate(dateKey, { [field]: value })
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
            {checkIn!.bodyFatPercent != null && ` · ${checkIn!.bodyFatPercent}%`}
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
      {/*
        Body fat is opt-in rather than a third always-present stepper. Its
        usefulness depends entirely on how it was measured — a scale's guess
        and a caliper reading differ enough to move the Cunningham figure
        materially — so it should be entered by someone who has a method,
        not defaulted into by everyone.
      */}
      {checkIn?.bodyFatPercent == null && !bodyFatRevealed ? (
        <button
          type="button"
          onClick={() => setBodyFatRevealed(true)}
          className="mt-5 w-full rounded-card border border-border py-3 text-sm font-medium text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
        >
          {t('measurement.bodyFatAdd')}
        </button>
      ) : (
        <div className="mt-5 flex justify-center">
          <Stepper
            label={t('measurement.bodyFatLabel')}
            // A display value until touched, exactly like weight and waist
            // above. The cost, shared with them: someone whose reading really
            // is the default has to nudge it and back to store it. That is the
            // right side of the trade — the alternative is inventing a figure
            // for everyone who merely looked.
            value={checkIn?.bodyFatPercent ?? DEFAULT_BODY_FAT_PERCENT}
            step={0.5}
            min={3}
            max={70}
            unit="%"
            onChange={(value) => void save('bodyFatPercent', value)}
          />
        </div>
      )}
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
