import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { seedDatabase } from '@/data/seed'
import { ProgressPage } from './ProgressPage'

/**
 * A12 (docs/review-backlog.md — re-measured 30 Jul, "STILL OPEN"):
 * each top-level section named itself twice — once via a hand-authored
 * `aria-label={t('...sectionLabel')}` on the `<section>`, and again via
 * its own `<h2>` calling the exact same `t()`. Two independently
 * authored copies of the same string, exactly the drift class this repo
 * has hit before (`MeasurementCard`'s region/heading text disagreeing —
 * see its own test's docblock). Precedent shipped fix, this file
 * follows it: `aria-labelledby` pointing at the section's own heading,
 * so there is one authored string, not two kept in sync by hand.
 *
 * Modelled directly on `MeasurementCard.test.tsx`'s own precedent test
 * ("takes its accessible name from its own visible heading").
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 20, 9, 0, 0) })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/progress']}>
      <Routes>
        <Route path="/progress" element={<ProgressPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProgressPage — regions are named by their own heading, not a duplicated string (A12)', () => {
  it.each([
    ['Consistency', 'consistency'],
    ['Strength', 'strength'],
    ['Waist', 'waist'],
  ])('the %s region has no separate aria-label — it is named by its own heading', async (label) => {
    renderPage()
    const region = await screen.findByRole('region', { name: label })
    const heading = screen.getByRole('heading', { level: 2, name: label })
    expect(region).not.toHaveAttribute('aria-label')
    expect(region).toHaveAttribute('aria-labelledby', heading.id)
  })
})
