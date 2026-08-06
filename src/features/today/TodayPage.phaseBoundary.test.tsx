import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { TodayPage } from './TodayPage'

/**
 * ~/.claude/plans/final-rest-day-lookahead.md — a phase's own final rest
 * days (no training weekday left on or before its own endDate) offer
 * nothing to start, honestly, rather than borrowing the next program's
 * opening session. phase-1-home ends Sunday 9 Aug 2026; Friday 7 Aug
 * (weekday 5) is its last training day.
 */

afterEach(async () => {
  vi.useRealTimers()
  await db.checkins.clear()
})

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<TodayPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Phase 1a — the bare fallback on a phase\'s own final rest days', () => {
  it('offers no session preview and no start button on Saturday 8 Aug, but keeps the day\'s own activity', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 8, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    // The day's own authored content (Zone 2 ride, "choose one"/"complete
    // rest") survives — this is display-only content independent of
    // whether there's a "next session" to preview.
    expect(await screen.findByText('Zone 2 ride', { selector: 'span' })).toBeInTheDocument()

    expect(screen.queryByText('Next up')).toBeNull()
    expect(screen.queryByRole('button', { name: /Start this session now/ })).toBeNull()
  })

  it('offers no session preview and no start button on Sunday 9 Aug either', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 9, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Weekly checkpoint' })).toBeInTheDocument()
    expect(screen.queryByText('Next up')).toBeNull()
    expect(screen.queryByRole('button', { name: /Start this session now/ })).toBeNull()
  })

  it('anti-over-clamp: Thursday 6 Aug (mid-program rest) still previews Friday\'s session', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 6, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    expect(await screen.findByText('Next up')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start this session now/ })).toBeInTheDocument()
  })

  it('anti-over-clamp: Friday 7 Aug itself, the last training day, is unaffected', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 7, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    expect(await screen.findByRole('button', { name: 'Start session' })).toBeInTheDocument()
  })
})
