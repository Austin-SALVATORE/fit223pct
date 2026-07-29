import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { programRepo } from '@/data/repositories'
import { toCanonicalProgramJson } from '@/domain/programExport'
import i18n from '@/i18n/i18next'
import { ProgramDataActions } from './ProgramDataActions'

vi.mock('@/lib/shareOrDownloadFile', () => ({
  shareOrDownloadFile: vi.fn().mockResolvedValue('downloaded'),
}))
import { shareOrDownloadFile } from '@/lib/shareOrDownloadFile'

beforeEach(async () => {
  await seedDatabase()
})

afterEach(async () => {
  cleanup()
  vi.mocked(shareOrDownloadFile).mockClear()
  await db.programs.clear()
  await i18n.changeLanguage('en')
})

function jsonFile(name: string, data: unknown): File {
  return new File([JSON.stringify(data)], name, { type: 'application/json' })
}

function newProgram(overrides: Record<string, unknown> = {}) {
  return {
    id: 'phase-2-gym',
    name: 'Phase 2 — Gym',
    phase: 2,
    startDate: '2026-08-10',
    endDate: null,
    trainingWeekdays: [1, 3, 5],
    rotation: ['A'],
    sessions: [
      {
        id: 'A',
        name: 'Session A',
        focus: 'Squat & pull',
        items: [
          {
            exerciseId: 'goblet-squat',
            sets: 3,
            mode: 'reps',
            range: { min: 8, max: 12 },
            restSeconds: 120,
            perSide: false,
            startWeightKg: 14,
            maxWeightKg: 20,
            weightStepKg: 2,
          },
        ],
      },
    ],
    ...overrides,
  }
}

describe('ProgramDataActions import', () => {
  it('imports a well-formed program with no id collision', async () => {
    render(<ProgramDataActions program={seedProgram} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, jsonFile('phase-2.json', newProgram()))

    expect(await screen.findByText('Imported "Phase 2 — Gym".')).toBeInTheDocument()
    expect(await programRepo.getById('phase-2-gym')).toMatchObject({ name: 'Phase 2 — Gym' })
  })

  it('asks before replacing a program with a colliding id, does nothing until confirmed', async () => {
    render(<ProgramDataActions program={seedProgram} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(
      input,
      jsonFile('phase-1.json', newProgram({ id: seedProgram.id, name: 'Phase 1 — Revised' })),
    )

    expect(await screen.findByRole('button', { name: 'Replace' })).toBeInTheDocument()
    expect((await programRepo.getById(seedProgram.id))?.name).toBe(seedProgram.name)

    await userEvent.click(screen.getByRole('button', { name: 'Replace' }))
    await waitFor(async () => {
      expect((await programRepo.getById(seedProgram.id))?.name).toBe('Phase 1 — Revised')
    })
  })

  it('cancelling a collision leaves the existing program untouched', async () => {
    render(<ProgramDataActions program={seedProgram} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(
      input,
      jsonFile('phase-1.json', newProgram({ id: seedProgram.id, name: 'Phase 1 — Revised' })),
    )
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('button', { name: 'Replace' })).not.toBeInTheDocument()
    expect((await programRepo.getById(seedProgram.id))?.name).toBe(seedProgram.name)
  })

  it('rejects a program referencing an exercise id outside the Library, naming it', async () => {
    render(<ProgramDataActions program={seedProgram} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const bad = newProgram()
    bad.sessions[0].items[0].exerciseId = 'cable-machine-row'
    await userEvent.upload(input, jsonFile('phase-2.json', bad))

    expect(
      await screen.findByText('Exercise id "cable-machine-row" in session "A" doesn\'t exist in the Library.'),
    ).toBeInTheDocument()
    expect(await programRepo.getById('phase-2-gym')).toBeUndefined()
  })

  it('rejects a file that is not valid JSON', async () => {
    render(<ProgramDataActions program={seedProgram} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, new File(['not json'], 'broken.json', { type: 'application/json' }))

    expect(await screen.findByText("That file isn't valid JSON.")).toBeInTheDocument()
  })
})

describe('ProgramDataActions export', () => {
  it('exports the current program as canonical JSON', async () => {
    render(<ProgramDataActions program={seedProgram} />)
    await userEvent.click(screen.getByRole('button', { name: 'Export program' }))

    expect(shareOrDownloadFile).toHaveBeenCalledWith(
      'phase-1-home.json',
      toCanonicalProgramJson(seedProgram),
    )
    const [, exportedJson] = vi.mocked(shareOrDownloadFile).mock.calls[0]
    expect(JSON.parse(exportedJson)).not.toHaveProperty('origin')
  })

  it('shows a status line naming the program after a successful program export', async () => {
    render(<ProgramDataActions program={seedProgram} />)
    await userEvent.click(screen.getByRole('button', { name: 'Export program' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Exported "Phase 1 — Home".')
  })

  it('says nothing when the share sheet is cancelled', async () => {
    vi.mocked(shareOrDownloadFile).mockResolvedValueOnce('cancelled')
    render(<ProgramDataActions program={seedProgram} />)
    await userEvent.click(screen.getByRole('button', { name: 'Export program' }))

    await waitFor(() => expect(shareOrDownloadFile).toHaveBeenCalled())
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('shows exactly Import program and Export program — Export all data moved to Settings', async () => {
    render(<ProgramDataActions program={seedProgram} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.map((b) => b.textContent)).toEqual(['Import program', 'Export program'])
  })

  it('lays the two buttons out on one equal-width row', async () => {
    render(<ProgramDataActions program={seedProgram} />)
    const [importButton, exportButton] = screen.getAllByRole('button')
    expect(importButton.parentElement).toBe(exportButton.parentElement)
    expect(importButton.parentElement?.className).toMatch(/grid-cols-2/)
  })
})

/**
 * I8 / I9 (docs/review-backlog.md). Both sites read a *seed* program's name,
 * which is locale-keyed, and both resolved it in an async callback where a
 * hook cannot run — so the English name reached fr and zh-CN users. The fix
 * is to carry the record, not the prose, and resolve at render.
 *
 * The incoming program on the confirm line stays verbatim on purpose: it is
 * imported content, which is never translated or shadowed.
 */
describe('the seed program\'s name is localized on the data screen', () => {
  it('localizes the export toast (I8)', async () => {
    await i18n.changeLanguage('fr')
    render(<ProgramDataActions program={seedProgram} />)
    await userEvent.click(screen.getByRole('button', { name: 'Exporter le programme' }))

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent('Phase 1 — Maison')
    expect(status).not.toHaveTextContent('Phase 1 — Home')
  })

  it('localizes the export toast in zh-CN too', async () => {
    await i18n.changeLanguage('zh-CN')
    render(<ProgramDataActions program={seedProgram} />)
    await userEvent.click(screen.getByRole('button', { name: '导出计划' }))

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent('第一阶段 — 居家训练')
    expect(status).not.toHaveTextContent('Phase 1 — Home')
  })

  it('localizes the existing program in the replace confirm, and leaves the imported one verbatim (I9)', async () => {
    await i18n.changeLanguage('fr')
    render(<ProgramDataActions program={seedProgram} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(
      input,
      jsonFile('phase-1.json', newProgram({ id: seedProgram.id, name: 'Mon propre bloc' })),
    )

    // A8 turned this into a real confirm, so the name lives on the heading
    // rather than inside a role="alert" that also held the buttons.
    const heading = await screen.findByRole('heading', { name: /Mon propre bloc/ })
    expect(heading).toHaveTextContent('Phase 1 — Maison')
    expect(heading).not.toHaveTextContent('Phase 1 — Home')
  })
})

/**
 * A8 (docs/review-backlog.md): the replace prompt was a `role="alert"`
 * paragraph with the Replace and Cancel buttons inside it. Focus never
 * moved, so a screen-reader user was told controls existed without being
 * taken to them — inside an assertive region that could re-interrupt. It
 * overwrites the owner's whole program, so it deserves a real confirm.
 */
describe('replacing a program is a real confirm, not an alert with buttons', () => {
  async function reachConfirm() {
    render(<ProgramDataActions program={seedProgram} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(
      input,
      jsonFile('phase-1.json', newProgram({ id: seedProgram.id, name: 'Phase 1 — Revised' })),
    )
    return screen.findByRole('heading', { name: /Phase 1 — Revised/ })
  }

  it('moves focus to the confirm heading and describes what replacement costs', async () => {
    const heading = await reachConfirm()

    await waitFor(() => expect(heading).toHaveFocus())
    const describedBy = heading.getAttribute('aria-describedby') ?? ''
    expect(document.getElementById(describedBy)).toHaveTextContent(
      'Your existing program is replaced.',
    )
  })

  it('no longer puts the controls inside a live region', async () => {
    await reachConfirm()

    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('button', { name: 'Replace' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })
})
