import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { seedDatabase } from '@/data/seed'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { LibraryPage } from './LibraryPage'

beforeAll(async () => {
  await seedDatabase()
})

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/library']}>
      <Routes>
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Settings entry', () => {
  it('opens Settings from the gear, with an accessible name', async () => {
    renderApp()
    const settingsLink = await screen.findByRole('link', { name: 'Settings' })
    await userEvent.click(settingsLink)
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })
})
