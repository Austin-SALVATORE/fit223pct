import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { seedDatabase } from '@/data/seed'
import i18n from '@/i18n/i18next'
import { PlanPage } from './PlanPage'

/**
 * **A Plan row that holds only an activity title must wrap it, not lose it**
 * (batch S1, item 4). Sunday's title is "Sortie dédiée et bilan hebdomadaire" in
 * French and "Dedicated ride & weekly checkpoint" in English, ~233px wide. The
 * rows live in a `GroupedList`, which is `overflow-hidden`, and the right-hand
 * column was `shrink-0`: a column that does not fit is not squeezed, it is cut
 * off at the card edge, and the date label beside it was squeezed to three lines
 * instead. Two rows show that title: an ordinary Sunday (the activity-only row)
 * and Sunday's own "Today" row (which shows the activity when there is no
 * session). Both are fixed; the date label of the activity-only row keeps its
 * one line.
 *
 * **What this test can and cannot see.** jsdom has no layout: it sees class
 * tokens, nothing about widths or clipping. **The browser numbers are the
 * evidence**, Chromium 151.0.7922.34 (playwright-core 1.62.1), headless, touch
 * emulation, `isMobile`, deviceScaleFactor 2, first launch, the clock set to
 * Friday 30 Oct or Sunday 1 Nov. "Clipped" is the most any child span's right
 * edge passes the card's inner edge (the row's right minus its 16px padding) or
 * the card itself; `scrollWidth` was 0 over the viewport in every case, because
 * the card hides what it clips.
 *
 *   Sunday row, "Sortie dédiée et bilan hebdomadaire" / "Dedicated ride ...":
 *                       clipped before -> after   row height before -> after
 *   fr 320              34.7px -> 0               100px -> 71px
 *   en 320              29.6px -> 0               100px -> 71px
 *   fr / en 360         0 -> 0                    100px -> 71px (the date label was already
 *                                                 squeezed to three lines)
 *   fr / en 375         0 -> 0                    76px -> 71px
 *   zh-CN, all widths   0 -> 0, unchanged
 *   Sunday 1 Nov, the "Today" row (clock on a Sunday):
 *   fr 320 / 360 / 375  88.2 / 48.2 / 33.2px -> 0 / 0 / 0   (row 100px at 320 -> 76px)
 *   en 320 / 360        46.3 / 6.3px -> 0 / 0
 *   Rows with a clipped or touching edge, 9 language-width cases, Sunday clock: 5, 1, 0,
 *   5, 1, 1, 0, 0, 0 before; 0 in all nine after.
 *   Every other row, Friday clock, 3 languages x 3 widths (279 row records): identical
 *   before and after. The only rows that differ are the 24 activity-only Sunday rows
 *   (12 English, 12 French, none Chinese).
 *
 * **A regression found by that last comparison, and why the Today row is conditional.**
 * The first version made the Today row's right column `min-w-0` unconditionally. That
 * moved a row that was never clipped: Friday's French Today row, "Corps entier A / Sortie
 * Zone 2", shares the squeeze when both columns can shrink, so it grew from 76px to 111px
 * at 320px (91px at 360) with the column wrapped to four lines. A column that holds a
 * session name now keeps `shrink-0`; only a column with no session (a bare activity
 * title, "postponed", "rest") is `min-w-0`. The third test pins that, which is the only
 * thing that would have seen it: the row-count and clipping numbers were both clean.
 *
 * Negative controls, run 30 Oct (mutation applied to `PlanPage.tsx`, this file run,
 * restored, `cmp` clean), red tests named:
 *   activity-only title `min-w-0` -> `shrink-0`        -> "an ordinary Sunday row"
 *   activity-only date `shrink-0` removed              -> "an ordinary Sunday row"
 *   Today row's column back to unconditional `shrink-0`-> "Sunday's own Today row"
 *   Today row's column unconditional `min-w-0`         -> "a training day's Today row"
 *                                                         (the regression above)
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 1, 10, 0, 0) })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

/** The date label and the right-hand column of the row whose accessible name matches. */
async function rowColumns(today: Date, name: RegExp) {
  vi.setSystemTime(today)
  render(
    <MemoryRouter initialEntries={['/plan']}>
      <Routes>
        <Route path="/plan" element={<PlanPage />} />
      </Routes>
    </MemoryRouter>,
  )
  const row = await screen.findByRole('link', { name })
  const [label, column] = Array.from(row.children) as HTMLElement[]
  return { label, column }
}

const SUNDAY_1_NOV = new Date(2026, 10, 1, 10, 0, 0)
const FRIDAY_30_OCT = new Date(2026, 9, 30, 10, 0, 0)

describe('Plan rows that hold only an activity title', () => {
  it('an ordinary Sunday row: the title wraps (min-w-0, never shrink-0) and the date keeps its line', async () => {
    const { label, column } = await rowColumns(SUNDAY_1_NOV, /Sun 8 Nov/)

    expect(column).toHaveTextContent('Dedicated ride & weekly checkpoint')
    expect(column.className).toMatch(/\bmin-w-0\b/)
    expect(column.className).not.toMatch(/\bshrink-0\b/)
    expect(column.className).toMatch(/\btext-right\b/)
    expect(label.className).toMatch(/\bshrink-0\b/)
  })

  it("Sunday's own Today row, which shows the same title because it has no session: it wraps too", async () => {
    const { column } = await rowColumns(SUNDAY_1_NOV, /Sun 1 Nov/)

    expect(column).toHaveTextContent('Dedicated ride & weekly checkpoint')
    expect(column.className).toMatch(/\bmin-w-0\b/)
    expect(column.className).not.toMatch(/\bshrink-0\b/)
  })

  it("a training day's Today row keeps its shrink-0 column: that row was never clipped and must not move", async () => {
    const { column } = await rowColumns(FRIDAY_30_OCT, /Fri 30 Oct/)

    expect(column).toHaveTextContent('Full Body A')
    expect(column.className).toMatch(/\bshrink-0\b/)
    expect(column.className).not.toMatch(/\bmin-w-0\b/)
  })
})
