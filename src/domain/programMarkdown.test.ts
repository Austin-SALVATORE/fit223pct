import { describe, expect, it } from 'vitest'
import { parseProgramMarkdown } from './programMarkdown'

const validMarkdown = `---
id: phase-2-gym
name: Phase 2 — Gym
phase: 2
startDate: 2026-08-10
endDate:
trainingWeekdays: [1, 3, 5]
rotation: [A, B]
---

## Session: A
Name: Session A
Focus: Squat & pull

| Exercise | Sets | Range | Mode | Rest | Weights | Note |
|---|---|---|---|---|---|---|
| barbell-squat | 3 | 8-12 | reps | 120 | 20/40/2.5 | Goblet squat substitutes if the rack's busy |
| plank | 2 | 20-40 | seconds | 60 | -/-/- | - |

## Session: B
Name: Session B
Focus: Hinge & press

| Exercise | Sets | Range | Mode | Rest | Weights | Note | Per side |
|---|---|---|---|---|---|---|---|
| bulgarian-split-squat | 3 | 8-12 | reps | 120 | 8/20/2 | - | yes |
`

describe('parseProgramMarkdown', () => {
  it('parses front matter and session tables into the JSON shape', () => {
    const result = parseProgramMarkdown(validMarkdown)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toMatchObject({
      id: 'phase-2-gym',
      name: 'Phase 2 — Gym',
      phase: 2,
      startDate: '2026-08-10',
      endDate: null,
      trainingWeekdays: [1, 3, 5],
      rotation: ['A', 'B'],
    })
    const sessions = (result.data as { sessions: unknown[] }).sessions as Array<{
      id: string
      name: string
      focus: string
      items: Array<Record<string, unknown>>
    }>
    expect(sessions).toHaveLength(2)
    expect(sessions[0]).toMatchObject({ id: 'A', name: 'Session A', focus: 'Squat & pull' })
    expect(sessions[0].items[0]).toMatchObject({
      exerciseId: 'barbell-squat',
      sets: 3,
      range: { min: 8, max: 12 },
      mode: 'reps',
      restSeconds: 120,
      startWeightKg: 20,
      maxWeightKg: 40,
      weightStepKg: 2.5,
      note: "Goblet squat substitutes if the rack's busy",
    })
    expect(sessions[0].items[0]).not.toHaveProperty('targetRir')
    expect(sessions[0].items[1]).toMatchObject({
      exerciseId: 'plank',
      mode: 'seconds',
      startWeightKg: null,
      maxWeightKg: null,
      weightStepKg: null,
    })
    expect(sessions[0].items[1].note).toBeUndefined()
    expect(sessions[1].items[0]).toMatchObject({ exerciseId: 'bulgarian-split-squat', perSide: true })
    expect(sessions[0].items[0].perSide).toBe(false)
  })

  it('rejects a table row with an unparseable range, naming the row', () => {
    const bad = validMarkdown.replace('| 8-12 | reps | 120 | 20/40/2.5 |', '| eight to twelve | reps | 120 | 20/40/2.5 |')
    const result = parseProgramMarkdown(bad)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.key).toBe('plan:import.invalidRange')
      expect(result.error.params).toMatchObject({ sectionId: 'A', exerciseId: 'barbell-squat' })
    }
  })

  it('rejects a table missing a required column, naming it', () => {
    const bad = validMarkdown.replace('| Exercise | Sets | Range | Mode | Rest | Weights | Note |\n|---|---|---|---|---|---|---|\n| barbell-squat | 3 | 8-12 | reps | 120 | 20/40/2.5 | Goblet squat substitutes if the rack\'s busy |', '| Exercise | Sets | Range | Mode | Weights | Note |\n|---|---|---|---|---|---|\n| barbell-squat | 3 | 8-12 | reps | 20/40/2.5 | Goblet squat substitutes if the rack\'s busy |')
    const result = parseProgramMarkdown(bad)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.key).toBe('plan:import.sessionMissingColumn')
      expect(result.error.params?.column).toBe('Rest')
    }
  })

  it('parses a comma-separated Substitutions column, treating "-" as none', () => {
    const withSubs = validMarkdown
      .replace(
        '| Exercise | Sets | Range | Mode | Rest | Weights | Note |\n|---|---|---|---|---|---|---|\n| barbell-squat | 3 | 8-12 | reps | 120 | 20/40/2.5 | Goblet squat substitutes if the rack\'s busy |\n| plank | 2 | 20-40 | seconds | 60 | -/-/- | - |',
        '| Exercise | Sets | Range | Mode | Rest | Weights | Note | Substitutions |\n|---|---|---|---|---|---|---|---|\n| barbell-squat | 3 | 8-12 | reps | 120 | 20/40/2.5 | - | goblet-squat, bulgarian-split-squat |\n| plank | 2 | 20-40 | seconds | 60 | -/-/- | - | - |',
      )
    const result = parseProgramMarkdown(withSubs)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const sessions = (result.data as { sessions: Array<{ items: Array<Record<string, unknown>> }> })
      .sessions
    expect(sessions[0].items[0].substitutionIds).toEqual(['goblet-squat', 'bulgarian-split-squat'])
    expect(sessions[0].items[1].substitutionIds).toBeUndefined()
  })

  it('rejects markdown with no session sections', () => {
    const result = parseProgramMarkdown('---\nid: x\nname: X\nphase: 1\nstartDate: 2026-01-01\nendDate:\ntrainingWeekdays: [1]\nrotation: [A]\n---\n')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.key).toBe('plan:import.noSessionsFound')
  })

  it('parses one or more "## Activity: <Weekday>" sections into weekdayActivities', () => {
    const withActivities =
      validMarkdown +
      `
## Activity: Tuesday
Kind: recovery
Title: Recovery walk & stretch

- 30-minute easy walk — conversational pace
- Hip flexor stretch — 45s per side

## Activity: Sunday
Kind: checkpoint
Title: Weekly checkpoint

- Weight and waist measurement
`
    const result = parseProgramMarkdown(withActivities)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const weekdayActivities = (
      result.data as {
        weekdayActivities: Record<string, { kind: string; title: string; items: unknown[] }>
      }
    ).weekdayActivities
    expect(weekdayActivities['2']).toEqual({
      kind: 'recovery',
      title: 'Recovery walk & stretch',
      items: [
        { label: '30-minute easy walk', detail: 'conversational pace' },
        { label: 'Hip flexor stretch', detail: '45s per side' },
      ],
    })
    expect(weekdayActivities['7']).toEqual({
      kind: 'checkpoint',
      title: 'Weekly checkpoint',
      items: [{ label: 'Weight and waist measurement' }],
    })
  })

  it('omits weekdayActivities entirely when no Activity section exists', () => {
    const result = parseProgramMarkdown(validMarkdown)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).not.toHaveProperty('weekdayActivities')
  })

  it('rejects an Activity heading that is not a recognized weekday name', () => {
    const bad =
      validMarkdown +
      '\n## Activity: Someday\nKind: recovery\nTitle: Recovery walk\n\n- 20-minute walk\n'
    const result = parseProgramMarkdown(bad)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.key).toBe('plan:import.unrecognizedWeekdayHeading')
      expect(result.error.params?.weekdayName).toBe('Someday')
    }
  })

  it('rejects an Activity section missing a Kind or Title line', () => {
    const missingKind =
      validMarkdown + '\n## Activity: Tuesday\nTitle: Recovery walk\n\n- 20-minute walk\n'
    const result = parseProgramMarkdown(missingKind)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.key).toBe('plan:import.activityMissingKind')
  })

  it('rejects an Activity section with no item bullets', () => {
    const bad = validMarkdown + '\n## Activity: Tuesday\nKind: recovery\nTitle: Recovery walk\n'
    const result = parseProgramMarkdown(bad)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.key).toBe('plan:import.activityMissingItems')
  })
})

const ladderMarkdown = `---
id: phase-1-home
name: Phase 1 — Home
phase: 1
startDate: 2026-07-20
endDate:
trainingWeekdays: [1, 3, 5]
rotation: [A]
---

## Session: A
Name: Session A
Focus: Squat focus

| Exercise | Sets | Range | Mode | Rest | Weights | Ladder | Note |
|---|---|---|---|---|---|---|---|
| goblet-squat | 3 | - | reps | 120 | -/14/2 | 8x12 / 10x10 / 12x8 | - |
| plank | 2 | 20-40 | seconds | 60 | -/-/- | - | - |
`

describe('parseProgramMarkdown ladder syntax', () => {
  it('parses a Ladder cell into setPlan, weight-then-reps per rung, ignoring the Weights start slot', () => {
    const result = parseProgramMarkdown(ladderMarkdown)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const sessions = (result.data as { sessions: Array<{ items: Array<Record<string, unknown>> }> }).sessions
    expect(sessions[0].items[0]).toMatchObject({
      exerciseId: 'goblet-squat',
      sets: 3,
      mode: 'reps',
      setPlan: [
        { weightKg: 8, reps: 12 },
        { weightKg: 10, reps: 10 },
        { weightKg: 12, reps: 8 },
      ],
      maxWeightKg: 14,
      weightStepKg: 2,
    })
    expect(sessions[0].items[0]).not.toHaveProperty('range')
    expect(sessions[0].items[0]).not.toHaveProperty('startWeightKg')
  })

  it('leaves a non-ladder row in the same table unaffected', () => {
    const result = parseProgramMarkdown(ladderMarkdown)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const sessions = (result.data as { sessions: Array<{ items: Array<Record<string, unknown>> }> }).sessions
    expect(sessions[0].items[1]).toMatchObject({ exerciseId: 'plank', range: { min: 20, max: 40 } })
    expect(sessions[0].items[1]).not.toHaveProperty('setPlan')
  })

  it('rejects an unparseable Ladder cell, naming the row', () => {
    const bad = ladderMarkdown.replace('8x12 / 10x10 / 12x8', '8-12, 10-10')
    const result = parseProgramMarkdown(bad)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.key).toBe('plan:import.invalidLadder')
      expect(result.error.params).toMatchObject({ sectionId: 'A', exerciseId: 'goblet-squat' })
    }
  })

  it('rejects a row that fills both Ladder and Range', () => {
    const bad = ladderMarkdown.replace(
      '| goblet-squat | 3 | - | reps | 120 | -/14/2 | 8x12 / 10x10 / 12x8 | - |',
      '| goblet-squat | 3 | 8-12 | reps | 120 | -/14/2 | 8x12 / 10x10 / 12x8 | - |',
    )
    const result = parseProgramMarkdown(bad)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.key).toBe('plan:import.ladderRowHasRange')
      expect(result.error.params).toMatchObject({ sectionId: 'A', exerciseId: 'goblet-squat' })
    }
  })
})
