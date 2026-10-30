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
 *   the caption hidden always (`aria-hidden="true"`)      -> 1 red. In A2 this was "an unweighted caption is left exactly as it was"; batch A3 speaks
 *                                                            unweighted captions too, so the same test now guards the one caption with nothing to
 *                                                            replace it, a custom set's (re-run in A3: 1 red, "has no spoken sibling and is not hidden")
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

/**
 * Batch A3: the rest of the set screen's glyphs.
 *
 *   - **Unweighted rung captions**, "Rung 1 of 3 · 16 reps" and "Rung 1 of 2 · 50 s":
 *     the "·" is voiced as "middle dot" (and "s" as a letter). Now "Rung 1 of 3, 16 reps"
 *     and "Rung 1 of 2, 50 seconds".
 *   - **Range captions**, "Target · 5–8 reps" and "Target · 30–45 s": the en dash is skipped or
 *     voiced as "minus", so the range is lost. Now "Target, 5 to 8 reps"; a range whose ends
 *     are equal is one number ("Target, 10 reps"), as the prescription sentence does.
 *   - **Set progress** in zh-CN, "第 1 / 4 组", whose "/" is voiced as "slash": "第 1 组，共 4 组".
 *     en and fr print words already, so nothing is added there (pinned below), and the hiding
 *     is on a span inside the paragraph, because the paragraph is the heading's
 *     `aria-describedby` target and a node referenced directly is read even when hidden.
 *   - **A custom set's caption** ("Custom set") has no glyph and is left exactly as it was:
 *     hiding a line that nothing replaces would silence it.
 *
 * Negative controls, run 30 Oct (mutation applied to `SetScreen.tsx` or `spokenPrescription.ts`,
 * this file run, restored from a saved copy, `cmp` clean):
 *   set progress always paired, even in en and fr        -> 2 red: "words already, so nothing is added", en and fr
 *   the zh progress span loses `aria-hidden`             -> 6 red: the zh progress test and the five zh caption-description tests, because the
 *                                                           description now carries "第 1 / 4 组" and its "/" in front of every caption
 *   a custom set's caption gets a spoken sibling         -> 1 red: "has no spoken sibling and is not hidden"
 *   unweighted rungs get no spoken caption               -> 12 red: the two unweighted rows, both tests, three languages
 *   the range spoken with the en dash back               -> 18 red: the three range rows, both tests, three languages
 *   equal ends not collapsed (in `spokenSpan`)           -> 7 red: the equal-ends row, both tests, three languages (6), and A1's "a range whose
 *                                                           ends are equal reads as one number" in spokenPrescription.test.ts (1)
 *   the caption hidden always                            -> 1 red: the custom set's caption (above)
 *   the caption never hidden                             -> 37 red: every caption test of A2 and A3 (the glyph line is back in the description),
 *                                                           and the zh progress test, which reads the same description
 */
const NEVER_GLYPHS = /[·–×/]/

function seconds(efforts: number[]): LadderPrescription {
  return {
    exerciseId: 'goblet-squat',
    sets: efforts.length,
    mode: 'seconds',
    restSeconds: 60,
    perSide: false,
    setPlan: efforts.map((reps) => ({ weightKg: null, reps })),
    maxWeightKg: null,
    weightStepKg: null,
  }
}

function bare(efforts: number[]): LadderPrescription {
  return {
    exerciseId: 'goblet-squat',
    sets: efforts.length,
    mode: 'reps',
    restSeconds: 60,
    perSide: false,
    setPlan: efforts.map((reps) => ({ weightKg: null, reps })),
    maxWeightKg: null,
    weightStepKg: null,
  }
}

function range(min: number, max: number, mode: 'reps' | 'seconds' = 'reps'): RepRangePrescription {
  return { ...bodyweightRange, mode, range: { min, max } }
}

function captionOf(): HTMLElement {
  const heading = screen.getByRole('heading', { level: 1 })
  const captionId = heading.getAttribute('aria-describedby')?.split(' ')[1] ?? ''
  const caption = document.getElementById(captionId) as HTMLElement
  expect(caption).not.toBeNull()
  return caption
}

// [name, item, en, fr, zh-CN]
const captions: [string, ExercisePrescription, string, string, string][] = [
  ['an unweighted reps rung', bare([16, 20, 24]), 'Rung 1 of 3, 16 reps', 'Palier 1 sur 3, 16 répétitions', '第 1 级，共 3 级，16 次'],
  ['an unweighted seconds rung', seconds([50, 60]), 'Rung 1 of 2, 50 seconds', 'Palier 1 sur 2, 50 secondes', '第 1 级，共 2 级，50 秒'],
  ['a rep range', range(8, 12), 'Target, 8 to 12 reps', 'Objectif, 8 à 12 répétitions', '目标，8到12 次'],
  ['a seconds range', range(30, 45, 'seconds'), 'Target, 30 to 45 seconds', 'Objectif, 30 à 45 secondes', '目标，30到45 秒'],
  ['a range whose ends are equal (one number, not "10 to 10")', range(10, 10), 'Target, 10 reps', 'Objectif, 10 répétitions', '目标，10 次'],
]

describe.each([
  ['en', 2],
  ['fr', 3],
  ['zh-CN', 4],
] as const)('SetScreen captions, spoken (A3) — %s', (locale, column) => {
  it.each(captions)('the caption is heard as the sentence and hears no glyph: %s', async (...row) => {
    await i18n.changeLanguage(locale)
    await start(row[1], null)
    const caption = captionOf()
    expect(heard(caption)).toBe(row[column])
    expect(heard(caption)).not.toMatch(NEVER_GLYPHS)
    // The printed caption is still there, hidden from assistive technology.
    const visible = caption.querySelector('span[aria-hidden="true"]')
    expect(visible).not.toBeNull()
  })

  it.each(captions)('the heading is described by the sentence: %s', async (...row) => {
    await i18n.changeLanguage(locale)
    await start(row[1], null)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveAccessibleDescription(new RegExp(escape(row[column] as string)))
    expect(heading).not.toHaveAccessibleDescription(NEVER_GLYPHS)
  })
})

describe('SetScreen set progress, spoken (A3)', () => {
  it('zh-CN: "第 1 / 4 组" is hidden and "第 1 组，共 4 组" is heard, in the heading\'s description', async () => {
    await i18n.changeLanguage('zh-CN')
    await start(ladder([14, 16, 18, 20]), null)
    const heading = screen.getByRole('heading', { level: 1 })
    const progress = document.getElementById(heading.getAttribute('aria-describedby')?.split(' ')[0] ?? '') as HTMLElement
    expect(heard(progress)).toBe('第 1 组，共 4 组')
    expect(progress.querySelector('span[aria-hidden="true"]')?.textContent).toBe('第 1 / 4 组')
    expect(heading).toHaveAccessibleDescription(/^第 1 组，共 4 组/)
    expect(heading).not.toHaveAccessibleDescription(/\//)
  })

  it.each([
    ['en', 'Set 1 of 4'],
    ['fr', 'Série 1 sur 4'],
  ])('%s: words already, so nothing is added and nothing is hidden', async (locale, text) => {
    await i18n.changeLanguage(locale)
    await start(ladder([14, 16, 18, 20]), null)
    const heading = screen.getByRole('heading', { level: 1 })
    const progress = document.getElementById(heading.getAttribute('aria-describedby')?.split(' ')[0] ?? '') as HTMLElement
    expect(progress.textContent).toBe(text)
    expect(progress.querySelector('[aria-hidden], .sr-only')).toBeNull()
  })
})

describe('SetScreen captions (A3) — a custom set\'s caption is left exactly as it was', () => {
  it('has no spoken sibling and is not hidden: nothing in it is a glyph to read', async () => {
    const item = ladder([36])
    let w = createWorkout({
      id: 'custom',
      programId: mesocycle2Build.id,
      session: { id: 's', name: 'S', focus: 'F', items: [item] },
      date: '2026-10-24',
      startedAt: '2026-10-24T09:00:00.000Z',
    })
    w = {
      ...w,
      exercises: [
        {
          ...w.exercises[0],
          customSlots: 1,
          sets: [{ setIndex: 0, weightKg: 36, reps: 6, seconds: null, completedAt: '2026-10-24T09:05:00.000Z' }],
        },
      ],
    }
    await db.workouts.put(w)
    render(
      <MemoryRouter initialEntries={['/workout']}>
        <Routes>
          <Route path="/" element={<p>TODAY PROBE</p>} />
          <Route path="/workout" element={<WorkoutPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await screen.findByText('Custom set')
    const caption = captionOf()
    expect(caption.querySelector('.sr-only')).toBeNull()
    expect(caption.querySelector('[aria-hidden]')).toBeNull()
  })
})

/**
 * Batch A4 follow-up: the "⇄ each side" pill on the caption of a per-side exercise. The caption is
 * the heading's `aria-describedby` target, so the pill's glyph was read into the description a user
 * hears on landing: "SET 1 OF 3 Rung 1 of 3, 12 reps at 10 kg ⇄ each side" (measured in the real tree
 * on Session B's single-arm row, in all three languages). The words beside the glyph already say it,
 * so only the glyph is hidden; there is nothing to add and no copy to draft. The same pill on the
 * rest screen's Next up card was done in the same way in `RestScreen.spoken.test.tsx`.
 *
 * Negative controls, run 30 Oct (mutation applied to `SetScreen.tsx`, this file run, restored from a
 * saved copy, `cmp` clean):
 *   the glyph loses `aria-hidden`                       -> 6 red: both pill tests, three languages
 *   the whole pill is hidden, words included            -> 6 red: both pill tests, three languages (the words are lost, which is the
 *                                                          other way to get this wrong)
 */
describe.each([
  ['en', 'each side'],
  ['fr', 'de chaque côté'],
  ['zh-CN', '每侧'],
] as const)('SetScreen "each side" pill (A4 follow-up) — %s', (locale, words) => {
  it('hides the glyph only: the words are heard, "⇄" is not, and it is still printed', async () => {
    await i18n.changeLanguage(locale)
    await start({ ...ladder([14, 16, 18, 20]), perSide: true }, null)
    const pill = captionOf().querySelector('span.rounded-full') as HTMLElement
    expect(pill).not.toBeNull()
    expect(pill.textContent?.trim()).toBe(`⇄ ${words}`)
    expect(pill.querySelector('[aria-hidden="true"]')?.textContent).toBe('⇄')
    expect(heard(pill)).toBe(words)
  })

  it('the heading is described with the words and without the glyph', async () => {
    await i18n.changeLanguage(locale)
    await start({ ...ladder([14, 16, 18, 20]), perSide: true }, null)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveAccessibleDescription(new RegExp(`${escape(words)}$`))
    expect(heading).not.toHaveAccessibleDescription(/⇄/)
  })
})

describe('SetScreen "each side" pill (A4 follow-up) — a ladder that is not per side has none', () => {
  it('adds no pill', async () => {
    await start(ladder([14, 16, 18, 20]), null)
    expect(captionOf().querySelector('span.rounded-full')).toBeNull()
  })
})
