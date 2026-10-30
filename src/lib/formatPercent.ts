/**
 * A percentage written the way the reader's language writes it (T3, 30 Oct).
 *
 * `${bodyFatPercent}%` printed the number as it came and glued the sign to it in
 * every language. French writes "18,5 %" (a comma, and a non-breaking space before the
 * sign so it never wraps onto a line of its own); English and Chinese write "18.5%".
 * The platform's CLDR data answers all three, so this asks it instead of encoding any
 * of them (the same reason `formatVolume` does).
 *
 * `percent` is a percentage already, 18.5 and not 0.185: it is what a check-in stores
 * and what the Stepper edits. `Intl`'s percent style multiplies by 100 itself, hence
 * the division. Up to two decimals are kept and trailing zeros dropped, the precision
 * the Stepper stores (`formatNumber` in `ui/Stepper.tsx` makes the same choice for a
 * weight), so every value the app can write prints as typed: 18.5 -> "18.5%".
 */
export function formatPercent(percent: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(percent / 100)
}
