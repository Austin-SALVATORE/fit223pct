import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { seedDatabase } from '@/data/seed'
import { ExercisePage } from './ExercisePage'

/**
 * Contextual back navigation: Back always returns to the user's actual
 * origin. Direct URLs (or lost state, e.g. after visiting from outside the
 * app) fall back safely to Today — never to a hard-coded Library parent.
 *
 * Initial-render-with-state also models a refresh on the detail page:
 * browsers persist history state across reloads.
 */

beforeAll(async () => {
  await seedDatabase()
})

function renderDetail(state?: unknown) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: '/library/goblet-squat', state }]}
    >
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/library" element={<p>LIBRARY PROBE</p>} />
        <Route path="/workout" element={<p>WORKOUT PROBE</p>} />
        <Route path="/library/:exerciseId" element={<ExercisePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ExercisePage contextual back', () => {
  it('falls back to Today on a direct URL with no origin state', async () => {
    renderDetail()
    const back = await screen.findByRole('link', { name: /Today/ })
    await userEvent.click(back)
    expect(await screen.findByText('TODAY PROBE')).toBeInTheDocument()
  })

  it('returns to Library when opened from Library', async () => {
    renderDetail({ from: 'library' })
    const back = await screen.findByRole('link', { name: /Library/ })
    await userEvent.click(back)
    expect(await screen.findByText('LIBRARY PROBE')).toBeInTheDocument()
  })

  it('returns directly to Today when opened from Today — never via Library', async () => {
    renderDetail({ from: 'today' })
    const back = await screen.findByRole('link', { name: /Today/ })
    await userEvent.click(back)
    expect(await screen.findByText('TODAY PROBE')).toBeInTheDocument()
  })

  it('returns to the active workout when opened from Workout', async () => {
    renderDetail({ from: 'workout' })
    const back = await screen.findByRole('link', { name: /Workout/ })
    await userEvent.click(back)
    expect(await screen.findByText('WORKOUT PROBE')).toBeInTheDocument()
  })

  it('treats unknown origin state as a direct visit (Today fallback)', async () => {
    renderDetail({ from: 'https://evil.example/deep-link' })
    expect(await screen.findByRole('link', { name: /Today/ })).toBeInTheDocument()
  })

  it('preserves the origin when following a substitution link', async () => {
    renderDetail({ from: 'workout' })
    const substitution = await screen.findByRole('link', { name: 'Split squat' })
    await userEvent.click(substitution)
    // Still on a detail page, back still points at the workout
    expect(await screen.findByRole('heading', { name: 'Split squat' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Workout/ })).toBeInTheDocument()
  })
})
