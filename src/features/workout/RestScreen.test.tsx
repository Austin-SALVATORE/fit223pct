import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { seedExercises } from '@/data/seed/exercises'
import { seedProgram } from '@/data/seed/program'
import { createWorkout } from '@/domain/workout'
import { RestScreen } from './RestScreen'

/**
 * Final-seconds emphasis (docs/Design.md "Motion" — rest timer is a
 * sanctioned purpose category) lives on the ring only, never the digit —
 * the countdown text is a data-critical number and must stay a plain,
 * stable readout regardless of how close to zero it is.
 */

const exerciseById = new Map(seedExercises.map((e) => [e.id, e]))
const workout = createWorkout({
  id: 'w',
  programId: seedProgram.id,
  session: seedProgram.sessions[0],
  date: '2026-07-22',
  startedAt: '2026-07-22T09:00:00.000Z',
})
const position = { exerciseIndex: 0, setIndex: 1 }

afterEach(() => {
  vi.useRealTimers()
})

function ring() {
  return document.querySelector('circle[stroke-dasharray]')
}

describe('RestScreen final-seconds emphasis', () => {
  it('keeps the ring on the default accent with plenty of time left', () => {
    vi.useFakeTimers()
    render(
      <RestScreen
        endsAt={Date.now() + 60_000}
        totalSeconds={60}
        exerciseChanged={false}
        workout={workout}
        position={position}
        exerciseById={exerciseById}
        onDone={() => {}}
      />,
    )

    expect(ring()?.getAttribute('class')).toContain('stroke-amber')
    expect(ring()?.getAttribute('class')).not.toContain('stroke-clay')
    expect(screen.getByText('1:00')).toBeInTheDocument()
  })

  it('emphasizes the ring in the final 3 seconds without touching the digit', () => {
    vi.useFakeTimers()
    render(
      <RestScreen
        endsAt={Date.now() + 3_000}
        totalSeconds={60}
        exerciseChanged={false}
        workout={workout}
        position={position}
        exerciseById={exerciseById}
        onDone={() => {}}
      />,
    )

    expect(ring()?.getAttribute('class')).toContain('stroke-clay')
    // The digit itself carries no emphasis class — only the ring does.
    const digit = screen.getByText('0:03')
    expect(digit.className).not.toMatch(/clay|amber/)
  })
})
