import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import i18n from '@/i18n/i18next'
import { seedDatabase } from '@/data/seed'
import { mesocycle2Build } from '@/data/seed/program'
import { createWorkout } from '@/domain/workout'
import type { Workout } from '@/domain/types'
import enSeed from '@/locales/en/seed.json'
import frSeed from '@/locales/fr/seed.json'
import zhSeed from '@/locales/zh-CN/seed.json'
import { WorkoutPage } from './WorkoutPage'

/**
 * Coach ruling 23 Oct 2026 (inverted-row grip): the bar-stability check is the
 * inverted row's prescription note on Full Body C, and it must resolve — not
 * fall back to the English literal, not show a raw key — in every locale on
 * set 1 of the seeded session. Cue 3 now says "between the bars".
 */

const SESSION = mesocycle2Build.sessions.find((s) => s.id === 'mesocycle2-fullbody-hipext-shoulder')!
const ROW = SESSION.items.find((i) => i.exerciseId === 'inverted-row')!

const NOTES: Record<string, string> = {
  en: "Before your first set, check both bars are locked at the same height, then pull on both the way you'll row. If either bar moves, slides or tilts, don't do this exercise — swap to the single-arm dumbbell row.",
  fr: 'Avant ta première série, vérifie que les deux barres sont bloquées à la même hauteur, puis tire sur les deux comme tu vas ramer. Si une barre bouge, glisse ou bascule, ne fais pas cet exercice — remplace-le par le rowing haltère unilatéral.',
  'zh-CN': '第一组之前，先确认两根杠已锁定在相同高度，再像划船那样用力拉两根杠。如果任何一根杠移动、滑动或倾斜，就不要做这个动作——更换为单臂哑铃划船。',
}

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  await db.workouts.clear()
  await i18n.changeLanguage('en')
})

describe('inverted-row bar-stability note (Full Body C)', () => {
  it('is authored on the seeded prescription', () => {
    expect(ROW.note).toBe(NOTES.en)
  })

  it('en cues 1 and 3 name both bars', () => {
    const cues = (enSeed.exercise as unknown as Record<string, { cues: string[] }>)['inverted-row'].cues
    expect(cues[0]).toBe('Set both bars to the same suitable height, heels on the floor, body in one straight line')
    expect(cues[2]).toBe('Pull your torso upward between the bars without jerking')
  })

  it.each(Object.keys(NOTES))('shows on set 1 in %s', async (lng) => {
    await i18n.changeLanguage(lng)
    await db.workouts.put(
      createWorkout({
        id: `row-${lng}`,
        programId: mesocycle2Build.id,
        session: { ...SESSION, items: [ROW] },
        date: '2026-10-23',
        startedAt: '2026-10-23T09:00:00.000Z',
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
    const note = screen.getByText(NOTES[lng])
    expect(note).toBeInTheDocument()
    expect(note.className).not.toMatch(/truncate|line-clamp|overflow-hidden|whitespace-nowrap/)
  })

  it.each([
    ['en', enSeed, 'Set both bars to the same suitable height, heels on the floor, body in one straight line', 'Pull your torso upward between the bars without jerking'],
    ['fr', frSeed, 'Règle les deux barres à la même hauteur adaptée, talons au sol, corps bien aligné', 'Tire ton buste vers le haut, entre les barres, sans à-coup'],
    ['zh-CN', zhSeed, '把两根杠调到相同的合适高度，脚跟着地，身体成一条直线', '把躯干向上拉到两根杠之间，不要猛拽'],
  ])('cues 1 and 3 in %s', (_lng, seed, cue1, cue3) => {
    const cues = (seed.exercise as unknown as Record<string, { cues: string[] }>)['inverted-row'].cues
    expect(cues[0]).toBe(cue1)
    expect(cues[2]).toBe(cue3)
  })

  async function showWith(change: (e: Workout['exercises'][number]) => Workout['exercises'][number]) {
    const base = createWorkout({
      id: 'row-variant',
      programId: mesocycle2Build.id,
      session: { ...SESSION, items: [ROW] },
      date: '2026-10-23',
      startedAt: '2026-10-23T09:00:00.000Z',
    })
    await db.workouts.put({ ...base, exercises: base.exercises.map(change) })
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

  it('shows on the first offered set when level 0 is skipped', async () => {
    await showWith((e) => ({ ...e, skippedLevels: [0] }))
    expect(screen.getByText(NOTES.en)).toBeInTheDocument()
  })

  it('does not show on a substitute exercise', async () => {
    await showWith((e) => ({ ...e, exerciseId: 'single-arm-db-row', substitutedForId: 'inverted-row' }))
    expect(screen.getByRole('heading', { level: 1, name: /single-arm/i })).toBeInTheDocument()
    expect(screen.queryByText(NOTES.en)).toBeNull()
  })
})
