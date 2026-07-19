import { useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { exerciseRepo, checkinRepo, programRepo, settingsRepo, workoutRepo } from '@/data/repositories'
import { validateProgramImport } from '@/domain/programImport'
import { parseProgramMarkdown } from '@/domain/programMarkdown'
import { toCanonicalProgramJson, programExportFilename } from '@/domain/programExport'
import { buildFullDataExport, toFullDataExportJson, fullDataExportFilename } from '@/domain/dataExport'
import { shareOrDownloadFile } from '@/lib/shareOrDownloadFile'
import { toDateKey } from '@/lib/dates'
import type { Program } from '@/domain/types'

type ImportState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'confirm'; program: Program; existingName: string }
  | { status: 'done'; name: string }

type ExportState = { status: 'idle' } | { status: 'done'; message: string }

/**
 * Quiet Import/Export actions for the Plan page — the program surface (see
 * docs/DataPortability.md). No new nav entry; this is the whole surface.
 */
export function ProgramDataActions({ program }: { program: Program }) {
  const [importState, setImportState] = useState<ImportState>({ status: 'idle' })
  const [exportState, setExportState] = useState<ExportState>({ status: 'idle' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const text = await file.text()
    const isMarkdown = /\.(md|markdown)$/i.test(file.name)

    let input: unknown
    if (isMarkdown) {
      const parsed = parseProgramMarkdown(text)
      if (!parsed.ok) {
        setImportState({ status: 'error', message: parsed.error })
        return
      }
      input = parsed.data
    } else {
      try {
        input = JSON.parse(text)
      } catch {
        setImportState({ status: 'error', message: "That file isn't valid JSON." })
        return
      }
    }

    const exercises = await exerciseRepo.getAll()
    const result = validateProgramImport(input, new Set(exercises.map((e) => e.id)))
    if (!result.ok) {
      setImportState({ status: 'error', message: result.error })
      return
    }

    const existing = await programRepo.getById(result.program.id)
    if (existing) {
      setImportState({ status: 'confirm', program: result.program, existingName: existing.name })
      return
    }
    await programRepo.put(result.program)
    setImportState({ status: 'done', name: result.program.name })
  }

  async function confirmReplace() {
    if (importState.status !== 'confirm') return
    await programRepo.put(importState.program)
    setImportState({ status: 'done', name: importState.program.name })
  }

  async function exportProgram() {
    const outcome = await shareOrDownloadFile(
      programExportFilename(program),
      toCanonicalProgramJson(program),
    )
    if (outcome !== 'cancelled') {
      setExportState({ status: 'done', message: `Exported "${program.name}".` })
    }
  }

  async function exportAllData() {
    const [programs, workouts, checkins, settings] = await Promise.all([
      programRepo.getAll(),
      workoutRepo.getAll(),
      checkinRepo.getAll(),
      settingsRepo.get(),
    ])
    const data = buildFullDataExport({
      programs,
      workouts,
      checkins,
      settings,
      exportedAt: new Date().toISOString(),
    })
    const outcome = await shareOrDownloadFile(
      fullDataExportFilename(toDateKey(new Date())),
      toFullDataExportJson(data),
    )
    if (outcome !== 'cancelled') {
      setExportState({ status: 'done', message: 'Backup saved.' })
    }
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <ActionButton onClick={() => fileInputRef.current?.click()}>Import program</ActionButton>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.md,.markdown"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void handleFile(file)
        }}
      />
      <ActionButton onClick={() => void exportProgram()}>Export program</ActionButton>
      <ActionButton onClick={() => void exportAllData()}>Export all data</ActionButton>

      <ImportFeedback
        state={importState}
        onConfirm={() => void confirmReplace()}
        onCancel={() => setImportState({ status: 'idle' })}
      />
      {exportState.status === 'done' && (
        <p role="status" className="w-full text-sm text-ink-secondary">
          {exportState.message}
        </p>
      )}
    </div>
  )
}

/**
 * The app's established secondary-control pattern (HoldTimer's "Start
 * hold", the early-start affordance) — bordered, text-ink-secondary,
 * never amber. whileTap mirrors Log set's press feedback exactly;
 * active:bg-raised (GroupedRow's own press tint) covers reduced-motion,
 * which drops whileTap entirely.
 */
function ActionButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={reducedMotion ? undefined : { scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="rounded-full border border-border px-4 py-3 text-sm font-medium text-ink-secondary transition-colors active:bg-raised hover:border-border-strong hover:text-ink"
    >
      {children}
    </motion.button>
  )
}

function ImportFeedback({
  state,
  onConfirm,
  onCancel,
}: {
  state: ImportState
  onConfirm: () => void
  onCancel: () => void
}) {
  if (state.status === 'idle') return null

  if (state.status === 'error') {
    return (
      <p role="alert" className="w-full text-clay">
        {state.message}
      </p>
    )
  }

  if (state.status === 'done') {
    return (
      <p role="status" className="w-full text-ink-secondary">
        Imported "{state.name}".
      </p>
    )
  }

  return (
    <p role="alert" className="flex w-full flex-wrap items-baseline gap-x-2 text-ink-secondary">
      <span>
        "{state.program.name}" replaces "{state.existingName}" — same program id.
      </span>
      <button type="button" onClick={onConfirm} className="font-medium text-clay">
        Replace
      </button>
      <button type="button" onClick={onCancel} className="text-ink-tertiary">
        Cancel
      </button>
    </p>
  )
}
