import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { checkinRepo, settingsRepo } from '@/data/repositories'
import { BaselineCard } from './BaselineCard'

/**
 * The milestone's visible output, and the two things it must never do:
 * show a figure whose provenance is a default, and turn a goal into a date.
 */

const CONFIRMED = {
  heightCm: 178,
  birthDate: '1990-01-01',
  sex: 'male' as const,
  profileConfirmedAt: '2026-07-30',
}

async function logWeight(date: string, weightKg: number) {
  await checkinRepo.put({
    id: `c-${date}`,
    date,
    sleep: null,
    energy: null,
    soreness: null,
    stress: null,
    motivation: null,
    weightKg,
    waistCm: null,
    bodyFatPercent: null,
  })
}

beforeEach(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.settings.clear()
  await db.checkins.clear()
})

describe('the baseline is shown only when every input is real', () => {
  it('renders nothing at all before the profile is confirmed', async () => {
    await settingsRepo.update({ heightCm: 180 })
    await logWeight('2026-07-01', 84)
    const { container } = render(<BaselineCard />)

    // Not an empty card with a hint — nothing. A baseline computed from the
    // seeded height would present an invented number as the owner's.
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(container).toBeEmptyDOMElement()
  })

  it('names what is missing instead of estimating, and still shows the facts it has', async () => {
    await settingsRepo.update({ profileConfirmedAt: '2026-07-30' })
    await logWeight('2026-07-01', 84)
    render(<BaselineCard />)

    expect(await screen.findByText(/No baseline yet/)).toBeInTheDocument()
    expect(screen.getByText('Your height')).toBeInTheDocument()
    expect(screen.getByText('Sex, which the formula needs')).toBeInTheDocument()
    // The measurement it does have is not hidden.
    expect(screen.getByText(/84 kg most recently/)).toBeInTheDocument()
    // And no number is offered as a baseline.
    expect(screen.queryByText(/kcal a day/)).toBeNull()
  })

  it('shows the resting figure and its provenance', async () => {
    await settingsRepo.update(CONFIRMED)
    await logWeight('2026-07-01', 84)
    render(<BaselineCard />)

    // Mifflin for 84kg / 178cm / 36y / male: 840 + 1112.5 - 180 + 5 = 1777.5
    expect(await screen.findByText(/1778 kcal a day/)).toBeInTheDocument()
    expect(screen.getByText(/Mifflin–St Jeor \(1990\)/)).toBeInTheDocument()
    expect(screen.getByText(/FAO\/WHO\/UNU \(2001\)/)).toBeInTheDocument()
  })
})

describe('maintenance is never attributed to an activity level the user did not state', () => {
  it('offers all three bands, claiming none of them, when no band is set', async () => {
    // The defect this replaced: the card hardcoded 'sedentary', computed one
    // range from it, and labelled the output sedentary — about someone who
    // had never been asked.
    await settingsRepo.update(CONFIRMED)
    await logWeight('2026-07-01', 84)
    render(<BaselineCard />)

    await screen.findByText(/1778 kcal a day/)
    expect(screen.getByText(/depends on how active you are/)).toBeInTheDocument()

    // 1777.5 × each band, lightest first.
    expect(screen.getByText('2489–3004 kcal')).toBeInTheDocument()
    expect(screen.getByText('3022–3537 kcal')).toBeInTheDocument()
    expect(screen.getByText('3555–4266 kcal')).toBeInTheDocument()

    // No band is asserted as this user's: the sentence form that names one
    // ("Assuming mostly sitting…") must not appear at all.
    expect(screen.queryByText(/^Assuming/)).toBeNull()
    expect(screen.queryByText(/kcal a day with activity/)).toBeNull()
  })

  it('marks no band as recommended — every row is presented identically', async () => {
    // Which band a trainee belongs in is the coach's judgement. A highlighted
    // row would make that claim in styling, where no test would see it.
    await settingsRepo.update(CONFIRMED)
    await logWeight('2026-07-01', 84)
    render(<BaselineCard />)

    await screen.findByText('2489–3004 kcal')
    const names = ['Sedentary', 'Active', 'Vigorous'].map((name) => screen.getByText(name))
    const classes = new Set(names.map((node) => node.className))
    expect(classes.size).toBe(1)
  })

  it('points at the profile form rather than offering the choice here', async () => {
    // Activity level is a stated fact about the person, so it is set behind
    // the profile form's Save with the other stated facts. A control on this
    // card would make a profile fact editable outside the form that owns it.
    await settingsRepo.update(CONFIRMED)
    await logWeight('2026-07-01', 84)
    render(<BaselineCard />)

    const link = await screen.findByRole('link', { name: 'Choose your activity level' })
    expect(link).toHaveAttribute('href', '#profile')
  })

  it('shows that band alone, with its label, once one is stated', async () => {
    await settingsRepo.update({ ...CONFIRMED, activityLevel: 'active' })
    await logWeight('2026-07-01', 84)
    render(<BaselineCard />)

    expect(await screen.findByText(/3022–3537 kcal a day with activity/)).toBeInTheDocument()
    expect(screen.getByText(/Assuming an active day/)).toBeInTheDocument()
    // The other bands are gone, and so is the prompt to choose.
    expect(screen.queryByText('2489–3004 kcal')).toBeNull()
    expect(screen.queryByRole('link', { name: 'Choose your activity level' })).toBeNull()
  })

  it('keeps the resting figure for a profile confirmed before the field existed', async () => {
    // The migration case, written explicitly: the owner's install already has
    // profileConfirmedAt with no activityLevel. An added field must not
    // retroactively blank a baseline, and a missing band is not a missing
    // input — it must not appear in the "what is missing" list either.
    await settingsRepo.update(CONFIRMED)
    await logWeight('2026-07-01', 84)
    render(<BaselineCard />)

    expect(await screen.findByText(/1778 kcal a day/)).toBeInTheDocument()
    // Not the no-figure state, and not the missing-input list: an unstated
    // band means "here are all three ranges", never "a fact is absent".
    expect(screen.queryByText(/No baseline yet/)).toBeNull()
    for (const missingLabel of ['Your height', 'Your date of birth', 'Sex, which the formula needs']) {
      expect(screen.queryByText(missingLabel)).toBeNull()
    }
  })
})

describe('the goal is a distance and never a date', () => {
  it('reports remaining distance and measured direction, with no duration anywhere', async () => {
    await settingsRepo.update({ ...CONFIRMED, targetWeightKg: 78 })
    await logWeight('2026-07-01', 86)
    await logWeight('2026-07-10', 85)
    await logWeight('2026-07-20', 84)
    render(<BaselineCard />)

    expect(await screen.findByText(/6.0 kg from 78 kg/)).toBeInTheDocument()
    expect(screen.getByText(/measurements have been going down/)).toBeInTheDocument()

    // Blunt on purpose, the same shape as the recovery end screen's no-digits
    // assertion: none of the vocabulary of arrival may appear.
    const text = document.body.textContent ?? ''
    for (const forbidden of ['week', 'month', 'by ', 'at this rate', 'on track', 'expect']) {
      expect(text.toLowerCase()).not.toContain(forbidden.toLowerCase())
    }
  })

  it('withholds the direction until there is enough data, but still shows the distance', async () => {
    await settingsRepo.update({ ...CONFIRMED, targetWeightKg: 78 })
    await logWeight('2026-07-01', 84)
    render(<BaselineCard />)

    expect(await screen.findByText(/6.0 kg from 78 kg/)).toBeInTheDocument()
    expect(screen.getByText(/A few more weigh-ins/)).toBeInTheDocument()
  })

  it('shows no target section at all when no target is set', async () => {
    await settingsRepo.update(CONFIRMED)
    await logWeight('2026-07-01', 84)
    render(<BaselineCard />)

    await screen.findByText(/1778 kcal a day/)
    expect(screen.queryByText(/Your target/)).toBeNull()
  })
})
