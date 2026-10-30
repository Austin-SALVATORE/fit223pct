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
 * The rest screen's printed delta line writes the amount as the language writes it
 * (T2, 30 Oct): French "↑ 2,5 kg de plus que la série que tu viens de faire". It
 * printed the number as it came, so a French reader saw "2.5" over a spoken line that
 * already said "2,5". The amount is now formatted once, with the Stepper's
 * `formatNumber`, and shared by the printed line and the spoken one.
 *
 * English and Chinese print a decimal point and are unchanged; whole-kilogram deltas
 * are unchanged in all three (`RestScreen.spoken.test.tsx` carries those rows). The
 * English and Chinese rows here are on purpose: they pass before and after the fix and
 * pin "unchanged" instead of leaving it as a claim.
 *
 * The first exercise of 'chest-back' is a ladder 12 / 14 / 15, so after one logged set
 * the next rung is 14 and the delta is 14 minus what was logged.
 *
 * Negative controls, run 30 Oct (mutation applied to `RestScreen.tsx`, the whole suite
 * run, restored and `cmp`ed), each leaving English, Chinese and the whole-kilogram rows green:
 *   the delta left as the raw number for both lines (the pre-fix code)
 *       -> 4 red, all French: the three rows here and `RestScreen.spoken.test.tsx`'s French
 *          decimal row
 *   the printed line given the raw number, the spoken one still formatted
 *       -> the same 4 red (the printed text is not found)
 *   the spoken sentence given the raw number, the printed line still formatted
 *       -> the same 4 red (the heard text differs: "2.5" against "2,5")
 *   The three mutations fail in different places but name the same rows, so a red here
 *   says the printed and the spoken numbers disagree or are both raw, not which one.
 *
 * What it cannot see: the weight carried by the next-set hero below the delta (formatted
 * already, `RestScreen.spoken.test.tsx`), and a delta that crosses a thousand (none can:
 * a load change is a few kilograms).
 */

const exerciseById = new Map(seedExercises.map((e) => [e.id, e]))
const baseWorkout = createWorkout({
  id: 'w',
  programId: seedProgram.id,
  session: seedProgram.sessions[0],
  date: '2026-07-22',
  startedAt: '2026-07-22T09:00:00.000Z',
})

afterEach(async () => {
  await i18n.changeLanguage('en')
})

function withLoggedSet(workout: Workout, weightKg: number): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((e, i) =>
      i === 0
        ? { ...e, sets: [{ setIndex: 0, weightKg, reps: 12, seconds: null, completedAt: '2026-07-22T09:05:00.000Z' }] }
        : e,
    ),
  }
}

function renderRest(logged: number) {
  return render(
    <RestScreen
      endsAt={Date.now() + 60_000}
      totalSeconds={60}
      exerciseChanged={false}
      workout={withLoggedSet(baseWorkout, logged)}
      position={{ exerciseIndex: 0, setIndex: 1 }}
      exerciseById={exerciseById}
      onDone={() => {}}
    />,
  )
}

// [name, weight logged, printed line in en, fr, zh-CN, spoken sentence in en, fr, zh-CN]
const rows: [string, number, string, string, string, string, string, string][] = [
  [
    'heavier by a decimal (11.5 logged, 14 next)',
    11.5,
    '↑ 2.5 kg heavier than the set you just did',
    '↑ 2,5 kg de plus que la série que tu viens de faire',
    '↑ 比你刚做的那组重 2.5 公斤',
    '2.5 kg heavier than the set you just did',
    '2,5 kg de plus que la série que tu viens de faire',
    '比你刚做的那组重 2.5 公斤',
  ],
  [
    'lighter by a decimal (16.5 logged, 14 next)',
    16.5,
    '↓ 2.5 kg lighter than the set you just did',
    '↓ 2,5 kg de moins que la série que tu viens de faire',
    '↓ 比你刚做的那组轻 2.5 公斤',
    '2.5 kg lighter than the set you just did',
    '2,5 kg de moins que la série que tu viens de faire',
    '比你刚做的那组轻 2.5 公斤',
  ],
  [
    'two decimals (13.75 logged, 14 next)',
    13.75,
    '↑ 0.25 kg heavier than the set you just did',
    '↑ 0,25 kg de plus que la série que tu viens de faire',
    '↑ 比你刚做的那组重 0.25 公斤',
    '0.25 kg heavier than the set you just did',
    '0,25 kg de plus que la série que tu viens de faire',
    '比你刚做的那组重 0.25 公斤',
  ],
]

const LOCALES = ['en', 'fr', 'zh-CN'] as const

describe.each(LOCALES.map((locale, i) => [locale, i] as const))('RestScreen delta line, printed — %s', (locale, i) => {
  it.each(rows)('%s', async (_name, logged, ...lines) => {
    await i18n.changeLanguage(locale)
    renderRest(logged)
    const printed = lines[i]
    const spoken = lines[3 + i]
    const line = screen.getByText(printed)
    expect(line).toHaveAttribute('aria-hidden', 'true')
    // The sentence that follows the printed line says the same number, with the same separator.
    expect(heard(line.nextElementSibling as HTMLElement)).toBe(spoken)
    const number = printed.match(/\d[.,]\d+/)![0]
    expect(spoken).toContain(number)
  })
})
