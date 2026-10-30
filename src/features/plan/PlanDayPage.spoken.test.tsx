import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import i18n from '@/i18n/i18next'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { completeWorkout, createWorkout, logSet, swapExercise } from '@/domain/workout'
import type { LoggedSet, Workout } from '@/domain/types'
import { heard } from '@/test/heard'
import { PlanDayPage } from './PlanDayPage'

/**
 * Backlog A14 leftover (batch A3), site 1: the plan day page's logged sets. Printed, a day's
 * sets read "10 × 20 kg · 9 × 20 kg": the multiplication sign is voiced as "times", the dot
 * as "middle dot", and a hold's "30s" as a letter. The printed line stays, hidden from
 * assistive technology, and the sets follow as a sentence, in order, with the same
 * "(assisted)" and "(Custom)" marks: "10 reps at 20 kg, then 9 reps at 20 kg". A record of
 * sets logged before a swap gets the same treatment inside its own sentence.
 *
 * The weight is spoken as the language writes it; the printed line shows the raw number
 * (a pre-existing French "17.75"), which this batch does not touch.
 *
 * Negative controls, run 30 Oct (mutation applied to `PlanDayPage.tsx`, this file run,
 * restored from a saved copy, `cmp` clean):
 *   the logged line loses `aria-hidden`                 -> 31 red: both tests on all five rows x three languages (30), and the
 *                                                          "adds no hidden line" count test (1)
 *   the logged spoken sentence removed                  -> 32 red: the same 30, the "adds no hidden line" test, and the French decimal row
 *   the spoken sets joined with the printed " · "       -> 27 red: both tests on the four multi-set rows (24) and the three prior-attempt
 *                                                          rows (3). The single-set row is unaffected, as it should be: nothing is joined
 *   the prior-attempt line loses `aria-hidden`          -> 3 red: the prior-attempt row, three languages
 *   the prior-attempt sentence removed                  -> 3 red: the same three
 *   the prior-attempt sentence built from printed sets  -> 3 red: the same three (the sentence would say "10 × 20 kg · 9 × 20 kg")
 *   the spoken weight left as `String(weightKg)`        -> 1 red: the French decimal row (17,75 spoken as 17.75)
 *   the spoken effort count fixed at 2                  -> 4 red: "a single set of a single rep", both tests, en and fr ("1 reps");
 *                                                          zh-CN has no plural and cannot see it
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
const held = (n: number): SetInput => ({ weightKg: null, reps: null, seconds: n, completedAt: at(10) })

/** Legs & Core: item 0 is goblet-squat (reps); its last item is side-plank (seconds). */
const session = seedProgram.sessions[1]
const holdIndex = session.items.findIndex((item) => item.mode === 'seconds')

function workoutOf(itemIndex: number, sets: SetInput[]): Workout {
  let w = createWorkout({ id: 'w-spoken', programId: seedProgram.id, session, date: DATE, startedAt: at(0) })
  sets.forEach((set, index) => {
    w = logSet(w, itemIndex, set, index)
  })
  return completeWorkout(w, at(40))
}

function swappedWorkout(): Workout {
  let w = createWorkout({ id: 'w-swapped', programId: seedProgram.id, session, date: DATE, startedAt: at(0) })
  w = logSet(w, 0, reps(20, 10), 0)
  w = logSet(w, 0, reps(20, 9), 1)
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

type Locale = 'en' | 'fr' | 'zh-CN'

// [name, workout, [visible, spoken] for en, fr, zh-CN]
const cases: [string, () => Workout, [string, string], [string, string], [string, string]][] = [
  [
    'weighted sets',
    () => workoutOf(0, [reps(20, 10), reps(20, 9)]),
    ['10 × 20 kg · 9 × 20 kg', '10 reps at 20 kg, then 9 reps at 20 kg'],
    ['10 × 20 kg · 9 × 20 kg', '10 répétitions à 20 kg, puis 9 répétitions à 20 kg'],
    ['10 × 20 kg · 9 × 20 kg', '20 kg做10 次、20 kg做9 次'],
  ],
  [
    'an assisted set and a custom set keep their marks',
    () => workoutOf(0, [reps(20, 10, { assisted: true }), reps(20, 9, { custom: true })]),
    ['10 × 20 kg (assisted) · 9 × 20 kg (Custom)', '10 reps at 20 kg (assisted), then 9 reps at 20 kg (Custom)'],
    [
      '10 × 20 kg (avec assistance) · 9 × 20 kg (Ajoutée)',
      '10 répétitions à 20 kg (avec assistance), puis 9 répétitions à 20 kg (Ajoutée)',
    ],
    ['10 × 20 kg（有辅助） · 9 × 20 kg（加练）', '20 kg做10 次（有辅助）、20 kg做9 次（加练）'],
  ],
  [
    'sets with no weight (bare reps)',
    () => workoutOf(0, [reps(null, 7), reps(null, 8)]),
    ['7 · 8', '7 reps, then 8 reps'],
    ['7 · 8', '7 répétitions, puis 8 répétitions'],
    ['7 · 8', '7 次、8 次'],
  ],
  [
    'holds (seconds)',
    () => workoutOf(holdIndex, [held(30), held(45)]),
    ['30s · 45s', '30 seconds, then 45 seconds'],
    ['30s · 45s', '30 secondes, puis 45 secondes'],
    ['30 秒 · 45 秒', '30 秒、45 秒'],
  ],
  [
    'a single set of a single rep (no sequence to join, and the singular)',
    () => workoutOf(0, [reps(20, 1)]),
    ['1 × 20 kg', '1 rep at 20 kg'],
    ['1 × 20 kg', '1 répétition à 20 kg'],
    ['1 × 20 kg', '20 kg做1 次'],
  ],
]

describe.each([
  ['en', 2],
  ['fr', 3],
  ['zh-CN', 4],
] as const)('PlanDayPage logged sets, spoken — %s', (locale: Locale, column) => {
  it.each(cases)('the sentence follows the hidden line: %s', async (...row) => {
    const [, build] = row
    const [visible, spoken] = row[column] as [string, string]
    await i18n.changeLanguage(locale)
    await db.workouts.put(build())
    renderDay()
    const line = await screen.findByText(visible)
    expect(line).toHaveAttribute('aria-hidden', 'true')
    expect(heard(line.nextElementSibling as HTMLElement)).toBe(spoken)
  })

  it.each(cases)('hears none of the glyphs from the exercise row: %s', async (...row) => {
    const [, build] = row
    const [visible, spoken] = row[column] as [string, string]
    await i18n.changeLanguage(locale)
    await db.workouts.put(build())
    renderDay()
    const line = await screen.findByText(visible)
    const item = line.closest('li') as HTMLElement
    const said = heard(item)
    expect(said).toContain(spoken)
    expect(said).not.toMatch(/[×·]/)
  })
})

describe.each([
  ['en', 'Before the swap, Goblet squat: 10 × 20 kg · 9 × 20 kg', 'Before the swap, Goblet squat: 10 reps at 20 kg, then 9 reps at 20 kg'],
  ['fr', 'Avant le remplacement, Goblet squat : 10 × 20 kg · 9 × 20 kg', 'Avant le remplacement, Goblet squat : 10 répétitions à 20 kg, puis 9 répétitions à 20 kg'],
  ['zh-CN', '更换前，高脚杯深蹲：10 × 20 kg · 9 × 20 kg', '更换前，高脚杯深蹲：20 kg做10 次、20 kg做9 次'],
] as const)('PlanDayPage record of sets before a swap, spoken — %s', (locale, visible, spoken) => {
  it('is hidden as printed and heard as a sentence', async () => {
    await i18n.changeLanguage(locale)
    await db.workouts.put(swappedWorkout())
    renderDay()
    const line = await screen.findByText(visible)
    expect(line).toHaveAttribute('aria-hidden', 'true')
    expect(heard(line.nextElementSibling as HTMLElement)).toBe(spoken)
  })
})

describe('PlanDayPage logged sets, spoken — the weight is spoken as the language writes it', () => {
  it('fr: 17,75 kg and not 17.75 kg (the printed line shows the raw number)', async () => {
    await i18n.changeLanguage('fr')
    await db.workouts.put(workoutOf(0, [reps(17.75, 8)]))
    renderDay()
    const line = await screen.findByText('8 × 17.75 kg')
    expect(heard(line.nextElementSibling as HTMLElement)).toBe('8 répétitions à 17,75 kg')
  })
})

describe('PlanDayPage — what is left alone', () => {
  it('an exercise with nothing logged adds no hidden line and no spoken sibling', async () => {
    await db.workouts.put(workoutOf(0, [reps(20, 10)]))
    renderDay()
    await screen.findByText('10 × 20 kg')
    // One logged exercise, so exactly one hidden line and one spoken sibling in the list.
    expect(document.querySelectorAll('li p[aria-hidden="true"]')).toHaveLength(1)
    expect(document.querySelectorAll('li p.sr-only')).toHaveLength(1)
  })
})
