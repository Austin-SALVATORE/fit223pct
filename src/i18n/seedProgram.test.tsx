import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import i18n from '@/i18n/i18next'
import { seedProgram } from '@/data/seed/program'
import { useProgramName, useSessionFocus, useSessionName, usePrescriptionNote } from './seedProgram'
import type { ExercisePrescription, Program, SessionTemplate } from '@/domain/types'

/**
 * Bug found in real use: importing a program that reuses the seed's id
 * (phase-1-home) had its authored content silently shadowed by the seed's
 * locale translations, because the fallback resolver keyed on id alone —
 * which can't distinguish "the pristine seeded program" from "user content
 * wearing the seed's id." Program.origin makes that explicit instead of
 * inferred; these tests are the fix's acceptance criteria.
 */

afterEach(async () => {
  await i18n.changeLanguage('en')
})

const authoredItem: ExercisePrescription = {
  exerciseId: 'goblet-squat',
  sets: 3,
  mode: 'reps',
  range: { min: 8, max: 12 },
  targetRir: 2,
  restSeconds: 120,
  perSide: false,
  startWeightKg: 14,
  maxWeightKg: 20,
  weightStepKg: 2,
  note: 'Austin — own cue for this lift',
}

const authoredSession: SessionTemplate = {
  id: 'A',
  name: 'Austin — Session A',
  focus: 'Austin — Squat focus',
  items: [authoredItem],
}

// Deliberately reuses the seed program's own id — the exact scenario that
// shadowed Austin's authored content before origin existed.
const importedProgram: Program = {
  ...seedProgram,
  name: 'Austin — Phase 1',
  origin: 'imported',
  sessions: [authoredSession],
}

function Probe({ program }: { program: Program }) {
  const session = program.sessions[0]
  return (
    <dl>
      <dt>program name</dt>
      <dd>{useProgramName(program)}</dd>
      <dt>session name</dt>
      <dd>{useSessionName(program.id, session, program.origin)}</dd>
      <dt>session focus</dt>
      <dd>{useSessionFocus(program.id, session, program.origin)}</dd>
      <dt>note</dt>
      <dd>{usePrescriptionNote(program.id, session.id, session.items[0], program.origin) ?? ''}</dd>
    </dl>
  )
}

describe('an imported program reusing the seed id', () => {
  it.each(['en', 'fr', 'zh-CN'] as const)(
    'shows the authored text verbatim under %s, never the seed translation',
    async (locale) => {
      await i18n.changeLanguage(locale)
      render(<Probe program={importedProgram} />)

      expect(screen.getByText('Austin — Phase 1')).toBeInTheDocument()
      expect(screen.getByText('Austin — Session A')).toBeInTheDocument()
      expect(screen.getByText('Austin — Squat focus')).toBeInTheDocument()
      expect(screen.getByText('Austin — own cue for this lift')).toBeInTheDocument()
    },
  )
})

describe('the untouched seeded program', () => {
  it('still translates into French', async () => {
    await i18n.changeLanguage('fr')
    render(<Probe program={seedProgram} />)

    expect(screen.getByText('Phase 1 — Maison')).toBeInTheDocument()
    expect(screen.getByText('Séance A')).toBeInTheDocument()
    expect(screen.getByText('Squat et tirage')).toBeInTheDocument()
    expect(screen.getByText('Descente de 3 secondes')).toBeInTheDocument()
  })

  it('still translates into Simplified Chinese', async () => {
    await i18n.changeLanguage('zh-CN')
    render(<Probe program={seedProgram} />)

    expect(screen.getByText('第一阶段 — 居家训练')).toBeInTheDocument()
    expect(screen.getByText('训练 A')).toBeInTheDocument()
    expect(screen.getByText('深蹲与拉')).toBeInTheDocument()
    expect(screen.getByText('下降用时3秒')).toBeInTheDocument()
  })
})
