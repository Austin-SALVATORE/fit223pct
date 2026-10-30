/**
 * Training volume (kg lifted) for a stat tile, in the reader's own number
 * conventions (batch A1, backlog I6).
 *
 * It used to be `${(volume / 1000).toFixed(1)}k` at two sites, which is an
 * English "k" and a dot decimal in every locale: French read "12.3k" where its
 * own convention is "12,3 k", and Chinese, which groups by 万 (10,000) and does
 * not abbreviate thousands at all, got a Western abbreviation it never writes.
 * Compact notation lets the platform's CLDR data answer all three. Below 1000
 * nothing is abbreviated, as before.
 *
 * The unit stays the caller's literal " kg", as it does everywhere else in the
 * app, so French reads "12,3 k kg" (twelve point three thousand kilograms).
 * That doubled "k" is legitimate but awkward; showing tonnes would fix it and
 * would also change what the tile says, which is the owner's call, not this
 * helper's.
 *
 * `compact` rounds to at most one decimal, which is what the old format did for
 * thousands. Chinese is coarser by construction (12345 is 1.2万, one decimal of
 * 10,000, against 12.3k): that is the language's own scale, not a loss.
 */
export function formatVolume(volumeKg: number, locale: string): string {
  if (volumeKg < 1000) {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0, useGrouping: false }).format(
      Math.round(volumeKg),
    )
  }
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(volumeKg)
}
