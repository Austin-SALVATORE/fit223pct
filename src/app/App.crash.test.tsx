import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import i18n from '@/i18n/i18next'
import { createWorkout } from '@/domain/workout'
import App from './App'

/**
 * A render failure shows a recovery screen instead of a blank page, and stays
 * where it happened. Before this the app had no error boundary anywhere: one
 * throwing component unmounted the whole tree, Today included.
 *
 * The screens are replaced by stand-ins that throw on demand; the shell, the
 * router and every boundary are real. Four boundaries, each with a test that
 * only it can pass:
 *   - Workout Mode's own        -> "Workout Mode", and the Today/Workout isolation
 *   - the routine player's own  -> "the routine player"
 *   - the shell's (one for all its screens) -> "a shell screen"
 *   - the app root, for what is not one screen -> "the app root"
 * A route-level failure must show the ROUTE fallback (heading "This screen hit a
 * problem"), not the root's ("Something went wrong"): with a route boundary
 * missing, the root boundary would still catch the throw, so the heading is what
 * tells them apart. "Back to Today" and navigating away recover without a reload.
 *
 * The recovery never touches data: an in-progress workout in Dexie is
 * byte-identical after the failure, "try again" and the way out (the last test; its
 * instrument is shown able to see a write).
 *
 * Negative controls, run 30 Oct (a boundary removed from App.tsx / AppShell.tsx,
 * the whole suite run, restored and `cmp`ed):
 *   Workout's `RouteErrorBoundary` removed (the root still catches)
 *                         -> "Workout Mode ...", the isolation test, "try again", fr,
 *                            zh-CN and the byte-identical-database test (6 red): each
 *                            finds the root's heading instead
 *   the routine player's removed
 *                         -> "the routine player" (1 red)
 *   the shell's (around `Outlet`) removed
 *                         -> "a shell screen", the isolation test, and "navigating away
 *                            from a failed shell screen" (3 red)
 *   `AppErrorBoundary` removed from App
 *                         -> "the app root" (1 red: the throw escapes and unmounts the tree)
 *   `resetKey` not passed by `RouteErrorBoundary`
 *                         -> "navigating away from a failed shell screen" (1 red)
 *   the fallback's "Back to Today" link pointed at `/library`
 *                         -> the isolation test, "Back to Today: a link to the root
 *                            route", and the byte-identical-database test (3 red).
 *                            "Back to Today" is NOT red when the route fallback is
 *                            removed: the root fallback has the same link. The heading
 *                            is what tells the two fallbacks apart.
 *   the retry handler clears `db.workouts`
 *                         -> the byte-identical-database test (and the guard) (2 red)
 */

const crash = vi.hoisted(() => ({
  today: false,
  library: false,
  workout: false,
  routine: false,
  locale: false,
}))

function standIn(name: keyof typeof crash, ok: string) {
  return function StandIn() {
    if (crash[name]) throw new Error(`${name} failed`)
    return <p>{ok}</p>
  }
}

vi.mock('@/features/today/TodayPage', () => ({ TodayPage: standIn('today', 'TODAY OK') }))
vi.mock('@/features/library/LibraryPage', () => ({ LibraryPage: standIn('library', 'LIBRARY OK') }))
vi.mock('@/features/workout/WorkoutPage', () => ({ WorkoutPage: standIn('workout', 'WORKOUT OK') }))
vi.mock('@/features/recovery/RoutinePlayer', () => ({ RoutinePlayer: standIn('routine', 'ROUTINE OK') }))
vi.mock('@/i18n/LocaleSync', () => ({ LocaleSync: standIn('locale', 'LOCALE OK') }))
vi.mock('@/features/library/ExercisePage', () => ({ ExercisePage: () => <p>EXERCISE</p> }))
vi.mock('@/features/progress/ProgressPage', () => ({ ProgressPage: () => <p>PROGRESS</p> }))
vi.mock('@/features/plan/PlanPage', () => ({ PlanPage: () => <p>PLAN</p> }))
vi.mock('@/features/plan/PlanDayPage', () => ({ PlanDayPage: () => <p>PLAN DAY</p> }))
vi.mock('@/features/settings/SettingsPage', () => ({ SettingsPage: () => <p>SETTINGS</p> }))
vi.mock('./ServiceWorkerUpdater', () => ({ ServiceWorkerUpdater: () => null }))

beforeAll(async () => {
  await seedDatabase()
})

beforeEach(() => {
  // React logs every caught render error; the boundary's own log is the one under test elsewhere.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(async () => {
  vi.restoreAllMocks()
  for (const key of Object.keys(crash) as (keyof typeof crash)[]) crash[key] = false
  await db.workouts.clear()
  await i18n.changeLanguage('en')
})

/** Lets a test move between routes without the screens' own links. */
function Go({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => void navigate(to)}>
      {label}
    </button>
  )
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <Go to="/" label="go today" />
      <Go to="/workout" label="go workout" />
      <Go to="/library" label="go library" />
    </MemoryRouter>,
  )
}

const ROUTE_HEADING = 'This screen hit a problem'
const APP_HEADING = 'Something went wrong'

describe('a failing screen shows a recovery screen, and stays where it happened', () => {
  it('Workout Mode: the route fallback, with its own way back, and exactly one main landmark', async () => {
    crash.workout = true
    renderAt('/workout')

    expect(await screen.findByRole('heading', { name: ROUTE_HEADING })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: APP_HEADING })).toBeNull()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByText(/Your workouts and history are safe/)).toBeInTheDocument()
  })

  it('the routine player: the route fallback', async () => {
    crash.routine = true
    renderAt('/routine/recovery-stretch-v1')
    expect(await screen.findByRole('heading', { name: ROUTE_HEADING })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: APP_HEADING })).toBeNull()
  })

  it('a shell screen: the fallback sits inside the shell\'s own main, which stays', async () => {
    crash.today = true
    renderAt('/')

    const heading = await screen.findByRole('heading', { name: ROUTE_HEADING })
    expect(screen.queryByRole('heading', { name: APP_HEADING })).toBeNull()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(within(screen.getByRole('main')).getByRole('heading', { name: ROUTE_HEADING })).toBe(heading)
  })

  it('Today and Workout Mode do not take each other down', async () => {
    // Workout Mode fails; Today is a click away and works.
    crash.workout = true
    const first = renderAt('/workout')
    await screen.findByRole('heading', { name: ROUTE_HEADING })
    await userEvent.click(screen.getByRole('link', { name: 'Back to Today' }))
    expect(await screen.findByText('TODAY OK')).toBeInTheDocument()
    first.unmount()

    // Today fails; Workout Mode is a click away and works.
    crash.workout = false
    crash.today = true
    renderAt('/')
    await screen.findByRole('heading', { name: ROUTE_HEADING })
    await userEvent.click(screen.getByRole('button', { name: 'go workout' }))
    expect(await screen.findByText('WORKOUT OK')).toBeInTheDocument()
  })

  it('navigating away from a failed shell screen recovers it with no reload', async () => {
    crash.library = true
    renderAt('/library')
    await screen.findByRole('heading', { name: ROUTE_HEADING })

    await userEvent.click(screen.getByRole('button', { name: 'go today' }))
    expect(await screen.findByText('TODAY OK')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: ROUTE_HEADING })).toBeNull()
  })

  it('"Try again" retries the screen: once it can render, it does', async () => {
    crash.workout = true
    renderAt('/workout')
    await screen.findByRole('heading', { name: ROUTE_HEADING })

    crash.workout = false
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('WORKOUT OK')).toBeInTheDocument()
  })

  it('Back to Today: a link to the root route, so it works without a reload', async () => {
    crash.workout = true
    renderAt('/workout')
    const link = await screen.findByRole('link', { name: 'Back to Today' })
    expect(link).toHaveAttribute('href', '/')
  })

  it('the app root: anything that is not one screen gets the root fallback, with a reload', async () => {
    crash.locale = true
    renderAt('/')

    expect(await screen.findByRole('heading', { name: APP_HEADING })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: ROUTE_HEADING })).toBeNull()
    expect(screen.getByRole('button', { name: 'Reload the app' })).toBeInTheDocument()
    // No router is assumed, so the way back is a plain link (a full load).
    expect(screen.getByRole('link', { name: 'Back to Today' })).toHaveAttribute('href', '/')
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it.each([
    ['fr', 'Cet écran a rencontré un problème', 'Réessayer', "Retour à Aujourd'hui"],
    ['zh-CN', '这个页面出了点问题', '重试', '返回今天'],
  ])('reads in %s, not as a raw key', async (lng, heading, retry, back) => {
    await i18n.changeLanguage(lng)
    crash.workout = true
    renderAt('/workout')

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: retry })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: back })).toBeInTheDocument()
    expect(screen.queryByText(/crash\./)).toBeNull()
  })
})

describe('the recovery screen never touches saved data', () => {
  async function snapshotDatabase(): Promise<string> {
    const tables = await Promise.all(db.tables.map(async (table) => [table.name, await table.toArray()] as const))
    return JSON.stringify(tables)
  }

  it('an in-progress workout is byte-identical after the failure, "try again" and the way back', async () => {
    await db.workouts.put(
      createWorkout({
        id: 'in-progress',
        programId: seedProgram.id,
        session: seedProgram.sessions[1],
        date: '2026-07-22',
        startedAt: '2026-07-22T09:00:00.000Z',
      }),
    )
    const before = await snapshotDatabase()

    crash.workout = true
    renderAt('/workout')
    await screen.findByRole('heading', { name: ROUTE_HEADING })
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await screen.findByRole('heading', { name: ROUTE_HEADING })
    await userEvent.click(screen.getByRole('link', { name: 'Back to Today' }))
    await screen.findByText('TODAY OK')
    // A write that was started and not awaited would not have landed yet.
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(await snapshotDatabase()).toBe(before)
    expect((await db.workouts.get('in-progress'))?.completedAt).toBeNull()
  })

  it('detects a write: the snapshot is not vacuously equal', async () => {
    const before = await snapshotDatabase()
    await db.workouts.put(
      createWorkout({
        id: 'a-write',
        programId: seedProgram.id,
        session: seedProgram.sessions[1],
        date: '2026-07-22',
        startedAt: '2026-07-22T09:00:00.000Z',
      }),
    )
    expect(await snapshotDatabase()).not.toBe(before)
  })
})
