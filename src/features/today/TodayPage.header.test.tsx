import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { seedDatabase } from '@/data/seed'
import { TodayPage } from './TodayPage'

/**
 * **Today's header wraps instead of running off the screen** (batch S1, item 3).
 * In French the header is "dimanche 1 novembre" plus the three links ("Plan",
 * "Progression", "Bibliothèque", 214px) plus the 16px Settings icon. "dimanche"
 * is the widest word and cannot break, so the row needed 332px in a 280px header
 * at 320px and the Settings link, whose 44px touch target bleeds 14px past the
 * header on purpose, ended 47px past the screen; at 360px, 6px.
 *
 * The fix is three class tokens, and each has a job:
 *   - the header is `flex-wrap`, so the nav can drop to a second row;
 *   - the date is `flex-1` **without `min-w-0`**. `flex-1` gives it a zero flex
 *     basis, so its size for the purpose of "does the nav fit beside it" is its
 *     longest word, and the nav wraps only when it genuinely cannot sit there.
 *     That is why English and Chinese, which fit, do not move. `min-w-0` would
 *     clamp that size to 0, the wrap would never trigger, and the nav would
 *     overlap the date (this was the first attempt; see the controls);
 *   - the nav group is `ml-auto`, so on its own row it stays at the right edge,
 *     where the gear is on every other page.
 *
 * **What this test can and cannot see.** jsdom has no layout. It sees those
 * three tokens and the order of the children, and nothing about whether a row
 * wraps, how wide anything is, or whether the page scrolls sideways. **The
 * browser numbers are the evidence**, Chromium 151.0.7922.34 (playwright-core
 * 1.62.1), headless, touch emulation, `isMobile`, deviceScaleFactor 2, first
 * launch, clock set to a Sunday, "overflow" being `scrollWidth` minus the
 * *configured* width (`innerWidth` grows with the content under `isMobile` and
 * reads 0 for a page that does scroll). "Header extent" is the right-most edge of
 * anything inside `<header>`, including the gear's 44px target and every text
 * range, so the header's own overflow is separable from the rest of the page.
 *
 *   French, Sunday 1 Nov   header extent, before -> after   page overflow, before -> after
 *   320                    366.1 -> 314                     47px -> 27px (all of it the Hero, below)
 *   360                    366.1 -> 354                     6px -> 0
 *   375                    369 -> 369                       0 -> 0
 *   (Sunday 29 Nov and Wednesday 28 Oct in French follow the same pattern.)
 *   Header height, French: 56px (date on three lines) -> 42px at 320 and 360 (date on one
 *   line, nav under it, right-aligned); 56px at 375, unchanged.
 *   English and Chinese, Sundays 1 and 29 Nov, 320 / 360 / 375: every row identical before
 *   and after. One English row changed, on purpose-by-consequence: Wednesday 28 Oct at 320
 *   ("Wednesday 28 October", the longest English date) had the date on three lines and the
 *   gear's target ending 0.1px inside the screen; it now wraps the nav under a one-line
 *   date (header 56px -> 42px).
 *   Rows with any header extent past the viewport, 27 cases (3 days x 3 languages x 3
 *   widths): 6 before, 0 after.
 *
 * **Not fixed here, found while measuring:** at 320px on a French Sunday the page still
 * scrolls 27px, and it is not the header (header extent 314). The Hero's `h1` is "Sortie
 * dédiée et bilan hebdomadaire" at `text-5xl`, and "hebdomadaire" alone is 327px wide, so
 * the title overflows any viewport narrower than ~347px (measured 330: 348, 340: 347, 360:
 * clean). It is a typography choice for the owner's design, so it is reported, not changed.
 *
 * Negative controls, run 30 Oct (mutation applied to `TodayPage.tsx`, this file run,
 * restored, `cmp` clean). jsdom, red tests named:
 *   `flex-wrap` removed from the header       -> "the header may wrap"
 *   `flex-1` removed from the date            -> "the header may wrap"
 *   `min-w-0` added to the date (the mistake) -> "the header may wrap"
 *   `ml-auto` removed from the nav group      -> "the nav and the Settings link"
 * Browser, the mistake itself: with `min-w-0` on the date nothing wrapped. French at 320 the
 * nav sat on the date's row at x 57.8..272 over a date ending at 101.9 (a 44px overlap,
 * header still 56px) and the page still scrolled 27px; at 360 the nav started at 97.8
 * against a date ending at 101.9 (4px). The page-overflow number alone had improved, so it
 * looked like progress; only the rects showed the overlap, which is why the test names it.
 */

const SUNDAY = new Date(2026, 10, 1, 10, 0, 0) // Sunday 1 November 2026

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: SUNDAY })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

async function renderHeader() {
  const { container } = render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<TodayPage />} />
      </Routes>
    </MemoryRouter>,
  )
  await waitFor(() => expect(container.querySelector('header time')).not.toBeNull())
  const header = container.querySelector('header') as HTMLElement
  const date = header.querySelector('time')?.parentElement as HTMLElement
  const nav = header.querySelector('nav') as HTMLElement
  const settings = header.querySelector('a[href="/settings"]') as HTMLElement
  return { header, date, nav, group: nav.parentElement as HTMLElement, settings }
}

describe('Today header — the date and the links share a row until they cannot', () => {
  it('the header may wrap, and the date is the item that gives way (flex-1, and never min-w-0)', async () => {
    const { header, date } = await renderHeader()

    expect(header.className).toMatch(/\bflex-wrap\b/)
    // flex-1: a zero basis, so the date counts as its longest word when deciding whether the links fit beside it.
    expect(date.className).toMatch(/\bflex-1\b/)
    // min-w-0 would clamp that to 0, the wrap would never trigger, and the links would overlap the date.
    expect(date.className).not.toMatch(/\bmin-w-0\b/)
  })

  it('the nav and the Settings link stay together, pushed to the end of whichever row they land on', async () => {
    const { header, group, nav, settings } = await renderHeader()

    expect(group.contains(nav)).toBe(true)
    expect(group.contains(settings)).toBe(true)
    expect(group.className).toMatch(/\bml-auto\b/)
    // The date first, the group second: the order is what puts the links under the date when they wrap.
    expect([...header.children].map((el) => el.tagName)).toEqual(['P', 'DIV'])
  })
})
