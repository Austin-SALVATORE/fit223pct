import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { workoutRepo } from '@/data/repositories'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout } from '@/domain/workout'
import type { LadderPrescription, LoggedSet, Workout } from '@/domain/types'
import { TodayPage } from './TodayPage'

/**
 * D7 (addendum §3.5). The start path must carry from the last NORMAL session
 * and, on an easier day, ease that carried plan — not carry the eased one.
 * `TodayPage.earlyStart.test.tsx` starts from an empty database, where carry
 * is a no-op, which is why it never saw the easier-day defect: these tests
 * seed history. Wed 22 Jul offers the session with the 3-rung goblet-squat.
 *
 * **Negative controls — two attempts, kept because the discarded one is the
 * instructive half** (`verification.md`: trace a control through the code as
 * it will be *after* the change).
 *  - *Prescribed by the plan, and NOT what these tests guard:* restore
 *    `session={adjusted.session}` at the `StartButton` call sites. Passing an
 *    already-eased session into carry-then-ease re-adds the dropped rung from
 *    the normal log and eases it away again, so the stored plan is identical
 *    and **neither test here goes red**. It is not fully absorbed: one
 *    pre-existing test, `TodayPage.earlyStart.test.tsx` "applies readiness to
 *    an early start exactly as a training day would", does go red at the
 *    unscheduled-day StartButton (`expected [{10,12}] to deeply equal
 *    [{10,12}, …(1)]`).
 *  - *Used here:* compose ease-then-carry inside `StartButton.start` instead
 *    of calling `prepareSessionForStart`. That reaches the branch directly and
 *    turns "an easier day stores the normal carried plan one rung shorter"
 *    red.
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 22, 9, 0, 0) })
  await seedDatabase()
})

afterAll(async () => {
  vi.useRealTimers()
  await db.checkins.clear()
})

afterEach(async () => {
  await db.workouts.clear()
  await db.checkins.clear()
})

const authored = seedProgram.sessions
  .flatMap((s) => s.items)
  .find((i) => i.exerciseId === 'goblet-squat') as LadderPrescription

function squatLog(count: number): LoggedSet[] {
  // Logged 2 kg ABOVE each authored rung, so a lost carry is visible.
  return authored.setPlan.slice(0, count).map((r, i) => ({
    setIndex: i,
    weightKg: (r.weightKg ?? 0) + 2,
    reps: r.reps,
    seconds: null,
    completedAt: '2026-07-15T10:00:00.000Z',
  }))
}

function pastWorkout(id: string, date: string, tier: 'ready' | 'easier'): Workout {
  const base = createWorkout({
    id,
    programId: seedProgram.id,
    session: seedProgram.sessions[1],
    date,
    startedAt: `${date}T09:00:00.000Z`,
  })
  const eased = tier === 'easier'
  const prescription = eased
    ? { ...authored, setPlan: authored.setPlan.slice(0, -1), sets: authored.sets - 1 }
    : authored
  return {
    ...base,
    completedAt: `${date}T10:00:00.000Z`,
    readiness: { tier, drivers: [] },
    exercises: base.exercises.map((e) =>
      e.exerciseId === 'goblet-squat' ? { ...e, prescription, sets: squatLog(prescription.sets) } : e,
    ),
  }
}

async function startFromToday(easier: boolean) {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/workout" element={<p>WORKOUT PROBE</p>} />
      </Routes>
    </MemoryRouter>,
  )
  await screen.findByRole('button', { name: 'Start session' })
  if (easier) {
    for (const label of ['Sleep', 'Energy', 'Freshness', 'Calm', 'Motivation']) {
      await userEvent.click(await screen.findByRole('button', { name: `${label}: 2` }))
    }
    await screen.findByText('Adjusted for readiness')
  }
  await userEvent.click(screen.getByRole('button', { name: 'Start session' }))
  await screen.findByText('WORKOUT PROBE')
  const stored = await workoutRepo.getActive()
  return stored?.exercises.find((e) => e.exerciseId === 'goblet-squat')
}

describe('starting a session after an easier-day workout', () => {
  it('a normal day carries the last NORMAL session, ignoring the later eased one', async () => {
    await db.workouts.bulkPut([pastWorkout('normal', '2026-07-15', 'ready'), pastWorkout('eased', '2026-07-18', 'easier')])

    const squat = await startFromToday(false)

    expect(squat?.prescription.sets).toBe(3)
    // The eased exposure (2 rungs) would leave rung 3 at its authored value.
    expect(squat?.prescription.setPlan?.map((r) => r.weightKg)).toEqual(
      authored.setPlan.map((r) => (r.weightKg ?? 0) + 2),
    )
  })

  it('an easier day stores the normal carried plan one rung shorter, not the eased authored plan carried', async () => {
    await db.workouts.put(pastWorkout('normal', '2026-07-15', 'ready'))

    const squat = await startFromToday(true)

    expect(squat?.prescription.sets).toBe(authored.sets - 1)
    expect(squat?.prescription.setPlan?.map((r) => r.weightKg)).toEqual(
      authored.setPlan.slice(0, -1).map((r) => (r.weightKg ?? 0) + 2),
    )
  })
})
