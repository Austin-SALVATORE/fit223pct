import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { TodayPage } from './TodayPage'

/**
 * Days without a scheduled session must still offer a way into Workout
 * Mode — a quiet secondary affordance, never competing with the rest-day
 * framing. Session identity derives from completed count, so an early
 * start simply advances the rotation; nothing is skipped.
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  await seedDatabase()
})

afterAll(async () => {
  vi.useRealTimers()
  await db.checkins.clear()
})

afterEach(async () => {
  await db.workouts.clear()
})

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/workout" element={<p>Workout mode</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Early start on unscheduled days', () => {
  it('offers a quiet start on a rest day and enters workout mode with the next session', async () => {
    vi.setSystemTime(new Date(2026, 6, 23, 9, 0, 0)) // Thursday — rest day
    renderApp()

    // Thursday carries the seed's optional-recovery activity — the
    // early-start affordance must coexist with the activity hero.
    expect(
      await screen.findByRole('heading', { name: 'Optional recovery' }),
    ).toBeInTheDocument()
    const early = await screen.findByRole('button', { name: 'Start this session now' })
    await userEvent.click(early)

    expect(await screen.findByText('Workout mode')).toBeInTheDocument()
    const workouts = await db.workouts.toArray()
    expect(workouts).toHaveLength(1)
    expect(workouts[0].date).toBe('2026-07-23')
    // Weekday-pinned: the next training day from Thursday is Friday —
    // Shoulders & Arms, always, regardless of completed count.
    expect(workouts[0].sessionTemplateId).toBe('shoulders-arms')
  })

  it('offers the same quiet start before the program has begun', async () => {
    vi.setSystemTime(new Date(2026, 6, 19, 9, 0, 0)) // Sunday — 1 day before start
    renderApp()

    expect(await screen.findByText('Starts tomorrow')).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: 'Start this session now' }),
    ).toBeInTheDocument()
  })

  it('keeps the training day primary CTA — no duplicate quiet affordance', async () => {
    vi.setSystemTime(new Date(2026, 6, 22, 9, 0, 0)) // Wednesday — training day
    renderApp()

    expect(await screen.findByRole('button', { name: 'Start session' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start this session now' })).toBeNull()
  })

  it('applies readiness to an early start exactly as a training day would', async () => {
    vi.setSystemTime(new Date(2026, 6, 23, 9, 0, 0)) // Thursday — rest day
    renderApp()

    for (const label of ['Sleep', 'Energy', 'Freshness', 'Calm', 'Motivation']) {
      await userEvent.click(await screen.findByRole('button', { name: `${label}: 2` }))
    }

    // Preview carries the canonical label, and the started workout carries
    // the adjusted prescription and the readiness snapshot — the M3 contract
    // holds on unscheduled days too
    expect(await screen.findByText('Adjusted for readiness')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Start this session now' }))

    expect(await screen.findByText('Workout mode')).toBeInTheDocument()
    const [workout] = await db.workouts.toArray()
    expect(workout.readiness?.tier).toBe('easier')
    expect(workout.readiness?.drivers).toContain('sleep')
    /*
      Shoulders & Arms is now a ladder-only session (coach recalibration,
      31 Jul — docs/programs/phase-1-home-v3-shoulders-arms-revision.md), so
      the mechanism that produces "Adjusted for readiness" here is every
      ladder losing its top rung, not an accessory's `sets` being trimmed
      by one — `applyReadiness` (adjustments.ts) branches on `item.setPlan`
      before it ever looks at `role`.

      The rung floor moved from two to one (owner ruling,
      docs/design/Mesocycle2Implementation.md §5), so **every** ladder in
      this session now eases on a low-readiness day — including the
      2-rung accessories, which used to sit exactly at the old floor and
      were the one thing an easier day left untouched here. That the
      old floor case now also eases is the whole point of the ruling, so
      each assertion below is checked against the *authored* ladder's own
      top rung sliced off, not a literal length — `toHaveLength(N)` alone
      can't tell "eased from N+1" apart from "was already N and untouched",
      and a mutation test proved exactly that for the 3-rung case below:
      shrinking the seed's own ladder to match the expected post-ease
      length left the assertion green for the wrong reason.
    */
    function authoredSetPlan(exerciseId: string) {
      return seedProgram.sessions
        .find((s) => s.id === 'shoulders-arms')
        ?.items.find((i) => i.exerciseId === exerciseId)?.setPlan
    }

    const authoredMainLift = authoredSetPlan('dumbbell-shoulder-press')
    expect(authoredMainLift).toHaveLength(3)
    const mainLift = workout.exercises.find((e) => e.exerciseId === 'dumbbell-shoulder-press')
    expect(mainLift?.prescription.setPlan).toEqual(authoredMainLift?.slice(0, -1))

    // The one-time floor case: dumbbell-lateral-raise is a 2-rung ladder,
    // and until this ruling that meant "already at the floor, untouched."
    // Now it eases down to its single surviving rung, same mechanism as
    // every other ladder in the session.
    const authoredAccessory = authoredSetPlan('dumbbell-lateral-raise')
    expect(authoredAccessory).toHaveLength(2)
    const accessory = workout.exercises.find((e) => e.exerciseId === 'dumbbell-lateral-raise')
    expect(accessory?.prescription.setPlan).toEqual(authoredAccessory?.slice(0, -1))
    expect(accessory?.prescription.sets).toBe(1)

    // overhead-triceps-extension is the coach's one *three*-rung accessory
    // — unaffected by the floor moving (it was never at either floor), so
    // it drops its top rung exactly as it did before this ruling.
    const authoredTriceps = authoredSetPlan('overhead-triceps-extension')
    expect(authoredTriceps).toHaveLength(3)
    const triceps = workout.exercises.find((e) => e.exerciseId === 'overhead-triceps-extension')
    expect(triceps?.prescription.setPlan).toEqual(authoredTriceps?.slice(0, -1))

    await db.checkins.clear()
  })

  it('offers no start of any kind once the phase has ended', async () => {
    // 14 Sep — the day after mesocycle-2-build's endDate (13 Sep). Mesocycle
    // 2 Deload (14-20 Sep) is deliberately not seeded yet
    // (docs/design/Mesocycle2Implementation.md §11.2), so this date still
    // has no active or upcoming program — 11 Aug no longer works for this
    // assertion now that mesocycle-2-build covers it.
    vi.setSystemTime(new Date(2026, 8, 14, 9, 0, 0))
    renderApp()

    // getActive falls back to the ended program (not undefined), so the
    // phase-complete state is reachable instead of reading as if no
    // program had ever existed.
    expect(await screen.findByText('Phase complete')).toBeInTheDocument()
    expect(screen.getByText("That's a wrap on this phase")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start this session now' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Start session' })).toBeNull()
  })
})
