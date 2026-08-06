import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
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

    // Session still wins the primary position: it precedes the activity
    // in document order.
    expect(
      sessionHeading.compareDocumentPosition(activityTitle) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
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
    await programRepo.put({ ...seedProgram, origin: 'imported', weekdayActivities: undefined })
    renderDay('2026-07-24') // Friday, scheduled, nothing logged
    expect(await screen.findByRole('heading', { name: /Friday 24 July/ })).toBeInTheDocument()
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
