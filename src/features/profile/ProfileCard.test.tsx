import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
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
    await userEvent.click(screen.getByRole('button', { name: 'Male' }))
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

describe('the form can be abandoned', () => {
  it('offers a translated Cancel that discards the draft', async () => {
    // Regression guard for a real defect: `common:cancel` existed in no
    // locale, so this button rendered the raw key — a lowercase "cancel" —
    // and logged [i18n] missing key on every render of the form. Every
    // console error observed on /settings was this one key. Asserted by its
    // exact name, which is what fails if the key goes missing again: the
    // fallback renders the key path, never the intended label.
    await settingsRepo.update({ heightCm: 178, profileConfirmedAt: '2026-07-30' })
    render(<ProfileCard />)

    await userEvent.click(await screen.findByRole('button', { name: /^Edit/ }))
    await userEvent.click(screen.getByRole('button', { name: /^Vigorous/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    // Back to the summary, and nothing was written.
    expect(await screen.findByText(/178 cm/)).toBeInTheDocument()
    expect((await settingsRepo.get())?.activityLevel).toBeUndefined()
  })
})

describe('sex is a text choice, not a digit control', () => {
  /**
   * `RatingPicker` — the 1–5 check-in control, `h-11 w-11` circles sized for a
   * single character — was being handed the words "Female" and "Male". The
   * boxes stayed 44px and 6px apart while the *text* overflowed them and
   * collided, which is why it looked like a spacing bug and why spacing was
   * never the fix. Asserted on structure and roles, since jsdom has no layout
   * to measure the overlap with.
   */
  async function openForm() {
    await settingsRepo.update({ heightCm: 180 })
    render(<ProfileCard />)
    await userEvent.click(await screen.findByRole('button', { name: /Set up your profile/ }))
  }

  it('renders both options as distinct controls in one labelled group', async () => {
    await openForm()

    const group = screen.getByRole('group', { name: 'Sex' })
    const options = within(group).getAllByRole('button')
    expect(options).toHaveLength(2)
    expect(options.map((b) => b.textContent)).toEqual(['Female', 'Male'])
    // Two elements, not one element rendering both words.
    expect(new Set(options).size).toBe(2)
  })

  it('sizes each option by the group rather than by its text', async () => {
    // The regression guard for the actual defect: a fixed square cannot hold a
    // translated word, and the three locales differ in length again. Each
    // option flexes to share the row, so no label can outgrow its own control.
    await openForm()

    const options = within(screen.getByRole('group', { name: 'Sex' })).getAllByRole('button')
    for (const option of options) {
      expect(option.className).toContain('flex-1')
      // The digit geometry that caused the overlap must not come back.
      expect(option.className).not.toMatch(/\bw-11\b/)
      expect(option.className).not.toMatch(/\bh-11\b/)
      expect(option.className).not.toContain('rounded-full')
    }
  })

  it('holds exactly one pressed state, and none before a choice', async () => {
    await openForm()
    const pressed = () =>
      within(screen.getByRole('group', { name: 'Sex' }))
        .getAllByRole('button')
        .filter((b) => b.getAttribute('aria-pressed') === 'true')

    expect(pressed()).toHaveLength(0)

    await userEvent.click(screen.getByRole('button', { name: 'Female' }))
    expect(pressed().map((b) => b.textContent)).toEqual(['Female'])

    await userEvent.click(screen.getByRole('button', { name: 'Male' }))
    expect(pressed().map((b) => b.textContent)).toEqual(['Male'])
  })

  it('is keyboard reachable and selectable', async () => {
    await openForm()

    const female = screen.getByRole('button', { name: 'Female' })
    female.focus()
    expect(female).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(female).toHaveAttribute('aria-pressed', 'true')
  })

  it('matches the option-card shape the activity level already uses', async () => {
    // The two are text choices in the same form; looking like one control
    // family is the point of the replacement, not a coincidence of styling.
    await openForm()

    const sex = within(screen.getByRole('group', { name: 'Sex' })).getAllByRole('button')[0]
    const activity = screen.getByRole('button', { name: /^Sedentary/ })
    for (const shared of ['rounded-card', 'border', 'px-4', 'py-3']) {
      expect(sex.className, `sex option missing ${shared}`).toContain(shared)
      expect(activity.className, `activity option missing ${shared}`).toContain(shared)
    }
  })
})
