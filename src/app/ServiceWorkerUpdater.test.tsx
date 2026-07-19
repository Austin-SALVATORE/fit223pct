import { afterEach, describe, expect, it } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { db } from '@/data/db'
import { seedProgram } from '@/data/seed/program'
import { createWorkout } from '@/domain/workout'
import { applyUpdate, onNeedRefresh, resetPwaRegisterMock } from '@/test/pwaRegisterMock'
import { ServiceWorkerUpdater } from './ServiceWorkerUpdater'

/**
 * A deploy landing mid-set is the one way this architecture can hurt the
 * user — reloading the page under them. This is the un-fakeable-in-a-real-
 * browser-test half of that contract: whether the update is actually
 * deferred while a workout is in progress. (The registration itself, and
 * the offline behavior it protects, are verified against the production
 * build separately — a dev/test environment never runs the real SW.)
 */

afterEach(async () => {
  await db.workouts.clear()
  resetPwaRegisterMock()
})

describe('ServiceWorkerUpdater', () => {
  it('never applies the update before the initial active-workout check resolves', async () => {
    const session = seedProgram.sessions[0]
    const workout = createWorkout({
      id: 'active',
      programId: seedProgram.id,
      session,
      date: '2026-07-22',
      startedAt: '2026-07-22T09:00:00.000Z',
    })
    await db.workouts.put(workout)

    render(<ServiceWorkerUpdater />)
    await waitFor(() => expect(onNeedRefresh).not.toBeNull())
    // Fire immediately — useLiveQuery's first render is synchronously
    // undefined regardless of what's actually in the database, and that
    // must never read as "safe to update."
    onNeedRefresh?.()

    expect(applyUpdate).not.toHaveBeenCalled()
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(applyUpdate).not.toHaveBeenCalled()
  })

  it('applies the update immediately when no workout is in progress', async () => {
    render(<ServiceWorkerUpdater />)
    await waitFor(() => expect(onNeedRefresh).not.toBeNull())

    onNeedRefresh?.()

    await waitFor(() => expect(applyUpdate).toHaveBeenCalledWith(true))
  })

  it('defers the update while a workout is in progress, applying it once the workout ends', async () => {
    const session = seedProgram.sessions[0]
    const workout = createWorkout({
      id: 'active',
      programId: seedProgram.id,
      session,
      date: '2026-07-22',
      startedAt: '2026-07-22T09:00:00.000Z',
    })
    await db.workouts.put(workout)

    render(<ServiceWorkerUpdater />)
    await waitFor(() => expect(onNeedRefresh).not.toBeNull())

    onNeedRefresh?.()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(applyUpdate).not.toHaveBeenCalled()

    await db.workouts.update('active', { completedAt: '2026-07-22T09:30:00.000Z' })

    await waitFor(() => expect(applyUpdate).toHaveBeenCalledWith(true))
  })
})
