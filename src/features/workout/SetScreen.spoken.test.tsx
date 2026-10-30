import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { mesocycle2Build } from '@/data/seed/program'
import i18n from '@/i18n/i18next'
import { completeWorkout, createWorkout, logSet } from '@/domain/workout'
import type { ExercisePrescription, LadderPrescription, RepRangePrescription } from '@/domain/types'
import { heard } from '@/test/heard'
import { WorkoutPage } from './WorkoutPage'

/**
 * Backlog A14's remainder (batch A2), site (b): the weight-by-reps strings on the
 * set screen. Two of them live here (the rest screen's hero is in
 * `RestScreen.spoken.test.tsx`):
 *
 *   - **Last time**, "12×14 kg · 12×16 kg · 12×18 kg · 12×20 kg", voiced as "12
 *     times 14 kilograms, middle dot ...". The entries stay on screen, hidden from
 *     assistive technology, and the same sets follow as a sentence in the order
 *     they were done, which is what carry-forward (each set starts where that set
 *     finished) is about: "12 reps at 14 kg, 12 reps at 16 kg, ... then 12 reps at
 *     20 kg".
 *   - **The rung caption**, "Rung 1 of 4 · 14 kg × 12". It is also the heading's
 *     `aria-describedby` target, and a description skips what is `aria-hidden`, so
 *     the heading's description is what proves the spoken caption reaches a user
 *     who lands on the screen: "Set 1 of 4 Rung 1 of 4, 12 reps at 14 kg".
 *
 * Only the weighted ladder captions are changed; an unweighted one ("Rung 1 of 4 ·
 * 12 reps") has no "×" and is left exactly as it was, which is also pinned.
 *
 * jsdom has no layout and does not apply the `sr-only` stylesheet. The real
 * accessibility tree of the set screen, in en, fr and zh-CN, is in the report.
 *
 * Negative controls, run 30 Oct (mutation applied to `SetScreen.tsx`, this file
 * run, restored from a saved copy, `cmp` clean):
 *   `aria-hidden` removed from the Last time entries      -> 3 red: "hears none of the glyphs", one per language. The sentence test stays GREEN
 *                                                            here (the sentence is still there, with the glyphs beside it); that is why the glyph test exists
 *   the Last time `sr-only` sentence removed              -> 4 red: the sentence test in each language, and the French decimal row
 *   the Last time weight left unformatted                 -> 1 red: the French decimal row (17,75 spoken as 17.75)
 *   `aria-hidden` removed from the rung caption           -> 6 red: the heading-description test and the caption test, one each per language
 *   the caption `sr-only` sentence removed                -> 6 red: the same six
 *   the caption's spoken text never built (`false`)       -> 6 red: the same six; the "left alone" test stays green, correctly
 *   the caption hidden always (`aria-hidden="true"`)      -> 1 red: "an unweighted caption is left exactly as it was". This is the regression the
 *                                                            "left alone" test exists for: hiding a caption that nothing replaces silences it
 */

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
  await i18n.changeLanguage('en')
})

type Locale = 'en' | 'fr' | 'zh-CN'

function ladder(weights: number[]): LadderPrescription {
  return {
    exerciseId: 'goblet-squat',
    sets: weights.length,
    mode: 'reps',
    restSeconds: 90,
    perSide: false,
    setPlan: weights.map((weightKg) => ({ weightKg, reps: 12 })),
    maxWeightKg: 38,
    weightStepKg: 2,
  }
}

const bodyweightRange: RepRangePrescription = {
  exerciseId: 'goblet-squat',
  sets: 3,
  mode: 'reps',
  restSeconds: 90,
  perSide: false,
  range: { min: 8, max: 12 },
  startWeightKg: null,
  maxWeightKg: null,
  weightStepKg: null,
}

async function start(item: ExercisePrescription, history: number[] | null) {
  if (history !== null) {
    let past = createWorkout({
      id: 'past',
      programId: mesocycle2Build.id,
      session: { id: 's', name: 'S', focus: 'F', items: [ladder(history)] },
      date: '2026-10-23',
      startedAt: '2026-10-23T09:00:00.000Z',
    })
    history.forEach((weightKg, index) => {
      past = logSet(past, 0, { weightKg, reps: 12, seconds: null, completedAt: `2026-10-23T09:1${index}:00.000Z` }, index)
    })
    await db.workouts.put(completeWorkout(past, '2026-10-23T09:40:00.000Z'))
  }
  await db.workouts.put(
    createWorkout({
      id: 'now',
      programId: mesocycle2Build.id,
      session: { id: 's', name: 'S', focus: 'F', items: [item] },
      date: '2026-10-24',
      startedAt: '2026-10-24T09:00:00.000Z',
    }),
  )
  render(
    <MemoryRouter initialEntries={['/workout']}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/workout" element={<WorkoutPage />} />
      </Routes>
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { level: 1 })
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const PREFIX: Record<Locale, RegExp> = { en: /^Last time/, fr: /^La dernière fois/, 'zh-CN': /^上次/ }

// [locale, Last time sentence, rung caption sentence]
const sentences: [Locale, string, string][] = [
  [
    'en',
    '12 reps at 14 kg, 12 reps at 16 kg, 12 reps at 18 kg, then 12 reps at 20 kg',
    'Rung 1 of 4, 12 reps at 14 kg',
  ],
  [
    'fr',
    '12 répétitions à 14 kg, 12 répétitions à 16 kg, 12 répétitions à 18 kg, puis 12 répétitions à 20 kg',
    'Palier 1 sur 4, 12 répétitions à 14 kg',
  ],
  [
    'zh-CN',
    '14 kg做12 次、16 kg做12 次、18 kg做12 次、20 kg做12 次',
    '第 1 级，共 4 级，14 kg做12 次',
  ],
]

describe.each(sentences)('SetScreen Last time, spoken — %s', (locale, lastTimeSentence) => {
  it('is heard as a sentence, with the sets in the order they were done', async () => {
    await i18n.changeLanguage(locale)
    await start(ladder([14, 16, 18, 20]), [14, 16, 18, 20])
    const line = screen.getByText(PREFIX[locale]) as HTMLElement
    expect(heard(line)).toContain(lastTimeSentence)
  })

  it('hears none of the glyphs the visible entries are made of', async () => {
    await i18n.changeLanguage(locale)
    await start(ladder([14, 16, 18, 20]), [14, 16, 18, 20])
    const line = screen.getByText(PREFIX[locale]) as HTMLElement
    expect(heard(line)).not.toMatch(/[×·→]/)
    // The entries are still on screen, whole, and hidden from assistive technology.
    const entries = line.querySelector('[data-numeric]')
    expect(entries).toHaveAttribute('aria-hidden', 'true')
    expect(entries?.textContent).toContain('×')
  })
})

describe('SetScreen Last time, spoken — the weight is spoken as the language writes it', () => {
  it('fr: 17,75 and not 17.75', async () => {
    await i18n.changeLanguage('fr')
    await start(ladder([17.75, 17.75]), [17.75, 17.75])
    const line = screen.getByText(PREFIX.fr) as HTMLElement
    expect(heard(line)).toContain('12 répétitions à 17,75 kg, puis 12 répétitions à 17,75 kg')
  })
})

describe.each(sentences)('SetScreen rung caption, spoken — %s', (locale, _lastTime, captionSentence) => {
  it('the heading is described by the sentence, not by the glyph line', async () => {
    await i18n.changeLanguage(locale)
    await start(ladder([14, 16, 18, 20]), [14, 16, 18, 20])
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveAccessibleDescription(new RegExp(escape(captionSentence)))
    expect(heading).not.toHaveAccessibleDescription(/×/)
  })

  it('the caption is heard as the sentence and hears no glyph', async () => {
    await i18n.changeLanguage(locale)
    await start(ladder([14, 16, 18, 20]), [14, 16, 18, 20])
    const heading = screen.getByRole('heading', { level: 1 })
    const captionId = heading.getAttribute('aria-describedby')?.split(' ')[1] ?? ''
    const caption = document.getElementById(captionId) as HTMLElement
    expect(caption).not.toBeNull()
    expect(heard(caption)).toBe(captionSentence)
    expect(heard(caption)).not.toMatch(/[×·]/)
    // And the visible line is still there for the eye, whole.
    const visible = caption.querySelector('span[aria-hidden="true"]')
    expect(visible).not.toBeNull()
    expect(visible?.textContent).toContain('×')
  })
})

describe('SetScreen rung caption — an unweighted caption is left exactly as it was', () => {
  it('has no spoken sibling and is not hidden (nothing in it is a glyph to read)', async () => {
    await start(bodyweightRange, null)
    const heading = screen.getByRole('heading', { level: 1 })
    const captionId = heading.getAttribute('aria-describedby')?.split(' ')[1] ?? ''
    const caption = document.getElementById(captionId) as HTMLElement
    expect(caption.querySelector('.sr-only')).toBeNull()
    expect(caption.querySelector('[aria-hidden]')).toBeNull()
  })
})
