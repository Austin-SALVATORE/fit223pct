import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { programRepo } from '@/data/repositories'
import { createWorkout, logSet, completeWorkout } from '@/domain/workout'
import { PlanPage } from './PlanPage'
import { PlanDayPage } from './PlanDayPage'
import { ExercisePage } from '@/features/library/ExercisePage'

/**
 * Amendment (19 Jul) to docs/Plan.md — every day row is clickable.
 * Monday 27 Jul 2026: mid-phase, matching PlanPage.test.tsx's reference point.
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 27, 9, 0, 0) })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

afterEach(async () => {
  await db.workouts.clear()
  await programRepo.put(seedProgram) // restore the plain program
})

async function putCompletedWorkout(date: string) {
  let workout = createWorkout({
    id: `w-${date}`,
    programId: seedProgram.id,
    session: seedProgram.sessions[1], // Legs & Core: item 0 = goblet-squat
    date,
    startedAt: `${date}T09:00:00.000Z`,
  })
  workout = logSet(workout, 0, {
    weightKg: 20,
    reps: 10,
    seconds: null,
    completedAt: `${date}T09:10:00.000Z`,
  })
  workout = logSet(workout, 0, {
    weightKg: 20,
    reps: 9,
    seconds: null,
    completedAt: `${date}T09:15:00.000Z`,
  })
  workout = completeWorkout(workout, `${date}T09:40:00.000Z`)
  await db.workouts.put(workout)
}

function renderDay(date: string) {
  return render(
    <MemoryRouter initialEntries={[`/plan/${date}`]}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/plan/:date" element={<PlanDayPage />} />
        <Route path="/library/:exerciseId" element={<ExercisePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PlanDayPage states', () => {
  it('completed workout day: facts only — session name, per-exercise logged sets, summary, no RIR anywhere', async () => {
    await putCompletedWorkout('2026-07-22')
    renderDay('2026-07-22')

    expect(await screen.findByRole('heading', { name: /Wednesday 22 July/ })).toBeInTheDocument()
    expect(screen.getByText('Legs & Core')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Goblet squat' })).toBeInTheDocument()
    expect(screen.getByText('10 × 20 kg · 9 × 20 kg')).toBeInTheDocument()
    expect(screen.getByText(/2 sets/)).toBeInTheDocument()
    expect(screen.queryByText(/Projected/)).toBeNull()
    expect(screen.queryByText(/RIR/)).toBeNull()
  })

  it('future training day: SessionPreview, Projected label, the pinned-mode honesty line, no readiness applied', async () => {
    renderDay('2026-07-29') // Wednesday, future relative to 27 Jul "today"
    expect(await screen.findByRole('heading', { name: /Wednesday 29 July/ })).toBeInTheDocument()
    expect(screen.getByText('Projected')).toBeInTheDocument()
    expect(screen.getByText(/each weekday's session is fixed/)).toBeInTheDocument()
    // No readiness-adjustment language ever appears on a future day.
    expect(screen.queryByText(/Adjusted for readiness/)).toBeNull()
  })

  it('activity day: title and items, same vocabulary as Today at list scale', async () => {
    // origin: 'imported' — a synthetic fixture, not the real seed's own
    // Tuesday content; see TodayPage.activity.test.tsx's fixture comment.
    await programRepo.put({
      ...seedProgram,
      origin: 'imported',
      weekdayActivities: {
        2: {
          kind: 'recovery',
          title: 'Recovery walk & stretch',
          items: [{ label: '30-minute easy walk', detail: 'conversational pace' }],
        },
      },
    })
    renderDay('2026-07-21') // Tuesday, second day of the phase
    expect(await screen.findByRole('heading', { name: /Tuesday 21 July/ })).toBeInTheDocument()
    expect(screen.getByText('Recovery')).toBeInTheDocument()
    expect(screen.getByText('Recovery walk & stretch')).toBeInTheDocument()
    expect(screen.getByText('30-minute easy walk')).toBeInTheDocument()
    expect(screen.getByText(/conversational pace/)).toBeInTheDocument()
  })

  it('past scheduled day, nothing logged: honest empty state, never a fabricated session', async () => {
    renderDay('2026-07-24') // Friday, scheduled, nothing logged
    expect(await screen.findByRole('heading', { name: /Friday 24 July/ })).toBeInTheDocument()
    expect(
      screen.getByText('Nothing was logged this day — nothing was lost. This weekday still offers the same session next time.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Chest & Back')).toBeNull()
    expect(screen.queryByText('Legs & Core')).toBeNull()
    expect(screen.queryByText('Shoulders & Arms')).toBeNull()
  })

  it('unknown/out-of-phase date: quiet message and a back link, never a crash', async () => {
    renderDay('2099-01-01')
    expect(await screen.findByText("This date isn't part of this phase.")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Plan/ })).toBeInTheDocument()
  })

  it('a malformed date in the URL never crashes — same quiet message', async () => {
    renderDay('not-a-date')
    expect(await screen.findByText("This date isn't part of this phase.")).toBeInTheDocument()
  })

  it("today's date redirects to Today rather than duplicating it", async () => {
    renderDay('2026-07-27')
    expect(await screen.findByText('TODAY PROBE')).toBeInTheDocument()
  })
})

describe('PlanDayPage navigation round-trip', () => {
  it('Plan → day → exercise → back → back returns cleanly through each step', async () => {
    await putCompletedWorkout('2026-07-22')
    render(
      <MemoryRouter initialEntries={['/plan']}>
        <Routes>
          <Route path="/" element={<p>TODAY PROBE</p>} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/plan/:date" element={<PlanDayPage />} />
          <Route path="/library/:exerciseId" element={<ExercisePage />} />
        </Routes>
      </MemoryRouter>,
    )

    await userEvent.click(await screen.findByRole('link', { name: /Wed 22 Jul/ }))
    expect(await screen.findByRole('heading', { name: /Wednesday 22 July/ })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Goblet squat' }))
    expect(await screen.findByRole('heading', { name: 'Goblet squat' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: /Day/ }))
    expect(await screen.findByRole('heading', { name: /Wednesday 22 July/ })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: /Plan/ }))
    expect(await screen.findByRole('heading', { name: 'Phase 1 — Home' })).toBeInTheDocument()
  })
})
