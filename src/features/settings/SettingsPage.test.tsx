import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { seedDatabase } from '@/data/seed'
import { settingsRepo } from '@/data/repositories'
import i18n from '@/i18n/i18next'
import { LocaleSync } from '@/i18n/LocaleSync'
import { SettingsPage } from './SettingsPage'

vi.mock('@/lib/shareOrDownloadFile', () => ({
  shareOrDownloadFile: vi.fn().mockResolvedValue('downloaded'),
}))
import { shareOrDownloadFile } from '@/lib/shareOrDownloadFile'

beforeEach(async () => {
  await seedDatabase()
})

afterEach(async () => {
  vi.mocked(shareOrDownloadFile).mockClear()
  // Tests below drive a real language switch through Dexie — restore both
  // so later test files see the English default they expect.
  await settingsRepo.update({ locale: 'en' })
  await i18n.changeLanguage('en')
})

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <Routes>
        <Route path="/plan" element={<p>PLAN PROBE</p>} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

/** LocaleSync isn't mounted by renderApp() alone — it's the piece that
 * actually applies a Dexie locale write to i18next, same composition as
 * App.tsx. */
function renderWithLocaleSync() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <LocaleSync />
      <Routes>
        <Route path="/plan" element={<p>PLAN PROBE</p>} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SettingsPage', () => {
  it('renders with a Backup section and a working export', async () => {
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Backup' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Export all data' }))

    expect(shareOrDownloadFile).toHaveBeenCalled()
    const [filename, content] = vi.mocked(shareOrDownloadFile).mock.calls[0]
    expect(filename).toMatch(/^fit223-export-\d{4}-\d{2}-\d{2}\.json$/)
    expect(() => JSON.parse(content)).not.toThrow()
    expect(await screen.findByRole('status')).toHaveTextContent('Backup saved.')
  })

  it('links back to Plan', async () => {
    renderApp()
    await userEvent.click(await screen.findByRole('link', { name: /Plan/ }))
    expect(await screen.findByText('PLAN PROBE')).toBeInTheDocument()
  })

  it('shows English pressed by default, with French and Chinese as options', async () => {
    renderApp()
    const english = await screen.findByRole('button', { name: 'English' })
    expect(english).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Français' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: '中文' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('switching to French updates document.documentElement.lang live, no reload', async () => {
    renderWithLocaleSync()
    await userEvent.click(await screen.findByRole('button', { name: 'Français' }))

    await waitFor(() => expect(document.documentElement.lang).toBe('fr'))
    expect((await settingsRepo.get())?.locale).toBe('fr')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Français' })).toHaveAttribute('aria-pressed', 'true'),
    )
  })
})
