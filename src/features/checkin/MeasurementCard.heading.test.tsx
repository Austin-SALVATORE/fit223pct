import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { db } from '@/data/db'
import type { CheckIn } from '@/domain/types'
import { MeasurementCard } from './MeasurementCard'

/**
 * A9 (docs/review-backlog.md — re-measured 30 Jul, "STILL OPEN"), the
 * `MeasurementCard` half. Same defect and same reasoning as
 * `CheckInCard.heading.test.tsx`: the collapsed row's `<h2>` is nested
 * inside the "Edit" button, so its text is absorbed into the button's
 * accessible name and unreachable by heading navigation. A naive
 * `getByRole('heading', …)` assertion can't see this — jsdom finds the
 * nested `<h2>` regardless of its interactive ancestor — so this checks
 * DOM containment directly.
 *
 * The expanded state already fixes the *analogous* region-naming defect
 * (A12) via `aria-labelledby` — see this file's sibling test in
 * `MeasurementCard.test.tsx` ("takes its accessible name from its own
 * visible heading"). That precedent doesn't touch the collapsed
 * button's own separate `<h2>` nesting, which is this file's subject.
 */

const DATE_KEY = '2026-07-20'

const COMPLETE_CHECKIN: CheckIn = {
  id: `checkin-${DATE_KEY}`,
  date: DATE_KEY,
  sleep: null,
  energy: null,
  soreness: null,
  stress: null,
  motivation: null,
  weightKg: 84,
  waistCm: 82,
}

afterEach(async () => {
  await db.checkins.clear()
})

describe('MeasurementCard — the collapsed heading is not absorbed into the Edit button (A9)', () => {
  it('the Edit button contains no heading in its own subtree', () => {
    render(<MeasurementCard dateKey={DATE_KEY} checkIn={COMPLETE_CHECKIN} />)
    const button = screen.getByRole('button', { name: /Edit$/ })
    expect(within(button).queryByRole('heading')).toBeNull()
  })

  it('the card heading is still reachable by heading navigation, outside the button', () => {
    render(<MeasurementCard dateKey={DATE_KEY} checkIn={COMPLETE_CHECKIN} />)
    const heading = screen.getByRole('heading', { level: 2, name: 'Measurements' })
    const button = screen.getByRole('button', { name: /Edit$/ })
    expect(button.contains(heading)).toBe(false)
  })
})
