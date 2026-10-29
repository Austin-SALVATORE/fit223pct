import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { exerciseRepo, workoutRepo } from '@/data/repositories'
import { seedDatabase } from '@/data/seed'
import { mesocycle2Build } from '@/data/seed/program'
import { createWorkout } from '@/domain/workout'
import type { LadderPrescription, LoggedSet, Workout } from '@/domain/types'
import { SessionPreview } from './SessionPreview'
import { TodayPage } from './TodayPage'

/**
 * Phase 2.4 / QA F-B (29 Oct), owner-approved P-a: "show exactly what Start
 * will use". The Today preview used to render `applyReadiness(session)`, the
 * AUTHORED session, while Start stored `prepareSessionForStart(...)`, the
 * CARRIED one: a goblet squat logged 45/78/41.25/38 kg was previewed as
 * 14 → 16 → 18 → 20 and stored as 45 → 78 → 41.25 → 38. The athlete was
 * shown one plan and handed another.
 *
 * Every test pins preview == stored by one instrument that cannot agree with
 * itself by construction: the rows the Today page renders are compared with
 * the rows a FRESH `SessionPreview` renders from the prescriptions the
 * workout actually STORED. Neither side reads the other's computation.
 *
 * Time is frozen to Mon 19 Oct 2026 (inside M2, 10 Aug - 31 Dec); with three
 * completed sessions behind it the rotation offers Full Body A, which holds
 * the 4-rung goblet squat 14 / 16 / 18 / 20. Tue 20 Oct is a rest day whose
 * next session is the same A.
 *
 * **Negative controls: all run on 29 Oct against the post-change code. Each
 * started from a fresh copy of the unmutated `TodayPage.tsx`, and the final
 * file was diffed byte-identical to that copy.** Find each site by its symbol.
 *  - CONTROL 1, "the preview shows the authored session". In `TrainingDay`,
 *    the `<SessionPreview>` prop `session={startSession}` back to
 *    `session={adjusted.session}`. RED, 3 tests (normal, eased, click-time),
 *    e.g. `expected '14→16→18→20 kg · 12/10/8/6' to be '45→78→41.25→38 kg ·
 *    11/9/7/5'`. The rest-day test stays green: it renders `UnscheduledDay`.
 *  - CONTROL 2, the same mutation in `UnscheduledDay`. RED, the rest-day
 *    test only, same message.
 *  - CONTROL 3, "Start works out its own plan at click". **Two attempts,
 *    kept because the first is the instructive half** (`verification.md`:
 *    trace a control through the code as it will be after the change).
 *      - 3a, which does NOT reach the click-time test: leave
 *        `session={startSession}` going to `StartButton`, but have `start()`
 *        re-read `getCompleted()` and run `prepareSessionForStart` on it.
 *        The session handed in is ALREADY carried, so re-carrying it from an
 *        empty history changes nothing and the click-time test stays green.
 *        Only the eased test goes red (`expected [...] to deeply equal
 *        [...]`, the row comparison), because carry-then-ease run over an
 *        already-eased plan re-adds the dropped rung and eases it away again,
 *        while the other accessories lose a set twice.
 *      - 3b, used: the pre-change wiring. `StartButton` gets the AUTHORED
 *        `session` (both call sites) and re-derives from a fresh read in
 *        `start()`. RED, the click-time test only: `expected [ 14, 16, 18, 20
 *        ] to deeply equal [ 45, 78, 41.25, 38 ]`. The other three stay green
 *        under it, because with history unchanged between render and click
 *        the two computations agree; that is why this test arms the spy.
 *  - CONTROL 4, "the preview is carried but not eased". In `TrainingDay`
 *    compute the preview from `prepareSessionForStart(session, completed,
 *    program.id, { ...readiness, tier: 'ready' })`. RED, the eased test
 *    only: `expected '45→78→41.25→38 kg · 11/9/7/5' to be '45→78→41.25 kg ·
 *    11/9/7'`.
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 9, 19, 9, 0, 0) })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

afterEach(async () => {
  await db.workouts.clear()
  await db.checkins.clear()
  vi.setSystemTime(new Date(2026, 9, 19, 9, 0, 0))
  vi.restoreAllMocks()
})

const sessionA = mesocycle2Build.sessions[0]
const authoredGoblet = sessionA.items.find((i) => i.exerciseId === 'goblet-squat') as LadderPrescription

/** The QA repro, verbatim: four rungs, none of them the authored 14 / 16 / 18 / 20. */
const LOGGED_KG = [45, 78, 41.25, 38]
/** Reps differ from the authored 12 / 10 / 8 / 6 too, so a lost carry of either shows. */
const LOGGED_REPS = [11, 9, 7, 5]

function gobletSet(index: number): LoggedSet {
  return {
    setIndex: index,
    weightKg: LOGGED_KG[index],
    reps: LOGGED_REPS[index],
    seconds: null,
    completedAt: '2026-10-12T10:00:00.000Z',
  }
}

function pastSession(id: string, date: string, withGoblet: boolean): Workout {
  const base = createWorkout({
    id,
    programId: mesocycle2Build.id,
    session: withGoblet ? sessionA : { ...sessionA, items: [] },
    date,
    startedAt: `${date}T09:00:00.000Z`,
  })
  return {
    ...base,
    completedAt: `${date}T10:00:00.000Z`,
    readiness: { tier: 'ready', drivers: [] },
    exercises: base.exercises.map((e) =>
      e.exerciseId === 'goblet-squat' ? { ...e, sets: LOGGED_KG.map((_, i) => gobletSet(i)) } : e,
    ),
  }
}

async function seedHistory() {
  await db.workouts.bulkPut([
    pastSession('past-a', '2026-10-12', true),
    pastSession('past-b', '2026-10-14', false),
    pastSession('past-c', '2026-10-16', false),
  ])
}

function renderToday() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/workout" element={<p>WORKOUT PROBE</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

/** The text of every numeric line in the one preview region, in order: names are not compared, the numbers are. */
function numericLines(region: HTMLElement): string[] {
  return Array.from(region.querySelectorAll('[data-numeric]')).map((el) => el.textContent ?? '')
}

/** The Today page's session preview: the region labelled by its heading plus the session name. */
async function todayPreview(): Promise<HTMLElement> {
  return screen.findByRole('region', { name: /Full Body A/ })
}

function gobletLine(region: HTMLElement): string {
  const row = within(region).getByRole('link', { name: /Goblet squat/ })
  return row.querySelector('[data-numeric]')?.textContent ?? ''
}

/** What a fresh SessionPreview prints for the prescriptions the workout actually stored. */
async function previewOfStored(stored: Workout): Promise<string[]> {
  cleanup()
  const exercises = await exerciseRepo.getAll()
  render(
    <MemoryRouter>
      <SessionPreview
        session={{ ...sessionA, items: stored.exercises.map((e) => e.prescription) }}
        programId={mesocycle2Build.id}
        programOrigin={mesocycle2Build.origin}
        exerciseById={new Map(exercises.map((e) => [e.id, e]))}
        heading="Today"
      />
    </MemoryRouter>,
  )
  return numericLines(await screen.findByRole('region', { name: /Full Body A/ }))
}

async function storedGoblet(): Promise<LadderPrescription> {
  const stored = await workoutRepo.getActive()
  return stored?.exercises.find((e) => e.exerciseId === 'goblet-squat')?.prescription as LadderPrescription
}

async function easeToday() {
  for (const label of ['Sleep', 'Energy', 'Freshness', 'Calm', 'Motivation']) {
    await userEvent.click(await screen.findByRole('button', { name: `${label}: 2` }))
  }
  await screen.findByText('Adjusted for readiness')
}

describe('the Today preview is the plan Start stores (F-B, P-a)', () => {
  it('on a training day, previews the carried plan and stores exactly the rows it showed', async () => {
    await seedHistory()
    renderToday()

    const region = await todayPreview()
    // The QA repro: the carried values, not the authored 14 -> 16 -> 18 -> 20.
    expect(gobletLine(region)).toBe('45→78→41.25→38 kg · 11/9/7/5')
    const previewed = numericLines(region)

    await userEvent.click(screen.getByRole('button', { name: 'Start session' }))
    await screen.findByText('WORKOUT PROBE')

    const goblet = await storedGoblet()
    expect(goblet.setPlan.map((r) => r.weightKg)).toEqual(LOGGED_KG)
    expect(goblet.setPlan.map((r) => r.weightKg)).not.toEqual(authoredGoblet.setPlan.map((r) => r.weightKg))
    // Every row, not just the goblet: the preview IS the stored plan.
    expect(await previewOfStored((await workoutRepo.getActive())!)).toEqual(previewed)
  })

  it('on an easier day, previews the eased-then-carried plan that Start stores: one rung shorter', async () => {
    await seedHistory()
    renderToday()
    await todayPreview()
    await easeToday()

    const region = await todayPreview()
    // The top rung (38 kg, 5 reps) is dropped from the CARRIED plan.
    expect(gobletLine(region)).toBe('45→78→41.25 kg · 11/9/7')
    const previewed = numericLines(region)

    await userEvent.click(screen.getByRole('button', { name: 'Start session' }))
    await screen.findByText('WORKOUT PROBE')

    const goblet = await storedGoblet()
    expect(goblet.setPlan.map((r) => r.weightKg)).toEqual([45, 78, 41.25])
    expect(await previewOfStored((await workoutRepo.getActive())!)).toEqual(previewed)
  })

  it('on a rest day, the early-start affordance previews and stores the same carried plan', async () => {
    await seedHistory()
    vi.setSystemTime(new Date(2026, 9, 20, 9, 0, 0)) // Tue 20 Oct: a rest day, next session A
    renderToday()

    const region = await screen.findByRole('region', { name: /Full Body A/ })
    expect(gobletLine(region)).toBe('45→78→41.25→38 kg · 11/9/7/5')
    const previewed = numericLines(region)

    await userEvent.click(screen.getByRole('button', { name: 'Start this session now' }))
    await screen.findByText('WORKOUT PROBE')

    expect((await storedGoblet()).setPlan.map((r) => r.weightKg)).toEqual(LOGGED_KG)
    expect(await previewOfStored((await workoutRepo.getActive())!)).toEqual(previewed)
  })

  it('stores the object it previewed, not whatever history reads like at click time', async () => {
    await seedHistory()
    // The page's own query reads history normally; once armed, any LATER read
    // (a recompute inside the click handler) sees an empty history. Under a
    // correct build nothing reads after the click, so the arming is invisible.
    let armed = false
    const realRead = workoutRepo.getCompleted.bind(workoutRepo)
    vi.spyOn(workoutRepo, 'getCompleted').mockImplementation(async () => (armed ? [] : realRead()))
    renderToday()

    const region = await todayPreview()
    expect(gobletLine(region)).toBe('45→78→41.25→38 kg · 11/9/7/5')
    const previewed = numericLines(region)

    armed = true
    await userEvent.click(screen.getByRole('button', { name: 'Start session' }))
    await screen.findByText('WORKOUT PROBE')

    // A click-time re-read would have stored the authored 14 -> 16 -> 18 -> 20.
    expect((await storedGoblet()).setPlan.map((r) => r.weightKg)).toEqual(LOGGED_KG)
    expect(await previewOfStored((await workoutRepo.getActive())!)).toEqual(previewed)
  })
})
