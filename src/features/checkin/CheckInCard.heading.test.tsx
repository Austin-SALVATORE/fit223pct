import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { db } from '@/data/db'
import { readinessFrom } from '@/domain/readiness'
import type { CheckIn } from '@/domain/types'
import { CheckInCard } from './CheckInCard'

/**
 * A9 (docs/review-backlog.md — re-measured 30 Jul, "STILL OPEN"): the
 * collapsed row's own `<h2>` is a DOM descendant of the "Edit" button.
 * Real screen readers absorb a heading nested inside an interactive
 * control into that control's accessible name during rendering, and
 * skip it entirely during heading-navigation (rotor/heading list) — the
 * heading exists but is unreachable as a heading.
 *
 * `@testing-library/dom`'s `getByRole('heading', …)` cannot see this: it
 * computes a role per DOM node and finds the nested `<h2>` regardless of
 * its interactive ancestor (verification.md's "an instrument that
 * cannot see the subject" — a naive `getByRole` assertion here would
 * pass on the unfixed code and prove nothing). The check that CAN see
 * the actual defect is DOM containment: the button's own subtree must
 * not contain a heading.
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

const COMPLETE = checkInWith({ sleep: 4, energy: 4, soreness: 4, stress: 4, motivation: 4 })

function card(checkIn: CheckIn) {
  return <CheckInCard dateKey={DATE_KEY} checkIn={checkIn} readiness={readinessFrom(checkIn, [checkIn])} />
}

afterEach(async () => {
  await db.checkins.clear()
})

describe('CheckInCard — the collapsed heading is not absorbed into the Edit button (A9)', () => {
  it('the Edit button contains no heading in its own subtree', () => {
    render(card(COMPLETE))
    const button = screen.getByRole('button', { name: /Edit$/ })
    expect(within(button).queryByRole('heading')).toBeNull()
  })

  it('the card heading is still reachable by heading navigation, outside the button', () => {
    render(card(COMPLETE))
    const heading = screen.getByRole('heading', { level: 2, name: "Today's readiness" })
    const button = screen.getByRole('button', { name: /Edit$/ })
    expect(button.contains(heading)).toBe(false)
  })
})
