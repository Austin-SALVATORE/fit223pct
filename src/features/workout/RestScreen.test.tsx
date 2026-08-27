import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { seedExercises } from '@/data/seed/exercises'
import { seedProgram } from '@/data/seed/program'
import { completeWorkout, createWorkout, logSet } from '@/domain/workout'
import type { LoggedSet, UserSettings, Workout } from '@/domain/types'
import { RestScreen } from './RestScreen'

/**
 * Final-seconds emphasis (docs/Design.md "Motion" — rest timer is a
 * sanctioned purpose category) lives on the ring only, never the digit —
 * the countdown text is a data-critical number and must stay a plain,
 * stable readout regardless of how close to zero it is.
 */

const exerciseById = new Map(seedExercises.map((e) => [e.id, e]))
const baseWorkout = createWorkout({
  id: 'w',
  programId: seedProgram.id,
  session: seedProgram.sessions[0],
  date: '2026-07-22',
  startedAt: '2026-07-22T09:00:00.000Z',
})

// 'chest-back' items, for reference:
//  0 incline-dumbbell-press  ladder [12x12, 14x10, 15x8]  3 sets, rest 120s
//  1 dumbbell-bench-press    ladder [10x12, 12x10, 15x8]  3 sets, rest 120s, teachingConcept "Independent control"
//  2 single-arm-db-row       ladder, perSide                3 sets, rest 90s
//  3 rear-delt-fly           rep-range 12-15, loaded        2 sets, teachingConcept "A fly, not a row"
//  4 dead-bug                rep-range 10-10, bodyweight, perSide, 2 sets, no teachingConcept

function set(overrides: Partial<LoggedSet> = {}): LoggedSet {
  return {
    setIndex: 0,
    reps: 12,
    weightKg: 12,
    seconds: null,
    completedAt: '2026-07-22T09:05:00.000Z',
    ...overrides,
  }
}

function withLoggedSet(workout: Workout, exerciseIndex: number, loggedSet: LoggedSet): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((e, i) =>
      i === exerciseIndex ? { ...e, sets: [...e.sets, loggedSet] } : e,
    ),
  }
}

afterEach(() => {
  vi.useRealTimers()
})

function renderRest(overrides: Partial<React.ComponentProps<typeof RestScreen>> = {}) {
  return render(
    <RestScreen
      endsAt={Date.now() + 60_000}
      totalSeconds={60}
      exerciseChanged={false}
      workout={baseWorkout}
      position={{ exerciseIndex: 0, setIndex: 1 }}
      exerciseById={exerciseById}
      completed={[]}
      settings={undefined}
      onDone={() => {}}
      {...overrides}
    />,
  )
}

function ring() {
  return document.querySelector('circle[stroke-dasharray]')
}

describe('RestScreen final-seconds emphasis', () => {
  it('keeps the ring on the default accent with plenty of time left', () => {
    vi.useFakeTimers()
    renderRest({ endsAt: Date.now() + 60_000, totalSeconds: 60 })

    expect(ring()?.getAttribute('class')).toContain('stroke-amber')
    expect(ring()?.getAttribute('class')).not.toContain('stroke-clay')
    expect(screen.getByText('1:00')).toBeInTheDocument()
  })

  it('emphasizes the ring in the final 3 seconds without touching the digit', () => {
    vi.useFakeTimers()
    renderRest({ endsAt: Date.now() + 3_000, totalSeconds: 60 })

    expect(ring()?.getAttribute('class')).toContain('stroke-clay')
    // The digit itself carries no emphasis class — only the ring does.
    const digit = screen.getByText('0:03')
    expect(digit.className).not.toMatch(/clay|amber/)
  })
})

describe('the rest timer is the md size, not the routine player\'s lg', () => {
  it('renders 36px digits, not the 48px routine-player size', () => {
    vi.useFakeTimers()
    renderRest({ endsAt: Date.now() + 60_000, totalSeconds: 60 })

    const digit = screen.getByText('1:00')
    expect(digit.className).toContain('text-4xl')
    expect(digit.className).not.toContain('text-5xl')
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

  it('keeps the identity+numbers card as the heading\'s description, not its name', async () => {
    renderRest()

    const heading = await screen.findByRole('heading', { name: 'Rest' })
    const describedBy = heading.getAttribute('aria-describedby') ?? ''
    const description = document.getElementById(describedBy)
    expect(description).not.toBeNull()
    expect(description).toHaveTextContent('Incline dumbbell press')
    expect(description).toHaveTextContent('14 kg')
    // No aria-live anywhere in the described block — backlog A10's class of
    // defect, on the screen that already learned it once.
    expect(description?.querySelector('[aria-live]')).toBeNull()
  })

  it("excludes the coaching concept from the description, even expanded — mounting must not recite a 302-character paragraph", async () => {
    // dumbbell-bench-press (index 1) carries a teachingConcept, so this is
    // the case that would leak if the concept card were nested inside the
    // described block instead of rendered as its sibling. Collapsed by
    // default hides the body regardless of nesting, so this expands it
    // first — the only way to actually exercise the exclusion.
    renderRest({ exerciseChanged: true, position: { exerciseIndex: 1, setIndex: 0 } })
    fireEvent.click(await screen.findByRole('button', { name: 'Independent control' }))
    await screen.findByText(/Two dumbbells can drift apart/)

    const heading = screen.getByRole('heading', { name: 'Rest' })
    const describedBy = heading.getAttribute('aria-describedby') ?? ''
    const description = document.getElementById(describedBy)
    expect(description).not.toBeNull()
    expect(description).toHaveTextContent('Dumbbell bench press')
    // The concept's title is fine (it's the disclosure trigger's own text,
    // outside the described block) — the *body* must never be reachable
    // from here, mounted or not.
    expect(description).not.toHaveTextContent('Two dumbbells can drift apart')
  })
})

describe('next set, same exercise — the compact card', () => {
  it('renders the rung as the hero number, with no illustration', async () => {
    renderRest()

    expect(await screen.findByText(/Next set/)).toBeInTheDocument()
    expect(screen.getByText('Incline dumbbell press')).toBeInTheDocument()
    expect(screen.getByText('14 kg × 10')).toBeInTheDocument()
    // The next-up card renders no <img> when the same exercise continues —
    // the identity cue is only needed for a movement the user isn't already
    // mid-way through.
    expect(document.querySelectorAll('img')).toHaveLength(0)
  })

  it('shows no delta when nothing has been logged this session', () => {
    renderRest()
    expect(screen.queryByText(/heavier than|lighter than/)).toBeNull()
  })

  it('shows the delta, directionally, against the set just logged', () => {
    const workout = withLoggedSet(baseWorkout, 0, set({ setIndex: 0, weightKg: 12, reps: 12 }))
    renderRest({ workout })

    // Rung 2 is 14kg — 2kg heavier than the 12kg just logged.
    expect(screen.getByText('↑ 2 kg heavier than the set you just did')).toBeInTheDocument()
  })
})

describe('the counter is session-aware (coach spec §4)', () => {
  function withExercise(workout: Workout, exerciseIndex: number, patch: Partial<Workout['exercises'][number]>): Workout {
    return {
      ...workout,
      exercises: workout.exercises.map((e, i) => (i === exerciseIndex ? { ...e, ...patch } : e)),
    }
  }

  it('a skipped level is never counted', () => {
    // Level 0 skipped — the ladder's own 3-rung total (prescription.sets)
    // would wrongly still say "of 3"; plannedSetIndices says "of 2".
    const workout = withExercise(baseWorkout, 0, { skippedLevels: [0] })
    renderRest({ workout, position: { exerciseIndex: 0, setIndex: 1 } })

    expect(screen.getByText('Next set · 1 of 2')).toBeInTheDocument()
  })

  it('an opened custom slot is counted, and being on it can be the last set', () => {
    const workout = withExercise(baseWorkout, 0, { customSlots: 1 })
    renderRest({ workout, position: { exerciseIndex: 0, setIndex: 3 } })

    expect(screen.getByText('Next set · 4 of 4')).toBeInTheDocument()
  })
})

describe('next exercise — the full card', () => {
  it('renders identity, meta and the hero number, and no delta', async () => {
    renderRest({ exerciseChanged: true, position: { exerciseIndex: 1, setIndex: 0 } })

    expect(await screen.findByText('Next up')).toBeInTheDocument()
    expect(screen.getByText('Dumbbell bench press')).toBeInTheDocument()
    expect(screen.getByText('3 sets · rest 120s')).toBeInTheDocument()
    expect(screen.getByText('10 kg × 12')).toBeInTheDocument()
    expect(screen.queryByText(/heavier than|lighter than/)).toBeNull()
    // alt="" and out of the tab order — the name already carries the
    // identity, matching the set screen's illustration band.
    const img = document.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('alt')).toBe('')
  })

  it('shows the each-side chip for a perSide prescription', async () => {
    renderRest({ exerciseChanged: true, position: { exerciseIndex: 2, setIndex: 0 } })

    expect(await screen.findByText('Single-arm dumbbell row')).toBeInTheDocument()
    expect(screen.getByText(/each side/)).toBeInTheDocument()
  })

  it('renders reps alone, never "× 10" with nothing before it, for unloaded work', async () => {
    renderRest({ exerciseChanged: true, position: { exerciseIndex: 4, setIndex: 0 } })

    expect(await screen.findByText('Dead bug')).toBeInTheDocument()
    expect(screen.getByText('10 reps')).toBeInTheDocument()
    expect(screen.queryByText(/×/)).toBeNull()
  })
})

describe('the concept disclosure', () => {
  it('is collapsed by default and expands on click, wired by aria-expanded/aria-controls', async () => {
    renderRest({ exerciseChanged: true, position: { exerciseIndex: 1, setIndex: 0 } })

    const trigger = await screen.findByRole('button', { name: 'Independent control' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    const bodyId = trigger.getAttribute('aria-controls')
    expect(bodyId).toBeTruthy()
    expect(document.getElementById(bodyId ?? '')).toBeNull()

    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const body = document.getElementById(bodyId ?? '')
    expect(body).not.toBeNull()
    expect(body).toHaveTextContent('Two dumbbells can drift apart')
  })

  it('never promotes the concept title to a heading — A9', async () => {
    renderRest({ exerciseChanged: true, position: { exerciseIndex: 1, setIndex: 0 } })

    await screen.findByRole('button', { name: 'Independent control' })
    expect(screen.queryByRole('heading', { name: 'Independent control' })).toBeNull()
  })

  it('falls back to the cue line when no concept is authored, with no disclosure', async () => {
    renderRest({ exerciseChanged: true, position: { exerciseIndex: 4, setIndex: 0 } })

    expect(await screen.findByText('Dead bug')).toBeInTheDocument()
    expect(screen.getByText(/Keep your ribs and pelvis controlled as you move/)).toBeInTheDocument()
    // Only +30s and Skip remain — no disclosure trigger.
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['+30s', 'Skip'])
  })
})

describe('the last-set state', () => {
  it('labels the final set, states what happens next, and shows no delta', async () => {
    // dead-bug (index 4) is the last exercise, 2 sets — setIndex 1 is its last.
    renderRest({
      exerciseChanged: false,
      position: { exerciseIndex: 4, setIndex: 1 },
    })

    expect(await screen.findByText(/Last set/)).toBeInTheDocument()
    expect(screen.getByText('Then the session is done.')).toBeInTheDocument()
    expect(screen.queryByText(/heavier than|lighter than/)).toBeNull()
  })

  it('takes priority over the next-exercise layout when both are true', async () => {
    // A single-set-remaining final exercise reached by a swap would be both
    // "new" and "last" at once — last-set must win, per the design spec.
    renderRest({
      exerciseChanged: true,
      position: { exerciseIndex: 4, setIndex: 1 },
    })

    expect(await screen.findByText(/Last set/)).toBeInTheDocument()
    expect(screen.queryByText('Next up')).toBeNull()
  })

  it('recognises a custom slot on the last exercise as the true last set — prescription.sets alone would miss it', () => {
    // dead-bug's prescription.sets is 2, so the old "setIndex === sets - 1"
    // check would say index 2 (the opened custom slot) is NOT last. It is:
    // planned = [0, 1, 2], and nothing follows it.
    const workout: Workout = {
      ...baseWorkout,
      exercises: baseWorkout.exercises.map((e, i) => (i === 4 ? { ...e, customSlots: 1 } : e)),
    }
    renderRest({ workout, position: { exerciseIndex: 4, setIndex: 2 } })

    expect(screen.getByText(/Last set/)).toBeInTheDocument()
    expect(screen.getByText('Then the session is done.')).toBeInTheDocument()
  })
})

describe('touch targets and structure', () => {
  it('keeps the rest controls at the 44px floor', () => {
    renderRest()
    const plusThirty = screen.getByRole('button', { name: '+30s' })
    expect(plusThirty.className).toContain('min-h-11')
  })

  it('scopes the +30s and Skip buttons to their own row, unaffected by the card redesign', () => {
    renderRest()
    const row = screen.getByRole('button', { name: '+30s' }).parentElement
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).getByRole('button', { name: 'Skip' })).toBeInTheDocument()
  })
})

/**
 * Equipment-aware progression, Phase 1 (`~/.claude/plans/
 * equipment-aware-progression.md`, AMENDMENT A) — surfaces 3 and 4 of
 * QA's four, the rest-screen hero number and its delta chip both read
 * from the same `target` this screen resolves at `:72`. rear-delt-fly
 * (the real seed's own chest-back item 3) starts at 5 kg, steps by 2 —
 * topped out last time, ungated arithmetic would offer 7.
 */
function confirmedSettings(): UserSettings {
  return {
    id: 'user',
    name: 'Test',
    weeklyGoal: 3,
    lastSeenWeeklyReviewWeekStart: null,
    equipment: { confirmedAt: '2026-08-01' },
  }
}

describe('the rest-screen hero number is gated on a verified equipment profile', () => {
  function toppedOutPrior(): Workout {
    let prior = createWorkout({
      id: 'prior-rear-delt-fly',
      programId: seedProgram.id,
      session: seedProgram.sessions[0],
      date: '2026-07-18',
      startedAt: '2026-07-18T09:00:00.000Z',
    })
    prior = logSet(prior, 3, { weightKg: 5, reps: 15, seconds: null, completedAt: '2026-07-18T09:05:00.000Z' }, 0)
    prior = logSet(prior, 3, { weightKg: 5, reps: 15, seconds: null, completedAt: '2026-07-18T09:07:00.000Z' }, 1)
    return completeWorkout(prior, '2026-07-18T09:40:00.000Z')
  }

  it('offers the coach\'s own 5 kg, never the computed 7, while equipment is unverified', () => {
    renderRest({
      workout: baseWorkout,
      position: { exerciseIndex: 3, setIndex: 0 },
      completed: [toppedOutPrior()],
      settings: undefined,
    })

    expect(screen.getByText(/5 kg × 12/)).toBeInTheDocument()
    expect(screen.queryByText(/7 kg × 12/)).toBeNull()
  })

  it('offers the computed 7 once the equipment profile is confirmed — the rule still holds when the gate is open', () => {
    renderRest({
      workout: baseWorkout,
      position: { exerciseIndex: 3, setIndex: 0 },
      completed: [toppedOutPrior()],
      settings: confirmedSettings(),
    })

    expect(screen.getByText(/7 kg × 12/)).toBeInTheDocument()
  })
})
