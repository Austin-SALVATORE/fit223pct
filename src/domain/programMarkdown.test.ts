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

| Exercise | Sets | Range | Mode | RIR | Rest | Weights | Note |
|---|---|---|---|---|---|---|---|
| barbell-squat | 3 | 8-12 | reps | 2 | 120 | 20/40/2.5 | Goblet squat substitutes if the rack's busy |
| plank | 2 | 20-40 | seconds | 2 | 60 | -/-/- | - |

## Session: B
Name: Session B
Focus: Hinge & press

| Exercise | Sets | Range | Mode | RIR | Rest | Weights | Note | Per side |
|---|---|---|---|---|---|---|---|---|
| bulgarian-split-squat | 3 | 8-12 | reps | 2 | 120 | 8/20/2 | - | yes |
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
      targetRir: 2,
      restSeconds: 120,
      startWeightKg: 20,
      maxWeightKg: 40,
      weightStepKg: 2.5,
      note: "Goblet squat substitutes if the rack's busy",
    })
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
    const bad = validMarkdown.replace('| 8-12 | reps | 2 | 120 | 20/40/2.5 |', '| eight to twelve | reps | 2 | 120 | 20/40/2.5 |')
    const result = parseProgramMarkdown(bad)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/range/i)
      expect(result.error).toMatch(/barbell-squat|Session A|A\b/)
    }
  })

  it('rejects a table missing a required column, naming it', () => {
    const bad = validMarkdown.replace('| Exercise | Sets | Range | Mode | RIR | Rest | Weights | Note |\n|---|---|---|---|---|---|---|---|\n| barbell-squat | 3 | 8-12 | reps | 2 | 120 | 20/40/2.5 | Goblet squat substitutes if the rack\'s busy |', '| Exercise | Sets | Range | Mode | RIR | Weights | Note |\n|---|---|---|---|---|---|---|\n| barbell-squat | 3 | 8-12 | reps | 2 | 20/40/2.5 | Goblet squat substitutes if the rack\'s busy |')
    const result = parseProgramMarkdown(bad)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/rest/i)
  })

  it('rejects markdown with no session sections', () => {
    const result = parseProgramMarkdown('---\nid: x\nname: X\nphase: 1\nstartDate: 2026-01-01\nendDate:\ntrainingWeekdays: [1]\nrotation: [A]\n---\n')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/session/i)
  })
})
