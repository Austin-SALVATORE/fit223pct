/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { seedExercises } from '@/data/seed/exercises'
import { programRepo } from '@/data/repositories'
import { parseProgramMarkdown } from '@/domain/programMarkdown'
import { validateProgramImport } from '@/domain/programImport'
import { resolveDayPlan } from '@/domain/schedule'
import { PlanPage } from './PlanPage'

const PHASE_2_PATH = resolve(process.cwd(), 'docs/programs/phase-2-gym.md')

/**
 * The 9→10 Aug boundary — Phase 1 ends 9 Aug (a Sunday, a rest day), Phase 2
 * starts 10 Aug (a Monday, Session A). Verifies the transition holds up in
 * the exact surface Austin will use to check it ahead of the date: the Plan
 * page's phase navigation, imported the same way he'll import it himself.
 */
function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/plan']}>
      <Routes>
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/" element={<p>TODAY PROBE</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function importPhase2() {
  const source = readFileSync(PHASE_2_PATH, 'utf-8')
  const parsed = parseProgramMarkdown(source)
  if (!parsed.ok) throw new Error(parsed.error)
  const libraryIds = new Set(seedExercises.map((e) => e.id))
  const result = validateProgramImport(parsed.data, libraryIds)
  if (!result.ok) throw new Error(result.error)
  await programRepo.put(result.program)
  return result.program
}

beforeAll(async () => {
  await seedDatabase()
})

afterEach(async () => {
  cleanup()
  await db.workouts.clear()
})

afterAll(() => {
  vi.useRealTimers()
})

describe('resolveDayPlan across the boundary', () => {
  it('9 Aug still belongs to Phase 1 — a rest day, not the end shown early', async () => {
    const phase2 = await importPhase2()
    const active = await programRepo.getActive('2026-08-09')
    expect(active?.id).toBe(seedProgram.id)
    expect(resolveDayPlan(seedProgram, new Date(2026, 7, 9), 0).kind).toBe('rest')
    expect(phase2.startDate).toBe('2026-08-10')
  })

  it('10 Aug resolves to Phase 2, Session A, on schedule from day one', async () => {
    const phase2 = await importPhase2()
    const active = await programRepo.getActive('2026-08-10')
    expect(active?.id).toBe('phase-2-gym')
    const plan = resolveDayPlan(phase2, new Date(2026, 7, 10), 0)
    expect(plan.kind).toBe('training')
    if (plan.kind === 'training') expect(plan.session.name).toBe('Session A')
  })
})

describe('Plan page phase navigation across the boundary', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 7, 9, 9, 0, 0) })
  })

  it('defaults to Phase 1 on 9 Aug, then Phase 2 is one "next" tap away with 10 Aug as its first day', async () => {
    await importPhase2()
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Phase 1 — Home' })).toBeInTheDocument()

    await userEvent.click(await screen.findByRole('button', { name: /Phase 2 — Gym →/ }))

    expect(await screen.findByRole('heading', { name: 'Phase 2 — Gym' })).toBeInTheDocument()
    expect(await screen.findByText('10 Aug – ongoing')).toBeInTheDocument()
    const firstDayRow = (await screen.findByText('Mon 10 Aug')).closest('li')
    expect(firstDayRow).toHaveTextContent('Session A')
    expect(firstDayRow).toHaveTextContent('Projected')
  })
})
