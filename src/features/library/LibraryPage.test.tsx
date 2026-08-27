import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { seedDatabase } from '@/data/seed'
import { seedExercises } from '@/data/seed/exercises'
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
// not imported from a .test.ts file. Two of the seven equipment-upgrade
// Library promotions (12 Aug 2026) still have no art — barbell-curl reuses
// the audited-FIT biceps-curl art under a renamed id/directory, and
// bodyweight-hip-hinge landed its own audited-FIT batch the same day, so
// neither is one of them; remove an id here in the same commit that
// removes it from KNOWN_MISSING. `dumbbell-squeeze-press` joined the same
// day as the 22 Aug amendment promotion (no art yet), then landed its own
// audited batch the same day and was removed from this list;
// `reverse-lunge`, promoted the same day, was never listed — its art
// already resolved.
const KNOWN_MISSING_IDS = new Set<string>(['bicycle-crunch', 'mountain-climber'])

describe('Every seeded exercise actually reaches the page', () => {
  /**
   * The gap this closes: `LibraryPage` sorts a row into one of four fixed
   * groups by `e.muscles[0]` alone (LibraryPage.tsx's `groupOrder`), and
   * an exercise whose primary muscle matches no group's list is silently
   * dropped from the whole render — no error, no console warning, no
   * empty-tile row, just absent. It happened once already: `calves` had
   * no bucket when `standing-calf-raise` was added, and every existing
   * test in this file stayed green throughout, because they all iterate
   * over what *rendered*, which by construction cannot see a row that
   * never rendered at all. Reverting only the bucket fix (leaving the
   * exercise and its Library entry in place) reproduces this exactly:
   * the "every rendered row has a thumbnail" test above still passes 3/3,
   * because there is one fewer row to check and nothing counts the total.
   *
   * This test counts instead of iterating: every id in `seedExercises`
   * must correspond to a rendered `/library/<id>` row, and the counts
   * must match exactly. A silently dropped exercise is a missing id, and
   * a duplicate-rendered one (a different failure mode) is a numeric
   * mismatch — both directions are covered by one set-equality check.
   */
  it('every id in seedExercises renders as a Library row — none silently dropped by a bucket with no muscle group match', async () => {
    renderApp()
    await screen.findByRole('link', { name: /Goblet squat/ })

    const allLinks = await screen.findAllByRole('link')
    const renderedIds = new Set(
      allLinks
        .map((link) => link.getAttribute('href'))
        .filter((href): href is string => href !== null && href.startsWith('/library/'))
        .map((href) => href.replace('/library/', '')),
    )
    const seededIds = new Set(seedExercises.map((e) => e.id))

    const missing = [...seededIds].filter((id) => !renderedIds.has(id))
    const unexpected = [...renderedIds].filter((id) => !seededIds.has(id))

    expect(missing, 'seeded exercises with no rendered Library row').toEqual([])
    expect(unexpected, 'rendered rows with no matching seeded exercise').toEqual([])
    expect(renderedIds.size).toBe(seededIds.size)
  })
})

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
