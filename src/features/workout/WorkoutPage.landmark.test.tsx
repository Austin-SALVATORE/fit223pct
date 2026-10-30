import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AppShell } from '@/app/AppShell'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout } from '@/domain/workout'
import { WorkoutPage } from './WorkoutPage'

/**
 * Workout Mode has exactly one `<main>` landmark (QA A13). It mounts outside
 * `AppShell` ("full-screen takeover", `App.tsx`), and `AppShell` holds the app's
 * only other `<main>`, so a screen reader's "jump to main content" found nothing
 * on the one screen where the athlete spends the session. It is one landmark in
 * every state the screen can be in, and still one if the screen is ever nested in
 * the shell.
 *
 * Negative controls, run 30 Oct (mutation applied, the whole suite run, restored and
 * `cmp`ed):
 *   `WorkoutPage` renders its screen with no `Main` around it
 *                         -> the three alone-cases (3 red): none has a landmark
 *   `Main` always renders `<main>` even when nested
 *                         -> "nested inside the shell's own main" (two landmarks)
 * Not run: `Main` around only the set screen's own root rather than the page. The
 * wrapper is one place, around the whole screen, so every return path of the page is
 * inside it by construction; the "no session in progress" and "before its data has
 * loaded" cases are the two returns that a root-only wrapper would miss, and they are
 * asserted.
 */

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
})

async function startWorkout() {
  await db.workouts.put(
    createWorkout({
      id: 'landmark',
      programId: seedProgram.id,
      session: seedProgram.sessions[1],
      date: '2026-07-22',
      startedAt: '2026-07-22T09:00:00.000Z',
    }),
  )
}

function renderAlone() {
  return render(
    <MemoryRouter initialEntries={['/workout']}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/workout" element={<WorkoutPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Workout Mode has one main landmark', () => {
  it('alone, with a session on screen', async () => {
    await startWorkout()
    renderAlone()
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getAllByRole('main')).toHaveLength(1)
    // The landmark holds the screen, not a sibling of it.
    expect(screen.getByRole('main')).toContainElement(screen.getByRole('heading', { level: 1 }))
  })

  it('alone, with no session in progress', async () => {
    renderAlone()
    await screen.findByText("There's no session in progress.")
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('alone, before its data has loaded', () => {
    renderAlone()
    // First render: the live query has not answered, the screen renders nothing of its own.
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it("nested inside the shell's own main, it adds none", async () => {
    await startWorkout()
    render(
      <MemoryRouter initialEntries={['/workout']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="workout" element={<WorkoutPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })
})
