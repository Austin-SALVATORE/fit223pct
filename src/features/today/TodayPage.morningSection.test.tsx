import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram, mesocycle2Build } from '@/data/seed/program'
import { programRepo, settingsRepo } from '@/data/repositories'
import type { ScheduleShift, Workout } from '@/domain/types'
import { TodayPage } from './TodayPage'

/**
 * Morning Posture Reset — Phase 3 behavioural tests (plan
 * `~/.claude/plans/morning-posture-reset.md` §8's Phase 3). Renders
 * `TodayPage` end to end (real seeded data, real Dexie), asserting the
 * Morning section's actual placement guarantee: it sits above `TodayBody`'s
 * four-way branch and reads only settings, so it must render identically
 * regardless of which branch fires — the explicit anti-regression for the
 * 10 Aug `DoneTodayActivities` defect, where a section rendered only
 * inside `PlannedDay`'s training branch and vanished on completion.
 *
 * **A correction to plan §1.7, found while writing the Layer 5 test below,
 * verified against the actual code rather than assumed from the plan's own
 * prose.** §1.7 states that at 2026-09-07 (past Mesocycle 2's `endDate`,
 * no successor program), "`programRepo.getActive` returns undefined and
 * `TodayBody` falls to `NoProgram`". That is not what `getActive`
 * (`src/data/repositories.ts`) does: when neither a "current" nor an
 * "upcoming" program is found, it falls back to `[...programs].reverse()
 * .find(p => p.startDate <= dateKey)` — the most recent *past* program —
 * rather than returning `undefined`. With only the two seeded programs and
 * no successor, that fallback resolves to `mesocycle2Build` itself, so
 * `TodayData.program` is defined and `TodayBody` takes the `program`
 * branch, into `PlannedDay`, whose `resolveDayPlan` then correctly returns
 * `kind: 'ended'` (`dateKey > program.endDate`). The Morning section still
 * renders — the coach's persistence directive is not violated, because the
 * design's actual guarantee (render above the branch, read only settings)
 * never depended on which branch fires — but the *mechanism* named in
 * §1.7's prose is wrong, and the "renders on ended days" test below and
 * the Layer 5 test exercise the same real branch (`PlannedDay`'s `'ended'`
 * kind), not two different ones. Flagged in the phase report rather than
 * silently corrected in the plan.
 */

const MORNING_NAME_EN = 'Morning Posture Reset'

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<TodayPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function activatePostureReset(): Promise<void> {
  await settingsRepo.update({ morningPostureResetActivatedAt: '2026-08-27' })
}

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  vi.useRealTimers()
  await db.workouts.clear()
  await db.checkins.clear()
  await programRepo.put(seedProgram)
  await programRepo.put(mesocycle2Build)
  const settings = await db.settings.get('user')
  if (settings) await db.settings.put({ ...settings, morningPostureResetActivatedAt: null, scheduleShift: null })
})

afterAll(() => {
  vi.useRealTimers()
})

describe('the flag gate', () => {
  it('renders nothing when morningPostureResetActivatedAt is absent (default seed)', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 20, 9, 0, 0) }) // Monday 20 Jul — phase-1-home training day
    await seedDatabase()
    renderApp()

    expect(await screen.findByRole('button', { name: 'Start session' })).toBeInTheDocument()
    expect(screen.queryByText(MORNING_NAME_EN)).toBeNull()
  })
})

describe('renders in all four TodayBody branches — the 10 Aug DoneTodayActivities anti-regression', () => {
  it('activeWorkout branch', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 20, 9, 0, 0) })
    await seedDatabase()
    await activatePostureReset()
    const workout: Workout = {
      id: 'workout-in-progress',
      programId: 'phase-1-home',
      sessionTemplateId: 'chest-back',
      date: '2026-07-20',
      startedAt: '2026-07-20T09:00:00.000Z',
      completedAt: null,
      exercises: [],
    }
    await db.workouts.put(workout)
    renderApp()

    expect(await screen.findByRole('link', { name: 'Resume session' })).toBeInTheDocument()
    expect(screen.getByText(MORNING_NAME_EN)).toBeInTheDocument()
  })

  it('doneToday branch', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 20, 9, 0, 0) })
    await seedDatabase()
    await activatePostureReset()
    const workout: Workout = {
      id: 'workout-done-today',
      programId: 'phase-1-home',
      sessionTemplateId: 'chest-back',
      date: '2026-07-20',
      startedAt: '2026-07-20T09:00:00.000Z',
      completedAt: '2026-07-20T10:00:00.000Z',
      exercises: [],
    }
    await db.workouts.put(workout)
    renderApp()

    expect(await screen.findByText('Done for today')).toBeInTheDocument()
    expect(screen.getByText(MORNING_NAME_EN)).toBeInTheDocument()
  })

  it('program (PlannedDay) branch — an ordinary training day', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 20, 9, 0, 0) })
    await seedDatabase()
    await activatePostureReset()
    renderApp()

    expect(await screen.findByRole('button', { name: 'Start session' })).toBeInTheDocument()
    expect(screen.getByText(MORNING_NAME_EN)).toBeInTheDocument()
  })

  it('NoProgram branch — every program deleted', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 20, 9, 0, 0) })
    await seedDatabase()
    await activatePostureReset()
    await db.programs.clear()
    renderApp()

    expect(await screen.findByText(/No training program is set up yet/)).toBeInTheDocument()
    expect(screen.getByText(MORNING_NAME_EN)).toBeInTheDocument()
  })
})

describe('renders on every DayPlan kind, and a postpone-vacated day', () => {
  it('an upcoming day — before the active program\'s own startDate', async () => {
    // 15 Jul 2026: before phase-1-home's startDate (20 Jul), no earlier
    // program exists, so getActive resolves its "upcoming" candidate and
    // resolveDayPlan returns kind: 'upcoming'.
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 15, 9, 0, 0) })
    await seedDatabase()
    await activatePostureReset()
    renderApp()

    expect(await screen.findByText('First up')).toBeInTheDocument()
    expect(screen.getByText(MORNING_NAME_EN)).toBeInTheDocument()
  })

  it('an ended day — past the fallback-resolved program\'s own endDate, no successor (see this file\'s own docblock correction to plan §1.7)', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 8, 7, 9, 0, 0) }) // 7 Sep 2026
    await seedDatabase()
    await activatePostureReset()
    renderApp()

    expect(await screen.findByRole('heading', { name: "That's a wrap on this phase" })).toBeInTheDocument()
    expect(screen.getByText(MORNING_NAME_EN)).toBeInTheDocument()
  })

  it('a postpone-vacated day', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 14, 9, 0, 0) }) // Friday 14 Aug — mesocycle2Build training day
    await seedDatabase()
    await activatePostureReset()
    const settings = await db.settings.get('user')
    if (!settings) throw new Error('seedDatabase did not create a settings row')
    const shift: ScheduleShift = {
      programId: 'mesocycle-2-build',
      weekStart: '2026-08-10',
      fromDate: '2026-08-14',
      days: 1,
      createdAt: '2026-08-14T09:00:00.000Z',
    }
    await db.settings.put({ ...settings, scheduleShift: shift })
    renderApp()

    expect(await screen.findByText('Postponed')).toBeInTheDocument()
    expect(screen.getByText(MORNING_NAME_EN)).toBeInTheDocument()
  })
})

/**
 * Layer 5 — the mesocycle-boundary guard (plan §7.3c). The coach's
 * persistence directive (§1.7, doc 23 §10 — "Mesocycle 2 ending on 6
 * September must NOT remove or reset it") made checkable on the date it
 * matters. Exercises the same real branch as the "ended day" test above —
 * see this file's own docblock for the correction to §1.7's stated
 * mechanism — but this test's purpose is the persistence claim
 * specifically, not branch coverage, and it carries its own negative
 * control.
 *
 * **Made red on purpose, per §7.3c and team-roles.md — and the first
 * attempt did NOT work, which is itself part of the proof.** §7.3c
 * literally proposes gating on `program` instead of settings
 * (`{program && postureResetActive && <MorningSection />}`). Tried that
 * first: it stayed green, because — per this file's own docblock
 * correction — `program` is never `undefined` at 2026-09-07 with the real
 * seed; `getActive`'s fallback hands back the stale, ended
 * `mesocycle2Build` itself. A `program &&` gate cannot fail here, so it is
 * not actually a negative control for this scenario — a "clean" run of it
 * would have been a false reassurance (`verification.md`'s "an instrument
 * that cannot see the subject").
 *
 * **The mutation that actually reproduces the coupling defect**, verified
 * by running it: `{postureResetActive && program !== undefined &&
 * (program.endDate === null || todayKey <= program.endDate) &&
 * <MorningSection />}` — i.e. render only while the resolved program is
 * still inside its own active window. Run alone, this failed (Morning
 * Posture Reset absent, timed out waiting for the text), reverted;
 * quoted verbatim in the phase report.
 */
describe('Layer 5 — mesocycle boundary', () => {
  it('renders 2026-09-07, past Mesocycle 2\'s endDate, with no successor program active', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 8, 7, 9, 0, 0) })
    await seedDatabase()
    await activatePostureReset()
    renderApp()

    expect(await screen.findByText(MORNING_NAME_EN)).toBeInTheDocument()
  })
})
