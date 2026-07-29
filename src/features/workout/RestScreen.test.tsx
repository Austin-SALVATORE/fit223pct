import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

function renderRest() {
  return render(
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
}

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

/**
 * A3 (docs/review-backlog.md): the rest-phase focus landing was a
 * `<p tabIndex={-1}>` carrying an aria-label. `role="paragraph"` prohibits
 * author naming, so assistive tech either dropped the label or read it
 * instead of the visible "Rest" — and the screen had no heading at all.
 */
describe('the rest screen names itself with a heading', () => {
  it('lands focus on a heading whose accessible name is its visible text', async () => {
    renderRest()

    const heading = await screen.findByRole('heading', { name: 'Rest' })
    await waitFor(() => expect(heading).toHaveFocus())
  })

  it('keeps the next-up context as the heading\'s description, not its name', async () => {
    renderRest()

    const heading = await screen.findByRole('heading', { name: 'Rest' })
    const describedBy = heading.getAttribute('aria-describedby') ?? ''
    const description = document.getElementById(describedBy)
    expect(description).not.toBeNull()
    // The fixture's next exercise, resolved through the seed locale keys —
    // the point is that the description carries the exercise and the set
    // position, which is what the prohibited aria-label used to say.
    expect(description).toHaveTextContent('Incline dumbbell press')
    expect(description).toHaveTextContent(/set \d of \d/)
  })
})
