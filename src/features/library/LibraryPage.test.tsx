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

// Kept in sync by hand with exerciseAsset.coverage.test.ts's KNOWN_MISSING —
// not imported from a .test.ts file. Two Mesocycle 2 additions (spec v2.7
// §18) have no art yet; remove an id here in the same commit that removes
// it from KNOWN_MISSING.
const KNOWN_MISSING_IDS = new Set(['hamstring-walkout', 'dumbbell-pullover'])

describe('Exercise thumbnails', () => {
  it('every real Library row has a thumbnail, except the known art gaps', async () => {
    renderApp()
    const goblet = await screen.findByRole('link', { name: /Goblet squat/ })
    expect(goblet.querySelector('img')).not.toBeNull()

    const allLinks = await screen.findAllByRole('link')
    // Exercise rows link to /library/<id> — this excludes the "← Today"
    // back link and the Settings gear, neither of which carry a thumbnail.
    const exerciseRows = allLinks.filter((link) => link.getAttribute('href')?.startsWith('/library/'))
    expect(exerciseRows.length).toBeGreaterThan(0)

    // Both directions: a row not in KNOWN_MISSING_IDS must have a
    // thumbnail, and a row that is must not — proving the empty-tile
    // fallback actually renders for the two current gaps rather than the
    // loop silently skipping past a broken resolution.
    for (const row of exerciseRows) {
      const id = row.getAttribute('href')?.replace('/library/', '')
      const hasThumbnail = row.querySelector('img') !== null
      if (id !== undefined && KNOWN_MISSING_IDS.has(id)) {
        expect(hasThumbnail, `${row.textContent} is in KNOWN_MISSING_IDS but has a thumbnail — remove it from the list`).toBe(false)
      } else {
        expect(hasThumbnail, `${row.textContent} has no thumbnail`).toBe(true)
      }
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
