import { describe, expect, it } from 'vitest'
import { formatPercent } from './formatPercent'

/**
 * A stored percentage (18.5, not 0.185) written the way the language writes it (T3,
 * 30 Oct). French puts a comma and a non-breaking space before the sign; English and
 * Chinese print "18.5%". The space is asserted as one of the two non-breaking spaces
 * CLDR has used for it (U+00A0 in the ICU shipped with Node 24 and with the Chromium
 * and WebKit builds measured on 30 Oct, U+202F in some other versions), never an
 * ordinary space, because an ordinary one lets the sign wrap onto a line of its own.
 *
 * Negative controls, run 30 Oct (mutation applied to `formatPercent.ts`, the whole
 * suite run, restored and `cmp`ed):
 *   the function returns `${percent}%` (the old line)
 *       -> 7 red: five here (the four French rows and the French half of the precision
 *          test) and two in `MeasurementCard.format.test.tsx`. English and Chinese stay
 *          green: for those the old text and the new are the same text, which is the
 *          claim "unchanged".
 *   the fraction digits left at the percent style's default of none
 *       -> 9 red: six here (18.5 would print "19%", in every language) and three in
 *          `MeasurementCard.format.test.tsx`, the English and Chinese "unchanged" rows
 *          among them.
 *
 * What it cannot see: a language other than the three the app ships, and an ICU that
 * chooses some other character for the space (the test accepts the two CLDR has used).
 */

const FR = (digits: string) => new RegExp(`^${digits}[\\u00a0\\u202f]%$`)

describe('formatPercent', () => {
  it.each([
    ['en', 18.5, '18.5%'],
    ['zh-CN', 18.5, '18.5%'],
    ['en', 20, '20%'],
    ['zh-CN', 20, '20%'],
    ['en', 18.25, '18.25%'],
    ['en', 0, '0%'],
  ])('%s %s -> %s', (locale, value, expected) => {
    expect(formatPercent(value, locale)).toBe(expected)
  })

  it.each([
    [18.5, '18,5'],
    [20, '20'],
    [18.25, '18,25'],
    [0, '0'],
  ])('fr %s -> a comma, a non-breaking space, a sign', (value, digits) => {
    const text = formatPercent(value, 'fr')
    expect(text).toMatch(FR(digits))
    expect(text).not.toContain(' ')
  })

  it('keeps the precision a stepper can store and drops the floating-point noise', () => {
    // 28.9 / 100 is 0.28900000000000003 as a double.
    expect(formatPercent(28.9, 'en')).toBe('28.9%')
    expect(formatPercent(7.1, 'en')).toBe('7.1%')
    expect(formatPercent(28.9, 'fr')).toMatch(FR('28,9'))
  })
})
