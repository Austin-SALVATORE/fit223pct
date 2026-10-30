import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import i18n from '@/i18n/i18next'
import { TodayPage } from './TodayPage'

/**
 * The Today heading drops from 48px to 40px below a 360px viewport, so French
 * Sunday's "Sortie dédiée et bilan hebdomadaire" no longer pushes the page 27px
 * sideways at 320px ("hebdomadaire" is 327px wide at 48px in a 280px column).
 *
 * jsdom has no layout, so this pins the CLASSES, not the pixels. The pixels were
 * measured in a real browser on 30 Oct (Chromium and WebKit, fr/en/zh at 320, 360
 * and 375, Sunday 1 Nov): 320px fr scrolled 27px before and 0px after; 360 and
 * 375 were byte-identical before and after (48px, same line breaks, same widest
 * line). Both heroes that carry a page title are checked, because the class is
 * shared and a third `h1` written by hand would silently miss it.
 *
 * Negative controls, run 30 Oct, each seen red and restored:
 * - the shared class reduced to `text-display mt-2 text-5xl text-ink` (the
 *   pre-fix class): both tests red, naming the missing `text-[2.5rem]`;
 * - only the activity hero's `h1` put back to a literal `text-5xl`: only the
 *   Sunday test red, the training-day test green (so the two do not mask each
 *   other).
 *
 * What it cannot see: that 40px actually fits (that is a measurement, above, and
 * it does not move if a longer word is added to a title); that Tailwind emitted
 * the arbitrary-variant rule (the build's CSS was checked once, not here); and
 * the `SessionSummary` heading, which is a separate `h1` with its own class.
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 1, 9, 0, 0) })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

afterEach(async () => {
  await db.workouts.clear()
  await i18n.changeLanguage('en')
})

function renderToday() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<TodayPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const FROM_360 = 'min-[360px]:text-5xl'
const BELOW_360 = 'text-[2.5rem]'

describe('the Today heading steps down below 360px', () => {
  it('on the activity day (Sunday), in French, where the long word lives', async () => {
    vi.setSystemTime(new Date(2026, 10, 1, 9, 0, 0)) // Sunday 1 Nov
    await i18n.changeLanguage('fr')
    renderToday()
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Sortie dédiée et bilan hebdomadaire' })
    expect(h1.className).toContain(BELOW_360)
    expect(h1.className).toContain(FROM_360)
    expect(h1.className).not.toMatch(/(^|\s)text-5xl(\s|$)/)
  })

  it('on a training day (Monday), whose heading is a session focus', async () => {
    vi.setSystemTime(new Date(2026, 10, 2, 9, 0, 0)) // Monday 2 Nov
    renderToday()
    const h1 = await screen.findByRole('heading', { level: 1 })
    expect(h1.className).toContain(BELOW_360)
    expect(h1.className).toContain(FROM_360)
    expect(h1.className).not.toMatch(/(^|\s)text-5xl(\s|$)/)
  })
})
