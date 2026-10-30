import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { seedDatabase } from '@/data/seed'
import i18n from '@/i18n/i18next'
import type { WeeklyReview } from '@/domain/weeklyReview'
import { WeeklyReviewCard } from './WeeklyReviewCard'

/**
 * Backlog I6 (batch A1), the weekly review's half. The volume tile printed an
 * English "k" and a dot decimal in every language. This pins that the card
 * formats with the language the app is in, by rendering the same review in each
 * of the three. `formatVolume.test.ts` pins the strings themselves; this is the
 * only thing that sees a call site ignoring the active language.
 *
 * **Fit at 320px, and what jsdom can and cannot see.** jsdom has no layout: it
 * sees the strings and the `flex-wrap` token, not whether anything fits. The
 * browser numbers are the evidence. Chromium 151.0.7922.34 (playwright-core
 * 1.62.1), headless, touch, `isMobile`, the real Today page with a week of
 * completed workouts seeded through the app's own domain functions, 3 languages x
 * 3 widths x 4 volumes (850, 12345, 123456, 987654) x this card and the session
 * summary = 72 cases. "Past the edge" is how far the last tile's text runs past the
 * container's inner (padding) edge; "wrapped" is a value broken over two lines.
 *
 *                              before the change      after the format only   after the wrap
 *   cases with a wrapped value   27 of 72               27 of 72                0 of 72
 *   worst past the edge          28px                   33px                    0px
 *   fr 320, card, 123,5 k kg     27.7px (crossed the    32.8px                  0, own row
 *                                card's border by ~7px)
 *   en 320, card, 12.3K kg       3.5px                  6.3px                   0, own row
 *   zh-CN, every case            0                      0                       0
 * So the three-tile row was already too wide at 320px: even "850 kg" wrapped its
 * unit onto a second line in French and English. The format change made it a few px
 * worse (uppercase "K", the space in "12,3 k") and the wrap fixes both. At 360px and
 * above the row is unchanged (one row); the tile moves down only when it must.
 *
 * Negative controls, run 30 Oct (mutation applied to `WeeklyReviewCard.tsx`,
 * this file run, restored, `cmp` clean):
 *   `formatVolume(volumeKg, i18n.language)` -> `formatVolume(volumeKg, 'en')`  -> "fr" and "zh-CN" rows
 *   the card's own `${(v / 1000).toFixed(1)}k` restored                         -> all three rows
 *   `flex-wrap` removed from the stats row                                      -> "the stats row may wrap"
 * Browser, `flex-wrap` removed: see the numbers above, the "after the format only" column.
 */

const review: WeeklyReview = {
  weekStart: '2026-10-19',
  weekEnd: '2026-10-25',
  scheduledCount: 3,
  completedCount: 3,
  totalSets: 38,
  volumeKg: 12345,
  readinessTierCounts: { ready: 2, steady: 1, easier: 0 },
}

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await i18n.changeLanguage('en')
})

/** The volume tile is the last of the card's three stats. */
function volumeText(): string {
  const { container } = render(<WeeklyReviewCard review={review} />)
  const values = container.querySelectorAll('dd')
  return values[values.length - 1].textContent ?? ''
}

describe('WeeklyReviewCard stats row', () => {
  it('may wrap, so a tile that does not fit at 320px moves to the next row whole', () => {
    const { container } = render(<WeeklyReviewCard review={review} />)
    expect(container.querySelector('dl')?.className).toMatch(/\bflex-wrap\b/)
  })
})

describe('WeeklyReviewCard volume follows the language', () => {
  it.each([
    ['en', '12.3K kg'],
    ['fr', '12,3 k kg'],
    ['zh-CN', '1.2万 kg'],
  ])('%s', async (language, expected) => {
    await i18n.changeLanguage(language)
    expect(volumeText()).toBe(expected)
  })
})
