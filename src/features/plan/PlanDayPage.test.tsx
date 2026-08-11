import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram, mesocycle2Build } from '@/data/seed/program'
import { programRepo } from '@/data/repositories'
import { createWorkout, logSet, completeWorkout } from '@/domain/workout'
import manifest from '@/data/generated/asset-manifest.json'
import { PlanPage } from './PlanPage'
import { PlanDayPage } from './PlanDayPage'
import { ExercisePage } from '@/features/library/ExercisePage'

const gobletSquatThumbnailHash = (manifest as Record<string, { thumbnailHash?: string }>)['goblet-squat']
  .thumbnailHash

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
  workout = logSet(
    workout,
    0,
    {
      weightKg: 20,
      reps: 10,
      seconds: null,
      completedAt: `${date}T09:10:00.000Z`,
    },
    0,
  )
  workout = logSet(
    workout,
    0,
    {
      weightKg: 20,
      reps: 9,
      seconds: null,
      completedAt: `${date}T09:15:00.000Z`,
    },
    1,
  )
  workout = completeWorkout(workout, `${date}T09:40:00.000Z`)
  await db.workouts.put(workout)
}

/**
 * Simulates a logged exercise whose id no longer resolves in the Library
 * (removed, or a stale reference) — exercises LoggedExerciseRow's
 * defensive fallback, which has no exercise to link to.
 */
async function putCompletedWorkoutWithUnknownExercise(date: string) {
  let workout = createWorkout({
    id: `w-unknown-${date}`,
    programId: seedProgram.id,
    session: seedProgram.sessions[1],
    date,
    startedAt: `${date}T09:00:00.000Z`,
  })
  workout = logSet(
    workout,
    0,
    {
      weightKg: 20,
      reps: 10,
      seconds: null,
      completedAt: `${date}T09:10:00.000Z`,
    },
    0,
  )
  workout = completeWorkout(workout, `${date}T09:20:00.000Z`)
  workout = {
    ...workout,
    exercises: workout.exercises.map((e, i) =>
      i === 0 ? { ...e, exerciseId: 'retired-exercise-id' } : e,
    ),
  }
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

/**
 * docs/design/SessionSetCustomization.md §4, "Skipped this session
 * surfaces in four places" — this is history's ("In history").
 */
describe('PlanDayPage: custom sets and skipped levels in history', () => {
  it('marks a custom set inline, and shows a separate line for a skipped level', async () => {
    let workout = createWorkout({
      id: 'w-custom-skip',
      programId: seedProgram.id,
      session: seedProgram.sessions[1], // Legs & Core, item 0 = goblet-squat
      date: '2026-07-22',
      startedAt: '2026-07-22T09:00:00.000Z',
    })
    // Level 0 skipped; level 1 done; a custom set logged after it.
    workout = logSet(
      workout,
      0,
      { weightKg: 12, reps: 10, seconds: null, completedAt: '2026-07-22T09:10:00.000Z' },
      1,
    )
    workout = logSet(
      workout,
      0,
      { weightKg: 10, reps: 12, seconds: null, completedAt: '2026-07-22T09:15:00.000Z', custom: true },
      3,
    )
    workout = {
      ...completeWorkout(workout, '2026-07-22T09:40:00.000Z'),
      exercises: [
        { ...workout.exercises[0], skippedLevels: [0], customSlots: 1 },
        ...workout.exercises.slice(1),
      ],
    }
    await db.workouts.put(workout)
    renderDay('2026-07-22')

    expect(await screen.findByRole('heading', { name: /Wednesday 22 July/ })).toBeInTheDocument()
    expect(screen.getByText(/12 × 10 kg \(Custom\)/)).toBeInTheDocument()
    expect(screen.getByText('1 level skipped')).toBeInTheDocument()
  })

  it('shows neither marker for a plain logged exercise — unchanged behavior', async () => {
    await putCompletedWorkout('2026-07-22')
    renderDay('2026-07-22')

    await screen.findByRole('heading', { name: /Wednesday 22 July/ })
    expect(screen.queryByText(/\(Custom\)/)).toBeNull()
    expect(screen.queryByText(/level skipped/)).toBeNull()
  })

  /**
   * QA finding (blocking) — a fully-skipped exercise (every prescribed
   * level in skippedLevels, zero logged sets) vanished from history
   * entirely: the row filter was `sets.length > 0`, and plannedSetIndices
   * correctly returns [] here, so sets never grows past 0. Coach spec §4:
   * "retain it in the audit history" — the worst case, not an edge one.
   */
  it('shows a fully-skipped exercise — every prescribed level skipped, zero logged sets', async () => {
    let workout = createWorkout({
      id: 'w-fully-skipped',
      programId: seedProgram.id,
      session: seedProgram.sessions[1], // Legs & Core, item 0 = goblet-squat (3-rung ladder)
      date: '2026-07-22',
      startedAt: '2026-07-22T09:00:00.000Z',
    })
    workout = {
      ...completeWorkout(workout, '2026-07-22T09:05:00.000Z'),
      exercises: [
        { ...workout.exercises[0], skippedLevels: [0, 1, 2] },
        ...workout.exercises.slice(1),
      ],
    }
    await db.workouts.put(workout)
    renderDay('2026-07-22')

    expect(await screen.findByRole('heading', { name: /Wednesday 22 July/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Goblet squat' })).toBeInTheDocument()
    expect(screen.getByText('3 levels skipped')).toBeInTheDocument()
  })
})

/**
 * Owner-reported defect (11 Aug plan) — a day that was started, had sets
 * logged, and never finished used to be indistinguishable from a
 * genuinely skipped day: the domain fallback hardcoded `workout: null,
 * session: null`, discarding the logged work. Fixed at the domain layer
 * (schedule.ts) plus this new detail branch, landed in the same commit —
 * shipping the domain fix alone would have made `ProjectedDetail` render
 * a *prescription* for a past day once `day.session` stopped being null,
 * which is worse than today's "nothing logged".
 */
describe('PlanDayPage: an attempted day (started, not finished)', () => {
  async function putAbandonedWorkout(date: string, loggedSets: boolean) {
    let workout = createWorkout({
      id: `w-abandoned-${date}`,
      programId: seedProgram.id,
      session: seedProgram.sessions[1], // Legs & Core, item 0 = goblet-squat
      date,
      startedAt: `${date}T09:00:00.000Z`,
    })
    if (loggedSets) {
      workout = logSet(
        workout,
        0,
        { weightKg: 20, reps: 10, seconds: null, completedAt: `${date}T09:10:00.000Z` },
        0,
      )
    }
    workout = { ...workout, abandonedAt: `${date}T20:00:00.000Z` }
    await db.workouts.put(workout)
  }

  it('shows the started-not-finished heading, the session, and the logged sets — not a Projected prescription', async () => {
    await putAbandonedWorkout('2026-07-22', true) // Wednesday
    renderDay('2026-07-22')

    expect(await screen.findByRole('heading', { name: /Wednesday 22 July/ })).toBeInTheDocument()
    expect(screen.getByText('You started this session')).toBeInTheDocument()
    expect(screen.getByText('Legs & Core')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Goblet squat' })).toBeInTheDocument()
    expect(screen.getByText('10 × 20 kg')).toBeInTheDocument()
    expect(screen.queryByText('Projected')).toBeNull()
    expect(screen.queryByText(/RIR/)).toBeNull()
  })

  /**
   * Edge case named in the plan: a workout row can exist with zero logged
   * sets (started, left immediately, closed at next boot). Handled at the
   * domain layer (schedule.ts treats it as a genuine skip), so this
   * screen never even receives a workout to build an attempted-day
   * detail from — it falls through to the ordinary "nothing logged" copy.
   */
  it('a zero-set workout never reaches the attempted detail — the domain layer treats it as a skip', async () => {
    await putAbandonedWorkout('2026-07-22', false)
    renderDay('2026-07-22')

    expect(await screen.findByRole('heading', { name: /Wednesday 22 July/ })).toBeInTheDocument()
    expect(screen.queryByText('You started this session')).toBeNull()
    expect(screen.getByText(/Nothing was logged this day/)).toBeInTheDocument()
  })
})

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

  /**
   * QA finding (7 Aug) on `b7123b7`: `CompletedDetail`'s activity render
   * had no guard — every completed-workout fixture up to this point used
   * the plain seedProgram, whose weekdayActivities live only on weekdays
   * 2/4/6/7, never on its own training weekdays (1/3/5). No shipped test
   * could ever reach a completed training day that also carries an
   * activity, so nothing would have caught it disappearing again. Mirrors
   * `ProjectedDetail`'s own regression test below, including the
   * `compareDocumentPosition` check — presence alone would not catch a
   * reorder.
   */
  it('a completed workout day whose weekday also carries an activity renders both — session first, activity second', async () => {
    await programRepo.put({
      ...seedProgram,
      origin: 'imported',
      weekdayActivities: {
        3: {
          kind: 'recovery',
          title: 'Zone 2 ride',
          items: [{ label: 'Zone 2 ride', detail: '30 min, after lifting' }],
        },
      },
    })
    await putCompletedWorkout('2026-07-22') // Wednesday — a training day
    renderDay('2026-07-22')

    expect(await screen.findByRole('heading', { name: /Wednesday 22 July/ })).toBeInTheDocument()

    const sessionName = screen.getByText('Legs & Core')
    expect(sessionName).toBeInTheDocument()

    // The activity is present too — secondary to the session, never a
    // replacement of it.
    expect(screen.getByText('Recovery')).toBeInTheDocument()
    const activityTitle = screen.getByText('Zone 2 ride')
    expect(activityTitle).toBeInTheDocument()
    // D3 (7 Aug device pass): the block used to show a title and nothing
    // else — no duration, so two different rides read identically here.
    expect(screen.getByText('30 min, after lifting')).toBeInTheDocument()

    // Session still wins the primary position: it precedes the activity
    // in document order.
    expect(
      sessionName.compareDocumentPosition(activityTitle) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
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

  /**
   * docs/design/ActivityPrescriptionPhaseA.md §4.1 originally pinned this
   * order — session before activity — as *exclusion*: the activity must
   * not appear at all on a training day, because `weekdayActivities` newly
   * claiming a training weekday was previously unrepresentable and
   * `day.activity` was checked before `day.session` on the assumption the
   * two were mutually exclusive.
   *
   * That exclusion is superseded (6 Aug) — the owner reported the ride
   * missing from Mesocycle 2's day detail (it already showed on the Plan
   * *list*, `PlanPage.tsx`, `e793e80`), and the ruling was "the day detail
   * shows both — session first, activity secondary." Session still wins
   * the primary position; what changed is that the activity is no longer
   * hidden. See PlanDayPage.tsx:102-113's updated comment.
   */
  it('a training day whose weekday carries an activity renders the session detail first, the activity second — never a replacement', async () => {
    await programRepo.put({
      ...seedProgram,
      origin: 'imported',
      weekdayActivities: {
        1: {
          kind: 'recovery',
          title: 'Zone 2 ride',
          items: [{ label: 'Zone 2 ride', detail: '30 min, after lifting' }],
        },
      },
    })
    renderDay('2026-08-03') // Monday, future relative to 27 Jul "today" — a training day
    expect(await screen.findByRole('heading', { name: /Monday 3 August/ })).toBeInTheDocument()

    const sessionHeading = screen.getByRole('heading', { level: 2, name: 'Chest & Back' })
    expect(sessionHeading).toBeInTheDocument()

    // The activity is present too — secondary to the session, not the
    // replacement this test used to assert.
    expect(screen.getByText('Recovery')).toBeInTheDocument()
    const activityTitle = screen.getByText('Zone 2 ride')
    expect(activityTitle).toBeInTheDocument()
    // D3 (7 Aug device pass): the block used to show a title and nothing
    // else — no duration, so two different rides read identically here.
    expect(screen.getByText('30 min, after lifting')).toBeInTheDocument()

    // Session still wins the primary position: it precedes the activity
    // in document order.
    expect(
      sessionHeading.compareDocumentPosition(activityTitle) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  /**
   * `ActivitySecondary` renders only `localized.items[0]?.detail` — a
   * shortcut whose docblock justified it by "every seeded training-day
   * activity is a single item". As of the M2 revision, `mesocycle2Build`'s
   * training weekdays (1/3/5) each carry a second item — the
   * session-specific stretching prescription — which this drops
   * silently. Uses the real seed content (no fixture override) so the
   * production data is what's under test.
   */
  describe('mesocycle2Build training day activity has two items', () => {
    beforeAll(async () => {
      await programRepo.put(mesocycle2Build)
    })

    afterAll(async () => {
      await db.programs.delete(mesocycle2Build.id)
    })

    it('shows both — the ride and the session-specific stretch item', async () => {
      renderDay('2026-08-10') // Monday, mesocycle2Build's startDate — its first training day
      expect(await screen.findByRole('heading', { name: /Monday 10 August/ })).toBeInTheDocument()

      expect(screen.getByRole('heading', { level: 2, name: 'Chest & Back' })).toBeInTheDocument()

      // First item — unchanged.
      expect(screen.getByText('Zone 2 ride')).toBeInTheDocument()
      expect(screen.getByText(/20 min, after lifting/)).toBeInTheDocument()

      // Second item — the stretching prescription, currently invisible.
      expect(screen.getByText('Chest & Back Stretching')).toBeInTheDocument()
      expect(
        screen.getByText(/Wall chest stretch, lat stretch, cross-body shoulder stretch/),
      ).toBeInTheDocument()
    })
  })

  /**
   * The pre-strength warm-up preview (11 Aug plan §4b) — same tertiary,
   * preview-only treatment as `MorningActivationPreview`, beside it and
   * before the session. Uses the real seed content (mesocycle2-chest-
   * back's shipped `warmupId`), no fixture override.
   */
  describe('mesocycle2Build training day carries a warm-up preview', () => {
    beforeAll(async () => {
      await programRepo.put(mesocycle2Build)
    })

    afterAll(async () => {
      await db.programs.delete(mesocycle2Build.id)
    })

    it('shows the warm-up above the session, with the ramp-up loads as text', async () => {
      renderDay('2026-08-10') // Monday, mesocycle2Build's startDate — its first training day
      expect(await screen.findByRole('heading', { name: /Monday 10 August/ })).toBeInTheDocument()

      const warmupHeading = screen.getByText('Warm-up')
      expect(warmupHeading).toBeInTheDocument()
      expect(screen.getByText('Easy cycling · 2–3 min')).toBeInTheDocument()
      expect(screen.getByText('Scapular push-up')).toBeInTheDocument()
      expect(screen.getByText('5.2 kg per dumbbell × 8')).toBeInTheDocument()
      expect(screen.getByText('8.2 kg per dumbbell × 5')).toBeInTheDocument()

      // Warm-up precedes the session in document order — same hierarchy
      // as Today's own Activation → Warm-up → Strength flow.
      const sessionHeading = screen.getByRole('heading', { level: 2, name: 'Chest & Back' })
      expect(
        warmupHeading.compareDocumentPosition(sessionHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })
  })

  /**
   * Owner-reported defect (M2 revision transcription plan, Phase 5):
   * `ScheduleDay` carries no `activation` field, so the Plan day detail
   * never rendered `Program.morningActivation` at all — Today already
   * did (`DoneTodayActivities`). Fixed by reading `morningActivation`
   * straight off `program` at this UI call site, the same pattern
   * Today's own code already uses.
   */
  it('a future training day carries the morning activation preview above the session', async () => {
    await programRepo.put({
      ...seedProgram,
      origin: 'imported',
      morningActivation: {
        kind: 'mobility',
        title: 'Morning Activation',
        items: [{ label: 'Cat-cow', detail: '6 controlled reps' }],
      },
    })
    renderDay('2026-08-03') // Monday, future relative to 27 Jul "today" — a training day
    expect(await screen.findByRole('heading', { name: /Monday 3 August/ })).toBeInTheDocument()

    const activationTitle = screen.getByText('Morning Activation')
    expect(activationTitle).toBeInTheDocument()
    expect(screen.getByText('Cat-cow')).toBeInTheDocument()
    expect(screen.getByText(/6 controlled reps/)).toBeInTheDocument()

    // Activation precedes the session in document order — quieter
    // styling, but ahead of it, matching Today's own order
    // (DoneTodayActivities renders activation above the ride).
    const sessionHeading = screen.getByRole('heading', { level: 2, name: 'Chest & Back' })
    expect(
      activationTitle.compareDocumentPosition(sessionHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('a completed day never renders the morning activation preview — CompletedDetail is out of scope', async () => {
    await programRepo.put({
      ...seedProgram,
      origin: 'imported',
      morningActivation: {
        kind: 'mobility',
        title: 'Morning Activation',
        items: [{ label: 'Cat-cow', detail: '6 controlled reps' }],
      },
    })
    await putCompletedWorkout('2026-07-22')
    renderDay('2026-07-22')

    expect(await screen.findByRole('heading', { name: /Wednesday 22 July/ })).toBeInTheDocument()
    expect(screen.queryByText('Morning Activation')).toBeNull()
  })

  it('past scheduled day, nothing logged: shows the day\'s own ride/stretch activity, never a fabricated session', async () => {
    // Friday now carries its own display-only activity (6 Aug content
    // batch — seed/program.ts's weekdayActivities comment), independent
    // of the strength session that went unlogged. This is not a
    // fabricated session: no session name ever appears, only the same
    // prescriptive, display-only ride/stretch content every other
    // activity day already renders regardless of completion.
    renderDay('2026-07-24') // Friday, scheduled, nothing logged
    expect(await screen.findByRole('heading', { name: /Friday 24 July/ })).toBeInTheDocument()
    // Friday's activity is recovery-shaped (owner ruling, 6 Aug: 40 min,
    // not the session's post-lift ride) — title is "Recovery day".
    expect(screen.getByRole('heading', { name: 'Recovery day' })).toBeInTheDocument()
    expect(screen.getByText(/40 min \(5 min easy warm-up, 5 min easy cool-down\)/)).toBeInTheDocument()
    expect(screen.queryByText('Chest & Back')).toBeNull()
    expect(screen.queryByText('Legs & Core')).toBeNull()
    expect(screen.queryByText('Shoulders & Arms')).toBeNull()
  })

  it('past scheduled day, nothing logged, weekday genuinely has no activity: honest empty state, never a fabricated session', async () => {
    // The real seed's every weekday now carries some activity (6 Aug
    // content batch), so the bare "nothing logged" fallback
    // (PlanDayPage.tsx's last branch) needs a program that genuinely has
    // none for the day, to keep that code path covered.
    //
    // Re-anchored from Friday to Monday 20 Jul (7 Aug ruling, Option A):
    // Friday dropped both its weekdaySessions pin and its trainingWeekdays
    // membership, so with weekdayActivities also cleared here it is no
    // longer "scheduled" by either test (projectSchedule.ts's dates loop:
    // `trainingWeekdays.includes(weekday) || weekdayActivities?.[weekday]`)
    // — the day stops existing in the schedule at all and the page falls
    // back to "This date isn't part of this phase.", not the bare-fallback
    // copy this test exists to cover. Monday is untouched by the amendment
    // and still exercises the same code path.
    await programRepo.put({ ...seedProgram, origin: 'imported', weekdayActivities: undefined })
    renderDay('2026-07-20') // Monday, scheduled, nothing logged
    expect(await screen.findByRole('heading', { name: /Monday 20 July/ })).toBeInTheDocument()
    expect(
      screen.getByText('Nothing was logged this day — nothing was lost. This weekday still offers the same session next time.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Chest & Back')).toBeNull()
    expect(screen.queryByText('Legs & Core')).toBeNull()
    expect(screen.queryByText('Shoulders & Arms')).toBeNull()
    expect(screen.queryByText('Zone 2 ride')).toBeNull()
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

/**
 * Owner request (5 Aug): a past-session exercise row must show its Library
 * thumbnail, and tapping either the thumbnail or the name opens the
 * existing Library entry — never a duplicate of its cues/concept.
 */
describe('PlanDayPage past-session thumbnails', () => {
  it('renders the Library thumbnail inside the exercise link, same asset as everywhere else', async () => {
    await putCompletedWorkout('2026-07-22')
    renderDay('2026-07-22')

    const link = await screen.findByRole('link', { name: 'Goblet squat' })
    const img = link.querySelector('img')
    expect(img).not.toBeNull()
    expect(img).toHaveAttribute('src', `/assets/exercises/goblet-squat/thumbnail.avif?v=${gobletSquatThumbnailHash}`)
    expect(img).toHaveAttribute('alt', '')
  })

  it('keeps the touch target at the 44px floor', async () => {
    await putCompletedWorkout('2026-07-22')
    renderDay('2026-07-22')

    const link = await screen.findByRole('link', { name: 'Goblet squat' })
    expect(link.className).toContain('min-h-11')
  })

  it('gives the name a truncate floor, not a free wrap that grows the row', async () => {
    // jsdom does not compute real layout, so this can only assert the
    // class contract, not pixels — but it is not a vacuous assertion:
    // measured live at 375px/fr against this exact commit, omitting
    // `truncate` here let "Extension triceps à la nuque avec haltère"
    // wrap onto two lines and grow the row instead of clipping, the same
    // class of defect SessionPreview's name column was fixed for (d19f38c).
    await putCompletedWorkout('2026-07-22')
    renderDay('2026-07-22')

    const link = await screen.findByRole('link', { name: 'Goblet squat' })
    const span = link.querySelector('span')
    expect(span?.className).toContain('truncate')
    // `truncate` alone does nothing on a flex child without this — the
    // span's automatic minimum width defaults to its content size, which
    // blocks `overflow-hidden` from ever having anything to clip.
    expect(span?.className).toContain('min-w-0')
  })

  it("excludes the logged numbers from the link's accessible name — they're data to read, not the action", async () => {
    await putCompletedWorkout('2026-07-22')
    renderDay('2026-07-22')

    // Exact match: getByRole with `name` defaults to exact, so this would
    // already fail if the sets text ("10 × 20 kg · 9 × 20 kg") had leaked
    // into the link. Asserting it explicitly rather than relying on the
    // absence of a failure elsewhere.
    const link = await screen.findByRole('link', { name: 'Goblet squat' })
    expect(link).not.toHaveTextContent('20 kg')
  })

  it('still shows a reserved thumbnail tile for a logged exercise no longer in the Library, without linking anywhere', async () => {
    await putCompletedWorkoutWithUnknownExercise('2026-07-22')
    renderDay('2026-07-22')

    expect(await screen.findByText('retired-exercise-id')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /retired-exercise-id/ })).toBeNull()
    // The empty-tile placeholder, not a broken <img> — same contract as
    // SessionPreview's thumbnails for an exercise with no resolvable asset.
    const row = screen.getByText('retired-exercise-id').closest('li')
    expect(row?.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    expect(row?.querySelector('img')).toBeNull()
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

/**
 * Owner-reported (iPhone, production PWA), QA-reproduced and root-caused
 * 7 Aug: navigate to Mesocycle 2 via PhaseNav, open a day, press back —
 * back landed on Phase 1 (the default phase), not Mesocycle 2. Root
 * cause: `/plan` and `/plan/:date` are sibling routes, and the viewed
 * phase lived in `PlanPage`'s own component state — a day-detail visit
 * remounts `PlanPage`, resetting it. Fix: the viewed phase moves into the
 * URL (`?program=<id>`), which survives back, forward, and a hard
 * refresh by construction (PlanPage.tsx's `dayHref`, PlanDayPage.tsx's
 * `BackToPlan`).
 */
describe('PlanDayPage navigation round-trip preserves the viewed phase (owner report, 7 Aug)', () => {
  beforeAll(async () => {
    await programRepo.put(mesocycle2Build)
  })

  afterAll(async () => {
    await db.programs.delete(mesocycle2Build.id)
  })

  it('Plan (Mesocycle 2) → day → back returns to Mesocycle 2, not the default phase', async () => {
    render(
      <MemoryRouter initialEntries={['/plan']}>
        <Routes>
          <Route path="/" element={<p>TODAY PROBE</p>} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/plan/:date" element={<PlanDayPage />} />
        </Routes>
      </MemoryRouter>,
    )

    // Starts on the default (active) phase — Phase 1, "today" is 27 Jul.
    expect(await screen.findByRole('heading', { name: 'Phase 1 — Home' })).toBeInTheDocument()

    await userEvent.click(await screen.findByRole('button', { name: /Mesocycle 2 — Build/ }))
    expect(await screen.findByRole('heading', { name: 'Mesocycle 2 — Build' })).toBeInTheDocument()

    // Mesocycle 2's own first training day (its startDate, a Monday).
    await userEvent.click(await screen.findByRole('link', { name: /Mon 10 Aug/ }))
    expect(await screen.findByRole('heading', { name: /Monday 10 August/ })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: /Plan/ }))
    expect(await screen.findByRole('heading', { name: 'Mesocycle 2 — Build' })).toBeInTheDocument()
  })

  it('a direct visit to /plan?program=mesocycle-2-build (the refresh-shaped case) renders Mesocycle 2 directly', async () => {
    render(
      <MemoryRouter initialEntries={['/plan?program=mesocycle-2-build']}>
        <Routes>
          <Route path="/plan" element={<PlanPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByRole('heading', { name: 'Mesocycle 2 — Build' })).toBeInTheDocument()
  })
})
