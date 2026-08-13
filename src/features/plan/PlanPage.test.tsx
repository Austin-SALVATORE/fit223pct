import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram, mesocycle2Build } from '@/data/seed/program'
import { programRepo } from '@/data/repositories'
import i18n from '@/i18n/i18next'
import { createWorkout, logSet, completeWorkout } from '@/domain/workout'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { PlanPage } from './PlanPage'

/**
 * The honesty rule (docs/Plan.md) end-to-end: a skipped day never fabricates
 * a session, today's rotation position reflects real completed count (not
 * calendar position), and only future days carry the "Projected" label.
 */

beforeAll(async () => {
  // Monday 27 Jul — mid-phase, after a completed Wed and a skipped Fri.
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 27, 9, 0, 0) })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

afterEach(async () => {
  cleanup()
  await db.workouts.clear()
})

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/plan']}>
      <Routes>
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function putCompletedWorkout(date: string, session = seedProgram.sessions[0]) {
  let workout = createWorkout({
    id: `w-${date}`,
    programId: seedProgram.id,
    session,
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
  workout = completeWorkout(workout, `${date}T09:40:00.000Z`)
  await db.workouts.put(workout)
}

/**
 * A day that was started, had a set logged, and closed by
 * `closeStaleWorkouts` without ever completing — `completedAt` stays
 * null, `abandonedAt` records when it was closed (types.ts's own
 * docblock: "closing is not finishing").
 */
async function putAbandonedWorkout(date: string, session = seedProgram.sessions[0]) {
  let workout = createWorkout({
    id: `w-${date}`,
    programId: seedProgram.id,
    session,
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
  workout = { ...workout, abandonedAt: `${date}T20:00:00.000Z` }
  await db.workouts.put(workout)
}

describe('PlanPage', () => {
  it('opens Settings from the gear and returns to Plan', async () => {
    renderApp()
    await userEvent.click(await screen.findByRole('link', { name: 'Settings' }))
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: /Plan/ }))
    expect(await screen.findByRole('heading', { name: 'Phase 1 — Home' })).toBeInTheDocument()
  })

  it('renders the phase header with the fixed weekday-session summary', async () => {
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Phase 1 — Home' })).toBeInTheDocument()
    expect(await screen.findByText('20 Jul – 9 Aug')).toBeInTheDocument()
    // 7 Aug ruling (Option A): Friday dropped its pin, Saturday newly
    // pins Legs & Core (seed/program.ts's dated comment) — the summary
    // line is built straight off weekdaySessions, so it now shows the
    // same session twice, for Wed and Sat.
    expect(
      await screen.findByText('Mon Chest & Back · Wed Legs & Core · Sat Legs & Core'),
    ).toBeInTheDocument()
  })

  it('shows a skipped scheduled day\'s own ride/stretch activity, never "missed"', async () => {
    // Friday now carries its own display-only activity (6 Aug content
    // batch — coach §12/§14 rides now apply to the current program, see
    // seed/program.ts's weekdayActivities comment), independent of the
    // strength session that was skipped. Showing it is not fabricating a
    // session: it's the same prescriptive, display-only content every
    // other activity day already renders, never a completion claim.
    await putCompletedWorkout('2026-07-22', seedProgram.sessions[1]) // Wed = Legs & Core
    renderApp()
    expect(await screen.findByText('Wed 22 Jul')).toBeInTheDocument()
    const skippedRow = (await screen.findByText('Fri 24 Jul')).closest('li')
    expect(skippedRow).not.toBeNull()
    // Friday's activity is recovery-shaped (owner ruling, 6 Aug) — the row
    // shows its title, "Recovery day".
    expect(skippedRow).toHaveTextContent('Recovery day')
    // The row itself carries no guilt copy — the page-level honesty-rule
    // note (a different, neutral sentence) is allowed to use the word.
    expect(skippedRow).not.toHaveTextContent(/missed/i)
  })

  it('keeps today\'s pinned session fixed regardless of a skipped day earlier this week — no rotation to shift', async () => {
    await putCompletedWorkout('2026-07-22', seedProgram.sessions[1]) // Wed done, Fri skipped
    renderApp()
    // Weekday-pinned: Monday is always Chest & Back, whatever happened
    // earlier in the week — the property Phase 4 (schedule.ts) guarantees,
    // exercised here through the real seed.
    expect(await screen.findByText(/Mon 27 Jul/)).toBeInTheDocument()
    expect(await screen.findByText('Today')).toBeInTheDocument()
    const todayLink = screen.getByRole('link', { name: /Mon 27 Jul.*Today.*Chest & Back/s })
    expect(todayLink).toBeInTheDocument()
  })

  it('labels only future sessions as projected, with the pinned-mode explanatory line once', async () => {
    renderApp()
    const projectedLabels = await screen.findAllByText('Projected', { exact: false })
    expect(projectedLabels.length).toBeGreaterThan(1)
    expect(
      screen.getAllByText(/each weekday's session is fixed/).length,
    ).toBe(1)
  })

  it('shows a completed day\'s session and summary, never projected', async () => {
    await putCompletedWorkout('2026-07-22', seedProgram.sessions[1])
    renderApp()
    const row = (await screen.findByText('Wed 22 Jul')).closest('li')
    expect(row).not.toBeNull()
    expect(row).toHaveTextContent('Legs & Core')
    // Correctly singular now that the count is pluralized — previously
    // this always rendered "sets" regardless of count.
    expect(row).toHaveTextContent('1 set')
    expect(row).not.toHaveTextContent('Projected')
  })

  /**
   * Owner-reported defect (11 Aug plan): `if (day.workout)` at the top of
   * the completed branch had no `completedAt` check, so an attempted day
   * (started, sets logged, never finished) rendered the identical row a
   * completed day gets — the list claimed the day was finished. Fixed by
   * distinguishing on `completedAt === null` and adding a quiet qualifier
   * that is neither failure nor completion language.
   */
  it('shows a started-but-not-finished day as attempted, never as completed — real summary plus a distinct qualifier', async () => {
    await putAbandonedWorkout('2026-07-22', seedProgram.sessions[1]) // Wed = Legs & Core
    renderApp()
    const row = (await screen.findByText('Wed 22 Jul')).closest('li')
    expect(row).not.toBeNull()
    expect(row).toHaveTextContent('Legs & Core')
    // The logged set is a real fact, shown exactly as a completed day's is.
    expect(row).toHaveTextContent('1 set')
    // The qualifier that keeps this from reading as completed.
    expect(row).toHaveTextContent('Started — not finished')
  })

  it('links today\'s row back to Today', async () => {
    renderApp()
    const todayLink = await screen.findByRole('link', { name: /Today/ })
    await userEvent.click(todayLink)
    expect(await screen.findByText('TODAY PROBE')).toBeInTheDocument()
  })
})

/**
 * Device pass finding D1 (7 Aug) — 12 phantom `[i18n] missing key` errors
 * per `/plan` visit. `DayRow` calls `useLocalizedActivity` unconditionally
 * (`day.activity ?? EMPTY_ACTIVITY`) for hook-order stability; on a
 * training day with no `weekdayActivities` entry (phase-1-home's own
 * Mon/Wed/Fri), that placeholder round-trips through `t()` under a real
 * program id, exactly the "phantom missing key no translator could ever
 * fix" case `seedProgram.ts`'s own docblock (useProgramName) already
 * warns about for the empty-*program*-id guard. This is the same failure
 * one level down: an empty-*activity* placeholder under a real program id.
 */
describe('PlanPage — no phantom i18n missing-key noise', () => {
  afterEach(async () => {
    await programRepo.put(seedProgram) // restore the plain program
  })

  it('logs zero [i18n] missing key errors for a week of real seed content', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      renderApp()
      await screen.findByRole('heading', { name: 'Phase 1 — Home' })
      const i18nMissingKeyCalls = consoleError.mock.calls.filter((call) =>
        String(call[0]).includes('[i18n] missing key'),
      )
      expect(i18nMissingKeyCalls).toEqual([])
    } finally {
      consoleError.mockRestore()
    }
  })
})

describe('PlanPage rotation-mode rendering (an explicit opt-out from pinned scheduling)', () => {
  afterEach(async () => {
    await programRepo.put(seedProgram)
  })

  it('renders the alternating-rotation sentence for a program that opts into rotation mode', async () => {
    await programRepo.put({
      ...seedProgram,
      schedulingMode: 'rotation',
      rotation: ['chest-back', 'legs-core'],
    })
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Phase 1 — Home' })).toBeInTheDocument()
    expect(screen.queryByText(/each weekday's session is fixed/)).toBeNull()
    // rotationLine resolves rotation ids to session names (owner finding,
    // zh-CN, 7 Aug — fixed; see the dedicated describe block below for
    // the full-locale regression coverage against the real M2 program).
    // This fixture's ids happen to be seedProgram's own ('chest-back',
    // 'legs-core'), so the resolved names read "Chest & Back" / "Legs &
    // Core" here.
    //
    // No weekday clause (owner/coach ruling, 7 Aug — see PlanPage.tsx's
    // own comment on the rotationLine paragraph): rotation identity
    // follows completion order, never calendar day, and naming specific
    // weekdays here read as a binding rotation mode doesn't make.
    expect(
      await screen.findByText('Chest & Back and Legs & Core alternate in the order you complete them.'),
    ).toBeInTheDocument()
  })
})

/**
 * Owner device finding, zh-CN, Mesocycle 2, 7 Aug: the program header's
 * scheduling-description sentence rendered raw session ids —
 * "mesocycle2-chest-back、mesocycle2-legs-core和mesocycle2-shoulders-arms
 * 交替，周一/周三/周五" — instead of localized session names. Root cause:
 * `PhaseHeader`'s `rotationList` fed `program.rotation` (session ids)
 * straight into `Intl.ListFormat`, never resolving them through
 * `sessionName` the way `weekdaySessionsLine` already did a few lines
 * below. Locale-independent (ids don't change per locale), so all three
 * locales are covered here, not just the one the owner happened to meet
 * it in.
 *
 * Red-first (id leak), run 7 Aug 2026: before the `PhaseHeader` fix, the
 * zh-CN assertion failed —
 * `expected "…mesocycle2-chest-back、mesocycle2-legs-core和mesocycle2-shoulders-arms交替…"
 * not to match /mesocycle2-/` — reproducing the owner's exact paste.
 *
 * Same finding also surfaced a second, separate issue in the same
 * sentence — the owner/coach ruling that the weekday clause claimed a
 * calendar binding rotation mode doesn't have (rotation identity follows
 * completion order, "first completed strength day -> Session A", never
 * calendar day — the coach's own description of the model, verbatim).
 * `rotationLine` dropped `{{weekdays}}` entirely; the true weekday
 * rhythm stays visible where it's actually authoritative — the calendar
 * grid below this header, not this summary sentence.
 *
 * Red-first (weekday clause), run 7 Aug 2026: before the wording change,
 * the en assertion below (asserting the *new* sentence) failed —
 * `Unable to find an element with the text: Chest & Back, Legs & Core,
 * and Shoulders & Arms alternate in the order you complete them.` — the
 * old code still produced "…alternate, Mon / Wed / Fri". Both fixes
 * verified together; re-run green after both landed.
 */
describe('PlanPage rotation-mode: the rotation sentence resolves session ids to localized names and drops the weekday clause (owner findings, 7 Aug)', () => {
  function renderMesocycle2() {
    return render(
      <MemoryRouter initialEntries={['/plan?program=mesocycle-2-build']}>
        <Routes>
          <Route path="/plan" element={<PlanPage />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  beforeAll(async () => {
    await programRepo.put(mesocycle2Build)
  })

  afterAll(async () => {
    await db.programs.delete(mesocycle2Build.id)
  })

  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('renders localized session names in en, never a raw mesocycle2- id or a weekday token', async () => {
    renderMesocycle2()
    expect(await screen.findByRole('heading', { name: 'Mesocycle 2 — Build' })).toBeInTheDocument()
    const rotationSentence = await screen.findByText(
      'Full Body A, Full Body B, and Full Body C alternate in the order you complete them.',
    )
    expect(rotationSentence).toBeInTheDocument()
    // Scoped to the sentence itself, not the whole page — the day list
    // below legitimately renders weekday abbreviations ("Mon 10 Aug"),
    // which is the calendar grid this ruling deliberately left alone.
    expect(rotationSentence.textContent).not.toMatch(/\bMon\b|\bWed\b|\bFri\b/)
    expect(document.body.textContent).not.toMatch(/mesocycle2-/)
  })

  it('renders localized session names in zh-CN, never a raw mesocycle2- id or a weekday token', async () => {
    await i18n.changeLanguage('zh-CN')
    renderMesocycle2()
    expect(await screen.findByRole('heading', { name: '第二中周期——强化期' })).toBeInTheDocument()
    const rotationSentence = await screen.findByText('全身训练A、全身训练B和全身训练C按完成顺序交替。')
    expect(rotationSentence).toBeInTheDocument()
    expect(rotationSentence.textContent).not.toMatch(/周一|周三|周五/)
    expect(document.body.textContent).not.toMatch(/mesocycle2-/)
  })

  it('renders localized session names in fr, never a raw mesocycle2- id or a weekday token', async () => {
    await i18n.changeLanguage('fr')
    renderMesocycle2()
    const rotationSentence = await screen.findByText(
      "Corps entier A, Corps entier B et Corps entier C alternent dans l'ordre où tu les termines.",
    )
    expect(rotationSentence).toBeInTheDocument()
    expect(rotationSentence.textContent).not.toMatch(/\blun\.|\bmer\.|\bven\./)
    expect(document.body.textContent).not.toMatch(/mesocycle2-/)
  })
})

describe('PlanPage activity days', () => {
  afterEach(async () => {
    await programRepo.put(seedProgram) // restore the plain program
  })

  it('lists an activity day by title, visually quieter than a strength session row', async () => {
    // origin: 'imported' — a synthetic fixture, not the real seed's own
    // Tuesday content; see TodayPage.activity.test.tsx's fixture comment.
    await programRepo.put({
      ...seedProgram,
      origin: 'imported',
      weekdayActivities: {
        2: {
          kind: 'recovery',
          title: 'Recovery walk & stretch',
          items: [{ label: '30-minute easy walk' }],
        },
      },
    })
    renderApp()

    const activityRow = (await screen.findByText('Tue 28 Jul')).closest('li')
    expect(activityRow).not.toBeNull()
    expect(activityRow).toHaveTextContent('Recovery walk & stretch')
    // Quieter than a strength row: the date label carries no font-medium class.
    const dateLabel = within(activityRow!).getByText('Tue 28 Jul')
    expect(dateLabel.className).not.toMatch(/font-medium/)
    // No completion state — there is none to show for an activity.
    expect(activityRow).not.toHaveTextContent('Projected')
  })

  it('leaves a plain rest day (no activity, no training) out of the list entirely — unchanged', async () => {
    await programRepo.put({
      ...seedProgram,
      weekdayActivities: {
        2: {
          kind: 'recovery',
          title: 'Recovery walk & stretch',
          items: [{ label: '30-minute easy walk' }],
        },
      },
    })
    renderApp()
    await screen.findByText('Tue 28 Jul') // wait for the list to render
    // Thursday has no activity declared for it and isn't a training day.
    expect(screen.queryByText(/30 Jul/)).toBeNull()
  })

  /**
   * Owner finding (mobile, real Mesocycle 2 plan) — a training day's own
   * activity (the post-strength ride) never appeared on this list, on any
   * of the three reachable training-day branches: isToday, a completed
   * workout, or a projected/scheduled session. Session always won outright
   * instead of being joined by the activity, quieter, the same treatment
   * this file already gives an activity-only day (see the row above).
   */
  describe('a training day shows its own activity alongside the session', () => {
    const trainingDayActivity = {
      kind: 'recovery' as const,
      title: 'Zone 2 ride',
      items: [{ label: 'Zone 2 ride', detail: '20 min, after lifting' }],
    }

    afterEach(async () => {
      await programRepo.put(seedProgram)
    })

    it('isToday: shows the activity alongside the session on today\'s own row', async () => {
      // "Today" in this file is frozen to Mon 27 Jul — chest-back, weekday 1.
      await programRepo.put({
        ...seedProgram,
        origin: 'imported',
        weekdayActivities: { 1: trainingDayActivity },
      })
      renderApp()

      const todayRow = await screen.findByRole('link', { name: /Mon 27 Jul.*Today.*Chest & Back.*Zone 2 ride/s })
      expect(todayRow).toBeInTheDocument()
    })

    it('a completed workout: shows the activity alongside the session and the sets/volume summary', async () => {
      await programRepo.put({
        ...seedProgram,
        origin: 'imported',
        weekdayActivities: { 3: trainingDayActivity }, // Wed = Legs & Core
      })
      await putCompletedWorkout('2026-07-22', seedProgram.sessions[1])
      renderApp()

      const row = (await screen.findByText('Wed 22 Jul')).closest('li')
      expect(row).not.toBeNull()
      expect(row).toHaveTextContent('Legs & Core')
      expect(row).toHaveTextContent('1 set')
      expect(row).toHaveTextContent('Zone 2 ride')
    })

    it('a projected/scheduled session: shows the activity alongside the session and the Projected badge', async () => {
      // Re-anchored from Friday to Saturday (7 Aug ruling, Option A):
      // Friday is no longer a training day, so it can no longer carry a
      // projected session at all. Saturday newly pins Legs & Core.
      await programRepo.put({
        ...seedProgram,
        origin: 'imported',
        weekdayActivities: { 6: trainingDayActivity }, // Sat = Legs & Core
      })
      renderApp()

      const row = (await screen.findByText('Sat 1 Aug')).closest('li')
      expect(row).not.toBeNull()
      expect(row).toHaveTextContent('Legs & Core')
      expect(row).toHaveTextContent('Projected')
      expect(row).toHaveTextContent('Zone 2 ride')
    })
  })

  it('still states a skipped scheduled day as a plain em-dash when the weekday genuinely has no activity', async () => {
    // The real seed's every weekday now carries some activity (6 Aug
    // content batch), so the bare "No session" fallback (PlanPage.tsx's
    // last branch) needs a program that genuinely has none for the
    // skipped weekday, to keep that code path covered.
    //
    // Re-anchored from Friday to Monday 20 Jul (7 Aug ruling, Option A):
    // Friday dropped both its weekdaySessions pin and its trainingWeekdays
    // membership, so with weekdayActivities also cleared here it is no
    // longer scheduled by either test (projectSchedule's dates loop:
    // `trainingWeekdays.includes(weekday) || weekdayActivities?.[weekday]`)
    // and the row would never render at all. Monday is untouched by the
    // amendment and still exercises the same code path.
    await programRepo.put({ ...seedProgram, origin: 'imported', weekdayActivities: undefined })
    await putCompletedWorkout('2026-07-22', seedProgram.sessions[1]) // Wed = Legs & Core
    renderApp()
    expect(await screen.findByText('Wed 22 Jul')).toBeInTheDocument()
    const skippedRow = (await screen.findByText('Mon 20 Jul')).closest('li')
    expect(skippedRow).not.toBeNull()
    expect(within(skippedRow!).getByLabelText('No session')).toHaveTextContent('—')
    expect(skippedRow).not.toHaveTextContent(/missed/i)
  })
})
