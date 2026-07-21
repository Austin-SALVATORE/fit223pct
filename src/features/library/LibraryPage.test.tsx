import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { seedDatabase } from '@/data/seed'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { GroupedList, GroupedRow } from '@/ui/GroupedList'
import { ExerciseThumbnail } from '@/ui/ExerciseThumbnail'
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
  it('every real Library row now has a thumbnail — full asset coverage as of 7d764c1', async () => {
    renderApp()
    // No real Library exercise is asset-less anymore (111/111 covered,
    // see exerciseAsset.coverage.test.ts's empty KNOWN_MISSING) — this
    // used to pair a real covered exercise against a real gap
    // (band-pull-apart); the gap closed, so this now asserts the
    // positive: every rendered row has an image, none fell back to the
    // empty tile.
    const goblet = await screen.findByRole('link', { name: /Goblet squat/ })
    expect(goblet.querySelector('img')).not.toBeNull()

    const allLinks = await screen.findAllByRole('link')
    // Exercise rows link to /library/<id> — this excludes the "← Today"
    // back link and the Settings gear, neither of which carry a thumbnail.
    const exerciseRows = allLinks.filter((link) => link.getAttribute('href')?.startsWith('/library/'))
    expect(exerciseRows.length).toBeGreaterThan(0)
    for (const row of exerciseRows) {
      expect(row.querySelector('img'), `${row.textContent} has no thumbnail`).not.toBeNull()
    }
  })

  it('the empty tile stays under test as a designed state — a future Library addition or a load failure, not a data gap today', () => {
    render(
      <GroupedList>
        <GroupedRow>
          <ExerciseThumbnail exerciseId="goblet-squat" />
        </GroupedRow>
        <GroupedRow>
          <ExerciseThumbnail exerciseId="a-future-exercise-with-no-asset-yet" />
        </GroupedRow>
      </GroupedList>,
    )
    const [withAsset, withoutAsset] = screen.getAllByRole('listitem')

    expect(withAsset.querySelector('img')).not.toBeNull()
    expect(withoutAsset.querySelector('img')).toBeNull()
    expect(withoutAsset.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })
})
