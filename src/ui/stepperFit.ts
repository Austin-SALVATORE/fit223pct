/**
 * The arithmetic behind how big a `Stepper`'s value is drawn (batch S1). It is
 * its own module, not part of `Stepper.tsx`, so it can be exported and tested
 * without a component file exporting a non-component (fast refresh refuses that).
 * The class tokens that consume the number live with the markup, in `VALUE_SLOT`
 * in `Stepper.tsx`, which explains the whole mechanism.
 */

/**
 * The width, in em of the value's own font, each size's cell was designed for:
 * the widest ordinary value, "00.00kg" (and "000.0cm"), measured in Chromium at
 * 375px with tabular figures — 194px at 60px (`lg`) and 112px at 30px (`form`).
 * An ordinary value asks for exactly this much, so at full width it is drawn at
 * the size this control always had.
 */
export const CELL_EM = {
  lg: 12.125 / 3.75,
  form: 7 / 1.875,
} as const

/**
 * Advance of one tabular digit, in em of the value's font. Measured in
 * Chromium (system-ui): 38.3px at 60px = 0.638, rounded up — a font with wider
 * digits only costs a couple of pixels of the 8px between the cell and a button.
 */
const DIGIT_EM = 0.64
/** A decimal separator, "." or ",": 0.235em measured. Any other non-digit (a sign) is charged as a digit. */
const SEPARATOR_EM = 0.24
/** The number part of the widest ordinary value, "00.00" — what `CELL_EM` was sized for. */
const REFERENCE_NUMBER_EM = 4 * DIGIT_EM + SEPARATOR_EM
/**
 * Extra room for the digits past the reference. Chromium rounds a glyph's
 * advance up at small sizes — a 31-digit number came out 8% wider than its
 * linear estimate at ~9px — and the excess is exactly what runs at small sizes.
 * Measured: with this, up to 20 digits fit the cell; past that `overflow-x-clip`
 * on the output takes over (a number nobody can lift). Zero excess stays zero,
 * so an ordinary value is never touched.
 */
const EXCESS_MARGIN = 1.15

/**
 * How many em of the value's font the text needs, never less than the cell was
 * designed for. Only the number counts: up to "00.00" the answer is `CELL_EM`
 * whatever the unit (the cell was sized with its unit in), and past it each
 * extra digit costs one `DIGIT_EM` (plus the margin).
 */
export function valueEm(size: 'lg' | 'form', formatted: string): number {
  const separators = (formatted.match(/[.,]/g) ?? []).length
  const numberEm = (formatted.length - separators) * DIGIT_EM + separators * SEPARATOR_EM
  return CELL_EM[size] + Math.max(0, numberEm - REFERENCE_NUMBER_EM) * EXCESS_MARGIN
}
