import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { seedDatabase } from '@/data/seed'
import { LibraryPage } from './LibraryPage'

/**
 * A12 (docs/review-backlog.md — re-measured 30 Jul, "STILL OPEN"): each
 * muscle-group section named itself twice — once via a hand-authored
 * `aria-label={groupLabel}` on the `<section>`, and again via its own
 * `<h2>{groupLabel}</h2>`. Two independently authored copies of one
 * string. Fix follows the shipped `MeasurementCard` precedent:
 * `aria-labelledby` pointing at the section's own heading.
 *
 * Modelled directly on `MeasurementCard.test.tsx`'s own precedent test
 * ("takes its accessible name from its own visible heading") and
 * `ProgressPage.regionNaming.test.tsx`'s sibling for the same finding.
 */

beforeAll(async () => {
  await seedDatabase()
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/library']}>
      <Routes>
        <Route path="/library" element={<LibraryPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LibraryPage — group regions are named by their own heading, not a duplicated string (A12)', () => {
  it.each([['Lower body'], ['Push'], ['Pull'], ['Core']])(
    'the %s group region has no separate aria-label — it is named by its own heading',
    async (label) => {
      renderPage()
      const region = await screen.findByRole('region', { name: label })
      const heading = screen.getByRole('heading', { level: 2, name: label })
      expect(region).not.toHaveAttribute('aria-label')
      expect(region).toHaveAttribute('aria-labelledby', heading.id)
    },
  )
})
