import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { DailyRoutineStepRow } from './DailyRoutineStepRow'
import type { DailyRoutineStep } from '@/domain/dailyRoutine'

/**
 * The 90/90 Breathing row's `breaths` count is a schema number
 * (`domain/dailyRoutine.ts`'s `breathing` variant) that must reach the
 * rendered copy — `morning.breathingInstruction` — through interpolation,
 * not a value hardcoded into the locale string. Before this file's
 * accompanying fix, `DailyRoutineStepRow.tsx` called
 * `t('morning.breathingInstruction')` with no arguments while all three
 * locale strings baked in their own "5"; a coach revision to the seed's
 * `breaths` value would then silently desync from the screen.
 *
 * The middle test is the connective-tissue proof (team-roles.md's dev
 * report expectation): run against the code as it stood before the fix,
 * it failed — the row read "Complete 5 controlled breaths" regardless of
 * `step.breaths: 7` — confirming the defect was real, not hypothetical.
 * Run after the fix, it passes.
 */
function renderStep(step: DailyRoutineStep) {
  return render(
    <MemoryRouter>
      <DailyRoutineStepRow step={step} />
    </MemoryRouter>,
  )
}

describe('DailyRoutineStepRow — breathing detail interpolates the schema breath count', () => {
  it('renders the seeded 90/90 Breathing dose (5 breaths)', () => {
    const step: DailyRoutineStep = { kind: 'breathing', exerciseId: 'ninety-ninety-breathing', rounds: 2, breaths: 5 }
    renderStep(step)
    expect(screen.getByText(/Complete 5 controlled breaths/)).toBeInTheDocument()
  })

  it('renders a non-default breath count from the step, not a hardcoded 5', () => {
    const step: DailyRoutineStep = { kind: 'breathing', exerciseId: 'ninety-ninety-breathing', rounds: 2, breaths: 7 }
    renderStep(step)
    expect(screen.getByText(/Complete 7 controlled breaths/)).toBeInTheDocument()
    expect(screen.queryByText(/Complete 5 controlled breaths/)).toBeNull()
  })

  it('renders the English singular form for a single breath', () => {
    const step: DailyRoutineStep = { kind: 'breathing', exerciseId: 'ninety-ninety-breathing', rounds: 2, breaths: 1 }
    renderStep(step)
    expect(screen.getByText(/Complete 1 controlled breath\./)).toBeInTheDocument()
  })
})
