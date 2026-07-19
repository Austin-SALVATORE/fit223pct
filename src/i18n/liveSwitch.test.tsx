import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { settingsRepo } from '@/data/repositories'
import i18n from '@/i18n/i18next'
import { LocaleSync } from '@/i18n/LocaleSync'
import { TodayPage } from '@/features/today/TodayPage'

/**
 * M7 Phase 10's acceptance test: a Dexie-driven locale change reaches an
 * already-mounted page with no reload and no remount — LocaleSync (not the
 * page) is what reacts to the live query, so this proves the wiring works
 * for a page that never touches settingsRepo itself, not just Settings.
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 22, 9, 0, 0) })
  await seedDatabase()
})

afterAll(async () => {
  vi.useRealTimers()
  await db.checkins.clear()
})

afterEach(async () => {
  await settingsRepo.update({ locale: 'en' })
  await i18n.changeLanguage('en')
})

function renderToday() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <LocaleSync />
      <TodayPage />
    </MemoryRouter>,
  )
}

describe('live locale switch', () => {
  it('updates Today in place when settingsRepo.locale changes, without unmounting it', async () => {
    renderToday()
    const button = await screen.findByRole('button', { name: 'Start session' })

    await settingsRepo.update({ locale: 'fr' })

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Démarrer la séance' })).toBeInTheDocument(),
    )
    // Same DOM node, not a fresh one from an unmount/remount — only its
    // text content changed.
    expect(screen.getByRole('button', { name: 'Démarrer la séance' })).toBe(button)
    expect(document.documentElement.lang).toBe('fr')
  })
})
