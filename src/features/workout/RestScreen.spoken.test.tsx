import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { seedExercises } from '@/data/seed/exercises'
import { seedProgram } from '@/data/seed/program'
import { createWorkout } from '@/domain/workout'
import type { Workout } from '@/domain/types'
import i18n from '@/i18n/i18next'
import { heard } from '@/test/heard'
import { RestScreen } from './RestScreen'

/**
 * Backlog A14's remainder (batch A2), site (b): the rest screen's hero number. For
 * a weighted set it is "14 kg × 10" at 2.5rem, voiced as "14 kilograms times 10".
 * It stays as it is, hidden from assistive technology, with "10 reps at 14 kg"
 * beside it. A hero with no "×" in it (bare reps, a hold) has nothing to replace and
 * is left exactly as it was, which is also pinned: hiding a number that nothing
 * speaks for would silence it.
 *
 * The hero is found by its size class, the one thing that marks it among the
 * screen's `data-numeric` paragraphs.
 *
 * jsdom has no layout and does not apply the `sr-only` stylesheet. The real
 * accessibility tree of the rest screen is in the report.
 *
 * Negative controls, run 30 Oct (mutation applied to `RestScreen.tsx`, this file
 * run, restored from a saved copy, `cmp` clean):
 *   `aria-hidden` removed from the hero                   -> 3 red: "hears none of the glyphs", one per language. The sentence test stays GREEN
 *                                                            (the sentence is still there, with the glyphs beside it)
 *   the `sr-only` sentence removed                        -> 7 red: both tests in each language (the second throws on the missing sibling)
 *                                                            and the French decimal row
 *   the hero hidden always (`aria-hidden="true"`)         -> 1 red: "a hero with no multiplication is left alone", the only test that can
 *                                                            see a number hidden with nothing to replace it
 *   the spoken weight left as `String(weightKg)`          -> 1 red: the French decimal row (17,75 spoken as 17.75)
 */

const exerciseById = new Map(seedExercises.map((e) => [e.id, e]))
const baseWorkout = createWorkout({
  id: 'w',
  programId: seedProgram.id,
  session: seedProgram.sessions[0],
  date: '2026-07-22',
  startedAt: '2026-07-22T09:00:00.000Z',
})

// 'chest-back' items, as `RestScreen.test.tsx` records them:
//  0 incline-dumbbell-press  ladder [12x12, 14x10, 15x8]
//  4 dead-bug                rep-range 10-10, bodyweight, perSide, 2 sets

afterEach(async () => {
  await i18n.changeLanguage('en')
})

function renderRest(exerciseIndex: number, setIndex: number) {
  return render(
    <RestScreen
      endsAt={Date.now() + 60_000}
      totalSeconds={60}
      exerciseChanged={false}
      workout={baseWorkout}
      position={{ exerciseIndex, setIndex }}
      exerciseById={exerciseById}
      onDone={() => {}}
    />,
  )
}

function hero(container: HTMLElement): HTMLElement {
  const found = [...container.querySelectorAll<HTMLElement>('p[data-numeric]')].filter((p) =>
    p.className.includes('text-[2.5rem]'),
  )
  if (found.length !== 1) throw new Error(`expected one hero, found ${found.length}`)
  return found[0]
}

describe.each([
  ['en', '14 kg × 10', '10 reps at 14 kg'],
  ['fr', '14 kg × 10', '10 répétitions à 14 kg'],
  ['zh-CN', '14 公斤 × 10', '14 kg做10 次'],
] as const)('RestScreen weighted hero, spoken — %s', (locale, visible, spoken) => {
  it('is heard as a sentence', async () => {
    await i18n.changeLanguage(locale)
    const { container } = renderRest(0, 1)
    const el = hero(container)
    expect(el.textContent).toBe(visible)
    expect(el.nextElementSibling).not.toBeNull()
    expect(heard(el.nextElementSibling as HTMLElement)).toBe(spoken)
  })

  it('hears none of the glyphs; the visible number is kept and hidden', async () => {
    await i18n.changeLanguage(locale)
    const { container } = renderRest(0, 1)
    const el = hero(container)
    expect(el).toHaveAttribute('aria-hidden', 'true')
    expect(heard(el.parentElement as HTMLElement)).not.toContain(visible)
    expect(heard(el.nextElementSibling as HTMLElement)).not.toMatch(/[×·→]/)
  })
})

describe('RestScreen hero, spoken — the weight is spoken as the language writes it', () => {
  it('fr: a decimal weight keeps its comma', async () => {
    await i18n.changeLanguage('fr')
    // Every seeded rung in this session is a whole number of kilograms, so the
    // decimal is made by rewriting the second rung of the first ladder to 17.75.
    const decimal = {
      ...baseWorkout,
      exercises: baseWorkout.exercises.map((e, i) =>
        i === 0 && e.prescription.setPlan
          ? {
              ...e,
              prescription: {
                ...e.prescription,
                setPlan: e.prescription.setPlan.map((rung, r) => (r === 1 ? { ...rung, weightKg: 17.75 } : rung)),
              },
            }
          : e,
      ),
    }
    const { container } = render(
      <RestScreen
        endsAt={Date.now() + 60_000}
        totalSeconds={60}
        exerciseChanged={false}
        workout={decimal}
        position={{ exerciseIndex: 0, setIndex: 1 }}
        exerciseById={exerciseById}
        onDone={() => {}}
      />,
    )
    const el = hero(container)
    expect(el.textContent).toBe('17,75 kg × 10')
    expect(heard(el.nextElementSibling as HTMLElement)).toBe('10 répétitions à 17,75 kg')
  })
})

describe('RestScreen hero, spoken — a hero with no multiplication is left alone', () => {
  it('bare reps: not hidden, no spoken sibling', async () => {
    const { container } = renderRest(4, 0)
    const el = hero(container)
    expect(el.textContent).toBe('10 reps')
    expect(el).not.toHaveAttribute('aria-hidden')
    expect(el.nextElementSibling?.className ?? '').not.toContain('sr-only')
  })
})

/**
 * Batch A3: the rest card's eyebrow ("Next set · 2 of 3", "Last set · 2 of 2", and zh-CN's
 * "下一组 · 第 2 / 3 组") and its delta line ("↑ 2 kg heavier than the set you just did").
 * The dot and the zh slash are punctuation to a reader, and the arrow is voiced as "upwards
 * arrow" before the amount, which the words "heavier" and "lighter" already carry. Each
 * stays on screen, hidden from assistive technology, with the sentence beside it.
 *
 * The card is the Rest heading's `aria-describedby` target, so the heading's description is
 * checked too: it is what a user hears on landing.
 *
 * Negative controls, run 30 Oct (mutation applied to `RestScreen.tsx`, this file run,
 * restored from a saved copy, `cmp` clean):
 *   the next-set eyebrow loses `aria-hidden`            -> 3 red: "next set: the label is hidden ...", one per language
 *   the next-set spoken sentence removed                -> 3 red: the same three
 *   the last-set eyebrow loses `aria-hidden`            -> 3 red: "last set: the label is hidden ...", one per language
 *   the last-set spoken sentence removed                -> 3 red: the same three
 *   the last-set sentence built from the next-set key   -> 3 red: the last-set rows ("Next set, 2 of 2" for a last set)
 *   the delta line loses `aria-hidden`                  -> 6 red: all six delta rows (two directions, three languages)
 *   the delta spoken sentence removed                   -> 7 red: the six delta rows and the French decimal row
 *   the spoken delta left as the raw number             -> 1 red: the French decimal row (1,5 spoken as 1.5); en and zh-CN print a point
 */
function withLoggedSet(workout: Workout, weightKg: number, reps = 12): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((e, i) =>
      i === 0
        ? { ...e, sets: [{ setIndex: 0, weightKg, reps, seconds: null, completedAt: '2026-07-22T09:05:00.000Z' }] }
        : e,
    ),
  }
}

function renderWith(workout: Workout, exerciseIndex: number, setIndex: number) {
  return render(
    <RestScreen
      endsAt={Date.now() + 60_000}
      totalSeconds={60}
      exerciseChanged={false}
      workout={workout}
      position={{ exerciseIndex, setIndex }}
      exerciseById={exerciseById}
      onDone={() => {}}
    />,
  )
}

const GLYPHS_REST = /[·↑↓×/]/

describe.each([
  ['en', 'Next set · 2 of 3', 'Next set, 2 of 3', 'Last set · 2 of 2', 'Last set, 2 of 2'],
  ['fr', 'Série suivante · 2 sur 3', 'Série suivante, 2 sur 3', 'Dernière série · 2 sur 2', 'Dernière série, 2 sur 2'],
  ['zh-CN', '下一组 · 第 2 / 3 组', '下一组，第 2 组，共 3 组', '最后一组 · 第 2 / 2 组', '最后一组，第 2 组，共 2 组'],
] as const)('RestScreen eyebrow, spoken (A3) — %s', (locale, nextVisible, nextSpoken, lastVisible, lastSpoken) => {
  it.each([
    ['next set', 0, 1, nextVisible, nextSpoken],
    ['last set', 4, 1, lastVisible, lastSpoken],
  ] as const)('%s: the label is hidden, the sentence is heard, and the heading is described by it', async (_name, exerciseIndex, setIndex, visible, spoken) => {
    await i18n.changeLanguage(locale)
    renderRest(exerciseIndex, setIndex)
    const label = screen.getByText(visible)
    expect(label).toHaveAttribute('aria-hidden', 'true')
    expect(heard(label.nextElementSibling as HTMLElement)).toBe(spoken)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveAccessibleDescription(new RegExp(spoken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    expect(heading).not.toHaveAccessibleDescription(GLYPHS_REST)
  })
})

describe.each([
  ['en', 12, '↑ 2 kg heavier than the set you just did', '2 kg heavier than the set you just did'],
  ['fr', 12, '↑ 2 kg de plus que la série que tu viens de faire', '2 kg de plus que la série que tu viens de faire'],
  ['zh-CN', 12, '↑ 比你刚做的那组重 2 公斤', '比你刚做的那组重 2 公斤'],
  ['en', 20, '↓ 6 kg lighter than the set you just did', '6 kg lighter than the set you just did'],
  ['fr', 20, '↓ 6 kg de moins que la série que tu viens de faire', '6 kg de moins que la série que tu viens de faire'],
  ['zh-CN', 20, '↓ 比你刚做的那组轻 6 公斤', '比你刚做的那组轻 6 公斤'],
] as const)('RestScreen delta line, spoken (A3) — %s, logged %s kg', (locale, logged, visibleText, spoken) => {
  it('is hidden with its arrow, heard without it, and the heading is described by it', async () => {
    await i18n.changeLanguage(locale)
    renderWith(withLoggedSet(baseWorkout, logged), 0, 1)
    const line = screen.getByText(visibleText)
    expect(line).toHaveAttribute('aria-hidden', 'true')
    expect(heard(line.nextElementSibling as HTMLElement)).toBe(spoken)
    expect(heard(line.parentElement as HTMLElement)).not.toMatch(/[↑↓]/)
    expect(screen.getByRole('heading', { level: 2 })).toHaveAccessibleDescription(
      new RegExp(spoken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    )
  })
})

describe('RestScreen delta line, spoken (A3) — the number is spoken as the language writes it', () => {
  it('fr: 1,5 kg and not 1.5 kg (the printed line shows the raw number)', async () => {
    await i18n.changeLanguage('fr')
    renderWith(withLoggedSet(baseWorkout, 12.5), 0, 1)
    const line = screen.getByText('↑ 1.5 kg de plus que la série que tu viens de faire')
    expect(heard(line.nextElementSibling as HTMLElement)).toBe('1,5 kg de plus que la série que tu viens de faire')
  })

  it('no delta, no line: a card with nothing logged adds nothing', () => {
    renderRest(0, 1)
    expect(screen.queryByText(/heavier than|lighter than/)).toBeNull()
  })
})
