import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { createWorkout, logSet } from '@/domain/workout'
import { ExercisePage } from '@/features/library/ExercisePage'
import en from '@/locales/en/workout.json'
import fr from '@/locales/fr/workout.json'
import zhCN from '@/locales/zh-CN/workout.json'
import { WorkoutPage } from './WorkoutPage'

/**
 * Session-preservation regressions: the workout's position is derived from
 * persisted sets, so leaving (refresh, Technique detour, app kill) and
 * returning must resume at the exact set.
 */

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
})

async function insertActiveWorkoutWithOneLoggedSet() {
  const session = seedProgram.sessions[1] // Legs & Core, item 0 = goblet-squat
  let workout = createWorkout({
    id: 'test-active',
    programId: seedProgram.id,
    session,
    date: '2026-07-22',
    startedAt: '2026-07-22T09:00:00.000Z',
  })
  workout = logSet(workout, 0, {
    weightKg: 14,
    reps: 10,
    seconds: null,
    completedAt: '2026-07-22T09:05:00.000Z',
  })
  await db.workouts.put(workout)
}

function renderWorkout() {
  return render(
    <MemoryRouter initialEntries={['/workout']}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/workout" element={<WorkoutPage />} />
        <Route path="/library/:exerciseId" element={<ExercisePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('WorkoutPage session preservation', () => {
  it('resumes at the exact set derived from persisted data', async () => {
    await insertActiveWorkoutWithOneLoggedSet()
    renderWorkout()
    expect(await screen.findByText(/Set 2 of 3/)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Goblet squat' })).toBeInTheDocument()
  })

  it('never shows the Settings entry — Workout Mode is deliberately chrome-free', async () => {
    await insertActiveWorkoutWithOneLoggedSet()
    renderWorkout()
    await screen.findByRole('heading', { name: 'Goblet squat' })
    expect(screen.queryByRole('link', { name: 'Settings' })).toBeNull()
  })

  it('survives a Technique detour: Workout → detail → back → same set', async () => {
    await insertActiveWorkoutWithOneLoggedSet()
    renderWorkout()
    await screen.findByText(/Set 2 of 3/)

    await userEvent.click(screen.getByRole('link', { name: 'Technique' }))
    expect(
      await screen.findByRole('heading', { name: 'Goblet squat' }),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: /Workout/ }))
    expect(await screen.findByText(/Set 2 of 3/)).toBeInTheDocument()
  })

  it('offers a way back to Today when no session is in progress', async () => {
    renderWorkout()
    expect(await screen.findByText(/no session in progress/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: /Back to Today/ }))
    expect(await screen.findByText('TODAY PROBE')).toBeInTheDocument()
  })
})

describe('pausing a session is a control you can see and hit', () => {
  /**
   * The owner could not reliably hit the old 40×40 icon-only ✕ — the control
   * the routine player's was copied from. Owner ruling: it reads as *pausing*,
   * not leaving, because a bare ✕ gives no hint the sets survive and closing
   * is the scarier of the two readings.
   */
  it('says pause, in words, with the glyph decorative', async () => {
    await insertActiveWorkoutWithOneLoggedSet()
    renderWorkout()
    await screen.findByText(/Set 2 of 3/)

    const pause = screen.getByRole('link', { name: /^Pause session/ })
    expect(pause.textContent).toContain('Pause session')
    expect(pause.querySelector('[aria-hidden="true"]')?.textContent).toBe('‖')
    // Never "leave" or "close" — the sets survive, and the routine player's
    // wording would say otherwise.
    expect(pause.textContent?.toLowerCase()).not.toMatch(/leave|close|exit|discard/)
  })

  it('states a 44px floor and does not use the palette\'s weakest contrast', async () => {
    await insertActiveWorkoutWithOneLoggedSet()
    renderWorkout()
    await screen.findByText(/Set 2 of 3/)

    const pause = screen.getByRole('link', { name: /^Pause session/ })
    // jsdom has no layout, so the class is the only mechanical proxy for a hit
    // target. Asserted anyway: it fails if someone reverts to a fixed h-10,
    // which is how 40px shipped here in the first place.
    expect(pause.className).toContain('min-h-11')
    expect(pause.className).not.toContain('h-10')
    expect(pause.className).toContain('text-ink-secondary')
    expect(pause.className).not.toContain('text-ink-tertiary')
  })

  it('pauses in one tap, with no confirm step', async () => {
    // A confirm would contradict the label: pausing costs nothing, which is
    // the whole point of saying "pause" rather than "leave". Reset and discard
    // are separate, deliberately-confirmed operations and this must not drift
    // toward either.
    await insertActiveWorkoutWithOneLoggedSet()
    renderWorkout()
    await screen.findByText(/Set 2 of 3/)

    await userEvent.click(screen.getByRole('link', { name: /^Pause session/ }))

    expect(await screen.findByText('TODAY PROBE')).toBeInTheDocument()
    // And the session is still there — paused, not discarded.
    const stored = await db.workouts.toArray()
    expect(stored).toHaveLength(1)
    expect(stored[0].completedAt).toBeNull()
    expect(stored[0].exercises[0].sets).toHaveLength(1)
  })

  it('keeps the promise it makes: the paused session resumes at the same set', async () => {
    // The label asserts resumability, so the assertion is tested rather than
    // trusted. Distinct from "resumes at the exact set derived from persisted
    // data" above: that proves resume in general, this proves it across the
    // pause control specifically, which is what the word promises.
    await insertActiveWorkoutWithOneLoggedSet()
    const first = renderWorkout()
    await screen.findByText(/Set 2 of 3/)

    await userEvent.click(screen.getByRole('link', { name: /^Pause session/ }))
    await screen.findByText('TODAY PROBE')
    first.unmount()

    renderWorkout()
    expect(await screen.findByText(/Set 2 of 3/)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Goblet squat' })).toBeInTheDocument()
  })
})

describe('the pause label and its accessible name never disagree', () => {
  it('the name starts with the visible string in every locale (WCAG 2.5.3)', () => {
    // Two coupled strings in separate files, which a translator has no reason
    // to know about. Voice-control users speak what they can see, so a name
    // that does not begin with the visible text is unreachable by voice.
    for (const [locale, bundle] of Object.entries({ en, fr, zhCN })) {
      expect(
        bundle.pauseAriaLabel.startsWith(bundle.pause),
        `${locale}: "${bundle.pauseAriaLabel}" must start with "${bundle.pause}"`,
      ).toBe(true)
      expect(bundle.pause.length, locale).toBeLessThan(bundle.pauseAriaLabel.length)
    }
  })

  it('promises pausing, not leaving, in every locale', () => {
    // The owner's ruling was semantic. A translator reaching for "quitter" or
    // "退出" would reintroduce exactly the wrong promise — that work is lost.
    expect(en.pause.toLowerCase()).toContain('pause')
    expect(fr.pause.toLowerCase()).toContain('pause')
    expect(zhCN.pause).toContain('暂停')
    for (const bundle of [en, fr, zhCN]) {
      expect(bundle.pause).not.toMatch(/leave|quitter|退出|close|fermer|关闭/i)
    }
  })
})
