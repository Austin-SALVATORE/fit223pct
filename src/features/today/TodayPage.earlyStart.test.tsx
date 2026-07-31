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
      the mechanism that produces "Adjusted for readiness" here is the
      3-rung shoulder-press ladder losing its top rung, not an accessory's
      `sets` being trimmed by one — `applyReadiness` (adjustments.ts)
      branches on `item.setPlan` before it ever looks at `role`, and a
      ladder floors at 2 rungs.
    */
    const mainLift = workout.exercises.find((e) => e.exerciseId === 'dumbbell-shoulder-press')
    expect(mainLift?.prescription.setPlan).toHaveLength(2)
    // The accessories are 2-rung ladders too now, and 2 is already the
    // floor `applyReadiness` won't go below — so unlike before this
    // conversion, an easier day leaves them untouched rather than trimming
    // a set. Asserting `setPlan` stays exactly the authored two rungs is
    // the regression guard: silently reverting to rep-range-shaped
    // trimming here would corrupt a ladder's rung count instead of a
    // rep-range prescription's `sets` field.
    const accessory = workout.exercises.find((e) => e.exerciseId === 'dumbbell-lateral-raise')
    expect(accessory?.prescription.setPlan).toHaveLength(2)
    expect(accessory?.prescription.sets).toBe(2)
    // overhead-triceps-extension is the one accessory the coach's spec
    // prescribes as a *three*-rung ladder — unlike the other two, it isn't
    // already at MIN_LADDER_RUNGS, so an easier day drops its top rung same
    // as the main lift, the one place in this session where accessory
    // easing still does something.
    //
    // Asserted against the *authored* ladder's own top rung sliced off,
    // not a literal length — `toHaveLength(2)` alone can't tell "eased
    // from 3" apart from "was already 2 and untouched", and a mutation
    // test proved exactly that: shrinking the seed's own ladder to two
    // rungs left this assertion green for the wrong reason.
    const authoredTriceps = seedProgram.sessions
      .find((s) => s.id === 'shoulders-arms')
      ?.items.find((i) => i.exerciseId === 'overhead-triceps-extension')
    expect(authoredTriceps?.setPlan).toHaveLength(3)
    const triceps = workout.exercises.find((e) => e.exerciseId === 'overhead-triceps-extension')
    expect(triceps?.prescription.setPlan).toEqual(authoredTriceps?.setPlan?.slice(0, -1))

    await db.checkins.clear()
  })

  it('offers no start of any kind once the phase has ended', async () => {
    vi.setSystemTime(new Date(2026, 7, 11, 9, 0, 0)) // 11 Aug — after endDate, Phase 2 not authored yet
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
