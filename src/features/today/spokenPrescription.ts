import type { TFunction } from 'i18next'
import { formatNumber } from '@/ui/Stepper'
import type { ExercisePrescription } from '@/domain/types'

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
 */
export function spokenPrescription(
  t: TFunction<'today'>,
  locale: string,
  item: ExercisePrescription,
): string {
  const quantity = (list: string, count: number): string =>
    item.mode === 'seconds'
      ? t('sessionPreview.spoken.seconds', { list, count })
      : t('sessionPreview.spoken.reps', { list, count })
  const perSide = (what: string): string =>
    item.perSide ? t('sessionPreview.spoken.perSide', { what }) : what
  const kilograms = (list: string): string => t('sessionPreview.spoken.kilograms', { list })

  if (item.setPlan) {
    const rungs = item.setPlan
    const reps = perSide(
      quantity(sequence(t, rungs.map((rung) => String(rung.reps))), rungs[rungs.length - 1].reps),
    )
    if (!rungs.some((rung) => rung.weightKg !== null)) return reps

    const weights = kilograms(
      sequence(
        t,
        rungs.map((rung) =>
          rung.weightKg !== null
            ? formatNumber(rung.weightKg, locale)
            : t('sessionPreview.spoken.noWeight'),
        ),
      ),
    )
    return t('sessionPreview.spoken.ladder', { weights, reps })
  }

  const { min, max } = item.range
  const span = min === max ? String(min) : t('sessionPreview.spoken.range', { min, max })
  const sets = t('sessionPreview.spoken.setsOf', { count: item.sets, what: perSide(quantity(span, max)) })
  if (item.startWeightKg === null) return sets
  return t('sessionPreview.spoken.join', {
    a: sets,
    b: t('sessionPreview.spoken.startingAt', {
      weight: kilograms(formatNumber(item.startWeightKg, locale)),
    }),
  })
}

/** "a", "a, then b", "a, b, then c" — in the locale's own list shape. */
function sequence(t: TFunction<'today'>, items: readonly string[]): string {
  if (items.length === 1) return items[0]
  return t('sessionPreview.spoken.sequence', {
    items: items.slice(0, -1).join(t('sessionPreview.spoken.listSeparator')),
    last: items[items.length - 1],
  })
}
