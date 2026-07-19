import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { programRepo } from '@/data/repositories'
import { createWorkout, logSet, completeWorkout } from '@/domain/workout'
import { PlanPage } from './PlanPage'

/**
 * The honesty rule (docs/Plan.md) end-to-end: a skipped day never fabricates
 * a session, today's rotation position reflects real completed count (not
 * calendar position), and only future days carry the "Projected" label.
 */

beforeAll(async () => {
  // Monday 27 Jul — mid-phase, after a completed Wed and a skipped Fri.
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 27, 9, 0, 0) })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

afterEach(async () => {
  cleanup()
  await db.workouts.clear()
})

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/plan']}>
      <Routes>
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/" element={<p>TODAY PROBE</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function putCompletedWorkout(date: string) {
  let workout = createWorkout({
    id: `w-${date}`,
    programId: seedProgram.id,
    session: seedProgram.sessions[0],
    date,
    startedAt: `${date}T09:00:00.000Z`,
  })
  workout = logSet(workout, 0, {
    weightKg: 20,
    reps: 10,
    seconds: null,
    rir: 2,
    completedAt: `${date}T09:10:00.000Z`,
  })
  workout = completeWorkout(workout, `${date}T09:40:00.000Z`)
  await db.workouts.put(workout)
}

describe('PlanPage', () => {
  it('renders the phase header with the rotation sentence', async () => {
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Phase 1 — Home' })).toBeInTheDocument()
    expect(await screen.findByText('21 Jul – 9 Aug')).toBeInTheDocument()
    expect(await screen.findByText('A and B alternate, Mon / Wed / Fri')).toBeInTheDocument()
  })

  it('states a skipped scheduled day as a plain em-dash, never "missed"', async () => {
    await putCompletedWorkout('2026-07-22')
    renderApp()
    expect(await screen.findByText('Wed 22 Jul')).toBeInTheDocument()
    const skippedRow = (await screen.findByText('Fri 24 Jul')).closest('li')
    expect(skippedRow).not.toBeNull()
    expect(await screen.findByLabelText('No session')).toHaveTextContent('—')
    // The row itself carries no guilt copy — the page-level honesty-rule
    // note (a different, neutral sentence) is allowed to use the word.
    expect(skippedRow).not.toHaveTextContent(/missed/i)
  })

  it('shows today\'s real rotation position, shifted by the skipped day, not a repeat', async () => {
    await putCompletedWorkout('2026-07-22') // session A, completedCount becomes 1
    renderApp()
    // completedCount=1 → rotation[1%2] = B, not A — proves the skip shifted
    // nothing else and consumed no rotation slot of its own.
    expect(await screen.findByText(/Mon 27 Jul/)).toBeInTheDocument()
    expect(await screen.findByText('Today')).toBeInTheDocument()
    const todayLink = screen.getByRole('link', { name: /Mon 27 Jul.*Today.*Session B/s })
    expect(todayLink).toBeInTheDocument()
  })

  it('labels only future sessions as projected, with the explanatory line once', async () => {
    renderApp()
    const projectedLabels = await screen.findAllByText('Projected', { exact: false })
    expect(projectedLabels.length).toBeGreaterThan(1)
    expect(
      screen.getAllByText(/rotation follows what you complete, not the date/).length,
    ).toBe(1)
  })

  it('shows a completed day\'s session and summary, never projected', async () => {
    await putCompletedWorkout('2026-07-22')
    renderApp()
    const row = (await screen.findByText('Wed 22 Jul')).closest('li')
    expect(row).not.toBeNull()
    expect(row).toHaveTextContent('Session A')
    expect(row).toHaveTextContent('1 sets')
    expect(row).not.toHaveTextContent('Projected')
  })

  it('links today\'s row back to Today', async () => {
    renderApp()
    const todayLink = await screen.findByRole('link', { name: /Today/ })
    await userEvent.click(todayLink)
    expect(await screen.findByText('TODAY PROBE')).toBeInTheDocument()
  })
})

describe('PlanPage activity days', () => {
  afterEach(async () => {
    await programRepo.put(seedProgram) // restore the plain program
  })

  it('lists an activity day by title, visually quieter than a strength session row', async () => {
    await programRepo.put({
      ...seedProgram,
      weekdayActivities: {
        2: {
          kind: 'recovery',
          title: 'Recovery walk & stretch',
          items: [{ label: '30-minute easy walk' }],
        },
      },
    })
    renderApp()

    const activityRow = (await screen.findByText('Tue 28 Jul')).closest('li')
    expect(activityRow).not.toBeNull()
    expect(activityRow).toHaveTextContent('Recovery walk & stretch')
    // Quieter than a strength row: the date label carries no font-medium class.
    const dateLabel = within(activityRow!).getByText('Tue 28 Jul')
    expect(dateLabel.className).not.toMatch(/font-medium/)
    // No completion state — there is none to show for an activity.
    expect(activityRow).not.toHaveTextContent('Projected')
  })

  it('leaves a plain rest day (no activity, no training) out of the list entirely — unchanged', async () => {
    await programRepo.put({
      ...seedProgram,
      weekdayActivities: {
        2: {
          kind: 'recovery',
          title: 'Recovery walk & stretch',
          items: [{ label: '30-minute easy walk' }],
        },
      },
    })
    renderApp()
    await screen.findByText('Tue 28 Jul') // wait for the list to render
    // Thursday has no activity declared for it and isn't a training day.
    expect(screen.queryByText(/30 Jul/)).toBeNull()
  })
})
