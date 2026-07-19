import { describe, expect, it } from 'vitest'
import { toCanonicalProgramJson, programExportFilename } from './programExport'
import { validateProgramImport } from './programImport'
import { seedProgram } from '@/data/seed/program'
import { seedExercises } from '@/data/seed/exercises'

const libraryIds = new Set(seedExercises.map((e) => e.id))

describe('toCanonicalProgramJson', () => {
  it('round-trips through validateProgramImport unchanged', () => {
    const json = toCanonicalProgramJson(seedProgram)
    const result = validateProgramImport(JSON.parse(json), libraryIds)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.program).toEqual(seedProgram)
  })

  it('names the export file after the program id', () => {
    expect(programExportFilename(seedProgram)).toBe('phase-1-home.json')
  })
})
