import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { programRepo } from '@/data/repositories'
import { seedProgram } from '@/data/seed/program'
import { TodayPage } from './TodayPage'

/**
 * ~/.claude/plans/final-rest-day-lookahead.md — a phase's own final rest
 * days (no training weekday left on or before its own endDate) preview
 * the successor program's opening session when one exists and is usable
 * (Phase 1b), or fall back to display-only content with no session
 * preview and no start button when it doesn't (Phase 1a).
 *
 * Re-anchored 7 Aug (lead ruling "Option A", following the owner's
 * "Saturday will be the last workout on phase 1 — core and leg"):
 * phase-1-home's last training day moved from Friday to Saturday 8 Aug
 * (see seed/program.ts's dated comment beside `weekdaySessions`), so
 * Saturday now resolves as `kind: 'training'` in resolveDayPlan and
 * never reaches the lookahead branch this file guards at all — it shows
 * phase-1-home's own Legs & Core session, not a preview. Sunday 9 Aug is
 * untouched by the seed change (weekday 7 was never a training weekday)
 * and remains the day that exercises the lookahead; its own describe
 * block below is unchanged from before this amendment.
 *
 * The invariant amendment A1 actually protects — no Mesocycle 2 workout
 * can be started or stored before Monday 10 Aug — survives intact:
 * Saturday's start button starts phase-1-home's own `legs-core` session,
 * never an `mesocycle2-*` one. The "Saturday 8 Aug — phase-1-home's own
 * final training day" describe block below makes that explicit. The one
 * real loss is Saturday's Mesocycle-2 preview card; Sunday still carries
 * it, unchanged.
 */

afterEach(async () => {
  vi.useRealTimers()
  await db.checkins.clear()
})

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<TodayPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Saturday 8 Aug — phase-1-home\'s own final training day (7 Aug ruling, Option A)', () => {
  it('shows phase-1-home\'s own Legs & Core session, never a Mesocycle 2 preview', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 8, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    // TrainingDay's Hero title is the session's `focus`, not its `name`
    // (TodayPage.tsx's TrainingDay: title={sessionFocus}) — legs-core's
    // focus is "Squat, hinge & core", the same text the Wednesday
    // training-day tests elsewhere in this suite already key off of.
    expect(await screen.findByRole('heading', { name: 'Squat, hinge & core' })).toBeInTheDocument()
    expect(screen.queryByText(/First up in Mesocycle 2/)).toBeNull()
    // The exercise that used to prove the M2 preview had genuinely
    // switched rosters (this file's old G3 test) — its absence here is
    // the same discriminator, now proving the opposite: no M2 content
    // reaches this day at all.
    expect(screen.queryByText('Chest-supported dumbbell row')).toBeNull()
  })

  it('has a real Start session button — the amendment-A1 invariant made explicit: it starts phase-1-home\'s own session, never Mesocycle 2\'s', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 8, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    expect(await screen.findByRole('button', { name: 'Start session' })).toBeInTheDocument()
    // The early-start quiet affordance is for unscheduled days only
    // (TodayPage.earlyStart.test.tsx) — Saturday is a real training day
    // now, so it must not show alongside the primary CTA (same rule
    // TodayPage.earlyStart.test.tsx's "keeps the training day primary
    // CTA" already pins for Wednesday).
    expect(screen.queryByRole('button', { name: /Start this session now/ })).toBeNull()
  })

  it('keeps Saturday\'s own ride activity alongside the session — unaffected content, only the pin changed', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 8, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    expect(await screen.findByText('Zone 2 ride', { selector: 'span' })).toBeInTheDocument()
  })
})

describe('Phase 1b — the successor-program preview, against the real seed', () => {
  it('Sunday 9 Aug previews the same successor session, and keeps its own weekly checkpoint', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 9, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Weekly checkpoint' })).toBeInTheDocument()
    expect(await screen.findByText(/First up in Mesocycle 2/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Start this session now/ })).toBeNull()
  })

  it('reuses plannedDay.startsIn for the timing, not new copy', async () => {
    // Re-anchored from Saturday (now phase-1's own training day) to
    // Sunday, the day still one training-weekday short of Mesocycle 2's
    // 10 Aug start — "Starts in 1 day", not the old "2 days".
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 9, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    // count=1 collapses to the singular copy (locales/en/today.json:
    // "startsIn_one": "Starts tomorrow"), same as the earlyStart test's
    // "offers the same quiet start before the program has begun" case.
    expect(await screen.findByText('Starts tomorrow')).toBeInTheDocument()
  })

  it('keeps the current program\'s own activity alongside the successor preview', async () => {
    // Re-anchored from Saturday to Sunday for the same reason as above.
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 9, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    // Sunday's own recovery-shaped ride (phase-1-home's own content,
    // corrected 6 Aug) — independent of what's being previewed as next.
    expect(await screen.findByText('Zone 2 ride', { selector: 'span' })).toBeInTheDocument()
  })
})

describe('Phase 1a — the bare fallback when no successor exists', () => {
  it('Sunday 9 Aug: no successor program at all — no preview, no start button, day\'s own activity survives', async () => {
    // Re-anchored from Saturday: Saturday is a real training day now
    // (own start button, by design), so it can no longer stand in for
    // "no training day left, and no successor either" — only Sunday
    // still exercises that branch.
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 9, 9, 0, 0) })
    await seedDatabase()
    await db.programs.delete('mesocycle-2-build')
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Weekly checkpoint' })).toBeInTheDocument()
    expect(screen.queryByText(/First up/)).toBeNull()
    expect(screen.queryByRole('button', { name: /Start this session now/ })).toBeNull()
  })

  /**
   * §8's own admission: this copy path is unreachable with the real
   * seed — every seeded program authors activity content on every
   * remaining weekday, so the bare Hero variant of the null branch never
   * renders in production. A guard that cannot fail is worse than none,
   * so this uses a fully synthetic program: no successor, and no
   * activity for the weekday either.
   */
  it('phaseEndingSubtitle: a genuinely bare final rest day, no activity and no successor', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 9, 9, 0, 0) })
    await seedDatabase()
    await db.programs.delete('mesocycle-2-build')
    await programRepo.put({
      ...seedProgram,
      origin: 'imported',
      weekdayActivities: undefined,
    })
    renderApp()

    expect(
      await screen.findByText('This phase is winding down. Your next program will appear here once it begins.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/First up/)).toBeNull()
    expect(screen.queryByRole('button', { name: /Start this session now/ })).toBeNull()
  })
})

describe('anti-over-clamp — ordinary rest/training days are unaffected', () => {
  it('Thursday 6 Aug (mid-program rest) still previews the next training day\'s session', async () => {
    // Previously previewed Friday; now previews Saturday, since Friday
    // dropped its pin and its trainingWeekdays membership (7 Aug ruling).
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 6, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    expect(await screen.findByText('Next up')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start this session now/ })).toBeInTheDocument()
  })

  it('Saturday 8 Aug, the new last training day, is unaffected by the boundary lookahead', async () => {
    // Replaces the old "Friday 7 Aug itself" case — Friday is no longer
    // a training day at all, so it can no longer anchor this assertion.
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 8, 9, 0, 0) })
    await seedDatabase()
    renderApp()

    expect(await screen.findByRole('button', { name: 'Start session' })).toBeInTheDocument()
  })
})
