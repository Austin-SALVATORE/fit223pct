import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/data/db'
import { checkinRepo, settingsRepo } from '@/data/repositories'
import { seedDatabase } from '@/data/seed'
import { resolveProfile } from '@/domain/profile'
import { toDateKey } from '@/lib/dates'
import { readinessFrom } from '@/domain/readiness'
import { CheckInCard } from './CheckInCard'
import { MeasurementCard } from './MeasurementCard'
import { TodayMeasurementCard } from './TodayMeasurementCard'

/**
 * The invariant this card exists to keep: **no measurement is persisted until
 * the user has actively chosen one**, and a measurement is not a check-in.
 *
 * Both halves had failed. Tapping "Add a body-fat reading" wrote 20% straight
 * to the database — a guess indistinguishable from a reading, feeding the
 * lean-mass REE — in code whose own adjacent comment forbade exactly that.
 */

const DATE_KEY = '2026-07-20'

afterEach(async () => {
  await db.checkins.clear()
  await db.settings.clear()
})

function renderCard(checkIn?: Awaited<ReturnType<typeof checkinRepo.getByDate>>) {
  return render(<MeasurementCard dateKey={DATE_KEY} checkIn={checkIn} />)
}

async function storedRow() {
  return await checkinRepo.getByDate(DATE_KEY)
}

describe('revealing a control is not entering a value', () => {
  it('persists nothing when the body-fat control is revealed', async () => {
    renderCard()

    await userEvent.click(screen.getByRole('button', { name: 'Add a body-fat reading' }))

    // The stepper is now on screen offering a starting point...
    expect(screen.getByLabelText('Body fat')).toHaveTextContent('20')
    // ...and absolutely nothing has been written. This is the regression test
    // for the defect: the old code called save() from this button's onClick.
    expect(await storedRow()).toBeUndefined()
  })

  it('persists nothing at all until a stepper is actually adjusted', async () => {
    renderCard()
    // Weight and waist are visible with their own placeholder defaults.
    expect(screen.getByLabelText('Weight')).toHaveTextContent('70')
    expect(screen.getByLabelText('Waist')).toHaveTextContent('80')

    expect(await storedRow()).toBeUndefined()
  })

  it('persists a body-fat reading once it is adjusted', async () => {
    renderCard()
    await userEvent.click(screen.getByRole('button', { name: 'Add a body-fat reading' }))
    await userEvent.click(screen.getByRole('button', { name: 'Increase Body fat' }))

    await waitFor(async () => {
      expect((await storedRow())?.bodyFatPercent).toBe(20.5)
    })
  })

  it('persists nothing when the revealed field is focused and left', async () => {
    // Direct entry added a second way to touch a control without choosing a
    // value: tapping the number opens a text field. Opening and leaving it is
    // still not entering a reading, so the invariant has to hold through the
    // typing path as well as the reveal path.
    renderCard()
    await userEvent.click(screen.getByRole('button', { name: 'Add a body-fat reading' }))
    await userEvent.click(screen.getByRole('button', { name: 'Edit Body fat' }))
    await userEvent.tab()

    expect(await storedRow()).toBeUndefined()
  })

  it('persists a typed body-fat reading, because typing is a choice', async () => {
    renderCard()
    await userEvent.click(screen.getByRole('button', { name: 'Add a body-fat reading' }))
    await userEvent.click(screen.getByRole('button', { name: 'Edit Body fat' }))
    const input = screen.getByRole('textbox', { name: 'Body fat' })
    await userEvent.clear(input)
    await userEvent.type(input, '17.5{Enter}')

    await waitFor(async () => {
      expect((await storedRow())?.bodyFatPercent).toBe(17.5)
    })
  })

  it('keeps the revealed stepper on screen after an adjustment', async () => {
    // Guards a subtler version of the same bug: if reveal state were derived
    // only from the stored value, the control would vanish on any write that
    // left bodyFatPercent null.
    renderCard()
    await userEvent.click(screen.getByRole('button', { name: 'Add a body-fat reading' }))
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))

    expect(screen.getByLabelText('Body fat')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add a body-fat reading' })).toBeNull()
  })
})

describe('a measurement-only row is not a check-in', () => {
  /**
   * Verified against every consumer that could read a bare row as "you
   * checked in", because entering your weight from Settings must not
   * fabricate a readiness record you never filled in:
   *
   *  - `readinessFrom` / `dayTier` — zero answered signals returns 'steady',
   *    identical to passing null. Asserted below.
   *  - `consistencyTrend(program, workouts, today)` and
   *    `buildWeeklyReview(program, workouts, today)` — neither takes check-ins
   *    at all; consistency counts workouts and the review's tier counts read
   *    `workout.readiness`. Verified by their signatures, so a check-in row
   *    cannot reach them.
   *  - `CheckInCard` completeness — needs all five signals. Asserted below.
   */
  it('leaves readiness exactly as an absent check-in would', async () => {
    await checkinRepo.mergeByDate(DATE_KEY, { weightKg: 84, bodyFatPercent: 18 })
    const row = await storedRow()
    if (!row) throw new Error('expected the merge to create a row')

    expect(readinessFrom(row, [])).toEqual(readinessFrom(null, []))
    expect(readinessFrom(row, []).tier).toBe('steady')
    expect(readinessFrom(row, []).drivers).toEqual([])
  })

  it('leaves every rating null, so the readiness card still asks', async () => {
    await checkinRepo.mergeByDate(DATE_KEY, { weightKg: 84 })
    const row = await storedRow()

    for (const signal of ['sleep', 'energy', 'soreness', 'stress', 'motivation'] as const) {
      expect(row?.[signal]).toBeNull()
    }

    // And the readiness card treats it as unanswered rather than done: it
    // renders the rating pickers instead of collapsing to a recorded tier.
    render(
      <CheckInCard dateKey={DATE_KEY} checkIn={row} readiness={readinessFrom(row ?? null, [])} />,
    )
    expect(screen.getByRole('button', { name: 'Sleep: 1' })).toBeInTheDocument()
  })
})

describe('two surfaces write the same row without clobbering it', () => {
  it('merges rather than replacing, so a second field keeps the first', async () => {
    await checkinRepo.mergeByDate(DATE_KEY, { weightKg: 84 })
    await checkinRepo.mergeByDate(DATE_KEY, { bodyFatPercent: 18 })

    const row = await storedRow()
    expect(row?.weightKg).toBe(84)
    expect(row?.bodyFatPercent).toBe(18)
  })

  it('does not null out fields when creating the row', async () => {
    // The create path builds a blank row in the repository, so a surface that
    // knows nothing about a column cannot write null over another surface's
    // value for it.
    await checkinRepo.mergeByDate(DATE_KEY, { waistCm: 80 })
    const row = await storedRow()

    expect(row?.waistCm).toBe(80)
    expect(row?.id).toBe(`checkin-${DATE_KEY}`)
    expect(row?.date).toBe(DATE_KEY)
  })

  it('preserves ratings a real check-in already wrote', async () => {
    // The order that matters most: readiness first, measurement second. A
    // full-row put built from a stale prop would blank all five ratings.
    await checkinRepo.mergeByDate(DATE_KEY, { sleep: 4, energy: 4, soreness: 3, stress: 3, motivation: 4 })
    await checkinRepo.mergeByDate(DATE_KEY, { weightKg: 84 })

    const row = await storedRow()
    expect(row?.sleep).toBe(4)
    expect(row?.motivation).toBe(4)
    expect(row?.weightKg).toBe(84)
  })

  it('survives concurrent writes that a read-then-put would lose', async () => {
    // Two writes started before either resolved — the shape of two steppers
    // adjusted inside one useLiveQuery frame, and now of two surfaces open on
    // the same row. Read-then-put drops one; a transaction does not.
    await Promise.all([
      checkinRepo.mergeByDate(DATE_KEY, { weightKg: 84 }),
      checkinRepo.mergeByDate(DATE_KEY, { waistCm: 80 }),
    ])

    const row = await storedRow()
    expect(row?.weightKg).toBe(84)
    expect(row?.waistCm).toBe(80)
  })
})

describe('the profile page writes a CheckIn, never UserSettings', () => {
  it('offers both weight and body fat from Settings', async () => {
    // The owner's report: "on profile page, there is no fat percentage to
    // input, only weight."
    await seedDatabase()
    render(<TodayMeasurementCard />)

    expect(await screen.findByLabelText('Weight')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add a body-fat reading' })).toBeInTheDocument()
  })

  it('writes the measurement to today\'s check-in and leaves settings untouched', async () => {
    await seedDatabase()
    const settingsBefore = JSON.stringify(await settingsRepo.get())
    render(<TodayMeasurementCard />)
    await screen.findByLabelText('Weight')

    await userEvent.click(screen.getByRole('button', { name: 'Add a body-fat reading' }))
    await userEvent.click(screen.getByRole('button', { name: 'Increase Body fat' }))

    const todayKey = toDateKey(new Date())
    await waitFor(async () => {
      expect((await checkinRepo.getByDate(todayKey))?.bodyFatPercent).toBe(20.5)
    })

    // A second copy on UserSettings would drift the first time a check-in was
    // logged without opening the profile (docs/UserProfile.md).
    expect(JSON.stringify(await settingsRepo.get())).toBe(settingsBefore)
    const settings = await settingsRepo.get()
    expect(settings).not.toHaveProperty('bodyFatPercent')
    expect(settings).not.toHaveProperty('weightKg')
  })

  it('reaches the profile baseline through the check-in series, not a copy', async () => {
    // The write has to land where resolveProfile reads, or the profile page
    // would accept a measurement that changed nothing downstream.
    await seedDatabase()
    render(<TodayMeasurementCard />)
    await screen.findByLabelText('Weight')

    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))

    const todayKey = toDateKey(new Date())
    await waitFor(async () => {
      const checkins = await checkinRepo.getAll()
      expect(resolveProfile({}, checkins).currentWeightKg).toBe(70.1)
      expect(checkins.some((c) => c.date === todayKey)).toBe(true)
    })
  })

  it('claims today only, and today is what it writes', async () => {
    // Trap: resolveProfile returns the most recent non-null weight, which may
    // be weeks old. This card must not present a stale figure as today's — it
    // sidesteps that entirely by rendering today's row and no other. A
    // three-week-old measurement is therefore invisible here rather than
    // mislabelled.
    await seedDatabase()
    await checkinRepo.mergeByDate('2026-07-01', { weightKg: 99 })
    render(<TodayMeasurementCard />)

    // The old figure is not shown at all, under any heading.
    await screen.findByLabelText('Weight')
    expect(screen.queryByText(/99/)).toBeNull()
    // And the heading makes no claim about when anything was measured.
    expect(screen.getByRole('heading', { name: 'Measurements' })).toBeInTheDocument()
  })
})

describe('the region is named by what a sighted user reads', () => {
  it('takes its accessible name from its own visible heading', () => {
    // These had drifted: the region announced "Body measurements" while the
    // heading read "Measurements", so the two audiences heard different
    // section names. Asserting the relationship rather than either string
    // means a copy change to the heading cannot reintroduce the gap.
    renderCard()

    const region = screen.getByRole('region')
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Measurements')
    expect(region).toHaveAccessibleName(heading.textContent ?? '')
  })
})
