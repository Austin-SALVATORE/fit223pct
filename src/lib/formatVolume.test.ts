import { describe, expect, it } from 'vitest'
import { formatVolume } from './formatVolume'

/**
 * Backlog I6 (batch A1): the volume tile was `${(v / 1000).toFixed(1)}k` in
 * every locale. These are the exact strings Node's ICU (CLDR) gives for each
 * language, written out so a reviewer can read what a user sees:
 *
 *   volume   old       en       fr          zh-CN
 *   850      850       850      850         850
 *   1234     1.2k      1.2K     1,2 k       1234        (zh does not abbreviate thousands)
 *   12000    12.0k     12K      12 k        1.2万
 *   12345    12.3k     12.3K    12,3 k      1.2万
 *   123456   123.5k    123.5K   123,5 k     12.3万
 *
 * The French space is a no-break space (U+00A0), so "12,3" and "k" cannot be
 * split across a line. The strings come from the platform, so a CLDR update
 * could in principle move one; that is the cost of not hard-coding a locale
 * table, and a failure here would be the first place to see it.
 *
 * Negative controls, run 30 Oct (mutation applied to `formatVolume.ts`, this
 * file run, restored, `cmp` clean):
 *   the old `${(v / 1000).toFixed(1)}k` body            -> the four "reads in each language's own convention" rows
 *   `maximumFractionDigits: 1` removed from compact     -> the 12345 and 123456 rows only ("12K" for "12.3K")
 *   the sub-1000 branch dropped (compact for everything)-> "does not abbreviate below 1000" (850.4 stays "850.4")
 * The component tests next to each call site (WeeklyReviewCard.volume.test.tsx,
 * SessionSummary.volume.test.tsx) pin that each passes the *active* language,
 * which this file cannot see.
 */
describe('formatVolume', () => {
  it('does not abbreviate below 1000, and rounds to a whole number', () => {
    for (const locale of ['en', 'fr', 'zh-CN']) {
      expect(formatVolume(850, locale)).toBe('850')
      expect(formatVolume(850.4, locale)).toBe('850')
      expect(formatVolume(999.6, locale)).toBe('1000')
    }
  })

  it.each([
    [1234, '1.2K', '1,2 k', '1234'],
    [12000, '12K', '12 k', '1.2万'],
    [12345, '12.3K', '12,3 k', '1.2万'],
    [123456, '123.5K', '123,5 k', '12.3万'],
  ])('%s kg reads in each language\'s own convention', (volume, en, fr, zh) => {
    expect(formatVolume(volume, 'en')).toBe(en)
    expect(formatVolume(volume, 'fr')).toBe(fr)
    expect(formatVolume(volume, 'zh-CN')).toBe(zh)
  })
})
