import { formatNumber } from '@/ui/Stepper'
import type { ExercisePrescription } from '@/domain/types'

/**
 * A translate function that is not tied to one namespace. The spoken vocabulary
 * lives in `today:sessionPreview.spoken` and is read from the workout, progress
 * and warm-up screens too, so every key here carries its namespace explicitly
 * (`today:...`), as `formatTrend.ts` does for `common:intlLocale`. Any
 * `useTranslation(...)`'s `t` is assignable to this.
 */
export type Translate = (key: string, options?: Record<string, unknown>) => string

/**
 * What a screen reader should say for a prescription (batch A1, backlog A14).
 *
 * The visible text is built from glyphs that are deliberately locale-neutral
 * ("60→65→70 kg · 12/10/8", "4 × 8–12 · 60 kg", i18n ruled on that), and a screen
 * reader reads them as punctuation: "60 right arrow 65 right arrow 70", "8 12"
 * for a range. This builds the sentence the glyphs stand for, in the reader's
 * language, to sit beside the visible text (`ItemRow` in `SessionPreview`), which
 * is hidden from assistive technology while this is exposed. The visible text
 * does not change.
 *
 *   60→65→70 kg · 12/10/8   "60, 65, then 70 kg, for 12, 10, then 8 reps"
 *   4 × 8–12 · 60 kg        "4 sets of 8 to 12 reps, starting at 60 kg"
 *   3 × 30–45 s /side       "3 sets of 30 to 45 seconds per side"
 *
 * **No prose in code.** Every word, separator and joiner is a key under
 * `today:sessionPreview.spoken` (so the architecture rule holds: nothing here is
 * English, and zh-CN, which lists with "、" and has no "then", can differ in
 * shape rather than just in words). The shape of the sentence follows
 * `formatPrescription` in `SessionPreview.tsx` branch for branch, including a
 * ladder rung with no weight (the visible "–") and a bodyweight ladder with no
 * weights at all.
 *
 * It lives in its own module, not in the component file, so it can be exported
 * and tested directly without a component file exporting a non-component.
 *
 * **Batch A2** exports the three pieces a set shares with a prescription
 * (`spokenSequence`, `spokenQuantity`, `spokenKilograms`) so `spokenSet.ts` and the
 * workout, progress and warm-up screens say "12 reps", "14 kg" and "a, then b"
 * the same way and from the same keys, in place of a second vocabulary.
 */
export function spokenPrescription(t: Translate, locale: string, item: ExercisePrescription): string {
  const quantity = (list: string, count: number): string => spokenQuantity(t, item.mode, list, count)
  const perSide = (what: string): string =>
    item.perSide ? t('today:sessionPreview.spoken.perSide', { what }) : what

  if (item.setPlan) {
    const rungs = item.setPlan
    const reps = perSide(
      quantity(spokenSequence(t, rungs.map((rung) => String(rung.reps))), rungs[rungs.length - 1].reps),
    )
    if (!rungs.some((rung) => rung.weightKg !== null)) return reps

    const weights = spokenKilograms(
      t,
      spokenSequence(
        t,
        rungs.map((rung) =>
          rung.weightKg !== null
            ? formatNumber(rung.weightKg, locale)
            : t('today:sessionPreview.spoken.noWeight'),
        ),
      ),
    )
    return t('today:sessionPreview.spoken.ladder', { weights, reps })
  }

  const { min, max } = item.range
  const span = min === max ? String(min) : t('today:sessionPreview.spoken.range', { min, max })
  const sets = t('today:sessionPreview.spoken.setsOf', { count: item.sets, what: perSide(quantity(span, max)) })
  if (item.startWeightKg === null) return sets
  return t('today:sessionPreview.spoken.join', {
    a: sets,
    b: t('today:sessionPreview.spoken.startingAt', {
      weight: spokenKilograms(t, formatNumber(item.startWeightKg, locale)),
    }),
  })
}

/** "a", "a, then b", "a, b, then c" — in the locale's own list shape. */
export function spokenSequence(t: Translate, items: readonly string[]): string {
  if (items.length === 1) return items[0]
  return t('today:sessionPreview.spoken.sequence', {
    items: items.slice(0, -1).join(t('today:sessionPreview.spoken.listSeparator')),
    last: items[items.length - 1],
  })
}

/** "12 reps" / "40 seconds" — `list` is the number(s) as printed, `count` drives the plural. */
export function spokenQuantity(t: Translate, mode: 'reps' | 'seconds', list: string, count: number): string {
  return mode === 'seconds'
    ? t('today:sessionPreview.spoken.seconds', { list, count })
    : t('today:sessionPreview.spoken.reps', { list, count })
}

/** "14 kg" — `list` is the number(s) as printed. */
export function spokenKilograms(t: Translate, list: string): string {
  return t('today:sessionPreview.spoken.kilograms', { list })
}
