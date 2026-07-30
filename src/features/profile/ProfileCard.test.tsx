import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { settingsRepo, checkinRepo } from '@/data/repositories'
import { ProfileCard } from './ProfileCard'

/**
 * The profile surface, and specifically the thing it exists to fix: the
 * seeded `heightCm: 180` must present as **empty**, not as 180, because
 * nothing ever asked the owner to confirm it. A form that helpfully shows
 * "180 cm" as his height is how an invented number becomes his data without
 * anyone deciding it should.
 */

beforeEach(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.settings.clear()
  await db.checkins.clear()
})

describe('a never-confirmed profile', () => {
  it('invites setup rather than displaying stored values as facts', async () => {
    // Simulate the owner's install: a seeded height, no confirmation marker.
    await settingsRepo.update({ heightCm: 180 })
    render(<ProfileCard />)

    expect(await screen.findByRole('button', { name: /Set up your profile/ })).toBeInTheDocument()
    // The number is in the database and must not be on screen as his height.
    expect(screen.queryByText(/180/)).toBeNull()
  })

  it('offers the stored height back in the form, where confirming it is a choice', async () => {
    await settingsRepo.update({ heightCm: 180 })
    render(<ProfileCard />)

    await userEvent.click(await screen.findByRole('button', { name: /Set up your profile/ }))

    // Now it appears — as a prefilled control he can accept or correct, which
    // is different from presenting it as an established fact.
    expect(screen.getByLabelText('Height')).toHaveTextContent('180')
  })

  it('does not invite setup once the profile has been confirmed', async () => {
    await settingsRepo.update({ heightCm: 178, profileConfirmedAt: '2026-07-30' })
    render(<ProfileCard />)

    expect(await screen.findByText(/178 cm/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Set up your profile/ })).toBeNull()
  })
})

describe('saving the profile', () => {
  it('writes the settings record and stamps the confirmation marker', async () => {
    await settingsRepo.update({ heightCm: 180 })
    render(<ProfileCard />)

    await userEvent.click(await screen.findByRole('button', { name: /Set up your profile/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Sex: Male' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))

    await waitFor(async () => {
      const settings = await settingsRepo.get()
      expect(settings?.profileConfirmedAt).not.toBeNull()
      expect(settings?.profileConfirmedAt).toBeDefined()
      expect(settings?.sex).toBe('male')
    })
  })

  it('writes height to settings, never to a check-in', async () => {
    // The plan's own test: height is a stable fact and belongs on settings.
    // A height that landed on a dated record would imply a per-day height.
    await settingsRepo.update({ heightCm: 180 })
    render(<ProfileCard />)

    await userEvent.click(await screen.findByRole('button', { name: /Set up your profile/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))

    await waitFor(async () => {
      expect((await settingsRepo.get())?.heightCm).toBe(180)
    })
    expect(await checkinRepo.getAll()).toHaveLength(0)
  })

  it('stores an absent birth date as null rather than an empty string', async () => {
    await settingsRepo.update({ heightCm: 180 })
    render(<ProfileCard />)

    await userEvent.click(await screen.findByRole('button', { name: /Set up your profile/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))

    await waitFor(async () => {
      expect((await settingsRepo.get())?.birthDate).toBeNull()
    })
  })
})

describe('the sex field says what it is for', () => {
  it('states that it parameterises the calculation, rather than asking unexplained', async () => {
    // A required field with no stated purpose reads as data collection. The
    // copy is also defensive: the consequence of relaxing the field sits next
    // to the field, where a future reader tidying it will see it.
    await settingsRepo.update({ heightCm: 180 })
    render(<ProfileCard />)

    await userEvent.click(await screen.findByRole('button', { name: /Set up your profile/ }))

    expect(
      screen.getByText(/energy your body uses at rest — the formula differs/),
    ).toBeInTheDocument()
  })
})

describe('targets predict nothing', () => {
  it('says the target yields a distance, never a date', async () => {
    await settingsRepo.update({ heightCm: 180 })
    render(<ProfileCard />)

    await userEvent.click(await screen.findByRole('button', { name: /Set up your profile/ }))

    expect(screen.getByText(/you will see the distance, never a date/)).toBeInTheDocument()
  })

  it('leaves the target absent unless it is deliberately added', async () => {
    await settingsRepo.update({ heightCm: 180 })
    render(<ProfileCard />)

    await userEvent.click(await screen.findByRole('button', { name: /Set up your profile/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))

    await waitFor(async () => {
      expect((await settingsRepo.get())?.targetWeightKg).toBeNull()
    })
  })
})

describe('the activity level is stated, never assumed', () => {
  it('preselects nothing, so an unanswered band stays unanswered', async () => {
    await settingsRepo.update({ heightCm: 180 })
    render(<ProfileCard />)

    await userEvent.click(await screen.findByRole('button', { name: /Set up your profile/ }))

    for (const band of ['Sedentary', 'Active', 'Vigorous']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${band}`) })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
    }
  })

  it('saves as null when no band was chosen — no default is invented', async () => {
    // The whole point of the field: the card used to attribute 'sedentary' to
    // someone who had never been asked. A default written here would put that
    // defect back one layer down, where the UI could no longer tell.
    await settingsRepo.update({ heightCm: 180 })
    render(<ProfileCard />)

    await userEvent.click(await screen.findByRole('button', { name: /Set up your profile/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))

    await waitFor(async () => {
      const settings = await settingsRepo.get()
      expect(settings?.profileConfirmedAt).toBeDefined()
      expect(settings?.activityLevel).toBeNull()
    })
  })

  it('persists the chosen band and reads it back on a fresh mount', async () => {
    await settingsRepo.update({ heightCm: 180 })
    const { unmount } = render(<ProfileCard />)

    await userEvent.click(await screen.findByRole('button', { name: /Set up your profile/ }))
    await userEvent.click(screen.getByRole('button', { name: /^Vigorous/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))

    await waitFor(async () => {
      expect((await settingsRepo.get())?.activityLevel).toBe('vigorous')
    })

    // Survives a reload: remount reads storage, not the discarded draft.
    unmount()
    render(<ProfileCard />)
    expect(await screen.findByText(/Vigorous/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /^Edit/ }))
    expect(screen.getByRole('button', { name: /^Vigorous/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('describes each band by the whole day, not by training frequency', async () => {
    // The FAO caveat, which has to reach the user: PAL comes from total daily
    // expenditure including all non-exercise movement, so someone training
    // three times a week reads themselves as "active" by gym intuition and
    // lands a band too high.
    await settingsRepo.update({ heightCm: 180 })
    render(<ProfileCard />)

    await userEvent.click(await screen.findByRole('button', { name: /Set up your profile/ }))

    expect(screen.getByText(/not how often you train/)).toBeInTheDocument()
    expect(screen.getByText(/Desk work and sitting for most of the day/)).toBeInTheDocument()
    expect(screen.getByText(/On your feet for a good part of the day/)).toBeInTheDocument()
    expect(screen.getByText(/Physically demanding work/)).toBeInTheDocument()
  })

  it('offers the band as part of the form behind Save, not as a live control', async () => {
    // Choosing must not write until Save: activity level is part of what
    // profileConfirmedAt confirms, and a marker set by brushing a control is
    // not a confirmation.
    await settingsRepo.update({ heightCm: 178, profileConfirmedAt: '2026-07-30' })
    render(<ProfileCard />)

    await userEvent.click(await screen.findByRole('button', { name: /^Edit/ }))
    await userEvent.click(screen.getByRole('button', { name: /^Active/ }))

    expect((await settingsRepo.get())?.activityLevel).toBeUndefined()
  })

  it('leaves a profile confirmed before the field existed confirmed, and shows no gap', async () => {
    // The migration case at this surface: an install with profileConfirmedAt
    // and no activityLevel is complete, not half-filled.
    await settingsRepo.update({ heightCm: 178, profileConfirmedAt: '2026-07-30' })
    render(<ProfileCard />)

    expect(await screen.findByText(/178 cm/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Set up your profile/ })).toBeNull()
    for (const band of ['Sedentary', 'Active', 'Vigorous']) {
      expect(screen.queryByText(band)).toBeNull()
    }
  })
})
