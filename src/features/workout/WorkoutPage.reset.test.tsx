import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout, logSet } from '@/domain/workout'
import type { Workout } from '@/domain/types'
import { WorkoutPage } from './WorkoutPage'

/**
 * Reset session, from inside Workout Mode. Before this, abandoning a
 * session meant leaving it first — the Today card's discard was the only
 * escape, and it is not reachable from where the mistake happens.
 *
 * Reset ends exactly where that discard ends: the workout is deleted, not
 * archived, and today reads as not started. It confirms first and names the
 * count, because it destroys real work. It lives behind ⋯ rather than beside
 * "Log set", since a destructive control must not sit where a thumb lands
 * repeatedly.
 */

const LEGS_AND_CORE = seedProgram.sessions[1]

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
})

async function insertWorkout(setCount: number): Promise<void> {
  let workout: Workout = createWorkout({
    id: 'test-reset',
    programId: seedProgram.id,
    session: LEGS_AND_CORE,
    date: '2026-07-22',
    startedAt: '2026-07-22T09:00:00.000Z',
  })
  for (let i = 0; i < setCount; i += 1) {
    workout = logSet(workout, 0, {
      weightKg: 10,
      reps: 12,
      seconds: null,
      completedAt: `2026-07-22T09:0${i}:00.000Z`,
    })
  }
  await db.workouts.put(workout)
}

function renderWorkout() {
  return render(
    <MemoryRouter initialEntries={['/workout']}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/workout" element={<WorkoutPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function openSheet(): Promise<HTMLElement> {
  await userEvent.click(await screen.findByRole('button', { name: 'Session options' }))
  return screen.findByRole('dialog', { name: 'Session options' })
}

describe('reset session', () => {
  // R1
  it('opens from the header and resets nothing by itself', async () => {
    await insertWorkout(2)
    renderWorkout()

    const sheet = await openSheet()
    expect(within(sheet).getByRole('heading', { name: 'This session' })).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: /^Reset session/ })).toBeInTheDocument()
    expect(await db.workouts.count()).toBe(1)
  })

  // R2
  it('confirms first, naming what will be lost', async () => {
    await insertWorkout(2)
    renderWorkout()

    const sheet = await openSheet()
    await userEvent.click(within(sheet).getByRole('button', { name: /^Reset session/ }))

    expect(within(sheet).getByRole('heading', { name: 'Clear 2 logged sets?' })).toBeInTheDocument()
    expect(await db.workouts.count()).toBe(1)
  })

  // R3
  it('deletes the workout on confirm and lands back on Today', async () => {
    await insertWorkout(2)
    renderWorkout()

    const sheet = await openSheet()
    await userEvent.click(within(sheet).getByRole('button', { name: /^Reset session/ }))
    await userEvent.click(within(sheet).getByRole('button', { name: 'Reset session' }))

    await waitFor(async () => expect(await db.workouts.count()).toBe(0))
    expect(await screen.findByText('TODAY PROBE')).toBeInTheDocument()
  })

  // R4
  it('leaves the workout intact on cancel and returns focus to the reset row', async () => {
    await insertWorkout(2)
    renderWorkout()

    const sheet = await openSheet()
    await userEvent.click(within(sheet).getByRole('button', { name: /^Reset session/ }))
    await userEvent.click(within(sheet).getByRole('button', { name: 'Keep going' }))

    // Re-queried rather than captured: the cancel replaces this subtree.
    await waitFor(() =>
      expect(within(sheet).getByRole('button', { name: /^Reset session/ })).toHaveFocus(),
    )
    expect(await db.workouts.count()).toBe(1)
  })

  // R5 — the announcement half. Focus lands on the confirm heading and the
  // destructive count is its description, so it is spoken with it.
  it('moves focus to the confirm heading, which is described by the count', async () => {
    await insertWorkout(2)
    renderWorkout()

    const sheet = await openSheet()
    await userEvent.click(within(sheet).getByRole('button', { name: /^Reset session/ }))

    const heading = within(sheet).getByRole('heading', { name: 'Clear 2 logged sets?' })
    await waitFor(() => expect(heading).toHaveFocus())

    const warningId = heading.getAttribute('aria-describedby') ?? ''
    expect(document.getElementById(warningId)).toHaveTextContent(
      'The session is deleted, not saved.',
    )
  })

  // R6
  it('closes on Escape mid-confirm without deleting anything', async () => {
    await insertWorkout(2)
    renderWorkout()

    const sheet = await openSheet()
    await userEvent.click(within(sheet).getByRole('button', { name: /^Reset session/ }))
    await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true))

    await userEvent.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Session options' })).toBeNull(),
    )
    expect(await db.workouts.count()).toBe(1)
  })

  // The owner's ruling: reset always confirms, even with nothing logged —
  // a control that sometimes confirms and sometimes doesn't is a worse
  // contract than one extra tap on a rare path. "Clear 0 logged sets?"
  // would be nonsense, so the empty state gets its own non-plural heading.
  it('still confirms with nothing logged, without naming a count', async () => {
    await insertWorkout(0)
    renderWorkout()

    const sheet = await openSheet()
    await userEvent.click(within(sheet).getByRole('button', { name: /^Reset session/ }))

    expect(within(sheet).getByRole('heading', { name: 'Reset this session?' })).toBeInTheDocument()
    expect(await db.workouts.count()).toBe(1)
  })

  it('reopens onto the options, not a stale confirm step', async () => {
    await insertWorkout(2)
    renderWorkout()

    const sheet = await openSheet()
    await userEvent.click(within(sheet).getByRole('button', { name: /^Reset session/ }))
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Session options' })).toBeNull(),
    )

    const reopened = await openSheet()
    expect(within(reopened).getByRole('heading', { name: 'This session' })).toBeInTheDocument()
    expect(within(reopened).queryByRole('heading', { name: /^Clear/ })).toBeNull()
  })
})
