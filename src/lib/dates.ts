/** ISO date key (yyyy-mm-dd) in local time — all scheduling is local-day based. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Inverse of toDateKey — local midnight of the given yyyy-mm-dd key. */
export function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`)
}

/** ISO weekday: 1 = Monday … 7 = Sunday */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export function isoWeekday(date: Date): IsoWeekday {
  const day = date.getDay()
  return (day === 0 ? 7 : day) as IsoWeekday
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/**
 * The app's established English date convention is day-before-month
 * ("22 July"), which is the `en-GB` formatting, not the `en`/`en-US`
 * default ("July 22") `Intl` would otherwise apply — this is the one
 * place that distinction is resolved, so every date-formatting call site
 * can just pass the active i18next locale through unchanged.
 */
export function dateFormattingLocale(locale: string): string {
  return locale === 'en' ? 'en-GB' : locale
}

export function formatLongDate(date: Date, locale: string): string {
  return date.toLocaleDateString(dateFormattingLocale(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
