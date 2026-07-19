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
export function isoWeekday(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
