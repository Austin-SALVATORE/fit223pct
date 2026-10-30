import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import i18n from '@/i18n/i18next'
import type { Exercise, LadderPrescription, RepRangePrescription, SessionTemplate } from '@/domain/types'
import { heard } from '@/test/heard'
import { SessionPreview } from './SessionPreview'

/**
 * Backlog A14 (batch A1), the component half. `spokenPrescription.test.ts` pins
 * the sentences; this pins that they actually reach assistive technology and the
 * glyphs do not. A link's accessible name is computed from its content, so the
 * exercise row's name is exactly what a screen reader announces for the row.
 *
 * What must hold, in all three languages:
 *   - the row's name contains the spoken sentence and none of → × – · /;
 *   - the visible line is unchanged and is hidden from assistive technology
 *     (`aria-hidden`), so it is not read as well.
 *
 * jsdom computes names from the DOM (it does not apply the `sr-only` stylesheet,
 * so the hidden sentence is plain text here), and has no layout. The accessibility
 * tree of the real page, in a real browser, is in the report for batch A1.
 *
 * Negative controls, run 30 Oct (mutation applied to `SessionPreview.tsx`, this
 * file run, restored, `cmp` clean):
 *   `aria-hidden` removed from the visible line   -> 6 red: "<lang>: the visible line is unchanged and hidden from
 *                                                    assistive technology" (en, fr, zh-CN) and "<lang>: each row's
 *                                                    accessible name carries the sentence and no glyph" (en, fr,
 *                                                    zh-CN), the glyphs being back in the name
 *   the `sr-only` sentence removed                -> the name test, all three languages
 *   the sentence built for another item           -> the name test (wrong numbers)
 */

const exercise = (id: string): Exercise => ({
  id,
  muscles: ['quads'],
  equipment: ['dumbbell'],
  substitutionIds: [],
  isUnilateral: false,
})

const ladder: LadderPrescription = {
  exerciseId: 'goblet-squat',
  sets: 3,
  mode: 'reps',
  restSeconds: 90,
  perSide: false,
  maxWeightKg: null,
  weightStepKg: null,
  setPlan: [
    { weightKg: 60, reps: 12 },
    { weightKg: 65, reps: 10 },
    { weightKg: 70, reps: 8 },
  ],
}

const rangeItem: RepRangePrescription = {
  exerciseId: 'not-a-real-exercise',
  sets: 4,
  mode: 'reps',
  restSeconds: 90,
  perSide: false,
  range: { min: 8, max: 12 },
  startWeightKg: 60,
  maxWeightKg: null,
  weightStepKg: null,
}

const session: SessionTemplate = { id: 'A', name: 'Session A', focus: 'Squat', items: [ladder, rangeItem] }

function renderPreview() {
  return render(
    <MemoryRouter>
      <SessionPreview
        session={session}
        programId="phase-1-home"
        exerciseById={new Map([
          ['goblet-squat', exercise('goblet-squat')],
          ['not-a-real-exercise', exercise('not-a-real-exercise')],
        ])}
        heading="Today"
      />
    </MemoryRouter>,
  )
}

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('SessionPreview — prescriptions are spoken, not spelled', () => {
  it.each([
    [
      'en',
      '60→65→70 kg · 12/10/8',
      '4 × 8–12 · 60 kg',
      '60, 65, then 70 kg, for 12, 10, then 8 reps',
      '4 sets of 8 to 12 reps, starting at 60 kg',
    ],
    [
      'fr',
      '60→65→70 kg · 12/10/8',
      '4 × 8–12 · 60 kg',
      '60, 65, puis 70 kg, pour 12, 10, puis 8 répétitions',
      '4 séries de 8 à 12 répétitions, à partir de 60 kg',
    ],
    [
      'zh-CN',
      '60→65→70 kg·12/10/8',
      '4 × 8–12·60 kg',
      '60、65、70 kg，分别对应12、10、8 次',
      '4 组，每组8到12 次，起始 60 kg',
    ],
  ])('%s: each row\'s accessible name carries the sentence and no glyph', async (locale, ladderVisible, rangeVisible, ladderSpoken, rangeSpoken) => {
    await i18n.changeLanguage(locale)
    renderPreview()

    expect(await screen.findAllByRole('link')).toHaveLength(2)
    // The computed name, via the role query: it contains the sentence ...
    expect(screen.getByRole('link', { name: new RegExp(escapeRegExp(ladderSpoken)) })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: new RegExp(escapeRegExp(rangeSpoken)) })).toBeInTheDocument()
    // ... and not the glyph line.
    expect(screen.queryByRole('link', { name: new RegExp(escapeRegExp(ladderVisible)) })).toBeNull()
    expect(screen.queryByRole('link', { name: new RegExp(escapeRegExp(rangeVisible)) })).toBeNull()
    expect(screen.queryByRole('link', { name: /[→×–]/ })).toBeNull()
  })

  it.each([
    ['en', '60→65→70 kg · 12/10/8', '4 × 8–12 · 60 kg'],
    ['fr', '60→65→70 kg · 12/10/8', '4 × 8–12 · 60 kg'],
    ['zh-CN', '60→65→70 kg·12/10/8', '4 × 8–12·60 kg'],
  ])('%s: the visible line is unchanged and hidden from assistive technology', async (locale, ladderVisible, rangeVisible) => {
    await i18n.changeLanguage(locale)
    renderPreview()

    for (const visible of [ladderVisible, rangeVisible]) {
      const line = await screen.findByText(visible)
      expect(line).toHaveAttribute('aria-hidden', 'true')
      expect(line.textContent).toBe(visible)
    }
  })
})

/**
 * Backlog A14's remainder (batch A2): the technique-rehearsal row above a first
 * working set. Its visible line is "Rehearsal · 7.75 kg × 8", read aloud as "7.75
 * kilograms times 8". The row is not a link, so there is no accessible name to
 * ask for; `heard()` takes what assistive technology would read out of the row
 * and skips `aria-hidden`.
 *
 * Negative controls, run 30 Oct (mutation applied to `SessionPreview.tsx`, this
 * file run, restored from a saved copy, `cmp` clean):
 *   `aria-hidden` removed from the rehearsal line       -> 6 red: the hidden test and the no-glyph test, all three languages
 *   the rehearsal `sr-only` sentence removed            -> 6 red: the sentence test and the no-glyph test (which also asserts the sentence), all three languages
 *   the rehearsal weight left unformatted               -> 2 red: both French tests (7,75 spoken as 7.75); en and zh-CN print a point and cannot see it
 */
describe('SessionPreview — the rehearsal row is spoken, not spelled', () => {
  const withRehearsal: LadderPrescription = { ...ladder, rehearsal: { weightKg: 7.75, reps: 8 } }
  const rehearsalSession: SessionTemplate = { id: 'A', name: 'Session A', focus: 'Squat', items: [withRehearsal] }

  function renderRehearsal() {
    return render(
      <MemoryRouter>
        <SessionPreview
          session={rehearsalSession}
          programId="phase-1-home"
          exerciseById={new Map([['goblet-squat', exercise('goblet-squat')]])}
          heading="Today"
        />
      </MemoryRouter>,
    )
  }

  const rows = [
    ['en', 'Rehearsal · 7.75 kg × 8', 'Rehearsal, 8 reps at 7.75 kg'],
    ['fr', 'Série technique · 7,75 kg × 8', 'Série technique, 8 répétitions à 7,75 kg'],
    ['zh-CN', '技术组 · 7.75 kg × 8', '技术组，7.75 kg做8 次'],
  ] as const

  it.each(rows)('%s: the row is heard as a sentence', async (locale, visible, spoken) => {
    await i18n.changeLanguage(locale)
    renderRehearsal()
    const row = (await screen.findByText(visible)).parentElement as HTMLElement
    expect(heard(row)).toContain(spoken)
  })

  it.each(rows)('%s: the row is heard with no glyph', async (locale, visible, spoken) => {
    await i18n.changeLanguage(locale)
    renderRehearsal()
    const row = (await screen.findByText(visible)).parentElement as HTMLElement
    const said = heard(row)
    expect(said).not.toMatch(/[→×–·/]/)
    expect(said).toContain(spoken)
  })

  it.each(rows)('%s: the visible line is unchanged and hidden from assistive technology', async (locale, visible) => {
    await i18n.changeLanguage(locale)
    renderRehearsal()
    const line = await screen.findByText(visible)
    expect(line).toHaveAttribute('aria-hidden', 'true')
    expect(line.textContent).toBe(visible)
  })
})

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
