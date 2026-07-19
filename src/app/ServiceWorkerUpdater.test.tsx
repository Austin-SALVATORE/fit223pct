import { afterEach, describe, expect, it } from 'vitest'
import { act, render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedProgram } from '@/data/seed/program'
import { createWorkout } from '@/domain/workout'
import { applyUpdate, onNeedRefresh, resetPwaRegisterMock } from '@/test/pwaRegisterMock'
import { ServiceWorkerUpdater } from './ServiceWorkerUpdater'

/**
 * A deploy landing while the user is engaged with the app is the one way
 * this architecture can hurt them — most sharply mid-set, but a silent
 * reload on any other screen is still an unannounced flash. This is the
 * un-fakeable-in-a-real-browser-test half of that contract: whether the
 * update actually stays deferred until a workout ends, and only lands at a
 * natural transition (app open, reopen, or navigation) rather than
 * eagerly the instant it becomes safe. (Registration itself, and the
 * offline behavior it protects, are verified against the production
 * build separately — a dev/test environment never runs the real SW.)
 */

async function putActiveWorkout() {
  const session = seedProgram.sessions[0]
  const workout = createWorkout({
    id: 'active',
    programId: seedProgram.id,
    session,
    date: '2026-07-22',
    startedAt: '2026-07-22T09:00:00.000Z',
  })
  await db.workouts.put(workout)
}

function renderAt(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Routes>
        <Route path="*" element={<ServiceWorkerUpdater />} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(async () => {
  await db.workouts.clear()
  resetPwaRegisterMock()
})

describe('ServiceWorkerUpdater', () => {
  it('never applies the update before the initial active-workout check resolves', async () => {
    await putActiveWorkout()

    renderAt('/')
    await waitFor(() => expect(onNeedRefresh).not.toBeNull())
    // Fire immediately — useLiveQuery's first render is synchronously
    // undefined regardless of what's actually in the database, and that
    // must never read as "safe to update."
    onNeedRefresh?.()

    expect(applyUpdate).not.toHaveBeenCalled()
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(applyUpdate).not.toHaveBeenCalled()
  })

  it('applies an already-pending update as soon as the fresh session settles, with no workout active', async () => {
    renderAt('/')
    await waitFor(() => expect(onNeedRefresh).not.toBeNull())

    onNeedRefresh?.()

    await waitFor(() => expect(applyUpdate).toHaveBeenCalledWith(true))
  })

  it('defers while a workout is in progress, applying once it ends (fresh session)', async () => {
    await putActiveWorkout()

    renderAt('/')
    await waitFor(() => expect(onNeedRefresh).not.toBeNull())

    onNeedRefresh?.()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(applyUpdate).not.toHaveBeenCalled()

    await db.workouts.update('active', { completedAt: '2026-07-22T09:30:00.000Z' })

    await waitFor(() => expect(applyUpdate).toHaveBeenCalledWith(true))
  })

  it('does not reload the instant it becomes safe once the session is no longer fresh — only on the next navigation or reopen', async () => {
    await putActiveWorkout()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ServiceWorkerUpdater />} />
          <Route path="/library" element={<ServiceWorkerUpdater />} />
        </Routes>
      </MemoryRouter>,
    )
    await waitFor(() => expect(onNeedRefresh).not.toBeNull())
    onNeedRefresh?.()
    await new Promise((resolve) => setTimeout(resolve, 50))

    // A navigation ends "freshness" for this test's purposes — simulate it
    // by dispatching a visibilitychange to hidden, which is the other way
    // freshness ends, without needing a second render tree.
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })
    act(() => document.dispatchEvent(new Event('visibilitychange')))

    await db.workouts.update('active', { completedAt: '2026-07-22T09:30:00.000Z' })
    await new Promise((resolve) => setTimeout(resolve, 100))
    // The workout ended while backgrounded/stale — must not have applied yet.
    expect(applyUpdate).not.toHaveBeenCalled()

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
    act(() => document.dispatchEvent(new Event('visibilitychange')))

    await waitFor(() => expect(applyUpdate).toHaveBeenCalledWith(true))
  })
})
