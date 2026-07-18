import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { TodayPage } from './TodayPage'

/**
 * Days without a scheduled session must still offer a way into Workout
 * Mode — a quiet secondary affordance, never competing with the rest-day
 * framing. Session identity derives from completed count, so an early
 * start simply advances the rotation; nothing is skipped.
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  await seedDatabase()
})

afterAll(async () => {
  vi.useRealTimers()
  await db.checkins.clear()
})

afterEach(async () => {
  await db.workouts.clear()
})

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/workout" element={<p>Workout mode</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Early start on unscheduled days', () => {
  it('offers a quiet start on a rest day and enters workout mode with the next session', async () => {
    vi.setSystemTime(new Date(2026, 6, 23, 9, 0, 0)) // Thursday — rest day
    renderApp()

    expect(await screen.findByText('Recovery is progress')).toBeInTheDocument()
    const early = await screen.findByRole('button', { name: 'Start this session now' })
    await userEvent.click(early)

    expect(await screen.findByText('Workout mode')).toBeInTheDocument()
    const workouts = await db.workouts.toArray()
    expect(workouts).toHaveLength(1)
    expect(workouts[0].date).toBe('2026-07-23')
    expect(workouts[0].sessionTemplateId).toBe('A')
  })

  it('offers the same quiet start before the program has begun', async () => {
    vi.setSystemTime(new Date(2026, 6, 19, 9, 0, 0)) // Sunday — 2 days before start
    renderApp()

    expect(await screen.findByText('Starts in 2 days')).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: 'Start this session now' }),
    ).toBeInTheDocument()
  })

  it('keeps the training day primary CTA — no duplicate quiet affordance', async () => {
    vi.setSystemTime(new Date(2026, 6, 22, 9, 0, 0)) // Wednesday — training day
    renderApp()

    expect(await screen.findByRole('button', { name: 'Start session' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start this session now' })).toBeNull()
  })

  it('applies readiness to an early start exactly as a training day would', async () => {
    vi.setSystemTime(new Date(2026, 6, 23, 9, 0, 0)) // Thursday — rest day
    renderApp()

    for (const label of ['Sleep', 'Energy', 'Freshness', 'Calm', 'Motivation']) {
      await userEvent.click(await screen.findByRole('button', { name: `${label}: 2` }))
    }

    // Preview carries the canonical label, and the started workout carries
    // the adjusted prescription and the readiness snapshot — the M3 contract
    // holds on unscheduled days too
    expect(await screen.findByText('Adjusted for readiness')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Start this session now' }))

    expect(await screen.findByText('Workout mode')).toBeInTheDocument()
    const [workout] = await db.workouts.toArray()
    expect(workout.readiness?.tier).toBe('easier')
    expect(workout.readiness?.drivers).toContain('sleep')
    expect(workout.exercises[0].prescription.targetRir).toBe(3)

    await db.checkins.clear()
  })

  it('offers no start of any kind once the phase has ended', async () => {
    vi.setSystemTime(new Date(2026, 7, 11, 9, 0, 0)) // 11 Aug — after endDate
    renderApp()

    // Post-phase, getActive returns no program — the next-phase message shows
    expect(await screen.findByText(/next phase will appear here/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start this session now' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Start session' })).toBeNull()
  })
})
