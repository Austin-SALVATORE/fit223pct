import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from '@/i18n/i18next'
import { Stepper } from './Stepper'

/**
 * Direct numeric entry. Owner-reported: reaching 82.5 from a 70 default at
 * `step={0.1}` is ~125 taps, so the buttons alone were not a way to enter a
 * number anyone had in mind.
 *
 * The failure modes here are quiet rather than loud, which is why each has its
 * own test: a per-keystroke clamp makes the field unusable while looking
 * correct, a comma decimal fails only in French, and a coerced `0` in a weight
 * field is a data bug rather than a visible one.
 */

afterEach(async () => {
  await i18n.changeLanguage('en')
})

function renderStepper(overrides: Partial<Parameters<typeof Stepper>[0]> = {}) {
  const onChange = vi.fn()
  render(
    <Stepper
      label="Weight"
      value={70}
      step={0.1}
      min={20}
      unit="kg"
      onChange={onChange}
      {...overrides}
    />,
  )
  return { onChange }
}

async function startTyping(label = 'Weight') {
  await userEvent.click(screen.getByRole('button', { name: `Edit ${label}` }))
  return screen.getByRole('textbox', { name: label })
}

describe('typing a value', () => {
  it('commits a typed value on Enter', async () => {
    const { onChange } = renderStepper()

    const input = await startTyping()
    await userEvent.clear(input)
    await userEvent.type(input, '82.5{Enter}')

    expect(onChange).toHaveBeenCalledWith(82.5)
  })

  it('commits on blur as well as Enter', async () => {
    const { onChange } = renderStepper()

    const input = await startTyping()
    await userEvent.clear(input)
    await userEvent.type(input, '84')
    await userEvent.tab()

    expect(onChange).toHaveBeenCalledWith(84)
  })

  it('does NOT clamp mid-typing, so a value above the min is reachable', async () => {
    // The trap: height has min=120. Clamping per keystroke rewrites the "1" of
    // "180" to "120" before the user reaches the "8", and 180 becomes
    // unreachable by typing. The intermediate "1" must survive untouched.
    const { onChange } = renderStepper({ label: 'Height', value: 170, step: 1, min: 120, unit: 'cm' })

    const input = await startTyping('Height')
    await userEvent.clear(input)
    await userEvent.type(input, '1')
    expect(input).toHaveValue('1')
    expect(onChange).not.toHaveBeenCalled()

    await userEvent.type(input, '80')
    expect(input).toHaveValue('180')

    await userEvent.type(input, '{Enter}')
    expect(onChange).toHaveBeenCalledWith(180)
  })

  it('clamps to the bounds on commit, not before', async () => {
    const { onChange } = renderStepper({ min: 20, max: 200 })

    const input = await startTyping()
    await userEvent.clear(input)
    await userEvent.type(input, '5{Enter}')

    expect(onChange).toHaveBeenCalledWith(20)
  })
})

describe('invalid input reverts and never coerces', () => {
  it.each([
    ['empty', ''],
    ['a lone minus', '-'],
    ['letters', 'abc'],
    ['a lone decimal point', '.'],
  ])('restores the previous value for %s', async (_label, typed) => {
    const { onChange } = renderStepper()

    const input = await startTyping()
    await userEvent.clear(input)
    if (typed) await userEvent.type(input, typed)
    await userEvent.tab()

    // Never NaN, never 0 — a silent zero in a weight field is a data bug.
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Weight')).toHaveTextContent('70')
  })

  it('cancels on Escape without writing', async () => {
    const { onChange } = renderStepper()

    const input = await startTyping()
    await userEvent.clear(input)
    await userEvent.type(input, '99{Escape}')

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Weight')).toHaveTextContent('70')
  })

  it('writes nothing when the field is opened and left untouched', async () => {
    // Guards the body-fat invariant from one layer down: revealing a control
    // and focusing it is not entering a reading.
    const { onChange } = renderStepper({ label: 'Body fat', value: 20, step: 0.5, min: 3, unit: '%' })

    await startTyping('Body fat')
    await userEvent.tab()

    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('the decimal separator follows the user, not the code', () => {
  it('accepts a comma decimal, which is what a French keypad produces', async () => {
    // `type="number"` would reject the comma outright and yield an empty
    // value, so a French user's weight would silently fail to save. This fails
    // only in fr, which is why it is asserted in fr.
    await i18n.changeLanguage('fr')
    const { onChange } = renderStepper()

    await userEvent.click(screen.getByRole('button', { name: 'Modifier Weight' }))
    const input = screen.getByRole('textbox', { name: 'Weight' })
    await userEvent.clear(input)
    await userEvent.type(input, '82,5{Enter}')

    expect(onChange).toHaveBeenCalledWith(82.5)
  })

  it('accepts a dot decimal too, in the same locale', async () => {
    await i18n.changeLanguage('fr')
    const { onChange } = renderStepper()

    await userEvent.click(screen.getByRole('button', { name: 'Modifier Weight' }))
    const input = screen.getByRole('textbox', { name: 'Weight' })
    await userEvent.clear(input)
    await userEvent.type(input, '82.5{Enter}')

    expect(onChange).toHaveBeenCalledWith(82.5)
  })
})

describe('the keypad defaults to decimal and only integral fields opt out', () => {
  it('asks for a decimal keypad where the step is fractional', async () => {
    renderStepper({ step: 0.1 })
    expect(await startTyping()).toHaveAttribute('inputmode', 'decimal')
  })

  it('still asks for decimal when the step is whole but the value is not', async () => {
    // The regression this rule was inverted for. Workout Mode's weight uses
    // `weightStepKg ?? 1`; under the old step-driven rule that produced a
    // numeric keypad with no decimal point, and 82.5 became untypeable in the
    // one place logging 82.5 mid-set matters most.
    renderStepper({ step: 1 })
    expect(await startTyping()).toHaveAttribute('inputmode', 'decimal')
  })

  it('asks for a numeric keypad only when the field is declared integral', async () => {
    renderStepper({ label: 'Reps', value: 10, step: 1, min: 1, integer: true })
    expect(await startTyping('Reps')).toHaveAttribute('inputmode', 'numeric')
  })

  it('carries the iOS width defences from the start', async () => {
    // Same class of bug as the date input, pre-empted rather than waited for.
    const input = await (renderStepper(), startTyping())
    for (const cls of ['appearance-none', 'min-w-0', 'box-border']) {
      expect(input.className).toContain(cls)
    }
  })
})

describe('the buttons and the announcement still work', () => {
  it('leaves the increment and decrement buttons untouched', async () => {
    const { onChange } = renderStepper()

    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(onChange).toHaveBeenCalledWith(70.1)

    await userEvent.click(screen.getByRole('button', { name: 'Decrease Weight' }))
    expect(onChange).toHaveBeenCalledWith(69.9)
  })

  it('keeps the value in a live region so button changes are announced', () => {
    renderStepper()
    // <output> is role=status. Losing it would make the buttons silent to a
    // screen reader, which typing must not cost.
    expect(screen.getByLabelText('Weight').tagName).toBe('OUTPUT')
    expect(screen.getByRole('status', { name: 'Weight' })).toBeInTheDocument()
  })

  it('gives the edit affordance and the value separate names', async () => {
    // Two accessible names in one control is the trap: the edit button is
    // named for the action, the output for the value, and only one of them is
    // the control being described at any time.
    renderStepper()
    expect(screen.getByRole('button', { name: 'Edit Weight' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Weight' })).toBeInTheDocument()

    const input = await startTyping()
    expect(input).toHaveAccessibleName('Weight')
    expect(screen.queryByRole('status')).toBeNull()
  })
})

describe('holding a button accelerates, without losing fine control', () => {
  /**
   * Time-based, so asserted on fake timers with the interval measured rather
   * than inferred. The naive version of this test — "holding changes the
   * value" — passes with no acceleration whatsoever, which is why every
   * assertion below is a *rate* over a window rather than a total.
   *
   * Base rate is 140ms; the ramp starts after 8 ticks and floors at 60ms.
   */
  const BASE_MS = 140
  const RAMP_AFTER = 8
  const FLOOR_MS = 60

  function press(name: string) {
    fireEvent.pointerDown(screen.getByRole('button', { name }), { pointerId: 1 })
  }
  function release(name: string) {
    fireEvent.pointerUp(screen.getByRole('button', { name }), { pointerId: 1 })
  }
  /** Calls made while the clock advances by `ms`. */
  function callsDuring(onChange: ReturnType<typeof vi.fn>, ms: number) {
    const before = onChange.mock.calls.length
    act(() => {
      vi.advanceTimersByTime(ms)
    })
    return onChange.mock.calls.length - before
  }

  it('holds the base rate first, so a short press is unchanged', () => {
    vi.useFakeTimers()
    try {
      const { onChange } = renderStepper()
      press('Increase Weight')
      // The immediate apply on press.
      expect(onChange).toHaveBeenCalledTimes(1)

      // Across the pre-ramp window the rate is exactly the old one.
      const ticks = callsDuring(onChange, BASE_MS * RAMP_AFTER)
      expect(ticks).toBe(RAMP_AFTER)
      release('Increase Weight')
    } finally {
      vi.useRealTimers()
    }
  })

  it('shortens the interval under a sustained hold', () => {
    vi.useFakeTimers()
    try {
      const { onChange } = renderStepper()
      press('Increase Weight')
      // Through the base window and the whole ramp.
      callsDuring(onChange, BASE_MS * RAMP_AFTER + 1000)

      // Now at the floor: a 600ms window yields 600/60 = 10 ticks, where the
      // un-accelerated control would manage 600/140 ≈ 4. This is the
      // assertion that fails if the ramp is removed.
      const atSpeed = callsDuring(onChange, 600)
      expect(atSpeed).toBeGreaterThanOrEqual(600 / FLOOR_MS - 1)
      expect(atSpeed).toBeGreaterThan(600 / BASE_MS + 2)
      release('Increase Weight')
    } finally {
      vi.useRealTimers()
    }
  })

  it('never exceeds the landability floor', () => {
    vi.useFakeTimers()
    try {
      const { onChange } = renderStepper()
      press('Increase Weight')
      callsDuring(onChange, 5000)

      // Held far past the ramp, the rate is capped rather than climbing.
      const atSpeed = callsDuring(onChange, 600)
      expect(atSpeed).toBeLessThanOrEqual(600 / FLOOR_MS)
      release('Increase Weight')
    } finally {
      vi.useRealTimers()
    }
  })

  it('resets to the base rate on release, so the next press starts slow', () => {
    vi.useFakeTimers()
    try {
      const { onChange } = renderStepper()
      press('Increase Weight')
      callsDuring(onChange, BASE_MS * RAMP_AFTER + 2000)
      release('Increase Weight')

      // Second press: the first window must be the base rate again, not a
      // resumption of top speed.
      onChange.mockClear()
      press('Increase Weight')
      const ticks = callsDuring(onChange, BASE_MS * RAMP_AFTER)
      // 1 immediate + RAMP_AFTER ticks; top speed would be ~18.
      expect(ticks).toBe(RAMP_AFTER)
      release('Increase Weight')
    } finally {
      vi.useRealTimers()
    }
  })

  it('stops immediately on release', () => {
    vi.useFakeTimers()
    try {
      const { onChange } = renderStepper()
      press('Increase Weight')
      callsDuring(onChange, 2000)
      release('Increase Weight')

      expect(callsDuring(onChange, 2000)).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('still clamps at the bound while held', () => {
    vi.useFakeTimers()
    try {
      const { onChange } = renderStepper({ value: 199.9, step: 0.1, min: 20, max: 200 })
      press('Increase Weight')
      callsDuring(onChange, 5000)
      release('Increase Weight')

      // apply() only fires onChange when the value actually moves, so a held
      // button at the ceiling stops calling rather than pushing past it.
      for (const call of onChange.mock.calls) expect(call[0]).toBeLessThanOrEqual(200)
    } finally {
      vi.useRealTimers()
    }
  })
})
