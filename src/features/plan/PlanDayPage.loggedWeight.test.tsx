import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import i18n from '@/i18n/i18next'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { completeWorkout, createWorkout, logSet, swapExercise } from '@/domain/workout'
import type { LoggedSet, Workout } from '@/domain/types'
import { PlanDayPage } from './PlanDayPage'

/**
 * The plan day page's printed logged sets write the weight as the language writes it
 * (T2, 30 Oct): French "8 × 17,75 kg". The line printed the stored number as it came,
 * "8 × 17.75 kg", over a spoken sentence (batch A3) that already said "17,75". The weight
 * is now formatted with the Stepper's `formatNumber`, in the one function both the day's
 * sets and a pre-swap record of sets go through.
 *
 * English and Chinese print a decimal point and are unchanged, and a whole weight is
 * unchanged in all three. Those rows are here on purpose: they pass before and after the
 * fix and pin "unchanged" instead of leaving it as a claim. The spoken sentences have
 * their own file (`PlanDayPage.spoken.test.tsx`).
 *
 * Negative controls, run 30 Oct (mutation applied to `PlanDayPage.tsx`, the whole suite
 * run, restored and `cmp`ed):
 *   the weight given to the printed line as the raw number again
 *       -> 5 red, all French: the three decimal rows (two with one load, two loads, an
 *          assisted set), the pre-swap record, and `PlanDayPage.spoken.test.tsx`'s French
 *          decimal row, which now looks at the printed line too. The English and Chinese
 *          rows and the whole-load row stay green, which is "unchanged".
 *
 * What it cannot see: the day's sets are only found here by their text, so a layout that
 * moved them somewhere else would pass; and it covers the weight, not the reps or the
 * seconds (integers) or the day's kilograms total (`Math.round`, an integer).
 */

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 6, 27, 9, 0, 0) })
  await seedDatabase()
})

afterAll(() => {
  vi.useRealTimers()
})

afterEach(async () => {
  await db.workouts.clear()
  await i18n.changeLanguage('en')
})

const DATE = '2026-07-22'
const at = (minute: number) => `${DATE}T09:${String(minute).padStart(2, '0')}:00.000Z`

type SetInput = Omit<LoggedSet, 'setIndex'>
const reps = (weightKg: number | null, n: number, extra: Partial<SetInput> = {}): SetInput => ({
  weightKg,
  reps: n,
  seconds: null,
  completedAt: at(10),
  ...extra,
})

/** Legs & Core: item 0 is goblet-squat. */
const session = seedProgram.sessions[1]

function workoutOf(sets: SetInput[]): Workout {
  let w = createWorkout({ id: 'w-weight', programId: seedProgram.id, session, date: DATE, startedAt: at(0) })
  sets.forEach((set, index) => {
    w = logSet(w, 0, set, index)
  })
  return completeWorkout(w, at(40))
}

function swappedWorkout(): Workout {
  let w = createWorkout({ id: 'w-swapped-weight', programId: seedProgram.id, session, date: DATE, startedAt: at(0) })
  w = logSet(w, 0, reps(17.75, 10), 0)
  w = logSet(w, 0, reps(17.5, 9), 1)
  w = swapExercise(w, 0, 'split-squat')
  w = logSet(w, 0, reps(12, 10), 0)
  return completeWorkout(w, at(40))
}

function renderDay() {
  return render(
    <MemoryRouter initialEntries={[`/plan/${DATE}`]}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/plan/:date" element={<PlanDayPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

// [name, workout, printed line in en, fr, zh-CN]
const rows: [string, () => Workout, string, string, string][] = [
  [
    'a barbell load with two decimals',
    () => workoutOf([reps(17.75, 8)]),
    '8 × 17.75 kg',
    '8 × 17,75 kg',
    '8 × 17.75 kg',
  ],
  [
    'a load with one decimal, then another',
    () => workoutOf([reps(17.5, 10), reps(20.25, 9)]),
    '10 × 17.5 kg · 9 × 20.25 kg',
    '10 × 17,5 kg · 9 × 20,25 kg',
    '10 × 17.5 kg · 9 × 20.25 kg',
  ],
  [
    'a whole load',
    () => workoutOf([reps(20, 10)]),
    '10 × 20 kg',
    '10 × 20 kg',
    '10 × 20 kg',
  ],
  [
    'an assisted set with a decimal load keeps its mark',
    () => workoutOf([reps(17.75, 10, { assisted: true })]),
    '10 × 17.75 kg (assisted)',
    '10 × 17,75 kg (avec assistance)',
    '10 × 17.75 kg（有辅助）',
  ],
]

const LOCALES = ['en', 'fr', 'zh-CN'] as const

describe.each(LOCALES.map((locale, i) => [locale, i] as const))('PlanDayPage logged sets, printed — %s', (locale, i) => {
  it.each(rows)('%s', async (_name, build, ...lines) => {
    await i18n.changeLanguage(locale)
    await db.workouts.put(build())
    renderDay()
    const line = await screen.findByText(lines[i])
    expect(line.textContent).toBe(lines[i])
    expect(line).toHaveAttribute('aria-hidden', 'true')
  })
})

describe.each([
  ['en', 'Before the swap, Goblet squat: 10 × 17.75 kg · 9 × 17.5 kg'],
  ['fr', 'Avant le remplacement, Goblet squat : 10 × 17,75 kg · 9 × 17,5 kg'],
  ['zh-CN', '更换前，高脚杯深蹲：10 × 17.75 kg · 9 × 17.5 kg'],
] as const)('PlanDayPage record of sets before a swap, printed — %s', (locale, printed) => {
  it('writes the weights the same way as the day’s own sets', async () => {
    await i18n.changeLanguage(locale)
    await db.workouts.put(swappedWorkout())
    renderDay()
    const line = await screen.findByText(printed)
    expect(line).toHaveAttribute('aria-hidden', 'true')
  })
})
