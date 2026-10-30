import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import i18n from '@/i18n/i18next'
import type { StagnationEvidencePoint, StagnationResult } from '@/domain/stagnation'
import type { Trend } from '@/domain/trends'
import type { Exercise } from '@/domain/types'
import { heard } from '@/test/heard'
import { StrengthCard } from './StrengthCard'

/**
 * Backlog A14's remainder (batch A2), site (a): the stagnation line on a Progress
 * card. Visible, it reads "No increase in 3 sessions — 16 kg × 10 reps → 16 kg × 10
 * reps → 16 kg × 9 reps", which a screen reader voices with "times", "right arrow"
 * and a "dash". The evidence part stays on screen, hidden from assistive technology
 * (`aria-hidden`), and a visually hidden span carries the sentence, inline, so the
 * paragraph is still one sentence when it is read: "No increase in 3 sessions: 10
 * reps at 16 kg, 10 reps at 16 kg, then 9 reps at 16 kg."
 *
 * The whole paragraph is checked with `heard()` (it has no accessible name to ask
 * for), in all three languages, for the three shapes the evidence can take: a
 * weighted set, bare reps, and a hold; plus the "easier day not counted" tail and a
 * decimal weight (French "17,75"). The visible evidence is checked to be hidden and
 * to still carry its glyphs.
 *
 * Negative controls, run 30 Oct (mutation applied to `StrengthCard.tsx`, this file
 * run, restored from a saved copy, `cmp` clean):
 *   `aria-hidden` removed from the visible evidence    -> 21 red, every test (the glyphs are heard again, and the hidden-span query finds nothing)
 *   the `sr-only` sentence removed                     -> 15 red: the five "heard" rows in each language. The no-glyph and hidden tests
 *                                                         stay green, correctly: with the sentence gone nothing glyph-bearing is heard
 *   the spoken list built from the visible formatter   -> 18 red: the five "heard" rows and the no-glyph test, each language
 *                                                         (`formatEvidence(...).join(' → ')` in place of `spokenEvidence`)
 *   the spoken weight left as `String(weightKg)`       -> 1 red: the French decimal row (17,75 spoken as 17.75); en and zh-CN print a point
 *   the `excluded` tail dropped (`{false && ...}`)     -> 3 red: the "easier day not counted" row in each language
 */

type Locale = 'en' | 'fr' | 'zh-CN'

const exercise: Exercise = {
  id: 'goblet-squat',
  muscles: ['quads'],
  equipment: ['dumbbell'],
  substitutionIds: [],
  isUnilateral: false,
}

const trend: Trend = { status: 'steady', evidence: [{ date: '2026-10-01', value: 16 }], unit: 'kg' }

const point = (
  weightKg: number | null,
  effort: number,
  effortMode: 'reps' | 'seconds' = 'reps',
): StagnationEvidencePoint => ({ date: '2026-10-01', weightKg, effort, effortMode })

function stagnant(evidence: StagnationEvidencePoint[], excludedForReadiness = 0): StagnationResult {
  return { status: 'stagnant', evidence, excludedForReadiness, suggestedSubstitutionId: null }
}

const PREFIX: Record<Locale, RegExp> = {
  en: /No increase in/,
  fr: /Aucune augmentation sur/,
  'zh-CN': /没有增长，已持续/,
}

async function paragraph(locale: Locale, stagnation: StagnationResult): Promise<HTMLElement> {
  await i18n.changeLanguage(locale)
  render(
    <MemoryRouter>
      <StrengthCard exercise={exercise} trend={trend} stagnation={stagnation} substitution={undefined} />
    </MemoryRouter>,
  )
  return screen.getByText(PREFIX[locale])
}

afterEach(async () => {
  await i18n.changeLanguage('en')
})

const weighted = stagnant([point(16, 10), point(16, 10), point(16, 9)])
const bare = stagnant([point(null, 12), point(null, 12), point(null, 11)])
const hold = stagnant([point(null, 40, 'seconds'), point(null, 40, 'seconds'), point(null, 38, 'seconds')])
const withEasierDay = stagnant([point(16, 10), point(16, 10), point(16, 9)], 1)
const decimal = stagnant([point(17.75, 10), point(17.75, 10), point(17.75, 9)])

const heardCases: [string, StagnationResult, string, string, string][] = [
  [
    'weighted sets',
    weighted,
    'No increase in 3 sessions: 10 reps at 16 kg, 10 reps at 16 kg, then 9 reps at 16 kg.',
    'Aucune augmentation sur 3 séances : 10 répétitions à 16 kg, 10 répétitions à 16 kg, puis 9 répétitions à 16 kg.',
    '没有增长，已持续 3 次训练：16 kg做10 次、16 kg做10 次、16 kg做9 次.',
  ],
  [
    'bare reps',
    bare,
    'No increase in 3 sessions: 12 reps, 12 reps, then 11 reps.',
    'Aucune augmentation sur 3 séances : 12 répétitions, 12 répétitions, puis 11 répétitions.',
    '没有增长，已持续 3 次训练：12 次、12 次、11 次.',
  ],
  [
    'holds',
    hold,
    'No increase in 3 sessions: 40 seconds, 40 seconds, then 38 seconds.',
    'Aucune augmentation sur 3 séances : 40 secondes, 40 secondes, puis 38 secondes.',
    '没有增长，已持续 3 次训练：40 秒、40 秒、38 秒.',
  ],
  [
    'with an easier day not counted (the tail is still said)',
    withEasierDay,
    'No increase in 3 sessions: 10 reps at 16 kg, 10 reps at 16 kg, then 9 reps at 16 kg (1 easier day not counted).',
    'Aucune augmentation sur 3 séances : 10 répétitions à 16 kg, 10 répétitions à 16 kg, puis 9 répétitions à 16 kg (1 jour plus facile non compté).',
    '没有增长，已持续 3 次训练：16 kg做10 次、16 kg做10 次、16 kg做9 次（1 次调整日未计入）.',
  ],
  [
    'a decimal weight, as the language writes it',
    decimal,
    'No increase in 3 sessions: 10 reps at 17.75 kg, 10 reps at 17.75 kg, then 9 reps at 17.75 kg.',
    'Aucune augmentation sur 3 séances : 10 répétitions à 17,75 kg, 10 répétitions à 17,75 kg, puis 9 répétitions à 17,75 kg.',
    '没有增长，已持续 3 次训练：17.75 kg做10 次、17.75 kg做10 次、17.75 kg做9 次.',
  ],
]

describe.each([
  ['en', 2],
  ['fr', 3],
  ['zh-CN', 4],
] as const)('StrengthCard stagnation line, spoken — %s', (locale, column) => {
  it.each(heardCases)('the paragraph is heard as one sentence: %s', async (...row) => {
    const p = await paragraph(locale, row[1])
    expect(heard(p)).toBe(row[column])
  })

  it('hears none of the glyphs the visible line is made of', async () => {
    const p = await paragraph(locale, weighted)
    expect(heard(p)).not.toMatch(/[→×—–·/]/)
  })

  it('keeps the visible evidence, with its glyphs, hidden from assistive technology', async () => {
    const p = await paragraph(locale, weighted)
    const visible = p.querySelector('span[aria-hidden="true"]')
    expect(visible).not.toBeNull()
    const text = visible?.textContent ?? ''
    expect(text.startsWith(' — ')).toBe(true)
    expect(text.split(' → ')).toHaveLength(3)
    expect(text.split('×')).toHaveLength(4)
  })
})
