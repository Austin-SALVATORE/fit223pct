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

describe('Exercise thumbnails', () => {
  it('renders a mixed list — a real thumbnail next to the same-geometry empty tile', async () => {
    renderApp()
    // goblet-squat has a converted asset; band-pull-apart is one of the
    // ~13 seeded exercises with no prompt yet (docs/design/
    // ExerciseAssetPipeline.md's "Parked decisions") — both must render
    // in the same list without one looking broken next to the other.
    const withAsset = await screen.findByRole('link', { name: /Goblet squat/ })
    const withoutAsset = await screen.findByRole('link', { name: /Band pull-apart/ })

    expect(withAsset.querySelector('img')).not.toBeNull()
    expect(withoutAsset.querySelector('img')).toBeNull()
    expect(withoutAsset.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })
})
