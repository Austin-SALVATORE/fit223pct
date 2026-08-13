import { describe, expect, it } from 'vitest'
import { toCanonicalProgramJson, programExportFilename } from './programExport'
import { validateProgramImport } from './programImport'
import { seedProgram, mesocycle2Build } from '@/data/seed/program'
import { seedExercises } from '@/data/seed/exercises'
import type { LadderPrescription } from './types'

const libraryIds = new Set(seedExercises.map((e) => e.id))

describe('toCanonicalProgramJson', () => {
  it('round-trips through validateProgramImport unchanged on content, but never carries origin', () => {
    const json = toCanonicalProgramJson(seedProgram)
    expect(JSON.parse(json)).not.toHaveProperty('origin')

    const result = validateProgramImport(JSON.parse(json), libraryIds)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // Content is byte-equal to the seed; origin is not — a re-imported
    // file always comes back 'imported', even reusing the seed's own id.
    expect(result.program).toEqual({ ...seedProgram, origin: 'imported' })
  })

  it('names the export file after the program id', () => {
    expect(programExportFilename(seedProgram)).toBe('phase-1-home.json')
  })

  // Regression: activityItemSchema is not .strict(), so an unlisted field is
  // stripped rather than rejected — routineId therefore vanished on import
  // and every recovery link died on an export/import round-trip, silently.
  it('round-trips an activity item\'s routineId', () => {
    const withRoutine = {
      ...seedProgram,
      weekdayActivities: {
        2: {
          kind: 'recovery' as const,
          title: 'Recovery day',
          items: [{ label: 'Guided Stretch', detail: '8–10 min', routineId: 'recovery-stretch-v1' }],
        },
      },
    }
    const result = validateProgramImport(JSON.parse(toCanonicalProgramJson(withRoutine)), libraryIds)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.program.weekdayActivities?.[2]?.items[0].routineId).toBe('recovery-stretch-v1')
    }
  })

  // Regression: same bug class as routineId above — activityItemSchema
  // omitted recordable, so it silently stripped on export/import (found via
  // the seed round-trip test above once phase-1-home carried a recordable
  // item, 6 Aug).
  it("round-trips an activity item's recordable marker", () => {
    const withRide = {
      ...seedProgram,
      weekdayActivities: {
        1: {
          kind: 'recovery' as const,
          title: 'Zone 2 ride',
          items: [{ label: 'Zone 2 ride', detail: '20 min', recordable: 'ride' as const }],
        },
      },
    }
    const result = validateProgramImport(JSON.parse(toCanonicalProgramJson(withRide)), libraryIds)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.program.weekdayActivities?.[1]?.items[0].recordable).toBe('ride')
    }
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
    expect(result.program).toEqual({ ...withSubs, origin: 'imported' })
    expect(result.program.sessions[0].items[0].substitutionIds).toEqual([
      'split-squat',
      'tempo-bodyweight-squat',
    ])
  })

  it('round-trips a setPlan ladder prescription (M8 Phase 8 acceptance test)', () => {
    const withLadder = {
      ...seedProgram,
      sessions: seedProgram.sessions.map((session, i) =>
        i === 0
          ? {
              ...session,
              items: session.items.map((item, j) =>
                j === 0
                  ? {
                      exerciseId: item.exerciseId,
                      sets: 3,
                      mode: 'reps' as const,
                      restSeconds: item.restSeconds,
                      perSide: item.perSide,
                      setPlan: [
                        { weightKg: 8, reps: 12 },
                        { weightKg: 10, reps: 10 },
                        { weightKg: 12, reps: 8 },
                      ],
                      maxWeightKg: 14,
                      weightStepKg: 2,
                    }
                  : item,
              ),
            }
          : session,
      ),
    }
    const json = toCanonicalProgramJson(withLadder)
    const result = validateProgramImport(JSON.parse(json), libraryIds)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.program).toEqual({ ...withLadder, origin: 'imported' })
    expect(result.program.sessions[0].items[0].setPlan).toEqual([
      { weightKg: 8, reps: 12 },
      { weightKg: 10, reps: 10 },
      { weightKg: 12, reps: 8 },
    ])
  })

  /**
   * D3/R9, 12 Aug 2026 equipment upgrade — `LadderPrescription.rehearsal`
   * is a new field on the strict ladder schema. **Retargeted to a
   * synthetic prescription 13 Aug 2026** (Full Body Restructure, six-
   * question bundle Q3): the seed dropped `bent-over-row`'s rehearsal
   * set, the only one this program ever carried, so no shipped
   * prescription exercises this property any more — the round-trip
   * property is what this test is for, and it should not depend on the
   * seed happening to exercise it
   * (`~/.claude/plans/m2-fullbody-restructure.md` §3.6).
   *
   * Built from a real seeded ladder's shape (`bent-over-row`'s old
   * rehearsal-bearing rung set) rather than an arbitrary literal, so a
   * schema regression here still reads as plausible seed content.
   */
  it("round-trips a LadderPrescription's rehearsal field (D3/R9)", () => {
    const rehearsalItem: LadderPrescription = {
      exerciseId: 'bent-over-row',
      sets: 3,
      mode: 'reps',
      perSide: false,
      role: 'main',
      restSeconds: 120,
      setPlan: [
        { weightKg: 17.75, reps: 12 },
        { weightKg: 21.75, reps: 10 },
        { weightKg: 25.75, reps: 8 },
      ],
      maxWeightKg: 43.75,
      weightStepKg: 2,
      rehearsal: { weightKg: 13.75, reps: 6 },
    }
    const syntheticSession = {
      id: 'test-rehearsal-session',
      name: 'Test Session',
      focus: 'Test',
      items: [rehearsalItem],
    }
    const syntheticProgram = {
      ...mesocycle2Build,
      sessions: [syntheticSession],
      rotation: [syntheticSession.id],
      weekdayActivities: undefined,
    }
    const json = toCanonicalProgramJson(syntheticProgram)
    const result = validateProgramImport(JSON.parse(json), libraryIds)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    // Compares items only, not the whole session — sessionTemplateSchema
    // silently strips `warmupId` (found by this test, not previously
    // known or documented; same defect class as this file's routineId
    // and recordable regressions above, but a new instance, unrelated to
    // `rehearsal`). Flagged to the lead rather than fixed here — outside
    // this test's assigned scope.
    expect(result.program.sessions[0].items).toEqual(syntheticSession.items)
    expect(result.program.sessions[0].id).toBe(syntheticSession.id)

    const bentOverRow = result.program.sessions[0].items.find(
      (i) => i.exerciseId === 'bent-over-row',
    ) as LadderPrescription
    expect(bentOverRow.rehearsal).toEqual({ weightKg: 13.75, reps: 6 })
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
    expect(result.program).toEqual({ ...withActivities, origin: 'imported' })
    expect(result.program.weekdayActivities?.[2]?.title).toBe('Recovery walk & stretch')
  })
})
