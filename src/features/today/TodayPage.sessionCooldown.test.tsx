import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { mesocycle2Build } from '@/data/seed/program'
import i18n from '@/i18n/i18next'
import type { SessionTemplate, Workout } from '@/domain/types'
import { TodayPage } from './TodayPage'

/**
 * "Also today" lists the stretching that belongs to the session on screen, not
 * the one the weekday authored (QA Q34). Mesocycle 2 Build runs in rotation mode:
 * after two completed sessions (A, B) a Monday is session C, and Monday's activity
 * is "Full Body A Stretching". The real program, the real Today page and the real
 * locale files; only the clock is fixed (Monday 2 Nov 2026).
 *
 * The French and Chinese rows matter as much as the English one: the swapped-in item
 * is authored under FRIDAY's locale keys, and a hook that resolved it under Monday's
 * would show A's wording under C's name.
 *
 * Negative controls: see `src/domain/sessionCooldown.test.ts` (`activityForSession`
 * a no-op; `resolveDayPlan` not passing the session; the item without its `source`)
 * and, for the done-today path, run 30 Oct: the session not passed to
 * `resolveActivityForDate` in `TodayPage`'s done branch -> "after the session is
 * done" (A's stretching, the weekday's, on a day B was trained).
 */

const [A, B] = mesocycle2Build.sessions

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 2, 9, 0, 0) }) // Mon 2 Nov
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

afterEach(async () => {
  await db.workouts.clear()
  await i18n.changeLanguage('en')
})

function workout(id: string, date: string, session: SessionTemplate, completed: boolean): Workout {
  return {
    id,
    programId: mesocycle2Build.id,
    sessionTemplateId: session.id,
    date,
    startedAt: `${date}T09:00:00.000Z`,
    completedAt: completed ? `${date}T09:45:00.000Z` : null,
    exercises: [],
  }
}

function renderToday() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<TodayPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

/** Sessions A and B done last week: the next one is C. */
async function twoSessionsDone() {
  await db.workouts.bulkPut([workout('a', '2026-10-28', A, true), workout('b', '2026-10-30', B, true)])
}

describe('Today, Monday, the next session is C', () => {
  it('en: Full Body C Stretching, not Monday\'s Full Body A', async () => {
    await twoSessionsDone()
    renderToday()
    expect(await screen.findByText('Full Body C Stretching')).toBeInTheDocument()
    expect(screen.queryByText('Full Body A Stretching')).toBeNull()
    // The ride that sits beside it is Monday's own.
    expect(screen.getByText('Zone 2 ride', { selector: 'span, p, strong' })).toBeInTheDocument()
  })

  it.each([
    ['fr', 'Étirements Corps entier C', 'Étirements Corps entier A', /fessiers en chiffre quatre/],
    ['zh-CN', '全身训练C拉伸', '全身训练A拉伸', /四字臀部拉伸/],
  ])('%s: C\'s label and C\'s detail, not A\'s', async (lng, label, wrongLabel, detail) => {
    await i18n.changeLanguage(lng)
    await twoSessionsDone()
    renderToday()
    expect(await screen.findByText(label)).toBeInTheDocument()
    expect(screen.queryByText(wrongLabel)).toBeNull()
    expect(screen.getByText(detail)).toBeInTheDocument()
  })

  it('when rotation and calendar agree (nothing done yet: Monday is A), it is unchanged', async () => {
    renderToday()
    expect(await screen.findByText('Full Body A Stretching')).toBeInTheDocument()
    expect(screen.queryByText('Full Body C Stretching')).toBeNull()
  })
})

describe('Today, after the session is done', () => {
  it('shows the stretching of the session that was trained, not the weekday\'s', async () => {
    // Monday, but the athlete trained session B today (rotation put B here).
    await db.workouts.put(workout('today', '2026-11-02', B, true))
    renderToday()
    expect(await screen.findByText('Full Body B Stretching')).toBeInTheDocument()
    expect(screen.queryByText('Full Body A Stretching')).toBeNull()
  })
})
