import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/data/db'
import { seedDatabase } from '@/data/seed'
import { seedProgram } from '@/data/seed/program'
import { programRepo } from '@/data/repositories'
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
            targetRir: 2,
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
      JSON.stringify(seedProgram, null, 2),
    )
  })

  it('exports full data as one dated JSON bundle', async () => {
    render(<ProgramDataActions program={seedProgram} />)
    await userEvent.click(screen.getByRole('button', { name: 'Export all data' }))

    await waitFor(() => expect(shareOrDownloadFile).toHaveBeenCalled())
    const [filename, content] = vi.mocked(shareOrDownloadFile).mock.calls[0]
    expect(filename).toMatch(/^fit223-export-\d{4}-\d{2}-\d{2}\.json$/)
    const parsed = JSON.parse(content)
    expect(parsed.programs.map((p: { id: string }) => p.id)).toContain(seedProgram.id)
    expect(parsed.settings.name).toBe('Austin')
  })

  it('shows a status line naming the program after a successful program export', async () => {
    render(<ProgramDataActions program={seedProgram} />)
    await userEvent.click(screen.getByRole('button', { name: 'Export program' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Exported "Phase 1 — Home".')
  })

  it('shows "Backup saved." after a successful full-data export', async () => {
    render(<ProgramDataActions program={seedProgram} />)
    await userEvent.click(screen.getByRole('button', { name: 'Export all data' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Backup saved.')
  })

  it('says nothing when the share sheet is cancelled', async () => {
    vi.mocked(shareOrDownloadFile).mockResolvedValueOnce('cancelled')
    render(<ProgramDataActions program={seedProgram} />)
    await userEvent.click(screen.getByRole('button', { name: 'Export program' }))

    await waitFor(() => expect(shareOrDownloadFile).toHaveBeenCalled())
    expect(screen.queryByRole('status')).toBeNull()
  })
})
