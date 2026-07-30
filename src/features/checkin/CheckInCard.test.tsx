import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/data/db'
import { checkinRepo } from '@/data/repositories'
import { readinessFrom } from '@/domain/readiness'
import type { CheckIn } from '@/domain/types'
import { CheckInCard } from './CheckInCard'

/**
 * A2: rating the fifth signal makes the check-in complete, which collapses
 * the card — unmounting the RatingPicker button the user just pressed.
 * Focus fell to <body>, so nothing announced that the check-in had
 * completed, and the readiness tier (the payoff of the whole flow) rendered
 * into a region focus had left and no live region covered. That is the
 * product's "what happens next" rule failing, not only a WCAG clause.
 */

const DATE_KEY = '2026-07-20'

function checkInWith(overrides: Partial<CheckIn>): CheckIn {
  return {
    id: `checkin-${DATE_KEY}`,
    date: DATE_KEY,
    sleep: null,
    energy: null,
    soreness: null,
    stress: null,
    motivation: null,
    weightKg: null,
    waistCm: null,
    ...overrides,
  }
}

/** Four of five signals rated — one tap from completing. */
const ALMOST_COMPLETE = checkInWith({ sleep: 4, energy: 4, soreness: 4, stress: 4 })
const COMPLETE = checkInWith({ sleep: 4, energy: 4, soreness: 4, stress: 4, motivation: 4 })

function card(checkIn: CheckIn) {
  return (
    <CheckInCard
      dateKey={DATE_KEY}
      checkIn={checkIn}
      readiness={readinessFrom(checkIn, [checkIn])}
    />
  )
}

afterEach(async () => {
  await db.checkins.clear()
})

describe('completing the check-in', () => {
  it('moves focus to the collapsed control, whose name carries the readiness tier', async () => {
    const { rerender } = render(card(ALMOST_COMPLETE))

    await userEvent.click(screen.getByRole('button', { name: 'Motivation: 4' }))
    // The card is prop-driven: the write above returns through TodayPage's
    // useLiveQuery as a new checkIn, and *that* is what collapses it. The
    // rerender stands in for the live query.
    rerender(card(COMPLETE))

    const collapsed = await screen.findByRole('button', { name: /Edit$/ })
    await waitFor(() => expect(collapsed).toHaveFocus())
    // The tier is the payoff of the flow, so it must be part of what gets
    // announced — not text sitting silently in a region focus has left.
    expect(collapsed).toHaveAccessibleName(expect.stringContaining('Ready to train.'))
  })

  it('does not steal focus when it simply renders already-complete', async () => {
    render(card(COMPLETE))

    await screen.findByRole('button', { name: /Edit$/ })
    expect(document.body).toHaveFocus()
  })
})

describe('two ratings tapped in one frame both survive', () => {
  /**
   * **The lost-rating regression.** The card used to rebuild the whole row
   * from its `checkIn` prop, which is one `useLiveQuery` frame old. Two taps
   * inside that frame both started from the same snapshot, so the second
   * write reinstated the first signal's previous value — a silently lost
   * answer, in the surface most likely to be tapped quickly, since there are
   * five rows and the natural gesture is to run down them.
   *
   * The card is rendered with a *stale* prop throughout, which is exactly the
   * condition that produced the bug: `useLiveQuery` has not caught up, so the
   * component still believes nothing is rated.
   */
  const EMPTY = checkInWith({})

  it('keeps the first rating when a second is tapped before the query catches up', async () => {
    render(card(EMPTY))

    // No re-render between the two, so the second tap reads the same prop the
    // first did. Without a transactional merge the second write wins outright
    // and Sleep goes back to null.
    await userEvent.click(screen.getByRole('button', { name: 'Sleep: 4' }))
    await userEvent.click(screen.getByRole('button', { name: 'Energy: 5' }))

    await waitFor(async () => {
      const stored = await db.checkins.get(`checkin-${DATE_KEY}`)
      expect(stored?.energy).toBe(5)
      expect(stored?.sleep, 'the first rating was dropped by the second write').toBe(4)
    })
  })

  it('survives two writes that start before either resolves', async () => {
    // The sharper version: both writes in flight at once, which read-then-put
    // cannot serialise however fresh the prop is.
    await Promise.all([
      checkinRepo.mergeByDate(DATE_KEY, { sleep: 3 }),
      checkinRepo.mergeByDate(DATE_KEY, { motivation: 5 }),
    ])

    const stored = await db.checkins.get(`checkin-${DATE_KEY}`)
    expect(stored?.sleep).toBe(3)
    expect(stored?.motivation).toBe(5)
  })

  it('creates the row with every column, including one this card never sets', async () => {
    // The literal that used to live in this file had already drifted — it
    // omitted bodyFatPercent, so a row created here differed in shape from
    // one created by MeasurementCard. The repository owns the blank row now.
    render(card(EMPTY))
    await userEvent.click(screen.getByRole('button', { name: 'Sleep: 4' }))

    await waitFor(async () => {
      const stored = await db.checkins.get(`checkin-${DATE_KEY}`)
      expect(stored).toBeDefined()
      expect(stored).toHaveProperty('bodyFatPercent', null)
      expect(stored).toHaveProperty('waistCm', null)
    })
  })
})
