import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import i18n from '@/i18n/i18next'
import { seedDatabase } from '@/data/seed'
import { TodayPage } from './TodayPage'

/**
 * M8 UX-batch fix: weekdayActivities now gets the same origin-keyed locale
 * treatment as sessions/prescriptions (i18n/seedProgram.ts's
 * useLocalizedActivity) — the seed's own activity content must fully
 * translate, not leak literal English into fr/zh-CN.
 */

beforeAll(async () => {
  // Tuesday 21 Jul 2026 — a real rest day for the seed's own weekday-pinned
  // schedule, carrying its own (untouched) recovery-day activity.
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 21, 9, 0, 0) })
  await seedDatabase()
})

afterEach(async () => {
  await i18n.changeLanguage('en')
})

afterAll(() => {
  vi.useRealTimers()
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

describe('the seed activity day, localized', () => {
  it('renders zero seed English on Today in zh-CN', async () => {
    await i18n.changeLanguage('zh-CN')
    renderApp()

    expect(await screen.findByRole('heading', { name: '恢复日' })).toBeInTheDocument()
    expect(screen.getByText('散步')).toBeInTheDocument()
    expect(screen.getByText(/6000–10000 步/)).toBeInTheDocument()
    expect(screen.getByText(/至少 7.5 小时/)).toBeInTheDocument()

    expect(screen.queryByText('Recovery day')).toBeNull()
    expect(screen.queryByText('Walk')).toBeNull()
    expect(screen.queryByText('Stretch')).toBeNull()
    expect(screen.queryByText('Hydration')).toBeNull()
    expect(screen.queryByText('Protein')).toBeNull()
    expect(screen.queryByText('Sleep')).toBeNull()
    expect(screen.queryByText(/6,000–10,000 steps/)).toBeNull()
  })

  it('renders zero seed English on Today in fr', async () => {
    await i18n.changeLanguage('fr')
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Jour de récupération' })).toBeInTheDocument()
    expect(screen.getByText('Marche')).toBeInTheDocument()
    expect(screen.getByText(/6 000 à 10 000 pas/)).toBeInTheDocument()

    expect(screen.queryByText('Recovery day')).toBeNull()
    expect(screen.queryByText('Walk')).toBeNull()
  })
})
