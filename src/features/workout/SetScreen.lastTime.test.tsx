import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { mesocycle2Build } from '@/data/seed/program'
import i18n from '@/i18n/i18next'
import { completeWorkout, createWorkout, logSet } from '@/domain/workout'
import type { LadderPrescription } from '@/domain/types'
import { WorkoutPage } from './WorkoutPage'

/**
 * The "Last time" and "First time" lines are never cut off (QA 2.3 F2, and the
 * older "First time" finding re-confirmed in the 30 Oct backlog sort). Both sat in
 * a `truncate` paragraph: at 375px the English "First time — the numbers below
 * are your starting …" and the French "Première fois — … ton p…" ended in an
 * ellipsis, and a four-set "Last time" lost its last entries. Under carry-forward
 * the number the card offers for a set is the one at its position in that very
 * list, so what was cut was the thing the line exists to show.
 *
 * It wraps instead. The cost, measured in headless Chromium (375px wide, one
 * 20px line): only when the text does not fit one line — the "First time" sentence
 * in English and French (not zh-CN), and "Last time" from four sets (English) or
 * three-plus (French; zh-CN from six). At 375x667 that moves Log set from y457 to
 * y477 and the page from 667 to 677 tall (10px of scroll); at 812 and 844 the
 * illustration band gives the 20px back and nothing below the line moves. The
 * entries stay whole: a no-break space before "kg" and before each "·", so a
 * wrapped line breaks between entries and never strands a dot or splits "12×14 kg".
 *
 * jsdom has no layout, so these pin what produces that: no truncating class on the
 * paragraph, and the no-break spaces in the text. The line counts and positions
 * are browser numbers (above, and in the commit message).
 *
 * Negative controls, run 30 Oct (mutation applied, this file run, restored):
 *   `truncate` put back on the paragraph
 *                         -> all six "is not truncated" rows
 *   a plain space before "kg" -> the three "keeps each entry whole" rows
 *   a plain space before each "·"
 *                         -> the same three rows
 */

const NBSP = ' '

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
  await i18n.changeLanguage('en')
})

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

async function start(history: number[] | null) {
  const item = ladder([14, 16, 18, 20])
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

const NOT_CUT = /truncate|line-clamp|overflow-hidden|whitespace-nowrap|text-ellipsis/

const FIRST_TIME: [string, string][] = [
  ['en', 'First time — the numbers below are your starting point.'],
  ['fr', 'Première fois — les chiffres ci-dessous sont ton point de départ.'],
  ['zh-CN', '第一次——下面的数据是你的起点。'],
]
const LAST_TIME: [string, RegExp][] = [
  ['en', /^Last time/],
  ['fr', /^La dernière fois/],
  ['zh-CN', /^上次/],
]

describe('"First time" is not truncated', () => {
  it.each(FIRST_TIME)('%s', async (lng, sentence) => {
    await i18n.changeLanguage(lng)
    await start(null)
    expect(screen.getByText(sentence).className).not.toMatch(NOT_CUT)
  })
})

describe('"Last time" is not truncated', () => {
  it.each(LAST_TIME)('%s', async (lng, prefix) => {
    await i18n.changeLanguage(lng)
    await start([14, 16, 18, 20])
    expect(screen.getByText(prefix).className).not.toMatch(NOT_CUT)
  })
})

describe('"Last time" keeps each entry whole', () => {
  it.each(LAST_TIME)('%s', async (lng, prefix) => {
    await i18n.changeLanguage(lng)
    await start([14, 16, 18, 20])
    const line = screen.getByText(prefix)
    const entries = line.querySelector('[data-numeric]')?.textContent
    // Every entry's "kg" is held to its number, and every "·" to the entry before it:
    // a wrapped line breaks between entries, never inside one, never starting with a dot.
    expect(entries).toBe(
      [14, 16, 18, 20].map((kg) => `12×${kg}${NBSP}kg`).join(`${NBSP}· `),
    )
  })
})
