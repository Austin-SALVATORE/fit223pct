import { afterEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import i18n from '@/i18n/i18next'
import type { CheckIn } from '@/domain/types'
import { MeasurementCard } from './MeasurementCard'

/**
 * The collapsed measurement line writes each number in the language's own notation
 * (T3, 30 Oct): French "84,2 kg · 85,5 cm · 18,5 %". It interpolated the stored numbers
 * as they came, "84.2 kg · 85.5 cm · 18.5%", a point in every language and, for French,
 * a percent sign glued to the number.
 *
 * What English and Chinese print is pinned and did not change. The percent sign is the
 * one place Intl can change the text: it does not for either (both print "18.5%").
 * French separates the sign with a non-breaking space; which of the two CLDR has used
 * is not pinned here (`formatPercent.test.ts` does that), only that it is not an
 * ordinary space.
 *
 * Negative controls, run 30 Oct (mutation applied to `MeasurementCard.tsx` or
 * `formatPercent.ts`, the whole suite run, restored and `cmp`ed):
 *   the weight left as the raw number     -> 2 red, French: the full line and the line with no body fat
 *   the waist left as the raw number      -> 2 red, the same two
 *   the body fat back to `${value}%`      -> 2 red, French: the full line (a point-free "18,5%" with no
 *                                            space is not French) and the whole-number row ("20%")
 *   the helper's own controls are in `formatPercent.test.ts`.
 * English and Chinese stay green under the first three: they print what they always did.
 *
 * What it cannot see: the expanded editor (the steppers format their own values), and the
 * "kg" and "cm" units, which are literals here as they were (Chinese reads "84.2 kg", not
 * "84.2 公斤", on this line; that is untouched).
 */

afterEach(async () => {
  await i18n.changeLanguage('en')
})

function checkIn(weightKg: number, waistCm: number, bodyFatPercent: number | null): CheckIn {
  return {
    id: 'c-2026-07-20',
    date: '2026-07-20',
    sleep: null,
    energy: null,
    soreness: null,
    stress: null,
    motivation: null,
    weightKg,
    waistCm,
    bodyFatPercent,
  }
}

/** The collapsed line in the language already set by the caller. */
function line(value: CheckIn): string {
  const { container } = render(<MeasurementCard dateKey="2026-07-20" checkIn={value} />)
  const el = container.querySelector('p[data-numeric]')
  if (!el) throw new Error('no collapsed measurement line')
  return el.textContent ?? ''
}

describe('the collapsed measurement line', () => {
  it.each([
    ['en', '84.2 kg · 85.5 cm · 18.5%'],
    ['zh-CN', '84.2 kg · 85.5 cm · 18.5%'],
  ])('%s is unchanged', async (locale, expected) => {
    await i18n.changeLanguage(locale)
    expect(line(checkIn(84.2, 85.5, 18.5))).toBe(expected)
  })

  it('fr writes the commas and the percent sign the way French does', async () => {
    await i18n.changeLanguage('fr')
    const text = line(checkIn(84.2, 85.5, 18.5))
    expect(text).toMatch(/^84,2 kg · 85,5 cm · 18,5[  ]%$/)
    expect(text).not.toContain('.')
  })

  it.each([
    ['en', '84 kg · 85 cm · 20%'],
    ['fr', '84 kg · 85 cm · 20 %'],
    ['zh-CN', '84 kg · 85 cm · 20%'],
  ])('%s: whole numbers print as they did', async (locale, expected) => {
    await i18n.changeLanguage(locale)
    const text = line(checkIn(84, 85, 20))
    expect(text.replace(' ', ' ')).toBe(expected)
  })

  it.each([
    ['en', '84.2 kg · 85.5 cm'],
    ['fr', '84,2 kg · 85,5 cm'],
    ['zh-CN', '84.2 kg · 85.5 cm'],
  ])('%s: with no body-fat reading the line stops after the waist', async (locale, expected) => {
    await i18n.changeLanguage(locale)
    expect(line(checkIn(84.2, 85.5, null))).toBe(expected)
  })
})
