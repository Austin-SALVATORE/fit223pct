import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { programRepo } from '@/data/repositories'
import { seedProgram } from '@/data/seed/program'
import { TodayPage } from './TodayPage'

/**
 * ~/.claude/plans/final-rest-day-lookahead.md — a phase's own final rest
 * days (no training weekday left on or before its own endDate) preview
 * the successor program's opening session when one exists and is usable
 * (Phase 1b), or fall back to display-only content with no session
 * preview and no start button when it doesn't (Phase 1a). phase-1-home
 * ends Sunday 9 Aug 2026; Friday 7 Aug (weekday 5) is its last training
 * day; mesocycle-2-build starts Monday 10 Aug.
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

describe('Phase 1b — the successor-program preview, against the real seed', () => {
  it('G3: Saturday 8 Aug previews Mesocycle 2\'s own opening roster, never phase-1-home\'s', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 8, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    expect(await screen.findByText(/First up in Mesocycle 2/)).toBeInTheDocument()
    expect(screen.getByText('Chest-supported dumbbell row')).toBeInTheDocument()
    // The true discriminator: this exercise is in phase-1-home's own
    // Monday session and not in mesocycle 2's — its absence proves the
    // preview genuinely switched rosters rather than coincidentally
    // showing shared exercise names.
    expect(screen.queryByText('Dumbbell bench press')).toBeNull()
  })

  it('reuses plannedDay.startsIn for the timing, not new copy', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 8, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    expect(await screen.findByText('Starts in 2 days')).toBeInTheDocument()
  })

  it('offers no start button across the phase boundary (owner ruling, amendment A1)', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 8, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    await screen.findByText(/First up in Mesocycle 2/)
    expect(screen.queryByRole('button', { name: /Start this session now/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Start session' })).toBeNull()
  })

  it('keeps the current program\'s own activity alongside the successor preview', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 8, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    // Saturday's own recovery-shaped ride (phase-1-home's own content,
    // corrected 6 Aug) — independent of what's being previewed as next.
    expect(await screen.findByText('Zone 2 ride', { selector: 'span' })).toBeInTheDocument()
  })

  it('Sunday 9 Aug previews the same successor session, and keeps its own weekly checkpoint', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 9, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Weekly checkpoint' })).toBeInTheDocument()
    expect(await screen.findByText(/First up in Mesocycle 2/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Start this session now/ })).toBeNull()
  })
})

describe('Phase 1a — the bare fallback when no successor exists', () => {
  it('Saturday 8 Aug: no successor program at all — no preview, no start button, day\'s own activity survives', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 8, 9, 0, 0) })
    await seedDatabase()
    await db.programs.delete('mesocycle-2-build')
    renderApp()

    expect(await screen.findByText('Zone 2 ride', { selector: 'span' })).toBeInTheDocument()
    expect(screen.queryByText(/First up/)).toBeNull()
    expect(screen.queryByRole('button', { name: /Start this session now/ })).toBeNull()
  })

  /**
   * §8's own admission: this copy path is unreachable with the real
   * seed — every seeded program authors activity content on every
   * remaining weekday, so the bare Hero variant of the null branch never
   * renders in production. A guard that cannot fail is worse than none,
   * so this uses a fully synthetic program: no successor, and no
   * activity for the weekday either.
   */
  it('phaseEndingSubtitle: a genuinely bare final rest day, no activity and no successor', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 8, 9, 0, 0) })
    await seedDatabase()
    await db.programs.delete('mesocycle-2-build')
    await programRepo.put({
      ...seedProgram,
      origin: 'imported',
      weekdayActivities: undefined,
    })
    renderApp()

    expect(
      await screen.findByText('This phase is winding down. Your next program will appear here once it begins.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/First up/)).toBeNull()
    expect(screen.queryByRole('button', { name: /Start this session now/ })).toBeNull()
  })
})

describe('anti-over-clamp — ordinary rest/training days are unaffected', () => {
  it('Thursday 6 Aug (mid-program rest) still previews Friday\'s session', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 6, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    expect(await screen.findByText('Next up')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start this session now/ })).toBeInTheDocument()
  })

  it('Friday 7 Aug itself, the last training day, is unaffected', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 7, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    expect(await screen.findByRole('button', { name: 'Start session' })).toBeInTheDocument()
  })
})
