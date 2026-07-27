import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/data/db'
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
