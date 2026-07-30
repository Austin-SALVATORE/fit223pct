import { describe, expect, it } from 'vitest'
import { routineOverview, routinePlaylist, type Routine } from './routine'

function routine(steps: Routine['steps']): Routine {
  return { id: 'stretching', steps }
}

describe('routinePlaylist', () => {
  it('expands a per-side step into two plays, left before right', () => {
    const plays = routinePlaylist(routine([{ id: 'hamstring', holdSeconds: 30, perSide: true }]))

    expect(plays.map((play) => play.side)).toEqual(['left', 'right'])
    expect(plays.every((play) => play.stepId === 'hamstring')).toBe(true)
    expect(plays.every((play) => play.holdSeconds === 30)).toBe(true)
  })

  it('leaves a single-sided step as one play with no side', () => {
    const plays = routinePlaylist(routine([{ id: 'child-pose', holdSeconds: 45 }]))

    expect(plays).toHaveLength(1)
    expect(plays[0].side).toBeNull()
  })

  it('numbers plays across the expanded sequence, not the authored steps', () => {
    const plays = routinePlaylist(
      routine([
        { id: 'hamstring', holdSeconds: 30, perSide: true },
        { id: 'child-pose', holdSeconds: 45 },
        { id: 'quad', holdSeconds: 20, perSide: true },
      ]),
    )

    // 3 authored steps, 5 plays — "1 of 5", never "1 of 3".
    expect(plays).toHaveLength(5)
    expect(plays.map((play) => play.index)).toEqual([1, 2, 3, 4, 5])
    expect(plays.every((play) => play.total === 5)).toBe(true)
    expect(plays.map((play) => `${play.stepId}:${play.side ?? '-'}`)).toEqual([
      'hamstring:left',
      'hamstring:right',
      'child-pose:-',
      'quad:left',
      'quad:right',
    ])
  })

  it('returns an empty playlist for a routine with no steps', () => {
    expect(routinePlaylist(routine([]))).toEqual([])
  })

  it('does not mutate the routine it was given', () => {
    const input = routine([
      { id: 'hamstring', holdSeconds: 30, perSide: true },
      { id: 'child-pose', holdSeconds: 45 },
    ])
    const snapshot = structuredClone(input)

    routinePlaylist(input)

    expect(input).toEqual(snapshot)
  })

  it('carries no prose — every field is an id, a number, or a side', () => {
    // The no-tracking and no-prose properties are what keep routines out of
    // both the progression engine and the seed-field guard. A play that
    // grew a `name` or `cue` would be a locale string travelling through
    // the domain, which is the thing domain purity forbids.
    const plays = routinePlaylist(
      routine([
        { id: 'hamstring', holdSeconds: 30, perSide: true },
        { id: 'child-pose', holdSeconds: 45 },
      ]),
    )

    for (const play of plays) {
      expect(Object.keys(play).sort()).toEqual(['holdSeconds', 'index', 'side', 'stepId', 'total'])
    }
  })
})

describe('routineOverview', () => {
  it('counts authored stretches, not plays', () => {
    const input = routine([
      { id: 'hamstring', holdSeconds: 30, perSide: true },
      { id: 'child-pose', holdSeconds: 45 },
    ])

    // Two authored stretches; three plays. Reporting 3 to the user is the
    // defect this asserts against — nobody standing on a mat counts sides.
    expect(routineOverview(input, 8).stretches).toBe(2)
    expect(routinePlaylist(input)).toHaveLength(3)
  })

  it('charges one lead-in per play, so a per-side stretch pays twice', () => {
    const oneSided = routine([{ id: 'child-pose', holdSeconds: 45 }])
    const perSide = routine([{ id: 'hamstring', holdSeconds: 45, perSide: true }])

    expect(routineOverview(oneSided, 8).seconds).toBe(53)
    // Not 45 × 2 + 8: the second side gets its own repositioning time, which
    // is why the shipped routine runs longer than the coach spec's own
    // per-stretch arithmetic.
    expect(routineOverview(perSide, 8).seconds).toBe(106)
  })

  it('moves with the content — a longer hold is a longer routine, with no edit here', () => {
    const before = routineOverview(routine([{ id: 'child-pose', holdSeconds: 45 }]), 8).seconds
    const after = routineOverview(routine([{ id: 'child-pose', holdSeconds: 60 }]), 8).seconds

    expect(after - before).toBe(15)
  })

  it('is zero on both counts for an empty routine', () => {
    expect(routineOverview(routine([]), 8)).toEqual({ stretches: 0, seconds: 0 })
  })

  it('does not mutate the routine it was given', () => {
    const input = routine([{ id: 'hamstring', holdSeconds: 30, perSide: true }])
    const snapshot = structuredClone(input)

    routineOverview(input, 8)

    expect(input).toEqual(snapshot)
  })
})
