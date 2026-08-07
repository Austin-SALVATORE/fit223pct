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
    // Weekday-pinned: the next training day from Thursday is now Saturday
    // — Friday dropped its pin and its trainingWeekdays membership (7 Aug
    // ruling, Option A; seed/program.ts's dated comment beside
    // `weekdaySessions`), so the search lands on Saturday's own pin,
    // Legs & Core (the same session already pinned on Wednesday) —
    // always, regardless of completed count.
    expect(workouts[0].sessionTemplateId).toBe('legs-core')
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
      Re-anchored 7 Aug (Option A): Thursday's early start now reaches
      Legs & Core, not Shoulders & Arms — Friday dropped its pin, and
      shoulders-arms is no longer pinned to any weekday at all for the
      rest of this phase (seed/program.ts's dated comment). The mechanism
      under test — early start applies readiness exactly as a training
      day would, easing a ladder by dropping its top rung, via
      `applyReadiness` branching on `item.setPlan` before it looks at
      `role` — is unchanged; only the session supplying the ladders is.

      Legs & Core has no 2-rung ladder, so the "floor moved from two to
      one" edge case shoulders-arms used to demonstrate here
      (docs/design/Mesocycle2Implementation.md §5) is no longer reachable
      through this early-start path — shoulders-arms itself is
      unreachable from any weekday now. That mechanism is still covered
      generically at the domain level (src/domain/adjustments.test.ts),
      independent of which seeded session happens to carry a 2-rung
      ladder; this test keeps proving the *integration* path (early start
      → readiness → a real ladder loses its top rung) against whichever
      session that path now resolves to. Each assertion is checked
      against the *authored* ladder's own top rung sliced off, not a
      literal length — `toHaveLength(N)` alone can't tell "eased from
      N+1" apart from "was already N and untouched".
    */
    function authoredSetPlan(exerciseId: string) {
      return seedProgram.sessions
        .find((s) => s.id === 'legs-core')
        ?.items.find((i) => i.exerciseId === exerciseId)?.setPlan
    }

    const authoredMainLift = authoredSetPlan('goblet-squat')
    expect(authoredMainLift).toHaveLength(3)
    const mainLift = workout.exercises.find((e) => e.exerciseId === 'goblet-squat')
    expect(mainLift?.prescription.setPlan).toEqual(authoredMainLift?.slice(0, -1))

    // bulgarian-split-squat — legs-core's other three-rung ladder, same
    // mechanism, proving this isn't specific to one exercise.
    const authoredSecondLift = authoredSetPlan('bulgarian-split-squat')
    expect(authoredSecondLift).toHaveLength(3)
    const secondLift = workout.exercises.find((e) => e.exerciseId === 'bulgarian-split-squat')
    expect(secondLift?.prescription.setPlan).toEqual(authoredSecondLift?.slice(0, -1))

    await db.checkins.clear()
  })

  it('offers no start of any kind once the phase has ended', async () => {
    // 14 Sep — past mesocycle-2-build's endDate (6 Sep, corrected 7 Aug —
    // the coach's four-week block ending before the 7 Sep travel).
    // Mesocycle 2 Deload (14-20 Sep) is deliberately not seeded yet
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
