import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import i18n from '@/i18n/i18next'
import { mesocycle2Build } from '@/data/seed/program'
import { seedExercises } from '@/data/seed/exercises'
import { SessionPreview } from './SessionPreview'

/** The inverted-row safety note is long; Today's preview must wrap it in full, never truncate. */

const SESSION = mesocycle2Build.sessions.find((s) => s.id === 'mesocycle2-fullbody-hipext-shoulder')!
const NOTES: Record<string, string> = {
  en: "Before your first set, check both bars are locked at the same height, then pull on both the way you'll row. If either bar moves, slides or tilts, don't do this exercise — swap to the single-arm dumbbell row.",
  fr: 'Avant ta première série, vérifie que les deux barres sont bloquées à la même hauteur, puis tire sur les deux comme tu vas ramer. Si une barre bouge, glisse ou bascule, ne fais pas cet exercice — remplace-le par le rowing haltère unilatéral.',
  'zh-CN': '第一组之前，先确认两根杠已锁定在相同高度，再像划船那样用力拉两根杠。如果任何一根杠移动、滑动或倾斜，就不要做这个动作——更换为单臂哑铃划船。',
}

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('SessionPreview — inverted-row note', () => {
  it.each(Object.keys(NOTES))('renders in full, untruncated, in %s', async (lng) => {
    await i18n.changeLanguage(lng)
    render(
      <MemoryRouter>
        <SessionPreview
          session={SESSION}
          programId={mesocycle2Build.id}
          exerciseById={new Map(seedExercises.map((e) => [e.id, e]))}
          heading="Today"
        />
      </MemoryRouter>,
    )
    const note = await screen.findByText(NOTES[lng])
    expect(note.className).not.toMatch(/truncate|line-clamp|overflow-hidden|whitespace-nowrap/)
  })
})
