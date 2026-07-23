import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { checkinRepo, programRepo } from '@/data/repositories'
import { TodayPage } from './TodayPage'

/**
 * Milestone 6 — Daily Program. Tuesday (weekday 2) is a rest day for
 * seedProgram (Mon/Wed/Fri) and also its startDate, so time is frozen there.
 */

// origin: 'imported' — these are synthetic activity fixtures, not the real
// seed's own Tuesday content, so they must render verbatim rather than
// resolve through the seed's locale keys for weekday 2 (see
// i18n/seedProgram.ts's useLocalizedActivity: content is keyed by weekday
// number alone, so any non-imported override for a real seed weekday would
// otherwise be shadowed by the real seed translation for that same day).
const recoveryProgram = {
  ...seedProgram,
  origin: 'imported' as const,
  weekdayActivities: {
    2: {
      kind: 'recovery' as const,
      title: 'Recovery walk & stretch',
      items: [
        { label: '30-minute easy walk', detail: 'conversational pace' },
        { label: 'Hip flexor stretch — 45s per side' },
      ],
    },
  },
}

const checkpointProgram = {
  ...seedProgram,
  origin: 'imported' as const,
  weekdayActivities: {
    2: {
      kind: 'checkpoint' as const,
      title: 'Weekly checkpoint',
      items: [{ label: 'Weight and waist measurement' }],
    },
  },
}

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 21, 9, 0, 0) })
  await seedDatabase()
})

afterEach(async () => {
  await db.checkins.clear()
  await programRepo.put(seedProgram) // restore the plain program between tests
})

afterAll(() => {
  vi.useRealTimers()
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

describe('Today on an activity day', () => {
  it('replaces the bare rest hero with the activity, keeping check-in and next-session preview', async () => {
    await programRepo.put(recoveryProgram)
    renderApp()

    expect(await screen.findByText('Recovery')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Recovery walk & stretch' })).toBeInTheDocument()
    expect(screen.getByText('30-minute easy walk')).toBeInTheDocument()
    expect(screen.getByText(/conversational pace/)).toBeInTheDocument()
    expect(screen.getByText('Hip flexor stretch — 45s per side')).toBeInTheDocument()

    // Everything else on an unscheduled day still remains.
    expect(await screen.findByRole('heading', { name: "Today's readiness" })).toBeInTheDocument()
    expect(screen.getByText('Next up')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start this session now' })).toBeInTheDocument()

    // No completion affordance anywhere — the deepest product invariant.
    expect(screen.queryByText(/mark complete/i)).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('shows the plain rest hero unchanged when the program has no activity for the weekday', async () => {
    // The seed program now ships with activity days (22 Jul revision), so
    // the bare-rest state needs a program that genuinely has none.
    await programRepo.put({ ...seedProgram, weekdayActivities: undefined })
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Recovery is progress' })).toBeInTheDocument()
  })
})

describe('Today on a checkpoint day', () => {
  it('surfaces weight and waist input that writes to the check-in', async () => {
    await programRepo.put(checkpointProgram)
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Weekly checkpoint' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Weight & waist' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    await userEvent.click(screen.getByRole('button', { name: 'Increase Waist' }))

    const stored = await checkinRepo.getByDate('2026-07-21')
    expect(stored?.weightKg).toBe(70.1)
    expect(stored?.waistCm).toBe(80.5)
  })

  it('omits the measurement card on a non-checkpoint activity day', async () => {
    await programRepo.put(recoveryProgram)
    renderApp()
    await screen.findByRole('heading', { name: 'Recovery walk & stretch' })
    expect(screen.queryByRole('heading', { name: 'Weight & waist' })).toBeNull()
  })
})
