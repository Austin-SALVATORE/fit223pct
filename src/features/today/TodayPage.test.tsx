import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { TodayPage } from './TodayPage'
import { ExercisePage } from '@/features/library/ExercisePage'
import { LibraryPage } from '@/features/library/LibraryPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

/**
 * Entry-path regressions: Today → detail → Today, Library → detail →
 * Library. Time is frozen to a scheduled training day so the Today screen
 * is deterministic regardless of when the suite runs.
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 22, 9, 0, 0) })
  await seedDatabase()
})

afterAll(async () => {
  vi.useRealTimers()
  await db.checkins.clear()
})

function renderApp(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/library/:exerciseId" element={<ExercisePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Today entry path', () => {
  it('round-trips Today → exercise detail → Today without passing through Library', async () => {
    renderApp('/')
    // Wednesday 22 Jul is a training day — session A is offered
    expect(await screen.findByRole('button', { name: 'Start session' })).toBeInTheDocument()

    await userEvent.click(await screen.findByRole('link', { name: /Goblet squat/ }))
    expect(await screen.findByRole('heading', { name: 'Goblet squat' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: /Today/ }))
    expect(await screen.findByRole('button', { name: 'Start session' })).toBeInTheDocument()
  })
})

describe('Readiness flowing into the plan', () => {
  it('adjusts the training day after a low readiness check-in', async () => {
    renderApp('/')
    expect(await screen.findByRole('button', { name: 'Start session' })).toBeInTheDocument()

    for (const label of ['Sleep', 'Energy', 'Freshness', 'Calm', 'Motivation']) {
      await userEvent.click(await screen.findByRole('button', { name: `${label}: 2` }))
    }

    // Card collapses into the easier phrase, hero eases, accessory volume trims
    expect(await screen.findByText(/touch easier/i)).toBeInTheDocument()
    expect(await screen.findByText(/Eased back a touch/)).toBeInTheDocument()
    expect(await screen.findByText(/1 × 15–20/)).toBeInTheDocument()

    // The canonical label and the concrete reasons appear next to the numbers
    expect(await screen.findByText('Adjusted for readiness')).toBeInTheDocument()
    expect(
      await screen.findByText(/One set less on the small stuff/),
    ).toBeInTheDocument()
  })

  it('locks the check-in card once a session is already in progress today', async () => {
    await db.workouts.put({
      id: 'active-today',
      programId: seedProgram.id,
      sessionTemplateId: 'A',
      date: '2026-07-22',
      startedAt: '2026-07-22T09:00:00.000Z',
      completedAt: null,
      exercises: [],
    })

    renderApp('/')
    expect(await screen.findByRole('link', { name: 'Resume session' })).toBeInTheDocument()

    // Locked: no Edit affordance, and tapping a rating does nothing
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull()
    expect(screen.getByText('Locked')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Sleep: 4' }),
    ).toBeNull()

    await db.workouts.delete('active-today')
  })
})

describe('Settings entry', () => {
  it('round-trips Today → Settings → Today', async () => {
    renderApp('/')
    await userEvent.click(await screen.findByRole('link', { name: 'Settings' }))
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: /Today/ }))
    expect(await screen.findByRole('button', { name: 'Start session' })).toBeInTheDocument()
  })
})

describe('Library entry path', () => {
  it('round-trips Library → exercise detail → Library', async () => {
    renderApp('/library')
    await userEvent.click(await screen.findByRole('link', { name: /^Romanian deadlift/ }))
    expect(
      await screen.findByRole('heading', { name: 'Romanian deadlift' }),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: /Library/ }))
    expect(await screen.findByRole('heading', { name: 'Exercises' })).toBeInTheDocument()
  })

  it('renders its grouped lists inside the clipped grouped-list container', async () => {
    renderApp('/library')
    const lists = await screen.findAllByRole('list')
    const grouped = lists.filter((l) => l.className.includes('overflow-hidden'))
    expect(grouped.length).toBeGreaterThan(0)
  })
})
