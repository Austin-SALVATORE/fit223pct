import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import i18n from '@/i18n/i18next'
import type { Trend } from '@/domain/trends'
import { heard } from '@/test/heard'
import { WaistCard } from './WaistCard'

/**
 * Backlog A14 leftover (batch A3), site 2: the waist card's range line. Printed, it is
 * "84 cm on 2026-09-14 → 82.5 cm on 2026-10-26": the arrow is voiced as "right arrow" or
 * skipped, and it is the only thing saying the second reading came after the first. It
 * stays on screen, hidden from assistive technology, with the sentence beside it: "From
 * 84 cm on 2026-09-14 to 82.5 cm on 2026-10-26".
 *
 * The dates are spoken exactly as the line prints them (ISO, "2026-09-14"): formatting a date
 * for speech is a separate piece of work, and spoken and printed agree this way. The values go
 * through the same `formatValue` as the printed line (French "82,5 cm").
 *
 * The card's first line, "82.5 cm — trending down", has an em dash and is not in this batch;
 * it is left exactly as it was, and a test says so.
 *
 * Negative controls, run 30 Oct (mutation applied to `WaistCard.tsx`, this file run, restored
 * from a saved copy, `cmp` clean):
 *   `aria-hidden` removed from the range line         -> 3 red: "hears none of the glyphs", one per language
 *                                                        (the sentence test stays GREEN: the sentence is still there beside the arrow)
 *   the `sr-only` sentence removed                    -> 6 red: the sentence test and the glyph test, three languages each
 *   the spoken line given the printed key             -> 6 red: the same six (the arrow is back in the sentence)
 *   the first line hidden along with it              -> 1 red: "the first line is left exactly as it was"
 */

type Locale = 'en' | 'fr' | 'zh-CN'

const trend: Trend = {
  status: 'decreasing',
  evidence: [
    { date: '2026-09-14', value: 84 },
    { date: '2026-09-28', value: 83.5 },
    { date: '2026-10-26', value: 82.5 },
  ],
  unit: 'cm',
}

afterEach(async () => {
  await i18n.changeLanguage('en')
})

const rows: [Locale, string, string][] = [
  ['en', '84 cm on 2026-09-14 → 82.5 cm on 2026-10-26', 'From 84 cm on 2026-09-14 to 82.5 cm on 2026-10-26'],
  ['fr', '84 cm le 2026-09-14 → 82,5 cm le 2026-10-26', 'De 84 cm le 2026-09-14 à 82,5 cm le 2026-10-26'],
  ['zh-CN', '2026-09-14：84 cm → 2026-10-26：82.5 cm', '从2026-09-14的84 cm到2026-10-26的82.5 cm'],
]

describe.each(rows)('WaistCard range line, spoken — %s', (locale, visible, spoken) => {
  it('is heard as a sentence, from the first reading to the last', async () => {
    await i18n.changeLanguage(locale)
    render(<WaistCard trend={trend} />)
    const line = screen.getByText(visible)
    expect(heard(line.nextElementSibling as HTMLElement)).toBe(spoken)
  })

  it('hears none of the glyphs; the printed line is kept and hidden', async () => {
    await i18n.changeLanguage(locale)
    const { container } = render(<WaistCard trend={trend} />)
    const line = screen.getByText(visible)
    expect(line).toHaveAttribute('aria-hidden', 'true')
    expect(heard(container)).not.toContain('→')
    expect(heard(container)).toContain(spoken)
  })
})

describe('WaistCard — what is left alone', () => {
  it('the first line ("82.5 cm — trending down") is not hidden and has no sibling', () => {
    render(<WaistCard trend={trend} />)
    const first = screen.getByText(/^82\.5 cm — /)
    expect(first).not.toHaveAttribute('aria-hidden')
    expect(first.nextElementSibling?.className ?? '').not.toContain('sr-only')
  })

  it('not enough data: the card is the reason alone, with no range line and no sibling', () => {
    const { container } = render(
      <WaistCard trend={{ status: 'insufficient-data', reason: { key: 'domain:trends.needMoreWaistData' } }} />,
    )
    expect(container.querySelector('.sr-only, [aria-hidden]')).toBeNull()
  })
})
