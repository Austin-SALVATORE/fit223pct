import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { exerciseRepo, programRepo } from '@/data/repositories'
import { validateProgramImport } from '@/domain/programImport'
import { parseProgramMarkdown } from '@/domain/programMarkdown'
import { toCanonicalProgramJson, programExportFilename } from '@/domain/programExport'
import { shareOrDownloadFile } from '@/lib/shareOrDownloadFile'
import { useTranslatedMessage } from '@/i18n/useTranslatedMessage'
import { SecondaryButton } from '@/ui/SecondaryButton'
import type { MessageDescriptor } from '@/domain/message'
import type { Program } from '@/domain/types'

type ImportState =
  | { status: 'idle' }
  | { status: 'error'; message: MessageDescriptor }
  | { status: 'confirm'; program: Program; existingName: string }
  | { status: 'done'; name: string }

type ExportState = { status: 'idle' } | { status: 'done'; message: string }

/**
 * Import/Export program — the program surface (see
 * docs/DataPortability.md's revised Surface section). Full-data backup
 * moved to Settings; this is program content only.
 */
export function ProgramDataActions({ program }: { program: Program }) {
  const { t } = useTranslation('plan')
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
      setExportState({ status: 'done', message: t('export.done', { name: program.name }) })
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
          {exportState.message}
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

  return (
    <p role="alert" className="mt-3 flex flex-wrap items-baseline gap-x-2 text-ink-secondary">
      <span>
        {t('import.replacesExisting', {
          newName: state.program.name,
          existingName: state.existingName,
        })}
      </span>
      <button type="button" onClick={onConfirm} className="font-medium text-clay">
        {t('import.replace')}
      </button>
      <button type="button" onClick={onCancel} className="text-ink-tertiary">
        {t('import.cancel')}
      </button>
    </p>
  )
}
