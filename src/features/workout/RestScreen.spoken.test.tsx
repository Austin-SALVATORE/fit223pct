import { afterEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { seedExercises } from '@/data/seed/exercises'
import { seedProgram } from '@/data/seed/program'
import { createWorkout } from '@/domain/workout'
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
