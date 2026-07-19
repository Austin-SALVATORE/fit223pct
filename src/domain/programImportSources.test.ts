import { describe, expect, it } from 'vitest'
import { parseProgramMarkdown } from './programMarkdown'
import { validateProgramImport } from './programImport'

const libraryIds = new Set(['barbell-squat', 'plank'])

describe('markdown → validateProgramImport', () => {
  it('a well-formed markdown file validates end to end', () => {
    const markdown = `---
id: phase-2-gym
name: Phase 2 — Gym
phase: 2
startDate: 2026-08-10
endDate:
trainingWeekdays: [1, 3, 5]
rotation: [A]
---

## Session: A
Name: Session A
Focus: Squat & pull

| Exercise | Sets | Range | Mode | RIR | Rest | Weights | Note |
|---|---|---|---|---|---|---|---|
| barbell-squat | 3 | 8-12 | reps | 2 | 120 | 20/40/2.5 | - |
| plank | 2 | 20-40 | seconds | 2 | 60 | -/-/- | - |
`
    const parsed = parseProgramMarkdown(markdown)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const result = validateProgramImport(parsed.data, libraryIds)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.program.startDate).toBe('2026-08-10')
    expect(result.program.endDate).toBeNull()
    expect(result.program.sessions[0].items[0].maxWeightKg).toBe(40)
    expect(result.program.sessions[0].items[1].maxWeightKg).toBeNull()
  })

  it('an unknown exercise id in markdown is caught by the same Library check as JSON', () => {
    const markdown = `---
id: phase-2-gym
name: Phase 2 — Gym
phase: 2
startDate: 2026-08-10
endDate:
trainingWeekdays: [1, 3, 5]
rotation: [A]
---

## Session: A
Name: Session A
Focus: Squat & pull

| Exercise | Sets | Range | Mode | RIR | Rest | Weights | Note |
|---|---|---|---|---|---|---|---|
| cable-machine-row | 3 | 8-12 | reps | 2 | 120 | 20/40/2.5 | - |
`
    const parsed = parseProgramMarkdown(markdown)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const result = validateProgramImport(parsed.data, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/cable-machine-row/)
  })

  it('a well-formed activity section validates end to end', () => {
    const markdown = `---
id: phase-2-gym
name: Phase 2 — Gym
phase: 2
startDate: 2026-08-10
endDate:
trainingWeekdays: [1, 3, 5]
rotation: [A]
---

## Session: A
Name: Session A
Focus: Squat & pull

| Exercise | Sets | Range | Mode | RIR | Rest | Weights | Note |
|---|---|---|---|---|---|---|---|
| barbell-squat | 3 | 8-12 | reps | 2 | 120 | 20/40/2.5 | - |

## Activity: Tuesday
Kind: recovery
Title: Recovery walk & stretch

- 30-minute easy walk — conversational pace
`
    const parsed = parseProgramMarkdown(markdown)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const result = validateProgramImport(parsed.data, libraryIds)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.program.weekdayActivities?.[2]).toEqual({
      kind: 'recovery',
      title: 'Recovery walk & stretch',
      items: [{ label: '30-minute easy walk', detail: 'conversational pace' }],
    })
  })

  it('an activity claiming a training weekday is rejected end to end, same as JSON', () => {
    const markdown = `---
id: phase-2-gym
name: Phase 2 — Gym
phase: 2
startDate: 2026-08-10
endDate:
trainingWeekdays: [1, 3, 5]
rotation: [A]
---

## Session: A
Name: Session A
Focus: Squat & pull

| Exercise | Sets | Range | Mode | RIR | Rest | Weights | Note |
|---|---|---|---|---|---|---|---|
| barbell-squat | 3 | 8-12 | reps | 2 | 120 | 20/40/2.5 | - |

## Activity: Monday
Kind: recovery
Title: Recovery walk

- 20-minute walk
`
    const parsed = parseProgramMarkdown(markdown)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const result = validateProgramImport(parsed.data, libraryIds)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe("Monday is a training day — it can't also carry an activity.")
  })
})
