import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout, logSet } from '@/domain/workout'
import { TodayPage } from './TodayPage'

/**
 * Backlog A4. Discarding an in-progress workout used to arm by swapping the
 * button's own label in place: the element stayed mounted, so no screen
 * reader announced the state change, and a blind user could destroy a
 * workout without ever perceiving that there had been a confirm step.
 *
 * It now uses ConfirmAction — the same primitive the swap sheet's
 * confirm-clear uses — because discard and reset are one concept and should
 * not have two behaviours. These are the first tests this control has ever
 * had; `grep discard src --include='*.test.tsx'` returned nothing before.
 */

beforeAll(async () => {
  // Monday 20 Jul 2026 — a training day on the seed's weekday-pinned schedule,
  // so discarding lands back on a startable session rather than a rest day.
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 20, 9, 0, 0) })
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
})

afterAll(async () => {
  vi.useRealTimers()
  await db.checkins.clear()
})

/** An active workout with `setCount` sets logged against its first exercise. */
async function startWorkout(setCount: number): Promise<void> {
  const session = seedProgram.sessions[0]
  let workout = createWorkout({
    id: 'workout-to-discard',
    programId: seedProgram.id,
    session,
    date: '2026-07-20',
    startedAt: '2026-07-20T09:00:00.000Z',
  })
  for (let i = 0; i < setCount; i += 1) {
    workout = logSet(workout, 0, {
      weightKg: 10,
      reps: 12,
      seconds: null,
      completedAt: `2026-07-20T09:0${i}:00.000Z`,
    })
  }
  await db.workouts.put(workout)
}

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<TodayPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const discardButton = () => screen.getByRole('button', { name: 'Discard session' })

describe('discarding an in-progress workout', () => {
  // T1
  it('shows a real confirm step, not a relabelled button', async () => {
    await startWorkout(2)
    renderApp()

    await userEvent.click(await screen.findByRole('button', { name: 'Discard session' }))

    expect(
      screen.getByRole('heading', { name: 'Discard 2 logged sets?' }),
    ).toBeInTheDocument()
    // Nothing is destroyed by arriving at the confirm.
    expect(await db.workouts.count()).toBe(1)
  })

  // T2 — the announcement half of A4: the heading takes focus and carries
  // the destructive count as its description.
  it('moves focus to the confirm heading, which is described by the count', async () => {
    await startWorkout(2)
    renderApp()

    await userEvent.click(await screen.findByRole('button', { name: 'Discard session' }))

    const heading = screen.getByRole('heading', { name: 'Discard 2 logged sets?' })
    await waitFor(() => expect(heading).toHaveFocus())

    const warningId = heading.getAttribute('aria-describedby') ?? ''
    expect(document.getElementById(warningId)).toHaveTextContent(
      'The session is deleted, not saved.',
    )
  })

  // T3
  it('returns focus to the discard button on cancel, workout intact', async () => {
    await startWorkout(2)
    renderApp()

    await userEvent.click(await screen.findByRole('button', { name: 'Discard session' }))
    await userEvent.click(screen.getByRole('button', { name: 'Keep it' }))

    await waitFor(() => expect(discardButton()).toHaveFocus())
    expect(await db.workouts.count()).toBe(1)
  })

  // T4
  it('deletes the workout on confirm and returns Today to not-started', async () => {
    await startWorkout(2)
    renderApp()

    await userEvent.click(await screen.findByRole('button', { name: 'Discard session' }))
    // The trigger has unmounted — this is the confirm's own action button,
    // which deliberately carries the same words as the control that led here.
    await userEvent.click(screen.getByRole('button', { name: 'Discard session' }))

    await waitFor(async () => expect(await db.workouts.count()).toBe(0))
    expect(await screen.findByRole('button', { name: 'Start session' })).toBeInTheDocument()
  })

  // T5 — guards useFocusOnChange's skip-the-first-render behaviour. An
  // ordinary Today load with a workout in progress must not grab focus.
  it('does not steal focus on an ordinary page load', async () => {
    await startWorkout(2)
    renderApp()

    await screen.findByRole('button', { name: 'Discard session' })
    expect(document.body).toHaveFocus()
  })

  it('names the session rather than a set count when nothing is logged yet', async () => {
    await startWorkout(0)
    renderApp()

    await userEvent.click(await screen.findByRole('button', { name: 'Discard session' }))

    expect(screen.getByRole('heading', { name: 'Discard this session?' })).toBeInTheDocument()
  })
})
