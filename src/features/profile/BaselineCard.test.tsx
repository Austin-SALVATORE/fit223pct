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

  it('shows the resting figure, a maintenance RANGE, and its provenance', async () => {
    await settingsRepo.update(CONFIRMED)
    await logWeight('2026-07-01', 84)
    render(<BaselineCard />)

    // Mifflin for 84kg / 178cm / 36y / male: 840 + 1112.5 - 180 + 5 = 1777.5
    expect(await screen.findByText(/1778 kcal a day/)).toBeInTheDocument()
    // A range, never a point — the bands are ranges and collapsing one would
    // manufacture precision the source does not have.
    expect(screen.getByText(/2489–3004 kcal a day with activity/)).toBeInTheDocument()
    expect(screen.getByText(/Mifflin–St Jeor \(1990\)/)).toBeInTheDocument()
    expect(screen.getByText(/FAO\/WHO\/UNU \(2001\)/)).toBeInTheDocument()
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
