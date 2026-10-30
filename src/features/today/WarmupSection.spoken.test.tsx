import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import i18n from '@/i18n/i18next'
import { heard } from '@/test/heard'
import type { Warmup } from '@/domain/warmup'
import { WarmupSection } from './WarmupSection'

/**
 * Backlog A14's remainder (batch A2), site (c): the warm-up ramp row. The visible
 * line is "8 kg per dumbbell × 5", which a screen reader voices as "8 kilograms per
 * dumbbell times 5". The row is a link, so its accessible name is computed from its
 * content, and that name is exactly what is announced for the row.
 *
 * What must hold, in all three languages:
 *   - the link's accessible name carries the sentence ("5 reps at 8 kg per
 *     dumbbell"), checked with the real name computation (`getByRole` + `name`);
 *   - what is heard from the row has none of → × – · /, checked with `heard()`,
 *     which skips `aria-hidden` subtrees, so the glyph line is shown to be absent
 *     by a second route, not only the sentence to be present;
 *   - the visible line is unchanged and `aria-hidden`;
 *   - a barbell is "total", a dumbbell "per dumbbell", and a per-side step says so;
 *   - the number is spoken as printed (French "7,75").
 *
 * jsdom has no layout and does not apply the `sr-only` stylesheet, so the hidden
 * sentence is plain text here. The real accessibility tree is in the report.
 *
 * Negative controls, run 30 Oct (mutation applied to `WarmupSection.tsx`, this file
 * run, restored from a saved copy, `cmp` clean):
 *   `aria-hidden` removed from the visible line       -> 18 red: "hears no glyph" and "hidden from assistive technology", 3 rows x 3 languages each.
 *                                                        "the link's name carries the sentence" stays GREEN here: the name still contains the
 *                                                        sentence, with the glyphs beside it. That is why the other two tests exist.
 *   the `sr-only` sentence removed                    -> 18 red: "the link's name carries the sentence" and "hears no glyph" (which also
 *                                                        asserts the sentence is heard), 3 rows x 3 languages each
 *   `perSide` ignored when building the sentence      -> 6 red: the per-side row, those two tests, all three languages
 *   `weightKind` forced to 'dumbbell'                 -> 6 red: the barbell row, those two tests, all three languages
 *   the weight left unformatted (`String(weightKg)`)  -> 2 red: the French barbell row only (7,75 spoken as 7.75); en and zh-CN
 *                                                        print a point, so they cannot see this one
 */

type Locale = 'en' | 'fr' | 'zh-CN'

const GLYPHS = /[→×–·/]/

afterEach(async () => {
  await i18n.changeLanguage('en')
})

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const dumbbell: Warmup = {
  id: 'spoken-dumbbell',
  steps: [{ kind: 'ramp', exerciseId: 'goblet-squat', implement: 'dumbbell', weightKg: 8, reps: 5 }],
}
const barbell: Warmup = {
  id: 'spoken-barbell',
  steps: [{ kind: 'ramp', exerciseId: 'barbell-romanian-deadlift', implement: 'barbell', weightKg: 7.75, reps: 8 }],
}
const perSide: Warmup = {
  id: 'spoken-per-side',
  steps: [{ kind: 'ramp', exerciseId: 'bulgarian-split-squat', implement: 'dumbbell', weightKg: 6, reps: 5, perSide: true }],
}

const cases: [string, Warmup, string, string, string, string][] = [
  [
    'a dumbbell ramp',
    dumbbell,
    '/library/goblet-squat',
    '5 reps at 8 kg per dumbbell',
    '5 répétitions à 8 kg par haltère',
    '每只哑铃 8 kg做5 次',
  ],
  [
    'a barbell ramp (total load, decimal)',
    barbell,
    '/library/barbell-romanian-deadlift',
    '8 reps at 7.75 kg total',
    '8 répétitions à 7,75 kg au total',
    '杠铃总重 7.75 kg做8 次',
  ],
  [
    'a per-side ramp',
    perSide,
    '/library/bulgarian-split-squat',
    '5 reps at 6 kg per dumbbell per side',
    '5 répétitions à 6 kg par haltère par côté',
    '每侧每只哑铃 6 kg做5 次',
  ],
]

async function renderRow(locale: Locale, warmup: Warmup, href: string): Promise<HTMLElement> {
  await i18n.changeLanguage(locale)
  render(
    <MemoryRouter>
      <WarmupSection warmup={warmup} />
    </MemoryRouter>,
  )
  const link = screen.getAllByRole('link').find((a) => a.getAttribute('href') === href)
  if (!link) throw new Error(`no row linking to ${href}`)
  return link
}

const sentenceFor = (locale: Locale, row: (typeof cases)[number]) =>
  locale === 'en' ? row[3] : locale === 'fr' ? row[4] : row[5]

describe.each(['en', 'fr', 'zh-CN'] as const)('WarmupSection ramp rows, spoken — %s', (locale) => {
  it.each(cases)("the link's name carries the sentence: %s", async (...row) => {
    const [, warmup, href] = row
    await renderRow(locale, warmup, href)
    const sentence = sentenceFor(locale, row)
    expect(screen.getByRole('link', { name: new RegExp(escape(sentence)) })).toHaveAttribute('href', href)
  })

  it.each(cases)('hears no glyph from the row: %s', async (...row) => {
    const [, warmup, href] = row
    const link = await renderRow(locale, warmup, href)
    expect(heard(link)).not.toMatch(GLYPHS)
    expect(heard(link)).toContain(sentenceFor(locale, row))
  })

  it.each(cases)('the visible line is unchanged and hidden from assistive technology: %s', async (...row) => {
    const [, warmup, href] = row
    const link = await renderRow(locale, warmup, href)
    const visible = link.querySelector('p[data-numeric]')
    expect(visible).not.toBeNull()
    expect(visible).toHaveAttribute('aria-hidden', 'true')
    // The glyph line is still there for the eye, whatever the language.
    expect(visible?.textContent).toMatch(/[×]/)
  })
})

describe('WarmupSection ramp rows — the visible English line is untouched', () => {
  it('still prints "8 kg per dumbbell × 5" and "6 kg per dumbbell × 5 /side"', async () => {
    await renderRow('en', dumbbell, '/library/goblet-squat')
    expect(screen.getByText('8 kg per dumbbell × 5')).toBeInTheDocument()
  })

  it('still prints the per-side suffix', async () => {
    await renderRow('en', perSide, '/library/bulgarian-split-squat')
    expect(screen.getByText('6 kg per dumbbell × 5 /side')).toBeInTheDocument()
  })
})
