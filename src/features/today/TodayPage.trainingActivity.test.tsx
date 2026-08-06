import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { programRepo } from '@/data/repositories'
import { TodayPage } from './TodayPage'

/**
 * docs/design/ActivityPrescriptionPhaseA.md §1/§2/§4 — a training day may
 * now carry its own weekday activity (post-strength cardio, display only)
 * and the program-level morning activation, alongside the session it
 * already offers. Wednesday (weekday 3) is a training day for seedProgram
 * (Mon/Wed/Fri).
 */

// origin: 'imported' — synthetic fixtures, not the real seed's own content,
// same reasoning as TodayPage.activity.test.tsx's fixture comment.
const rideProgram = {
  ...seedProgram,
  origin: 'imported' as const,
  weekdayActivities: {
    3: {
      kind: 'recovery' as const,
      title: 'Zone 2 ride',
      items: [{ label: 'Zone 2 ride', detail: '30 min, after lifting' }],
    },
  },
}

const activationProgram = {
  ...seedProgram,
  origin: 'imported' as const,
  morningActivation: {
    kind: 'mobility' as const,
    title: 'Morning Activation',
    items: [
      { label: 'Cat-cow', detail: '6 controlled reps' },
      { label: 'Bodyweight squat', detail: '8 reps' },
    ],
  },
}

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 22, 9, 0, 0) }) // Wed 22 Jul — a training day
  await seedDatabase()
})

afterEach(async () => {
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

describe('Today on a training day carrying its own weekday activity', () => {
  it('shows the ride below the session, without replacing the session hero or Start button', async () => {
    await programRepo.put(rideProgram)
    renderApp()

    // The session is still the point of the day — untouched by the ride.
    expect(await screen.findByRole('heading', { name: 'Squat, hinge & core' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start session' })).toBeInTheDocument()

    // The ride renders too, display only.
    expect(screen.getByText('Zone 2 ride', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText(/30 min, after lifting/)).toBeInTheDocument()

    // Display only — no completion affordance for the ride either.
    expect(screen.queryByText(/mark complete/i)).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('shows nothing extra when the program has no activity for the weekday — unchanged behavior', async () => {
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Squat, hinge & core' })).toBeInTheDocument()
    expect(screen.queryByText('Zone 2 ride')).toBeNull()
  })
})

describe('Today on a training day with morning activation', () => {
  it('shows the preparation round above the session hero', async () => {
    await programRepo.put(activationProgram)
    renderApp()

    expect(await screen.findByText('Before you start')).toBeInTheDocument()
    expect(screen.getByText('Cat-cow')).toBeInTheDocument()
    expect(screen.getByText(/6 controlled reps/)).toBeInTheDocument()
    expect(screen.getByText('Bodyweight squat')).toBeInTheDocument()

    // The session itself is unaffected.
    expect(screen.getByRole('heading', { name: 'Squat, hinge & core' })).toBeInTheDocument()
  })

  it('shows nothing extra when the program has no morning activation set — unchanged behavior', async () => {
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Squat, hinge & core' })).toBeInTheDocument()
    expect(screen.queryByText('Before you start')).toBeNull()
  })
})
