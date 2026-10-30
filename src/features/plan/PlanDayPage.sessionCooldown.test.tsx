import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { mesocycle2Build } from '@/data/seed/program'
import i18n from '@/i18n/i18next'
import type { SessionTemplate, Workout } from '@/domain/types'
import { PlanDayPage } from './PlanDayPage'

/**
 * The Plan's day detail lists the stretching of that day's own session, past or
 * projected, not the weekday's (QA Q34, the same rule as Today). The clock is Monday
 * 2 Nov 2026 with sessions A and B done, so today is C, Wed 4 Nov is A, Fri 6 Nov is
 * B and Mon 9 Nov is C again, a Monday whose weekday content is A's.
 *
 * Negative controls: `projectSchedule` not passing the session -> both tests here
 * (`sessionCooldown.test.ts` has the domain cases and the full list).
 */

const [A, B] = mesocycle2Build.sessions

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 2, 9, 0, 0) })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

afterEach(async () => {
  await db.workouts.clear()
  await i18n.changeLanguage('en')
})

function done(id: string, date: string, session: SessionTemplate): Workout {
  return {
    id,
    programId: mesocycle2Build.id,
    sessionTemplateId: session.id,
    date,
    startedAt: `${date}T09:00:00.000Z`,
    completedAt: `${date}T09:40:00.000Z`,
    exercises: [],
  }
}

function renderDay(date: string) {
  return render(
    <MemoryRouter initialEntries={[`/plan/${date}`]}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/plan/:date" element={<PlanDayPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Plan day detail', () => {
  it('a future Monday the rotation makes session C: C\'s stretching, in French too', async () => {
    await db.workouts.bulkPut([done('a', '2026-10-28', A), done('b', '2026-10-30', B)])
    renderDay('2026-11-09')
    expect(await screen.findByText('Full Body C Stretching')).toBeInTheDocument()
    expect(screen.queryByText('Full Body A Stretching')).toBeNull()
  })

  it('in French the swapped-in item reads in French, under C\'s own keys', async () => {
    await i18n.changeLanguage('fr')
    await db.workouts.bulkPut([done('a', '2026-10-28', A), done('b', '2026-10-30', B)])
    renderDay('2026-11-09')
    expect(await screen.findByText('Étirements Corps entier C')).toBeInTheDocument()
    expect(screen.queryByText('Étirements Corps entier A')).toBeNull()
  })
})
