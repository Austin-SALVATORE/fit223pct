import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { seedDatabase } from '@/data/seed'
import { SettingsPage } from './SettingsPage'

vi.mock('@/lib/shareOrDownloadFile', () => ({
  shareOrDownloadFile: vi.fn().mockResolvedValue('downloaded'),
}))
import { shareOrDownloadFile } from '@/lib/shareOrDownloadFile'

beforeEach(async () => {
  await seedDatabase()
})

afterEach(() => {
  vi.mocked(shareOrDownloadFile).mockClear()
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
})
