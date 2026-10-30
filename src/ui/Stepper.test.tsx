import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from '@/i18n/i18next'
import { Stepper, formatNumber } from './Stepper'
import { valueEm } from './stepperFit'

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

  it('keeps a live region for the value, so button changes are announced', () => {
    renderStepper()
    // The claim has not changed — button changes must reach a screen reader —
    // but the mechanism has. The visible <output> is now `aria-live="off"`
    // and a dedicated unlabelled region carries the announcement on a
    // debounce (A10). Asserting both halves so neither can quietly go.
    const value = screen.getByLabelText('Weight')
    expect(value.tagName).toBe('OUTPUT')
    expect(value).toHaveAttribute('aria-live', 'off')

    const announcer = screen.getAllByRole('status').find((n) => n !== value)
    expect(announcer, 'no live region left to announce the value').toBeDefined()
    expect(announcer).toHaveTextContent('70')
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
    // The *named* status is gone while editing, so the input is the only
    // thing describing the value. The announcer stays, unlabelled, and does
    // not compete — which is what "separate names" means here.
    expect(screen.queryByRole('status', { name: 'Weight' })).toBeNull()
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

describe('the displayed separator matches the one the user types', () => {
  /**
   * The app used to accept `82,5` from a French user and read it back as
   * `82.5` — disagreeing with the input it had just taken. Pre-existing, and
   * invisible until direct entry gave the user a separator of their own to
   * supply.
   */
  it('shows a comma decimal in French', async () => {
    await i18n.changeLanguage('fr')
    renderStepper({ value: 82.5 })

    expect(screen.getByLabelText('Weight')).toHaveTextContent('82,5')
    expect(screen.getByLabelText('Weight')).not.toHaveTextContent('82.5')
  })

  it('shows a dot decimal in English and Chinese', async () => {
    for (const locale of ['en', 'zh-CN']) {
      await i18n.changeLanguage(locale)
      const { unmount } = render(
        <Stepper label="Weight" value={82.5} step={0.1} min={20} unit="kg" onChange={vi.fn()} />,
      )
      expect(screen.getByLabelText('Weight'), locale).toHaveTextContent('82.5')
      unmount()
    }
  })

  it('round-trips: what is shown can be retyped and re-shown', async () => {
    // The property that matters more than either separator on its own — the
    // field is seeded from the display, so the value a user sees is one they
    // can edit without translating it first.
    await i18n.changeLanguage('fr')
    const { onChange } = renderStepper({ value: 82.5 })

    await userEvent.click(screen.getByRole('button', { name: 'Modifier Weight' }))
    const input = screen.getByRole('textbox', { name: 'Weight' })
    expect(input).toHaveValue('82,5')

    // Committing the seeded value unchanged writes nothing, which is what
    // keeps the body-fat invariant intact through a localised round trip.
    await userEvent.tab()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not group thousands, so a comma never means two things at once', async () => {
    await i18n.changeLanguage('en')
    renderStepper({ value: 1234, step: 1, min: 0 })

    expect(screen.getByLabelText('Weight')).toHaveTextContent('1234')
    expect(screen.getByLabelText('Weight')).not.toHaveTextContent('1,234')
  })
})

describe('editing does not drift a value the display rounds (F5)', () => {
  // The bar is 7.75 kg, so every barbell load ends in .75. The display shows
  // one decimal (17.8), and the edit draft used to be seeded from that string,
  // so Edit-then-Enter committed 17.8 !== 17.75 and every edit drifted the
  // owner's real load by 0.05 kg.
  it('seeds the edit field with the full stored precision, not the display rounding', async () => {
    renderStepper({ value: 17.75, step: 2, min: 0 })

    const input = await startTyping()
    expect(input).toHaveValue('17.75')
  })

  it('opening the field and committing unchanged writes nothing', async () => {
    const { onChange } = renderStepper({ value: 17.75, step: 2, min: 0 })

    const input = await startTyping()
    await userEvent.type(input, '{Enter}')

    expect(onChange).not.toHaveBeenCalled()
  })

  it('keeps the French decimal comma at full precision', async () => {
    await i18n.changeLanguage('fr')
    renderStepper({ value: 17.75, step: 2, min: 0 })

    await userEvent.click(screen.getByRole('button', { name: 'Modifier Weight' }))
    expect(screen.getByRole('textbox', { name: 'Weight' })).toHaveValue('17,75')
    await i18n.changeLanguage('en')
  })
})

describe('the display shows the stored number, not a rounding of it (F5b)', () => {
  // The owner loads plates. 17.75 kg (bar 7.75 + plates) was shown as "17.8",
  // so the figure on screen was not the load on the bar.
  it.each([
    ['en', 17.75, '17.75'],
    ['fr', 17.75, '17,75'],
    ['en', 17.5, '17.5'],
    ['en', 18, '18'],
    ['fr', 82.5, '82,5'],
  ])('%s: %s reads %s', async (locale, value, text) => {
    await i18n.changeLanguage(locale)
    renderStepper({ value, step: 2, min: 0 })

    expect(screen.getByLabelText('Weight')).toHaveTextContent(text)
    expect(screen.getByLabelText('Weight').textContent).not.toMatch(/17[.,]8/)
    await i18n.changeLanguage('en')
  })

  it('formatNumber trims trailing zeros and keeps up to two decimals', () => {
    expect(formatNumber(17.75, 'en')).toBe('17.75')
    expect(formatNumber(17.5, 'en')).toBe('17.5')
    expect(formatNumber(18, 'en')).toBe('18')
    expect(formatNumber(17.75, 'fr')).toBe('17,75')
  })
})

describe('a sustained hold does not flood the live region (A10)', () => {
  /**
   * The backlog recorded this at the old fixed 140ms — ~7 announcements/sec —
   * and the hold acceleration took it to ~17/sec at the 60ms floor. The
   * display still updates every tick; only the announcement is debounced.
   *
   * Counted as updates-per-window rather than as a total, for the same reason
   * the ramp test is: a total passes with the flood intact, because the value
   * genuinely does change many times.
   */
  const ANNOUNCE_MS = 300

  /**
   * A *controlled* host, unlike `renderStepper`, whose spy never feeds the
   * value back. Announcement is driven by the value prop actually changing,
   * so a harness that holds it fixed would show silence and prove nothing.
   */
  function renderControlled(props: { value: number; step: number; unit?: string }) {
    const changes: number[] = []
    function Host() {
      const [value, setValue] = useState(props.value)
      return (
        <Stepper
          label="Weight"
          value={value}
          step={props.step}
          min={0}
          unit={props.unit ?? 'kg'}
          onChange={(next) => {
            changes.push(next)
            setValue(next)
          }}
        />
      )
    }
    render(<Host />)
    return { changes }
  }

  function announcer() {
    const value = screen.getByLabelText('Weight')
    const found = screen.getAllByRole('status').find((n) => n !== value)
    if (!found) throw new Error('no live region')
    return found
  }

  /**
   * Distinct texts the live region took on while the clock advanced —
   * i.e. how many times a screen reader would have spoken.
   *
   * Seeded with the text *before* advancing: an unseeded version counts the
   * first sample as a change (nothing !== something) and reports one
   * announcement for a region that never moved.
   */
  function announcementsDuring(ms: number, sampleMs = 20) {
    let previous = announcer().textContent ?? ''
    const spoken: string[] = []
    for (let elapsed = 0; elapsed < ms; elapsed += sampleMs) {
      act(() => {
        vi.advanceTimersByTime(sampleMs)
      })
      const text = announcer().textContent ?? ''
      if (text !== previous) {
        spoken.push(text)
        previous = text
      }
    }
    return spoken
  }

  it('announces once for a hold that changes the value many times', () => {
    vi.useFakeTimers()
    try {
      const { changes } = renderControlled({ value: 70, step: 0.1 })
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Increase Weight' }), { pointerId: 1 })

      // Two seconds of holding, well past the ramp.
      const announcements = announcementsDuring(2000)
      // The value really is changing throughout — this is a flood being
      // suppressed, not an absence of activity.
      expect(changes.length).toBeGreaterThan(15)
      // ...and the region stayed silent while it did.
      expect(
        announcements.length,
        `live region updated ${announcements.length} times mid-hold`,
      ).toBe(0)

      fireEvent.pointerUp(screen.getByRole('button', { name: 'Increase Weight' }), { pointerId: 1 })
    } finally {
      vi.useRealTimers()
    }
  })

  it('announces the value it landed on once the hold ends', () => {
    // Silence during the hold is only acceptable because the result arrives
    // after it. Losing that would be a worse defect than the flood.
    vi.useFakeTimers()
    try {
      renderControlled({ value: 70, step: 0.1 })
      const button = screen.getByRole('button', { name: 'Increase Weight' })
      fireEvent.pointerDown(button, { pointerId: 1 })
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      fireEvent.pointerUp(button, { pointerId: 1 })

      const settled = announcementsDuring(ANNOUNCE_MS + 100)
      expect(settled).toHaveLength(1)
      expect(announcer()).toHaveTextContent('kg')
      // And it is the value actually reached, not the one it started from.
      expect(announcer()).not.toHaveTextContent('70 kg')
    } finally {
      vi.useRealTimers()
    }
  })

  it('still announces a single discrete tap', () => {
    // The constraint that rules out silencing the region outright: one tap is
    // one change, and announcing it is how a screen-reader user knows the
    // control worked.
    vi.useFakeTimers()
    try {
      renderControlled({ value: 70, step: 0.1 })
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Increase Weight' }), { pointerId: 1 })
      fireEvent.pointerUp(screen.getByRole('button', { name: 'Increase Weight' }), { pointerId: 1 })

      const announcements = announcementsDuring(ANNOUNCE_MS + 100)
      expect(announcements).toHaveLength(1)
      expect(announcer()).toHaveTextContent('70.1 kg')
    } finally {
      vi.useRealTimers()
    }
  })

  it('says nothing on mount, when nobody has changed anything', () => {
    vi.useFakeTimers()
    try {
      renderControlled({ value: 70, step: 0.1 })
      // A live region announces *changes*. Writing the initial value into it
      // a moment after render would be a change, and would announce a value
      // the user never touched.
      expect(announcementsDuring(ANNOUNCE_MS + 200)).toHaveLength(0)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('an absent value renders as nothing, and a press supplies one', () => {
  /**
   * The `70 kg` placeholder defect, one layer down. A field with no
   * measurement used to open on a plausible figure, which on the profile page
   * sat above a baseline card showing the user's real most-recent weight —
   * the same quantity twice, one invented.
   */
  it('shows no digit at all when the value is absent', () => {
    render(<Stepper label="Weight" value={null} step={0.1} min={20} unit="kg" onChange={vi.fn()} />)

    const value = screen.getByLabelText('Weight')
    expect(value.textContent).not.toMatch(/\d/)
    expect(value).toHaveTextContent('—')
    // Not even the unit, which would read as "kg of something".
    expect(value.textContent).not.toContain('kg')
  })

  it('writes nothing merely by rendering', () => {
    const onChange = vi.fn()
    render(<Stepper label="Weight" value={null} step={0.1} min={20} onChange={onChange} />)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('materialises startFrom on the first press, in either direction', () => {
    for (const button of ['Increase Weight', 'Decrease Weight']) {
      const onChange = vi.fn()
      const { unmount } = render(
        <Stepper label="Weight" value={null} step={0.1} min={20} startFrom={70} onChange={onChange} />,
      )
      fireEvent.pointerDown(screen.getByRole('button', { name: button }), { pointerId: 1 })
      fireEvent.pointerUp(screen.getByRole('button', { name: button }), { pointerId: 1 })
      // The press means "give me a number to work from" before it means up or
      // down, so both land on the same starting figure.
      expect(onChange, button).toHaveBeenCalledWith(70)
      unmount()
    }
  })

  it('steps normally once a value exists', async () => {
    // The half that cannot be tested through a card rendered with a static
    // prop: the second press has to see the first one's value.
    const changes: number[] = []
    function Host() {
      const [value, setValue] = useState<number | null>(null)
      return (
        <Stepper
          label="Weight"
          value={value}
          step={0.1}
          min={20}
          startFrom={70}
          onChange={(next) => {
            changes.push(next)
            setValue(next)
          }}
        />
      )
    }
    render(<Host />)

    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(changes).toEqual([70, 70.1])
  })

  it('falls back to min when no startFrom is given', () => {
    // Documented rather than desirable — a weight field's minimum is not a
    // sensible opening figure, which is why any caller passing null should
    // pass startFrom too.
    const onChange = vi.fn()
    render(<Stepper label="Weight" value={null} step={0.1} min={20} onChange={onChange} />)
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Increase Weight' }), { pointerId: 1 })
    fireEvent.pointerUp(screen.getByRole('button', { name: 'Increase Weight' }), { pointerId: 1 })
    expect(onChange).toHaveBeenCalledWith(20)
  })

  it('opens the edit field blank, and typing commits', async () => {
    const onChange = vi.fn()
    render(<Stepper label="Weight" value={null} step={0.1} min={20} startFrom={70} onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Edit Weight' }))
    const input = screen.getByRole('textbox', { name: 'Weight' })
    expect(input).toHaveValue('')

    await userEvent.type(input, '82.5{Enter}')
    expect(onChange).toHaveBeenCalledWith(82.5)
  })

  it('announces nothing while absent', () => {
    vi.useFakeTimers()
    try {
      render(<Stepper label="Weight" value={null} step={0.1} min={20} unit="kg" onChange={vi.fn()} />)
      const value = screen.getByLabelText('Weight')
      const announcer = screen.getAllByRole('status').find((n) => n !== value)
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      // A live region reading "dash" is noise; the first real value announces
      // on the press that creates it.
      expect(announcer?.textContent).toBe('')
    } finally {
      vi.useRealTimers()
    }
  })
})

/** Both value sizes: `lg` is Workout Mode's 60px set entry, `form` the 30px field in a card. */
const KINDS = [
  ['lg', { size: 'lg' as const }],
  ['form', { variant: 'form' as const }],
] as const

/**
 * **The buttons never move** (QA F1 on 47821a0, Medium). On a touch screen the
 * click that follows a press is delivered to whatever is under the finger when
 * it lifts, and `StepButton` applies the value on pointerdown. The value cell
 * used to grow with its content, so "—" to "41.75kg" widened the row by 33px:
 * the "+" slid out from under the thumb, its click landed on the display, and
 * the editor opened with the soft keyboard. Every barbell load on this hardware
 * ends in .75, so it hit the owner's exact case.
 *
 * **Batch S1 (30 Oct) added the second half: the value must not overlap the
 * buttons either, and no typed number may widen the page.** eb14b08 fixed the
 * slot's width but the cell was `shrink-0` inside a row capped at its container,
 * so on a narrow screen the row shrank the *button* around the cell, not the
 * cell: "41.75kg" spilled 22px into each button at 320px and 2px at 360px. And a
 * typed 12345.67 (QA F-C) spilled the same way, wide enough to scroll the page.
 *
 * The slot is now the one fixed-width box both the display and the editor sit in
 * (it can only shrink, never grow, so the buttons still cannot move), and the
 * text is sized from it: a size container whose width, minus the button's 4px of
 * padding, is divided by the em the text needs. See `VALUE_SLOT` in `Stepper`.
 *
 * **What these tests can and cannot see.** jsdom has no layout. Every test in
 * this file pins *structure*: class tokens, the number given to `--stepper-em`
 * (jsdom keeps a custom property but drops an inline `font-size` it cannot
 * parse, which is why the number is passed that way), and the pure arithmetic of
 * `valueEm`. It cannot see a width, a font size in pixels, whether the text
 * overlaps a button, whether the page scrolls sideways, or the retargeted click.
 * **The browser numbers below are the evidence.** A green run here proves the
 * wiring is in place, not that the layout is right.
 *
 * **Measured**, Chromium 151.0.7922.34 (playwright-core 1.62.1), headless, touch
 * emulation, `isMobile`, deviceScaleFactor 2, on the real set screen (first
 * launch, "Start session"), 30 Oct. Container = the width SetScreen gives the
 * stepper (238 / 278 / 293 / 298px at 320 / 360 / 375 / 390+). "Gap" is from the
 * value's text to the nearer 44px button, in px (negative = overlap); "overflow"
 * is `documentElement.scrollWidth` minus the configured viewport width, NOT
 * `innerWidth` (an `isMobile` Chromium widens its layout viewport to fit
 * overflowing content, so `innerWidth` grows with `scrollWidth` and reads 0 for a
 * page that does scroll sideways). Weight "41.75kg", lg; identical in en, fr and
 * zh-CN:
 *
 *   viewport | cell  | gap before -> after | font after
 *   320      | 134px | -22   -> +6.8       | 41.4px
 *   360      | 174px | -2    -> +7.6       | 53.8px
 *   375      | 189px | +5.5  -> +7.9       | 58.5px
 *   390-430  | 194px | +8    -> +8         | 60px  (rows for 14, 9.75, 41.75, 100.5, 1000 identical)
 *
 * F-C, typed "12345.67" (page overflow before -> after, then gap):
 *   320: 52px -> 0 (-136.7 -> +9.9);  360: 32px -> 0 (-116.7 -> +10.7);
 *   375: 24px -> 0 (-109.2 -> +11.3).  30 digits, 360: 935px -> 0 (+11.1).
 *   300 digits (still finite, so accepted): 0 with the clip in place.
 * The step buttons: 44x44 in all 165 cases (5 widths x 3 languages x 11 values),
 * and none moved horizontally in any of them or while the editor was open
 * (150 editor-open checks). Form size, on /settings (45 states, 3 widths x 3
 * languages): 18 overlaps and 395px of overflow before, 0 and 0 after.
 * Opening the editor also used to push the buttons down 6.5px (row 73px vs 60px);
 * both are 60px now.
 *
 * **Instrument notes**, because three readings were wrong before they were right:
 * `innerWidth` hides overflow under `isMobile` (above); `Range.getBoundingClientRect`
 * reports unclipped text boxes, so once the output clips on x the visible ink is
 * the range intersected with the output; and the set screen scrolls inside an inner
 * container, so a vertical position is only comparable relative to its own Stepper
 * (a Playwright `click()` scrolls it, which read as a 20px "shift" in French at 320).
 *
 * Negative controls, run 30 Oct (mutation applied to `Stepper.tsx`, or to
 * `stepperFit.ts` where marked, this file run, restored, `cmp` clean; the
 * arithmetic ones were re-run after it moved into `stepperFit.ts`, which a lint
 * rule asked for, and the results below are from the final code). jsdom, red
 * tests named:
 *   lg slot `w-[12.625rem]` -> `min-w-32`            -> "lg: the value slot has one fixed width"
 *   form slot `w-[7.5rem]` -> `min-w-20`             -> "form: the value slot has one fixed width"
 *   slot `shrink` -> `shrink-0`                      -> "the slot may shrink" (lg, form)
 *   editor loses `w-full`                            -> "the editor fills the same slot" (lg, form)
 *   slot loses `@container`                          -> "the slot is a size container" (lg, form)
 *   `valueEm` excess multiplied by 0 (stepperFit.ts) -> "a number wider than 00.00" (lg, form), "grows with every digit"
 *                                                       (lg, form), "charges a separator less than a digit"
 *   `DIGIT_EM = 0` (stepperFit.ts)                   -> the same five
 *   `CELL_EM.lg` 3.233 -> 3.0 (stepperFit.ts)        -> 5: "ordinary value" (lg), French comma, "a number wider" (lg),
 *                                                       "the editor is fitted" (lg), "valueEm is the design width" (lg)
 *   value span handed the cell em, not `valueEm`     -> "a number wider than 00.00" (lg, form) ONLY. The pure `valueEm`
 *                                                       tests stay green: this is the wiring break, and the DOM test
 *                                                       is the only thing that sees it
 *   value span loses the `fit` class                 -> "the slot is a size container" (lg, form)
 *   output loses `overflow-x-clip`                   -> "the display clips on x"
 *   unit appended to the string `valueEm` measures   -> 7 red: ordinary values (lg, form, French), F-C (lg, form), unit (lg, form)
 *   `px-1` moved back onto the button                -> "the display clips on x"
 *   editor given the draft's em                      -> "the editor is fitted as an ordinary value is" (lg, form)
 *   StepButton `shrink-0` removed                    -> "step buttons carry h-11, w-11 and shrink-0"
 *   row `max-w-full` removed                         -> "the row carries max-w-full"
 * Browser, the same harness as the table above, because jsdom cannot see these:
 *   B1 slot `shrink` -> `shrink-0`: at 320 the "+" sits at x 295..339 instead of 235..279, outside its own row, and the
 *      page scrolls 19px; at 360 it is 20px out (295 vs 275).
 *   B2 the fit replaced by a fixed 60px (`text-6xl`), clip kept: the page stays at 0 and a 4px gap holds, but "41.75kg"
 *      is cut by 52px at 320 and 12px at 360, and "12345.67kg" by 166.7px / 126.7px. The clip alone keeps the page
 *      still and the number unreadable; the fit is what keeps it whole.
 *   B3 the fit and the clip both removed: "41.75kg" overlaps the buttons by 22px at 320 and 2px at 360, which is the
 *      defect as it was. At 30 digits, 360px: page overflow 407px, against 0 with the clip kept (B2, 992px cut).
 *   And `px-1` on the button rather than the output (before it moved): "41.75kg" at 320 was clipped by 2.3px, 136.3px
 *   of text in a 134px cell, a rounding overshoot that now lands in the padding.
 */
describe('the step buttons do not move when the value changes width', () => {
  const widthRem = (classes: string): number | null => {
    const match = /(?:^|\s)w-\[([\d.]+)rem\]/.exec(classes)
    return match ? Number(match[1]) : null
  }
  /** The slot: the one box the display button and the editor sit in. */
  const slotOfDisplay = () => screen.getByRole('button', { name: 'Edit Weight' }).parentElement as HTMLElement

  it.each(KINDS)('%s: the value slot has one fixed width, never a minimum, whatever the value shows', (_name, props) => {
    const { unmount } = render(<Stepper label="Weight" value={null} step={2} min={0} unit="kg" onChange={() => {}} {...props} />)
    const blank = slotOfDisplay().className
    unmount()
    render(<Stepper label="Weight" value={41.75} step={2} min={0} unit="kg" onChange={() => {}} {...props} />)
    const filled = slotOfDisplay().className

    expect(widthRem(blank)).not.toBeNull()
    // The same slot for "—" and for "41.75kg".
    expect(widthRem(filled)).toBe(widthRem(blank))
    // `min-w-0` is allowed (and required, below); any other minimum is the old bug.
    expect(blank).not.toMatch(/\bmin-w-(?!0\b)/)
    expect(filled).not.toMatch(/\bmin-w-(?!0\b)/)
  })

  it.each(KINDS)('%s: the slot may shrink on a narrow screen, so the cell gives way and the buttons do not', (_name, props) => {
    render(<Stepper label="Weight" value={41.75} step={2} min={0} unit="kg" onChange={() => {}} {...props} />)
    const slot = slotOfDisplay().className

    expect(slot).toMatch(/\bmin-w-0\b/)
    expect(slot).not.toMatch(/\bshrink-0\b/)
  })

  it.each(KINDS)("%s: the editor fills the same slot the display sat in (so opening it moves nothing)", async (_name, props) => {
    render(<Stepper label="Weight" value={41.75} step={2} min={0} unit="kg" onChange={() => {}} {...props} />)
    const edit = screen.getByRole('button', { name: 'Edit Weight' })
    const slot = edit.parentElement
    expect(edit.className).toMatch(/\bw-full\b/)

    await userEvent.click(edit)
    const editor = screen.getByRole('textbox', { name: 'Weight' })

    // The very same element, and the editor has no width of its own to disagree with it.
    expect(editor.parentElement).toBe(slot)
    expect(editor.className).toMatch(/\bw-full\b/)
    expect(widthRem(editor.className)).toBeNull()
  })

  it('step buttons carry h-11, w-11 and shrink-0 (that a narrow row cannot squeeze them is measured in a browser, not here)', () => {
    renderStepper()
    for (const name of ['Decrease Weight', 'Increase Weight']) {
      const button = screen.getByRole('button', { name })
      expect(button.className).toMatch(/\bh-11\b/)
      expect(button.className).toMatch(/\bw-11\b/)
      expect(button.className).toMatch(/\bshrink-0\b/)
    }
  })

  it('the row carries max-w-full (what that does on a narrow screen is measured in a browser, not here)', () => {
    renderStepper()
    const row = screen.getByRole('button', { name: 'Decrease Weight' }).parentElement
    expect(row?.className).toMatch(/\bmax-w-full\b/)
  })
})

/**
 * **The value is fitted to its slot** (batch S1, items 1 and 2). The layout
 * proof is in the browser (see the numbers above). What jsdom can pin is the
 * wiring that makes the browser do it: the slot is a size container, the text
 * carries the class that divides the slot by `--stepper-em`, and each element is
 * given the right number. The test that matters most is the F-C one: a long
 * number must be handed *more* em than an ordinary one, on the span that
 * actually holds the text.
 */
describe('the value is fitted to its slot, so it cannot overlap the buttons or widen the page', () => {
  /** The em width each size was designed for: 194px / 60px and 112px / 30px, measured. */
  const CELL_EM = { lg: 12.125 / 3.75, form: 7 / 1.875 } as const
  const FIT_CAP = { lg: '3.75rem', form: '1.875rem' } as const
  const emOf = (el: Element | null | undefined) =>
    Number((el as HTMLElement | undefined)?.style.getPropertyValue('--stepper-em'))
  const outputOf = () => screen.getByLabelText('Weight', { selector: 'output' })
  const slotOfDisplay = () => screen.getByRole('button', { name: 'Edit Weight' }).parentElement as HTMLElement
  const renderKind = (props: object, value: number | null, unit: string | undefined = 'kg') =>
    render(<Stepper label="Weight" value={value} step={2} min={0} unit={unit} onChange={() => {}} {...props} />)

  it.each(KINDS)('%s: the slot is a size container, and the text size is the cap over (slot - 0.5rem) / --stepper-em', (name, props) => {
    renderKind(props, 41.75)
    expect(slotOfDisplay().className).toMatch(/(?:^|\s)@container(?:\s|$)/)

    const fit = `min(${FIT_CAP[name]},calc((100cqw_-_0.5rem)/var(--stepper-em)))`
    expect(outputOf().className).toContain(fit)
    expect(outputOf().firstElementChild?.className).toContain(fit)
  })

  it.each(KINDS)('%s: the placeholder and every ordinary value take the cell\'s design width, so they keep the size this control always had', (name, props) => {
    for (const value of [null, 0, 9.75, 41.75, 99.99, 100.5, 1000]) {
      const { unmount } = renderKind(props, value)
      expect(emOf(outputOf())).toBeCloseTo(CELL_EM[name], 4)
      if (value !== null) expect(emOf(outputOf().firstElementChild)).toBeCloseTo(CELL_EM[name], 4)
      unmount()
    }
  })

  it('a French comma value is just as ordinary as the dot one', async () => {
    await i18n.changeLanguage('fr')
    renderKind({ size: 'lg' as const }, 41.75)
    expect(outputOf()).toHaveTextContent('41,75')
    expect(emOf(outputOf().firstElementChild)).toBeCloseTo(CELL_EM.lg, 4)
  })

  it.each(KINDS)('%s: a number wider than "00.00" is given more room, digit by digit (QA F-C)', (name, props) => {
    const seen: number[] = []
    for (const value of [99.99, 100.25, 1234.56, 12345.67, 1234567.89, 1e30]) {
      const { unmount } = renderKind(props, value)
      seen.push(emOf(outputOf().firstElementChild))
      unmount()
    }
    // 99.99 is the widest ordinary value; everything after it asks for more, and more each time.
    expect(seen[0]).toBeCloseTo(CELL_EM[name], 4)
    for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeGreaterThan(seen[i - 1])
    expect(seen[3]).toBeGreaterThan(CELL_EM[name]) // 12345.67, the QA F-C value
  })

  it.each(KINDS)('%s: the unit never counts toward the room asked for (the cell was sized with it in)', (_name, props) => {
    const { unmount } = renderKind(props, 12345.67, 'kg')
    const withKg = emOf(outputOf().firstElementChild)
    unmount()
    renderKind(props, 12345.67, 'min')
    expect(emOf(outputOf().firstElementChild)).toBe(withKg)
  })

  it.each(KINDS)('%s: the editor is fitted as an ordinary value is, however long the draft', async (name, props) => {
    renderKind(props, 41.75)
    await userEvent.click(screen.getByRole('button', { name: 'Edit Weight' }))
    const editor = screen.getByRole('textbox', { name: 'Weight' })
    await userEvent.clear(editor)
    await userEvent.type(editor, '123456789012345678901234567890')

    // The editor's box is the slot's, so a long draft scrolls inside it and cannot widen anything.
    expect(emOf(editor)).toBeCloseTo(CELL_EM[name], 4)
    expect(editor.className).toContain(`min(${FIT_CAP[name]},calc((100cqw_-_0.5rem)/var(--stepper-em)))`)
  })

  it('the display clips on x as a last line of defence, 4px outside the cell it is fitted to', () => {
    renderKind({ size: 'lg' as const }, 41.75)
    // Clips (does not just hide), so a descender is not cropped vertically.
    expect(outputOf().className).toMatch(/\boverflow-x-clip\b/)
    // The padding is on the output, so the clip edge is outside the cell: a ~2% advance
    // overshoot lands in the padding instead of being shaved off the last glyph.
    expect(outputOf().className).toMatch(/\bpx-1\b/)
    expect(screen.getByRole('button', { name: 'Edit Weight' }).className).not.toMatch(/\bpx-/)
  })

  describe('valueEm', () => {
    it.each(KINDS)('%s: is the cell\'s design width for anything up to "00.00", in either separator, and never less', (name) => {
      for (const text of ['0', '5', '14', '9.75', '9,75', '41.75', '41,75', '99.99', '100.5', '1000', '9999']) {
        expect(valueEm(name, text)).toBeCloseTo(CELL_EM[name], 4)
      }
    })

    it.each(KINDS)('%s: grows with every digit past that, with no gaps in the sequence up to 40 digits', (name) => {
      let previous = valueEm(name, '9999')
      for (let digits = 5; digits <= 40; digits++) {
        const next = valueEm(name, '9'.repeat(digits))
        expect(next).toBeGreaterThan(previous)
        previous = next
      }
    })

    it('charges a separator less than a digit, and a sign as a digit', () => {
      // Seven characters each: a separator in place of a digit is narrower.
      expect(valueEm('lg', '12345.6')).toBeLessThan(valueEm('lg', '1234567'))
      expect(valueEm('lg', '-12345')).toBeGreaterThan(valueEm('lg', '12345'))
    })
  })
})
