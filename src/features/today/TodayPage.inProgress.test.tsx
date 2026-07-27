import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import i18n from '@/i18n/i18next'
import type { Program, Workout } from '@/domain/types'
import { TodayPage } from './TodayPage'

/**
 * The resume hero (docs/review-backlog.md I1). Two defects lived here and
 * no test mounted this branch at all:
 *
 *  - the stored English `session.focus` was rendered raw, so a fr/zh-CN
 *    user resuming a workout saw "Push & pull foundation"; and
 *  - the session *name* never appeared, so the day lost its identity the
 *    moment it started — the opposite of what weekday-pinned sessions
 *    exist to give it.
 *
 * Owner ruling: the hero shows both — eyebrow "In progress · Chest & Back",
 * title "Push & pull foundation", both through the seed hooks.
 */

const SEED_PROGRAM_ID = 'phase-1-home'
const SEED_SESSION_ID = 'chest-back'

beforeAll(async () => {
  // Monday 20 Jul 2026 — a training day for the seed's weekday-pinned schedule.
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 20, 9, 0, 0) })
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
  await i18n.changeLanguage('en')
})

afterAll(async () => {
  vi.useRealTimers()
  await db.checkins.clear()
})

async function startWorkout(sessionTemplateId = SEED_SESSION_ID): Promise<void> {
  const workout: Workout = {
    id: 'workout-in-progress',
    programId: SEED_PROGRAM_ID,
    sessionTemplateId,
    date: '2026-07-20',
    startedAt: '2026-07-20T09:00:00.000Z',
    completedAt: null,
    exercises: [],
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

describe('the in-progress hero', () => {
  it('titles with the focus and names the session in the eyebrow', async () => {
    await startWorkout()
    renderApp()

    expect(
      await screen.findByRole('heading', { name: 'Push & pull foundation' }),
    ).toBeInTheDocument()
    expect(screen.getByText('In progress · Chest & Back')).toBeInTheDocument()
  })

  it('localizes both values in zh-CN, leaving no seed English', async () => {
    await startWorkout()
    await i18n.changeLanguage('zh-CN')
    renderApp()

    expect(await screen.findByRole('heading', { name: '推拉基础' })).toBeInTheDocument()
    expect(screen.getByText('进行中 · 胸背训练')).toBeInTheDocument()

    // The defect this test exists for: the raw stored fields must not appear.
    expect(screen.queryByText('Push & pull foundation')).toBeNull()
    expect(screen.queryByText(/Chest & Back/)).toBeNull()
  })

  it('localizes both values in fr', async () => {
    await startWorkout()
    await i18n.changeLanguage('fr')
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Fondation poussée-tirage' })).toBeInTheDocument()
    expect(screen.getByText('En cours · Poitrine et dos')).toBeInTheDocument()
    expect(screen.queryByText('Push & pull foundation')).toBeNull()
  })

  it("renders an imported program's own wording verbatim, even in zh-CN", async () => {
    // Reusing the seed's program and session ids on purpose: an id match is
    // not evidence the content is the seed's, and the owner's own words must
    // never be shadowed by seed translations (.claude/rules/architecture.md).
    const imported: Program = {
      id: SEED_PROGRAM_ID,
      name: 'My own block',
      phase: 1,
      startDate: '2026-07-01',
      endDate: null,
      trainingWeekdays: [1],
      rotation: [SEED_SESSION_ID],
      sessions: [
        { id: SEED_SESSION_ID, name: 'Upper A', focus: 'Bench and rows', items: [] },
      ],
      origin: 'imported',
    }
    await db.programs.put(imported)
    await startWorkout()
    await i18n.changeLanguage('zh-CN')
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Bench and rows' })).toBeInTheDocument()
    expect(screen.getByText('进行中 · Upper A')).toBeInTheDocument()
    expect(screen.queryByText('推拉基础')).toBeNull()

    await db.programs.clear()
    await seedDatabase()
  })

  it('falls back without a separator when the session template is gone', async () => {
    await startWorkout('deleted-session')
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Session' })).toBeInTheDocument()
    expect(screen.getByText('In progress')).toBeInTheDocument()
  })
})
