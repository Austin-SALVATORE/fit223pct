import { spokenKilograms, spokenQuantity, type Translate } from './spokenPrescription'

/**
 * One logged or prescribed *set* as a screen reader should say it (batch A2,
 * backlog A14's remainder). A set is printed as "12×14 kg", "14 kg × 12" or
 * "8 kg per dumbbell × 5": a multiplication sign between two quantities, in an
 * order that changes from screen to screen (reps first in "Last time", weight first
 * in the rung caption). Read aloud that is "12 times 14 kilograms", which is
 * wrong twice: it is not a product, and it does not say which number is the
 * load. This says "12 reps at 14 kg", the same in every place a set appears.
 *
 * Numbers arrive already formatted for the language, exactly as the visible text
 * printed them (French "17,75"), so the spoken and the visible never disagree;
 * this only supplies the words. Built from the same keys as a prescription's
 * ("N reps", "N kg", "a, then b" in `spokenPrescription.ts`), plus the four that
 * only a set needs (`weightedSet`, `perDumbbell`, `barbellTotal`, `rehearsal`).
 *
 *   12, 14      "12 reps at 14 kg"
 *   40 s, 10    "40 seconds at 10 kg"
 *   5, 8 (dumbbell)   "5 reps at 8 kg per dumbbell"
 *   12, no weight     "12 reps"
 *   no effort, 14     "14 kg"           (a rung with nothing printed for the reps)
 */
export interface SpokenSetInput {
  /** The weight as printed, or null when the set has none. */
  weight: string | null
  /** The reps or seconds as printed, or null when none is printed (the visible "–"). */
  effort: string | null
  /** The number behind `effort`, for the plural ("1 rep", "2 reps"). */
  effortCount: number
  mode: 'reps' | 'seconds'
  /** How the weight is qualified, when it is: a warm-up ramp says "per dumbbell" or "total". */
  weightKind?: 'dumbbell' | 'barbell'
}

export function spokenSet(t: Translate, set: SpokenSetInput): string {
  const load =
    set.weight === null
      ? null
      : set.weightKind === 'dumbbell'
        ? t('today:sessionPreview.spoken.perDumbbell', { weight: spokenKilograms(t, set.weight) })
        : set.weightKind === 'barbell'
          ? t('today:sessionPreview.spoken.barbellTotal', { weight: spokenKilograms(t, set.weight) })
          : spokenKilograms(t, set.weight)
  const work = set.effort === null ? null : spokenQuantity(t, set.mode, set.effort, set.effortCount)
  if (work !== null && load !== null) return t('today:sessionPreview.spoken.weightedSet', { effort: work, weight: load })
  return work ?? load ?? ''
}
