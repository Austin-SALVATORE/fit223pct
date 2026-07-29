import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import i18n from './i18next'
import { SUPPORTED_LOCALES } from './i18next'
import { RatingPicker } from '@/ui/RatingPicker'

/**
 * I3 and I7 (docs/review-backlog.md), from the user's side.
 *
 * Both are the §4 shape rather than a missing translation: the correct
 * per-locale form already existed somewhere in the codebase, and a second
 * site hardcoded the English one instead. So these assert on rendered
 * output, since a key-level check cannot see a literal that never asked for
 * a key.
 */

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('label/value punctuation follows the locale (I7)', () => {
  const expected: Record<string, string> = {
    en: 'Sleep: 3',
    fr: 'Sleep : 3',
    'zh-CN': 'Sleep：3',
  }

  for (const locale of SUPPORTED_LOCALES) {
    it(`${locale} punctuates the rating pill's name`, async () => {
      await i18n.changeLanguage(locale)
      render(
        <RatingPicker
          label="Sleep"
          options={[{ value: 3, display: '3' }]}
          value={null}
          onChange={() => {}}
        />,
      )

      expect(screen.getByRole('button', { name: expected[locale] })).toBeInTheDocument()
    })
  }

  it('zh-CN drops the ASCII spaces around the middot', () => {
    // The exact failure PlanPage documents and Intl.ListFormat was adopted
    // to fix — ASCII spacing reads as visibly foreign in Chinese.
    expect(i18n.getFixedT('zh-CN', 'common')('middotJoin', { a: 'A', b: 'B' })).toBe('A·B')
    expect(i18n.getFixedT('en', 'common')('middotJoin', { a: 'A', b: 'B' })).toBe('A · B')
    expect(i18n.getFixedT('fr', 'common')('middotJoin', { a: 'A', b: 'B' })).toBe('A · B')
  })
})

describe('units are translated, not Latin literals (I3)', () => {
  it('zh-CN writes seconds as 秒 everywhere it writes them', () => {
    const zh = i18n.getFixedT('zh-CN', null, '')
    // The internal inconsistency the backlog names: topSeconds already knew
    // the correct form while these two shipped a bare "s".
    expect(zh('workout:sessionSummary.topSeconds', { seconds: 30 })).toContain('秒')
    expect(zh('domain:highlight.effortSeconds', { delta: 5 })).toContain('秒')
    expect(zh('plan:dayDetail.secondsEffort', { seconds: 30 })).toContain('秒')
    expect(zh('common:unitSeconds')).toContain('秒')
  })

  it('reps and seconds carry per-locale words and plurals', () => {
    const en = i18n.getFixedT('en', 'progress')
    const fr = i18n.getFixedT('fr', 'progress')
    const zh = i18n.getFixedT('zh-CN', 'progress')

    expect(en('unit.reps', { count: 1, value: '1' })).toBe('1 rep')
    expect(en('unit.reps', { count: 12, value: '12' })).toBe('12 reps')
    expect(fr('unit.reps', { count: 12, value: '12' })).toBe('12 répétitions')
    // zh-CN has no plural categories — _other only, or localeParity fails.
    expect(zh('unit.reps', { count: 12, value: '12' })).toBe('12 次')
  })
})
