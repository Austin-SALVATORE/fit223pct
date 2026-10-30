import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { checkinRepo, settingsRepo } from '@/data/repositories'
import { seedDatabase } from '@/data/seed'
import i18n from '@/i18n/i18next'
import { ActivationRecordControl } from '@/features/activity/ActivationRecordControl'
import { ExercisePage } from '@/features/library/ExercisePage'
import { PlanPage } from '@/features/plan/PlanPage'
import { BaselineCard } from '@/features/profile/BaselineCard'
import { RoutinePlayer } from '@/features/recovery/RoutinePlayer'

/**
 * The 44px floor, reached in the five places the forced-colors review found
 * under it (T1, 30 Oct). `touchTargets.test.tsx` asserts class literals in the
 * Workout Mode files and the Settings switch; it never opened these files.
 *
 * Measured in a real browser on 30 Oct (Chromium, 375 and 320px, en/fr/zh), before
 * the fix, then after:
 *   Today "Mark done"                     38 -> 44
 *   routine player Back / Pause / Next    42 -> 44
 *   Settings "Choose your activity level" 38 -> 44
 *   Library substitution chips            38 -> 44
 *   Plan PhaseNav previous / next         20 -> 44 (layout unchanged, see below)
 * Widths did not move in any locale or width.
 *
 * jsdom has no layout, so this cannot measure height. It checks the class that
 * makes the height, and it checks it on the element that IS the control, found
 * the way a user finds it (by role and name), not in a window of source text: the
 * first version of `touchTargets.test.tsx` was satisfied by a sibling's `min-h-11`,
 * and a search of the file cannot tell which control a class belongs to. Each
 * control is its own test, and the two PhaseNav buttons are separate, so one
 * carrying the floor cannot cover for the other.
 *
 * `-my-3` on PhaseNav is part of the contract, not decoration: the buttons are 44px
 * boxes around 20px of text, and `-my-3` takes the 12px above and below back out of
 * the layout. Without it the row grows from 20px to 44px and everything under it
 * moves 24px. It is asserted for that reason.
 *
 * Negative controls, run 30 Oct (mutation applied, the whole suite run, restored and
 * `cmp`ed). `min-h-11` removed from:
 *   "Mark done"                        -> that test red, nothing else
 *   the routine player's PlayerButton  -> Back, Pause and Next red (one component)
 *   the Settings link                  -> that test red
 *   the Library chip                   -> both chips red
 *   the PhaseNav previous button only  -> "previous" red, "next" green
 *   the PhaseNav next button only      -> "next" red, "previous" green
 * and `-my-3` removed from the previous button only -> "previous" red, "next" green
 * (the layout contract above).
 * The last four pairs use anchors that include the button's own `onClick`, because
 * the two PhaseNav class strings are identical and a bare string cannot tell them
 * apart.
 *
 * What it cannot see: a height. A class can be present and still lose to another
 * (`h-10` beside it would), and a parent can clip the box. The pixels above were
 * measured; this test is what keeps them from regressing quietly, no more.
 */

function expectFloor(control: HTMLElement, extra: string[] = []): void {
  // `inline-flex` + `items-center` keep the label centred in the taller box;
  // `min-h-11` is the floor itself.
  for (const token of ['min-h-11', 'inline-flex', 'items-center', ...extra]) {
    expect(control.classList.contains(token), `${control.textContent} lacks ${token}: ${control.className}`).toBe(true)
  }
}

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 2, 9, 0, 0) }) // Mon 2 Nov, mid Mesocycle 2
})

// Every test, not once: the settings record is cleared after each (the baseline link
// only renders for a confirmed profile), and `settingsRepo.update` does nothing when
// there is no record to patch.
beforeEach(async () => {
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

afterEach(async () => {
  cleanup()
  await db.settings.clear()
  await db.checkins.clear()
  await i18n.changeLanguage('en')
})

describe('the controls found under 44px now carry the floor', () => {
  it('Today "Mark done"', () => {
    render(<ActivationRecordControl dateKey="2026-11-02" programId="mesocycle-2-build" existing={undefined} />)
    expectFloor(screen.getByRole('button', { name: 'Mark done' }))
  })

  it.each(['Back', 'Pause', 'Next'])('the routine player %s button', async (name) => {
    render(
      <MemoryRouter initialEntries={['/routine/recovery-stretch-v1']}>
        <Routes>
          <Route path="/routine/:routineId" element={<RoutinePlayer />} />
        </Routes>
      </MemoryRouter>,
    )
    await userEvent.click(await screen.findByRole('button', { name: 'Start' }))
    expectFloor(screen.getByRole('button', { name }))
  })

  it('the Settings "Choose your activity level" link', async () => {
    await settingsRepo.update({ heightCm: 178, birthDate: '1990-01-01', sex: 'male', profileConfirmedAt: '2026-07-30' })
    await checkinRepo.put({
      id: 'c-2026-07-01',
      date: '2026-07-01',
      sleep: null,
      energy: null,
      soreness: null,
      stress: null,
      motivation: null,
      weightKg: 84,
      waistCm: null,
      bodyFatPercent: null,
    })
    render(<BaselineCard />)
    expectFloor(await screen.findByRole('link', { name: 'Choose your activity level' }))
  })

  it.each(['Split squat', 'Tempo bodyweight squat'])('the Library substitution chip "%s"', async (name) => {
    render(
      <MemoryRouter initialEntries={['/library/goblet-squat']}>
        <Routes>
          <Route path="/library/:exerciseId" element={<ExercisePage />} />
        </Routes>
      </MemoryRouter>,
    )
    expectFloor(await screen.findByRole('link', { name }))
  })

  it('the Plan phase navigation: previous', async () => {
    render(
      <MemoryRouter initialEntries={['/plan']}>
        <Routes>
          <Route path="/plan" element={<PlanPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expectFloor(await screen.findByRole('button', { name: /^← Phase 1/ }), ['-my-3'])
  })

  it('the Plan phase navigation: next', async () => {
    render(
      <MemoryRouter initialEntries={['/plan?program=phase-1-home']}>
        <Routes>
          <Route path="/plan" element={<PlanPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expectFloor(await screen.findByRole('button', { name: /Mesocycle 2.* →$/ }), ['-my-3'])
  })
})
