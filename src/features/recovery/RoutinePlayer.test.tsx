import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import i18n from '@/i18n/i18next'
import type { Routine } from '@/domain/routine'
import { RoutinePlayer } from './RoutinePlayer'

/**
 * The player's behaviour and its accessibility, which are the same subject
 * here: a timed, auto-advancing sequence is exactly the shape that strands a
 * screen-reader user, so the announcement budget (one utterance per play,
 * zero per tick) is a design constraint rather than a polish item.
 */

const ROUTINE: Routine = {
  id: 'test-stretching',
  steps: [
    { id: 'test-hamstring', holdSeconds: 30, perSide: true },
    { id: 'test-child-pose', holdSeconds: 20 },
  ],
}

vi.mock('@/data/seed/routines', async () => {
  const actual = await vi.importActual<typeof import('@/data/seed/routines')>(
    '@/data/seed/routines',
  )
  return {
    ...actual,
    get seedRoutines() {
      return [ROUTINE]
    },
    routineById: (id: string) => (id === 'test-stretching' ? ROUTINE : undefined),
  }
})

/** Mirrors RoutinePlayer's constant — coach ruling A. */
const LEAD_IN_SECONDS = 8

beforeAll(() => {
  i18n.addResourceBundle(
    'en',
    'seed',
    {
      routine: {
        'test-stretching': { name: 'Recovery stretch' },
      },
      routineStep: {
        'test-hamstring': { name: 'Hamstring stretch', cue: 'Keep the back leg straight.' },
        'test-child-pose': { name: 'Child pose' },
      },
    },
    true,
    true,
  )
})

afterEach(() => {
  vi.useRealTimers()
})

function renderPlayer(routineId = 'test-stretching') {
  return render(
    <MemoryRouter initialEntries={[`/routine/${routineId}`]}>
      <Routes>
        <Route path="/" element={<p>TODAY PROBE</p>} />
        <Route path="/routine/:routineId" element={<RoutinePlayer />} />
      </Routes>
    </MemoryRouter>,
  )
}

/**
 * Gets past the ready screen.
 *
 * `fireEvent` rather than `userEvent`: half these tests run on fake timers,
 * and userEvent's own delays then have to be threaded through
 * `advanceTimers` on every call site for what is a plain button click. The
 * ready screen's *own* interaction tests use userEvent, so the realistic
 * pointer path is still covered.
 */
async function start() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  })
}

/** Renders and starts, for the tests that are about the routine, not the gate. */
async function renderPlaying(routineId = 'test-stretching') {
  const result = renderPlayer(routineId)
  await screen.findByRole('button', { name: 'Start' })
  await start()
  return result
}

/**
 * `shouldAdvanceTime` matters: plain fake timers also freeze the clock that
 * testing-library's waitFor/findBy poll on, so every async query times out
 * even when the DOM is already correct.
 */
function useControlledClock() {
  vi.useFakeTimers({ shouldAdvanceTime: true })
}

/** Advances the fake clock by `seconds`, flushing React work each tick. */
async function tick(seconds: number) {
  for (let i = 0; i < seconds; i += 1) {
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
  }
}

/** AnimatePresence's exit runs before the next play mounts — it needs room. */
const AFTER_ADVANCE = { timeout: 3000 }

describe('the ready screen', () => {
  it('opens on a preview, not a running routine', async () => {
    renderPlayer()

    expect(await screen.findByRole('heading', { name: 'Recovery stretch' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
    // Nothing about the routine is under way: no lead-in copy, no stretch.
    expect(screen.queryByText('Get into position')).toBeNull()
    expect(screen.queryByRole('heading', { name: /Hamstring stretch/ })).toBeNull()
  })

  it('does not start the routine as time passes', async () => {
    // The regression test for the reported defect: the owner tapped a stretch
    // and the eight-second lead-in was already burning with the phone still
    // in their hand. Without this, the gate can be removed — or an effect can
    // start the interval early again — and every other test still passes,
    // because they all click Start first.
    useControlledClock()
    renderPlayer()
    await act(async () => {})

    await tick(LEAD_IN_SECONDS + 60)

    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
    expect(screen.queryByText('Get into position')).toBeNull()
    expect(screen.queryByRole('heading', { name: /Hamstring stretch/ })).toBeNull()
  })

  it('previews the count and duration, derived rather than written down', async () => {
    renderPlayer()
    await screen.findByRole('heading', { name: 'Recovery stretch' })

    // Two authored stretches, three plays — the number shown is the one a
    // person recognises, not the number of screens the player will show.
    // Duration is 3 lead-ins (24 s) + 30 + 30 + 20 = 104 s, so "about 2 min".
    expect(screen.getByText('2 stretches · about 2 min')).toBeInTheDocument()
    expect(screen.queryByText(/3 stretches/)).toBeNull()
  })

  it('names the first stretch, so the decision is informed', async () => {
    renderPlayer()
    await screen.findByRole('heading', { name: 'Recovery stretch' })

    expect(screen.getByText('First up: Hamstring stretch')).toBeInTheDocument()
  })

  it('takes focus on the heading and offers Start as a real button', async () => {
    renderPlayer()

    const heading = await screen.findByRole('heading', { name: 'Recovery stretch' })
    await waitFor(() => expect(heading).toHaveFocus())
    // A real button, not a styled div or a link: Enter and Space have to work,
    // and the rest of the player's controls set that expectation.
    expect(screen.getByRole('button', { name: 'Start' }).tagName).toBe('BUTTON')
  })

  it('leaves from the ready screen exactly as it does mid-routine', async () => {
    renderPlayer()
    await screen.findByRole('heading', { name: 'Recovery stretch' })

    await userEvent.click(screen.getByRole('link', { name: /^Leave this routine/ }))

    expect(await screen.findByText('TODAY PROBE')).toBeInTheDocument()
  })

  it('hands play one a full lead-in, however long the decision took', async () => {
    useControlledClock()
    renderPlayer()
    await act(async () => {})

    // Twenty seconds of deliberation — more than the whole lead-in.
    await tick(20)
    await start()

    expect(screen.getByText('Get into position')).toBeInTheDocument()
    // The gate does not consume the lead-in: coach ruling A is physical
    // transition time and is owed in full from the moment Start is pressed.
    expect(screen.getByText('0:08')).toBeInTheDocument()
    await tick(LEAD_IN_SECONDS - 1)
    expect(screen.getByText('Get into position')).toBeInTheDocument()
  })
})

describe('the routine player', () => {
  it('opens on the first play, naming the step and its side', async () => {
    await renderPlaying()

    expect(
      await screen.findByRole('heading', { name: 'Hamstring stretch — left side' }),
    ).toBeInTheDocument()
    expect(screen.getByText('1 of 3')).toBeInTheDocument()
  })

  it('leads in before the hold, and does not start the hold timer during it', async () => {
    useControlledClock()
    await renderPlaying()

    expect(screen.getByText('Get into position')).toBeInTheDocument()

    // Still in the lead-in one second in — the hold has not begun.
    await tick(1)
    expect(screen.getByText('Get into position')).toBeInTheDocument()

    await tick(LEAD_IN_SECONDS)
    await waitFor(() => expect(screen.queryByText('Get into position')).toBeNull())
    // Still the same play: the lead-in ended, it did not advance.
    expect(screen.getByRole('heading', { name: 'Hamstring stretch — left side' })).toBeInTheDocument()
  })

  it('auto-advances exactly one play when the hold reaches zero', async () => {
    useControlledClock()
    await renderPlaying()

    await tick(LEAD_IN_SECONDS + 30 + 1)

    // The position line lives in the header, outside AnimatePresence, so it
    // updates immediately and can be asserted without waiting on the exit.
    //
    // "Exactly one" is the assertion that matters: the finished play stays
    // mounted through its exit animation with its timer still running, so an
    // unguarded advance fires again on the very next tick and the routine
    // silently skips a stretch. This caught that.
    expect(screen.getByText('2 of 3')).toBeInTheDocument()

    await tick(2)
    expect(screen.getByText('2 of 3')).toBeInTheDocument()
  })

  it('moves focus to the new play heading when it advances', async () => {
    // Real timers throughout: switching implementations mid-test leaves the
    // player's interval uncleared, which then leaks into the next test.
    // Next is the same advance path auto-advance uses.
    await renderPlaying()
    await screen.findByRole('heading', { name: 'Hamstring stretch — left side' })

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Re-queried, never captured: the advance replaces this subtree.
    await waitFor(
      () =>
        expect(
          screen.getByRole('heading', { name: 'Hamstring stretch — right side' }),
        ).toHaveFocus(),
      AFTER_ADVANCE,
    )
    expect(document.body).not.toHaveFocus()
  })

  it('exposes the cue as the heading\'s description, not a live region', async () => {
    await renderPlaying()

    const heading = await screen.findByRole('heading', { name: 'Hamstring stretch — left side' })
    const cueId = heading.getAttribute('aria-describedby') ?? ''
    expect(document.getElementById(cueId)).toHaveTextContent('Keep the back leg straight.')
  })

  it('keeps the countdown digits out of the announcement budget', async () => {
    await renderPlaying()
    await screen.findByRole('heading', { name: /Hamstring stretch/ })

    // The A10 defence: an implicit live region ticking once a second is a
    // slower version of Stepper announcing ~7 times a second.
    const timer = document.querySelector('time')
    expect(timer).not.toBeNull()
    expect(timer?.getAttribute('aria-live')).toBe('off')
  })

  it('pauses as a toggle with a stable name, and stops the countdown', async () => {
    useControlledClock()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await renderPlaying()

    const pause = screen.getByRole('button', { name: 'Pause' })
    expect(pause).toHaveAttribute('aria-pressed', 'false')

    await user.click(pause)
    expect(screen.getByRole('button', { name: 'Pause' })).toHaveAttribute('aria-pressed', 'true')

    // Auto-advance must not fire while paused: well past the whole first play.
    await tick(LEAD_IN_SECONDS + 40)
    expect(
      screen.getByRole('heading', { name: 'Hamstring stretch — left side' }),
    ).toBeInTheDocument()
  })

  it('moves one play at a time with Next and Back, clamping at the start', async () => {
    await renderPlaying()
    await screen.findByRole('heading', { name: 'Hamstring stretch — left side' })

    // Back is present but inert on the first play — it clamps, never wraps.
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(
      await screen.findByRole('heading', { name: 'Hamstring stretch — right side' }, AFTER_ADVANCE),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(
      await screen.findByRole('heading', { name: 'Hamstring stretch — left side' }, AFTER_ADVANCE),
    ).toBeInTheDocument()
  })

  it('says what happens next, before it happens', async () => {
    await renderPlaying()
    await screen.findByRole('heading', { name: 'Hamstring stretch — left side' })
    expect(screen.getByText('Next: Hamstring stretch')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByRole('heading', { name: /right side/ }, AFTER_ADVANCE)
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('Last one', undefined, AFTER_ADVANCE)).toBeInTheDocument()
  })

  it('leaves with a single tap and no confirm step', async () => {
    await renderPlaying()
    await screen.findByRole('heading', { name: /Hamstring stretch/ })

    // A confirm here would assert that leaving costs you something, which is
    // the no-tracking ruling eroding as UI rather than as data.
    await userEvent.click(screen.getByRole('link', { name: /^Leave this routine/ }))

    expect(await screen.findByText('TODAY PROBE')).toBeInTheDocument()
  })

  it('ends with no count, no duration, no number of any kind', async () => {
    await renderPlaying()
    await screen.findByRole('heading', { name: /Hamstring stretch/ })

    for (let i = 0; i < 3; i += 1) {
      await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    }

    const heading = await screen.findByRole('heading', { name: 'Done.' }, AFTER_ADVANCE)
    // Blunt on purpose. No guard can catch a tracking *affordance* — an end
    // screen reading "12 stretches, 9 minutes" writes nothing and imports
    // nothing, so both no-tracking guards pass while it is exactly what the
    // owner ruled out. The only mechanical defence is refusing digits.
    //
    // The ready screen shows those same two numbers and is deliberately
    // outside this subtree: a preview informs a decision you have not made,
    // where the identical numbers afterwards would be a report on what you
    // did. Scoping to the end screen is what keeps the assertion this blunt —
    // it never needed loosening to let the preview in.
    const endScreen = heading.closest('div')
    expect(endScreen?.textContent ?? '').not.toMatch(/\d/)
  })

  it('holds the screen awake only once the routine is actually running', async () => {
    // The ready screen is a decision moment, so someone who opens it and
    // walks away must not be pinning the display on. Asserted at the player
    // level rather than the hook's: useWakeLock.test.tsx proves the hook is
    // correct given `active`, and `active` is what this fix changed.
    const requests: string[] = []
    Object.defineProperty(navigator, 'wakeLock', {
      value: {
        request: (type: string) => {
          requests.push(type)
          return Promise.resolve({ released: false, release: () => Promise.resolve() })
        },
      },
      configurable: true,
      writable: true,
    })

    renderPlayer()
    await screen.findByRole('heading', { name: 'Recovery stretch' })
    await waitFor(() => expect(requests).toEqual([]))

    await start()
    await waitFor(() => expect(requests).toEqual(['screen']))
  })

  it('degrades to plain text for an unknown routine, never a dead end', async () => {
    renderPlayer('no-such-routine')

    expect(await screen.findByText("That routine isn't available.")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Today' })).toBeInTheDocument()
  })
})
