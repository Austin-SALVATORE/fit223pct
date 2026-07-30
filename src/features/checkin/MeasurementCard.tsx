import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { checkinRepo } from '@/data/repositories'
import { CARD_SECTION } from '@/ui/cardSection'
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
  const headingId = useId()
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
        className={`${CARD_SECTION} flex w-full items-baseline justify-between gap-4 text-left`}
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
    // Named by its own heading rather than by a parallel `aria-label` string.
    // The two had drifted — the region announced "Body measurements" while the
    // heading read "Measurements", so a screen-reader user and a sighted user
    // did not hear the same section name. Pointing at the heading makes them
    // the same string by construction instead of by upkeep across three
    // locales.
    <section aria-labelledby={headingId} className={CARD_SECTION}>
      <h2 id={headingId} className="eyebrow">
        {t('measurement.heading')}
      </h2>
      {/*
        **Wraps rather than assuming both steppers fit side by side.** They do
        not at phone width: 156 + 32 gap + 162 needs 350px against the card's
        308px content box at 390px, and `justify-center` then spilled the
        overflow 21px past the padding on *each* side, so the controls sat
        flush against the card's border. On a desktop-width card the same
        markup fits with room to spare, which is exactly why it read as a
        minor centring quirk on a PC and as content bleeding out of the card
        on a phone — one layout, two verdicts.

        `flex-wrap` with a row gap is the adaptive form: side by side where
        there is room, stacked where there is not, and never overflowing.
      */}
      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4">
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
        <div className="mt-5">
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
