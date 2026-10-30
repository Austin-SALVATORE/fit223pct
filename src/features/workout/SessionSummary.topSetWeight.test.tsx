import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { seedExercises } from '@/data/seed/exercises'
import { seedProgram } from '@/data/seed/program'
import type { LoggedSet } from '@/domain/types'
import { createWorkout, logSet } from '@/domain/workout'
import i18n from '@/i18n/i18next'
import { SessionSummary } from './SessionSummary'

/**
 * The summary's visible top-set line writes the weight as the language writes it
 * (T1, 30 Oct). It printed the stored number as it came, so a French reader saw
 * "8 × 17.75 kg" over a spoken line that already said "17,75". The weight is now
 * formatted once, through the same `formatNumber` the Stepper and the rest screen
 * use, and the visible line and the spoken one share the string.
 *
 * English and Chinese print a decimal point and are unchanged; a whole weight is
 * unchanged in all three. Those rows are here on purpose: they pass before and after
 * the fix, and pin "unchanged" instead of leaving it as a claim.
 *
 * The visible line is `aria-hidden` (the spoken sentence follows it), so it is found
 * by its text, which is what a sighted reader sees.
 *
 * Negative controls, run 30 Oct (mutation applied to `SessionSummary.tsx`, the whole
 * suite run, restored and `cmp`ed):
 *   the visible key given the raw number again (the spoken line left formatted)
 *       -> 4 red: the three French decimal rows and the agreement test. The English
 *          and Chinese rows and the whole-load row stay green, which is "unchanged".
 *   the weight formatted nowhere (`String(best.weightKg)`, visible and spoken)
 *       -> 5 red: the same four, plus `SessionSummary.spoken.test.tsx`'s French
 *          decimal row. The existing spoken test cannot see the visible line, and
 *          this one could not see the spoken line before the weight was shared.
 */

const exerciseById = new Map(seedExercises.map((e) => [e.id, e]))
const done = '2026-08-07T09:05:00.000Z'

type SetInput = Omit<LoggedSet, 'setIndex'>
const weighted = (weightKg: number, reps: number, extra: Partial<SetInput> = {}): SetInput => ({
  weightKg,
  reps,
  seconds: null,
  completedAt: done,
  ...extra,
})

function renderSummary(sets: SetInput[]) {
  let workout = createWorkout({
    id: 'w-top-weight',
    programId: seedProgram.id,
    session: seedProgram.sessions[1],
    date: '2026-08-07',
    startedAt: '2026-08-07T09:00:00.000Z',
  })
  sets.forEach((set, index) => {
    workout = logSet(workout, 0, set, index)
  })
  return render(
    <MemoryRouter>
      <SessionSummary workout={workout} exerciseById={exerciseById} history={[]} />
    </MemoryRouter>,
  )
}

afterEach(async () => {
  await i18n.changeLanguage('en')
})

// [name, sets, en, fr, zh-CN] — the visible line in each language.
const rows: [string, SetInput[], string, string, string][] = [
  [
    'a barbell load with two decimals',
    [weighted(17.75, 8)],
    '1 set · top 8 × 17.75 kg',
    '1 série · meilleure série 8 × 17,75 kg',
    '1 组 · 最佳 8 × 17.75 kg',
  ],
  [
    'a load with one decimal',
    [weighted(17.5, 8)],
    '1 set · top 8 × 17.5 kg',
    '1 série · meilleure série 8 × 17,5 kg',
    '1 组 · 最佳 8 × 17.5 kg',
  ],
  [
    'a whole load',
    [weighted(14, 12)],
    '1 set · top 12 × 14 kg',
    '1 série · meilleure série 12 × 14 kg',
    '1 组 · 最佳 12 × 14 kg',
  ],
  [
    'an assisted top set with a decimal load',
    [weighted(17.75, 8, { assisted: true })],
    '1 set · top 8 × 17.75 kg, assisted',
    '1 série · meilleure série 8 × 17,75 kg, avec assistance',
    '1 组 · 最佳 8 × 17.75 kg，有辅助',
  ],
]

const LOCALES = ['en', 'fr', 'zh-CN'] as const

describe.each(LOCALES.map((locale, i) => [locale, i] as const))('SessionSummary visible top-set line — %s', (locale, i) => {
  it.each(rows)('%s', async (_name, sets, ...lines) => {
    await i18n.changeLanguage(locale)
    renderSummary(sets)
    const line = screen.getByText(lines[i])
    expect(line.textContent).toBe(lines[i])
    expect(line).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('SessionSummary visible and spoken top-set lines agree on the weight', () => {
  it('French: the point is nowhere in the heard line or the seen one', async () => {
    await i18n.changeLanguage('fr')
    renderSummary([weighted(17.75, 8)])
    const seen = screen.getByText('1 série · meilleure série 8 × 17,75 kg')
    const heard = seen.nextElementSibling as HTMLElement
    expect(seen.textContent).not.toContain('17.75')
    expect(heard.textContent).toContain('17,75')
    expect(heard.textContent).not.toContain('17.75')
  })
})
