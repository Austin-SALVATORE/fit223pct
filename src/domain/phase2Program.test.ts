/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseProgramMarkdown } from './programMarkdown'
import { validateProgramImport } from './programImport'
import { seedExercises } from '@/data/seed/exercises'
import { seedProgram } from '@/data/seed/program'

const PHASE_2_PATH = resolve(process.cwd(), 'docs/programs/phase-2-gym.md')

/**
 * The actual importable Phase 2 file, run through the real validator against
 * the real Library — the safety net for hand-authored content: any typo'd
 * exercise id, malformed row, or schema drift fails the build, not a
 * training session on Austin's phone.
 */
describe('Phase 2 (Fitness Park) program file', () => {
  const source = readFileSync(PHASE_2_PATH, 'utf-8')
  const libraryIds = new Set(seedExercises.map((e) => e.id))

  it('parses and validates against the real Library', () => {
    const parsed = parseProgramMarkdown(source)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    const result = validateProgramImport(parsed.data, libraryIds)
    expect(result.ok).toBe(true)
  })

  it('starts the day after Phase 1 ends, keeping the timeline honest', () => {
    const parsed = parseProgramMarkdown(source)
    if (!parsed.ok) throw new Error(parsed.error)
    const result = validateProgramImport(parsed.data, libraryIds)
    if (!result.ok) throw new Error(result.error)

    expect(result.program.startDate).toBe('2026-08-10')
    expect(seedProgram.endDate).toBe('2026-08-09')
  })

  it('graduates every home-equipment-capped exercise with its predecessor as the substitution', () => {
    const parsed = parseProgramMarkdown(source)
    if (!parsed.ok) throw new Error(parsed.error)
    const result = validateProgramImport(parsed.data, libraryIds)
    if (!result.ok) throw new Error(result.error)

    const exerciseById = new Map(seedExercises.map((e) => [e.id, e]))
    const usedIds = result.program.sessions.flatMap((s) => s.items.map((i) => i.exerciseId))

    expect(exerciseById.get('barbell-squat')?.substitutionIds).toContain('goblet-squat')
    expect(exerciseById.get('barbell-hip-thrust')?.substitutionIds).toContain('hip-thrust')
    expect(usedIds).toContain('bench-press') // carried unchanged, per the review contract
  })

  it('declares contextual fallbacks on the machine-dependent slots', () => {
    const parsed = parseProgramMarkdown(source)
    if (!parsed.ok) throw new Error(parsed.error)
    const result = validateProgramImport(parsed.data, libraryIds)
    if (!result.ok) throw new Error(result.error)

    const itemById = new Map(
      result.program.sessions.flatMap((s) => s.items).map((i) => [i.exerciseId, i]),
    )
    expect(itemById.get('barbell-squat')?.substitutionIds).toEqual([
      'goblet-squat',
      'bulgarian-split-squat',
    ])
    expect(itemById.get('cable-row')?.substitutionIds).toEqual([
      'single-arm-db-row',
      'bent-over-row',
    ])
    expect(itemById.get('lat-pulldown')?.substitutionIds).toEqual(['single-arm-db-row'])
  })

  it('removes the home-equipment weight ceiling on every loaded main lift', () => {
    const parsed = parseProgramMarkdown(source)
    if (!parsed.ok) throw new Error(parsed.error)
    const result = validateProgramImport(parsed.data, libraryIds)
    if (!result.ok) throw new Error(result.error)

    const mainLifts = result.program.sessions
      .flatMap((s) => s.items)
      .filter((i) => i.role !== 'accessory' && i.startWeightKg !== null)

    expect(mainLifts.length).toBeGreaterThan(0)
    for (const lift of mainLifts) {
      expect(lift.maxWeightKg).toBeNull()
    }
  })

  it('declares the four Milestone 6 activity days, none overlapping a training weekday', () => {
    const parsed = parseProgramMarkdown(source)
    if (!parsed.ok) throw new Error(parsed.error)
    const result = validateProgramImport(parsed.data, libraryIds)
    if (!result.ok) throw new Error(result.error)

    const activities = result.program.weekdayActivities
    expect(activities).toBeDefined()
    expect(activities?.[2]?.kind).toBe('recovery') // Tuesday
    expect(activities?.[4]?.kind).toBe('mobility') // Thursday
    expect(activities?.[6]?.kind).toBe('optional') // Saturday
    expect(activities?.[7]?.kind).toBe('checkpoint') // Sunday

    // Every declared weekday is disjoint from the training rotation.
    for (const weekday of Object.keys(activities ?? {}).map(Number)) {
      expect(result.program.trainingWeekdays).not.toContain(weekday)
    }
  })

  it('holds every activity item to the technique-note specificity bar — no generic wellness prompts', () => {
    const parsed = parseProgramMarkdown(source)
    if (!parsed.ok) throw new Error(parsed.error)
    const result = validateProgramImport(parsed.data, libraryIds)
    if (!result.ok) throw new Error(result.error)

    const genericPhrases = /hydrate|drink water|sleep early|self-?care|listen to your body|stay active/i
    const allItems = Object.values(result.program.weekdayActivities ?? {}).flatMap((a) => a.items)
    expect(allItems.length).toBeGreaterThan(0)
    for (const item of allItems) {
      const fullText = item.detail ? `${item.label} — ${item.detail}` : item.label
      expect(fullText).not.toMatch(genericPhrases)
      expect(fullText.length).toBeGreaterThan(10) // long enough to carry real content, not a stub
    }
  })
})
