import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { seedDatabase } from '@/data/seed'
import { TodayPage } from './TodayPage'
import { ExercisePage } from '@/features/library/ExercisePage'
import { LibraryPage } from '@/features/library/LibraryPage'

/**
 * Entry-path regressions: Today → detail → Today, Library → detail →
 * Library. Time is frozen to a scheduled training day so the Today screen
 * is deterministic regardless of when the suite runs.
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 22, 9, 0, 0) })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

function renderApp(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/library/:exerciseId" element={<ExercisePage />} />
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
