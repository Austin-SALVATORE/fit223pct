import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { exerciseRepo, programRepo } from '@/data/repositories'
import { validateProgramImport } from '@/domain/programImport'
import { parseProgramMarkdown } from '@/domain/programMarkdown'
import { toCanonicalProgramJson, programExportFilename } from '@/domain/programExport'
import { shareOrDownloadFile } from '@/lib/shareOrDownloadFile'
import { useTranslatedMessage } from '@/i18n/useTranslatedMessage'
import { useProgramName } from '@/i18n/seedProgram'
import { ConfirmAction } from '@/ui/ConfirmAction'
import { SecondaryButton } from '@/ui/SecondaryButton'
import type { MessageDescriptor } from '@/domain/message'
import type { Program } from '@/domain/types'

type ImportState =
  | { status: 'idle' }
  | { status: 'error'; message: MessageDescriptor }
  // Holds the whole existing Program, not just its name: the name has to be
  // resolved through useProgramName at *render* time, because the seed
  // program's name is locale-keyed and this state is set from an async
  // callback where hooks cannot run (docs/review-backlog.md I9).
  | { status: 'confirm'; program: Program; existing: Program }
  | { status: 'done'; name: string }

type ExportState = { status: 'idle' } | { status: 'done' }

/** Never rendered — keeps useProgramName's call unconditional. */
const EMPTY_PROGRAM: Program = {
  id: '',
  name: '',
  phase: 0,
  startDate: '',
  endDate: null,
  trainingWeekdays: [],
  rotation: [],
  sessions: [],
}

/**
 * Import/Export program — the program surface (see
 * docs/DataPortability.md's revised Surface section). Full-data backup
 * moved to Settings; this is program content only.
 */
export function ProgramDataActions({ program }: { program: Program }) {
  const { t } = useTranslation('plan')
  // The active program may be the seed, whose name is locale-keyed — read it
  // through the hook rather than off the record (I8).
  const programName = useProgramName(program)
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
        setImportState({ status: 'error', message: { key: 'plan:import.notValidJson' } })
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
      setImportState({ status: 'confirm', program: result.program, existing })
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
      // Only the fact, never the prose: the message is built at render so it
      // follows a live language switch and resolves the seed's locale key.
      setExportState({ status: 'done' })
    }
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3">
        <SecondaryButton onClick={() => fileInputRef.current?.click()}>
          {t('import.importProgram')}
        </SecondaryButton>
        <SecondaryButton onClick={() => void exportProgram()}>{t('import.exportProgram')}</SecondaryButton>
      </div>
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

      <ImportFeedback
        state={importState}
        onConfirm={() => void confirmReplace()}
        onCancel={() => setImportState({ status: 'idle' })}
      />
      {exportState.status === 'done' && (
        <p role="status" className="mt-3 text-sm text-ink-secondary">
          {t('export.done', { name: programName })}
        </p>
      )}
    </div>
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
  const { t } = useTranslation('plan')
  const errorMessage = useTranslatedMessage(
    state.status === 'error' ? state.message : { key: 'plan:import.notValidJson' },
  )
  // Unconditional, with a placeholder off the confirm path — Rules of Hooks.
  // The *existing* program may be the seed (locale-keyed name); the incoming
  // one is always imported and renders verbatim, which is why only this side
  // goes through the hook.
  const existingName = useProgramName(
    state.status === 'confirm' ? state.existing : EMPTY_PROGRAM,
  )

  if (state.status === 'idle') return null

  if (state.status === 'error') {
    return (
      <p role="alert" className="mt-3 text-clay">
        {errorMessage}
      </p>
    )
  }

  if (state.status === 'done') {
    return (
      <p role="status" className="mt-3 text-ink-secondary">
        {t('import.imported', { name: state.name })}
      </p>
    )
  }

  // Was a role="alert" paragraph with the Replace and Cancel buttons inside
  // it: focus never moved, so the user was *told* about controls without
  // being taken to them, inside an assertive region that could re-interrupt
  // (docs/review-backlog.md A8). It overwrites the owner's whole program, so
  // it gets the same real confirm the swap sheet and the Today discard use —
  // heading takes focus, destructive consequence as its description.
  return (
    <div className="mt-3">
      <ConfirmAction
        heading={t('import.replacesExisting', {
          newName: state.program.name,
          existingName,
        })}
        warning={t('import.replaceWarning')}
        confirmLabel={t('import.replace')}
        cancelLabel={t('import.cancel')}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </div>
  )
}
