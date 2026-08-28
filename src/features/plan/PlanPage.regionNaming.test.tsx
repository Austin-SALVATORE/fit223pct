import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import { seedDatabase } from '@/data/seed'
import { PlanPage } from './PlanPage'

/**
 * A12 (docs/review-backlog.md — re-measured 30 Jul, "STILL OPEN"): each
 * week's wrapping `<section>` carried its own `aria-label={weekLabel}`
 * while the `GroupedList` it wraps (`<ul aria-label={weekLabel}>`) is
 * already named the same thing — a second, redundant named landmark
 * with no heading of its own to point `aria-labelledby` at (unlike the
 * ProgressPage/LibraryPage sibling fixes for the same finding). The
 * suggested fix text offers a second option for exactly this shape:
 * "Use aria-labelledby or drop the section label" — here there's
 * nothing to labelledby, so the section's own aria-label is dropped;
 * the list stays the sole named element for the week's content.
 */

beforeAll(async () => {
  // Monday 27 Jul — mid-phase, matches PlanPage.test.tsx's own fixture.
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 27, 9, 0, 0) })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/plan']}>
      <Routes>
        <Route path="/plan" element={<PlanPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PlanPage — a week is named once, by its list, not twice by a redundant wrapping region (A12)', () => {
  it('the week list is named "Week of …", and no region duplicates that name', async () => {
    renderPage()
    expect((await screen.findAllByRole('list', { name: /^Week of / })).length).toBeGreaterThan(0)
    expect(screen.queryAllByRole('region', { name: /^Week of / })).toHaveLength(0)
  })
})
