import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { seedDatabase } from '@/data/seed'
import { settingsRepo } from '@/data/repositories'
import i18n from '@/i18n/i18next'
import { LocaleSync } from '@/i18n/LocaleSync'
import { CARD_SECTION } from '@/ui/cardSection'
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

function renderApp(initialEntry: string | { pathname: string; state?: unknown } = '/settings') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
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
    // Two properties, both load-bearing: the confirmation appears, **and** it
    // sits in a live region so it is announced rather than only drawn.
    //
    // Scoped to the Backup region rather than queried page-wide, because
    // Settings now also mounts the measurement card and a Stepper's readout is
    // legitimately an `<output>` — i.e. also `role="status"`. A bare
    // `findByRole('status')` is therefore ambiguous here. It was briefly
    // replaced with a `findByText`, which resolves the ambiguity by dropping
    // the live-region assertion entirely: remove `role="status"` from the
    // toast and that version still passes. Scope the query, never the claim.
    const backup = screen.getByRole('region', { name: 'Backup' })
    expect(await within(backup).findByRole('status')).toHaveTextContent('Backup saved.')
  })

  it('falls back to Today when opened with no origin state (e.g. a direct URL)', async () => {
    renderApp()
    await userEvent.click(await screen.findByRole('link', { name: /Today/ }))
    expect(await screen.findByText('TODAY PROBE')).toBeInTheDocument()
  })

  it('returns to Plan when opened from the Plan page', async () => {
    renderApp({ pathname: '/settings', state: { from: 'plan' } })
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

describe('the page speaks one visual language', () => {
  /**
   * Settings had bare `mt-8` sections until the profile work added card-styled
   * ones beside them. Their contents then started 21px apart — measured at
   * 390px, card contents at x=357 against bare headings at x=336 — so headings
   * jogged left halfway down the page. The owner saw it before any review did,
   * because it is invisible in a diff: each section was individually correct.
   *
   * Asserted on the shared class rather than on pixels, which jsdom has no
   * layout to produce. `CARD_SECTION` is imported rather than spelled out, so
   * a future change to the treatment moves this test with it instead of
   * against it.
   */
  it('dresses every top-level section in the same card treatment', async () => {
    renderApp()
    // Waits on structure, not on a localized name: the cards mount behind
    // useLiveQuery, and earlier tests in this file drive real language
    // switches, so a name-based anchor would be both slower and locale-bound.
    await waitFor(() => expect(document.querySelectorAll('section').length).toBeGreaterThanOrEqual(4))

    const sections = [...document.querySelectorAll('section')].filter(
      (node) => node.parentElement?.closest('section') === null,
    )

    const undressed = sections
      .filter((node) => !CARD_SECTION.split(' ').every((cls) => node.classList.contains(cls)))
      .map((node) => node.getAttribute('aria-label') ?? node.className)

    expect(
      undressed,
      'Every top-level Settings section wears CARD_SECTION. A bare section sits 21px ' +
        'left of its neighbours, which reads as a broken page rather than as a variant.',
    ).toEqual([])
  })

  it('names the sections a user can see', async () => {
    // Each card is a landmark, so each needs a name — and the measurement card
    // takes its name from its own visible heading rather than a parallel
    // string, which is what stopped the two drifting apart.
    renderApp()
    await waitFor(() => expect(document.querySelectorAll('section').length).toBeGreaterThanOrEqual(4))

    const named = screen.getAllByRole('region').map((r) => r.getAttribute('aria-label') ?? r.textContent?.slice(0, 20))
    // Every card is a landmark, so every card needs a name.
    expect(screen.getAllByRole('region').length, `named: ${named.join(' | ')}`).toBe(
      document.querySelectorAll('section').length,
    )
  })
})
