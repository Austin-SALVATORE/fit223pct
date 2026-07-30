import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import i18n from '@/i18n/i18next'
import { seedDatabase } from '@/data/seed'
import type { Routine } from '@/domain/routine'
import { RoutinePlayer } from './RoutinePlayer'

/**
 * Guard B — playing a routine end to end writes nothing, anywhere.
 *
 * Guard A (routineNoTracking.guard.test.ts) fails when someone *imports* the
 * write layer. This one fails when a write happens at all, by any path A did
 * not model — including one that bypasses the import graph entirely. The
 * owner's no-tracking ruling is the one most likely to erode, so it gets
 * both.
 *
 * The method is a whole-database snapshot: every table serialised before and
 * after, compared byte for byte. That detects a write of any shape, in any
 * table, rather than only the ones this test thought to look at.
 */

vi.mock('@/data/seed/routines', async () => {
  const actual = await vi.importActual<typeof import('@/data/seed/routines')>(
    '@/data/seed/routines',
  )
  const routine: Routine = {
    id: 'test-stretching',
    steps: [
      { id: 'test-hamstring', holdSeconds: 2, perSide: true },
      { id: 'test-child-pose', holdSeconds: 2 },
    ],
  }
  return {
    ...actual,
    seedRoutines: [routine],
    routineById: (id: string) => (id === routine.id ? routine : undefined),
  }
})

beforeAll(async () => {
  await seedDatabase()
  // The test routine's steps are test-only ids, so register their prose the
  // way phase 5's seed.json will — otherwise every render logs a missing key
  // and the headings read as raw key paths.
  i18n.addResourceBundle('en', 'seed', {
    routine: {
      'test-stretching': { name: 'Recovery stretch' },
    },
    routineStep: {
      'test-hamstring': { name: 'Hamstring stretch', cue: 'Keep the back leg straight.' },
      'test-child-pose': { name: 'Child pose' },
    },
  }, true, true)
})

afterEach(() => {
  vi.useRealTimers()
})

async function snapshotDatabase(): Promise<string> {
  const tables = await Promise.all(
    db.tables.map(async (table) => [table.name, await table.toArray()] as const),
  )
  return JSON.stringify(tables)
}

function renderPlayer() {
  return render(
    <MemoryRouter initialEntries={['/routine/test-stretching']}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/routine/:routineId" element={<RoutinePlayer />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('a routine writes nothing', () => {
  it('adds no storage at all — no table exists for routine data', () => {
    // If someone later adds a `routineCompletions` table, this fails before
    // any behavioural test has to notice.
    expect(db.tables.length).toBe(5)
    for (const table of db.tables) {
      expect(table.name).not.toMatch(/routine|completion/i)
    }
    // This deliberately no longer asserts a specific db.verno. It did, and
    // M10's additive v4 bump broke it — which was the assertion failing for
    // the wrong reason: the schema version says nothing about whether
    // routines persist anything, so pinning it made an unrelated migration
    // look like a routine regression. The table-name check is what the guard
    // actually means.
  })

  it('leaves every table byte-identical after a routine is played to the end', async () => {
    const before = await snapshotDatabase()

    renderPlayer()
    // Through the ready gate first: a routine now begins with an explicit
    // Start, and this test's subject is the whole play-through, gate included.
    await userEvent.click(await screen.findByRole('button', { name: 'Start' }))
    await screen.findByRole('heading', { name: 'Hamstring stretch — left side' })

    // Driven with Next rather than by waiting out real timers — this test is
    // about writes, not timing.
    for (let i = 0; i < 3; i += 1) {
      await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    }

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Done.' })).toBeInTheDocument())

    expect(await snapshotDatabase()).toBe(before)
  })

  it('detects a write — the snapshot is not vacuously equal', async () => {
    // Without this, a snapshot that silently captured nothing would make the
    // test above pass forever while checking nothing.
    const before = await snapshotDatabase()
    const settings = await db.settings.get('user')
    if (!settings) throw new Error('seeded settings record is missing')
    await db.settings.put({ ...settings, locale: 'fr' })
    expect(await snapshotDatabase()).not.toBe(before)
  })
})
