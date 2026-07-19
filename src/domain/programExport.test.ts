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

  it('round-trips a program-defined substitutionIds field', () => {
    const withSubs = {
      ...seedProgram,
      sessions: seedProgram.sessions.map((session, i) =>
        i === 0
          ? {
              ...session,
              items: session.items.map((item, j) =>
                j === 0 ? { ...item, substitutionIds: ['split-squat', 'tempo-bodyweight-squat'] } : item,
              ),
            }
          : session,
      ),
    }
    const json = toCanonicalProgramJson(withSubs)
    const result = validateProgramImport(JSON.parse(json), libraryIds)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.program).toEqual(withSubs)
    expect(result.program.sessions[0].items[0].substitutionIds).toEqual([
      'split-squat',
      'tempo-bodyweight-squat',
    ])
  })

  it('round-trips a weekdayActivities field', () => {
    const withActivities = {
      ...seedProgram,
      weekdayActivities: {
        2: {
          kind: 'recovery' as const,
          title: 'Recovery walk & stretch',
          items: [{ label: '30-minute easy walk', detail: 'conversational pace' }],
        },
        7: {
          kind: 'checkpoint' as const,
          title: 'Weekly checkpoint',
          items: [{ label: 'Weight and waist measurement' }],
        },
      },
    }
    const json = toCanonicalProgramJson(withActivities)
    const result = validateProgramImport(JSON.parse(json), libraryIds)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.program).toEqual(withActivities)
    expect(result.program.weekdayActivities?.[2]?.title).toBe('Recovery walk & stretch')
  })
})
