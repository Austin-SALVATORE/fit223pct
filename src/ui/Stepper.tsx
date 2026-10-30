import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { CELL_EM, valueEm } from './stepperFit'

/**
 * Press-and-hold repeat, and the ramp that keeps a long hold usable.
 *
 * The base interval is unchanged, deliberately: a short press has to behave
 * exactly as it did, because the same button serves "nudge 82.4 to 82.5" and
 * "get from 70 to 82.5". Only after `HOLD_RAMP_AFTER_TICKS` at the base rate
 * does the interval start shortening, so fine adjustment is never fighting an
 * accelerating control.
 *
 * `HOLD_MIN_INTERVAL_MS` is a landability floor rather than a performance
 * one. Faster is easy; stopping on a chosen value is what gets hard, because
 * overshoot is release-latency x rate. At 60ms a ~200ms human release costs
 * about three steps, which is recoverable with a tap or two. Typing is the
 * answer for large jumps, so this does not need to be fast enough to replace
 * it — an explicit coarse +2/-2 pair was considered and ruled out.
 */
const HOLD_INTERVAL_MS = 140
const HOLD_RAMP_AFTER_TICKS = 8
const HOLD_RAMP_STEP_MS = 10
const HOLD_MIN_INTERVAL_MS = 60

/**
 * How long the value must sit still before it is announced.
 *
 * **Backlog A10, made worse by the ramp.** The visible value lives in an
 * `<output>`, which is a `role="status"` live region, so every repeat tick
 * announced. At the old fixed 140ms that was ~7 announcements/sec, already
 * recorded as a defect on 27 Jul; the acceleration floor of 60ms took it to
 * ~17/sec. A screen-reader user holding `+` got an unusable flood.
 *
 * **Debounced rather than announced-on-release**, which was the other option
 * the backlog named. Release is the wrong thing to hang it on: it is a
 * pointer event, and the value also changes by keyboard (Enter/Space arrive
 * as a click with `detail === 0`) and by typing (committed on blur or Enter).
 * Announce-on-release needs a trigger wired to each input path and silently
 * misses the next one added. Debouncing keys on the *value*, so every path is
 * covered by construction — a tap announces once, a hold announces once when
 * it settles, and a rapid double-tap announces once rather than twice.
 *
 * `TimerRing` solved the same flood by silencing its region outright
 * (`<time aria-live="off">`) and letting a focus move carry the
 * announcement at each phase boundary. That does not transfer: pressing `+`
 * moves no focus, so silence alone would leave a discrete tap unannounced —
 * and knowing the control worked is the whole point of announcing it.
 */
const ANNOUNCE_DEBOUNCE_MS = 300

function intervalForTick(tick: number): number {
  if (tick < HOLD_RAMP_AFTER_TICKS) return HOLD_INTERVAL_MS
  const shortened = HOLD_INTERVAL_MS - (tick - HOLD_RAMP_AFTER_TICKS + 1) * HOLD_RAMP_STEP_MS
  return Math.max(HOLD_MIN_INTERVAL_MS, shortened)
}

/**
 * The value slot: the one box the display button and the editor both live in.
 * Its width is fixed (never a minimum, never content-sized) and the same for
 * "—" and "41.75kg", so the step buttons beside it cannot move — see the
 * comment on the row in `Stepper`. It can only get *narrower*, when the
 * container is narrower than the row's design width (`shrink`, `min-w-0`, on a
 * row capped by `max-w-full`): the cell gives way, the 44px buttons never do.
 *
 * Sized in Chromium at 375px with tabular figures — every digit is the same
 * width, so the design width is the widest ordinary value, "00.00kg" (and
 * "000.0cm"):
 *
 *   lg    cell 194px = 12.125rem   ("41.75kg", "100.5kg"; 155.8 for "9.75kg")
 *   form  cell 112px = 7rem        ("102.5cm" 111.6, "100.5kg" 106.2)
 *
 * The slot is the cell plus the display button's 4px padding each side (202px,
 * 120px). The editor is `w-full` in the same slot, so opening or committing it
 * moves nothing — by construction, not because two numbers happen to differ by
 * 0.5rem.
 *
 * **The text is sized from the slot, not from a fixed class.** The slot is a
 * size container (`@container`), and the value's `font-size` (`fit`, below) is
 * `min(base, (100cqw - 0.5rem) / var(--stepper-em))`: the cell width divided by
 * the width, in em, of the text that has to fit. At full width and for any
 * ordinary value that is exactly `base` (60px / 30px), the size this control
 * always had; on a 238px-wide container (320px phone) the cell is 134px and the
 * same text is 41px, so "41.75kg" fills the cell instead of spilling 22px into
 * each button. `--stepper-em` is `CELL_EM` for anything up to the reference
 * width and grows by the excess for a longer number (`valueEm`; both in
 * `stepperFit.ts`), so a number the editor accepts that is wider than "00.00"
 * shrinks to fit rather than spilling (QA F-C: 12345.67 widened the page by 32px
 * at 360). The unit never enters it: the cell was sized with the unit in.
 *
 * The formula is a static class and the per-render number is a custom property,
 * and the split is deliberate: jsdom drops an inline `font-size` it cannot
 * parse but keeps `--stepper-em`, so a test can see which number each element
 * was given and that the class consumes it.
 *
 * `fit`'s base size, `box` and `unit` are the old `text-6xl` / `text-3xl` values
 * (3.75rem / 1.875rem, line-height 1 / 1.2) and the unit's old `text-2xl` /
 * `text-lg` (24px / 18px) written as 0.4em / 0.6em of the value, so they scale
 * with it. `box` is a fixed height so a smaller font never changes the row's
 * height, and so the editor and the display occupy the same rectangle.
 */
const VALUE_SLOT = {
  lg: {
    slot: 'w-[12.625rem]',
    box: 'h-[3.75rem] leading-none',
    fit: '[font-size:min(3.75rem,calc((100cqw_-_0.5rem)/var(--stepper-em)))]',
    unit: 'text-[0.4em]',
  },
  form: {
    slot: 'w-[7.5rem]',
    box: 'h-[2.25rem] leading-[1.2]',
    fit: '[font-size:min(1.875rem,calc((100cqw_-_0.5rem)/var(--stepper-em)))]',
    unit: 'text-[0.6em]',
  },
} as const

/** The custom property the `fit` class divides the slot by. */
function fitVars(em: number): CSSProperties {
  return { '--stepper-em': em.toFixed(4) } as CSSProperties
}

interface StepperProps {
  label: string
  /**
   * **`null` means nothing has been entered**, and renders as visibly
   * not-a-number rather than as a plausible figure.
   *
   * Nullable rather than a separate `empty` flag, deliberately: a flag would
   * let `empty` and a number coexist, so the type would permit exactly the lie
   * this exists to prevent — a value that looks measured and is not. Here
   * "absent" and "a number" are the same slot and cannot both be true.
   *
   * `number` is assignable to `number | null`, so the six callers that always
   * have a value are unchanged and unaffected.
   */
  value: number | null
  step: number
  min: number
  max?: number
  unit?: string
  onChange: (value: number) => void
  /**
   * How the stepper presents itself — **not** where its caller puts it.
   *
   * `'focal'` (default) is the original: centred, with an uppercase eyebrow
   * label. It suits a control that *is* the screen, like Workout Mode's set
   * entry, where the stepper is the one decision being made.
   *
   * `'form'` left-aligns and gives the label the same sentence-case
   * treatment every other field label uses, so a stepper can sit in a column
   * of fields without being the only thing on a different edge.
   *
   * This is a prop rather than a flat change because the two are genuinely
   * different jobs, not one screen's preference: a form of four fields needs
   * one edge, and a takeover screen needs a focus. Defaulting to `'focal'`
   * means no existing caller changes behaviour by doing nothing.
   */
  /**
   * Where a press lands when the value is absent. Defaults to `min`, which is
   * rarely what a caller wants — a weight field's minimum is 20kg, not a
   * sensible opening figure — so any caller that passes `null` should pass
   * this too.
   *
   * **This is why the DEFAULT_* constants survive.** They are no longer
   * displayed, so they look dead; they are the value a *deliberate press*
   * starts from. Revealing a control is not choosing, but pressing `+` is —
   * the same distinction the body-fat reveal turns on.
   */
  startFrom?: number
  variant?: 'focal' | 'form'
  /**
   * How large the value reads. **Orthogonal to `variant`, deliberately** —
   * `variant` describes alignment and label style and is a standing ruling
   * (see above); size is a different axis and folding them together would
   * force a caller wanting big numbers to also accept an alignment.
   *
   * `md` (default) is the 30px value every existing caller has. `lg` is 60px
   * for Workout Mode's set screen, where the owner reported the numbers they
   * are about to log were too small to read at arm's length.
   */
  size?: 'md' | 'lg'
  /**
   * The field counts whole things and a fraction of one is meaningless —
   * reps, or seconds of a hold. Switches the on-screen keypad to `numeric`.
   *
   * **Defaults to false, and the direction is the whole point.** The rule was
   * originally step-driven: `numeric` wherever the step was a whole number.
   * That fails dangerously, because the two mistakes are not symmetrical. A
   * decimal keypad on an integer field costs nothing — parsing and clamping
   * already handle a stray dot. A numeric keypad on a decimal-capable field
   * makes the value **unreachable**: Workout Mode's weight uses
   * `weightStepKg ?? 1`, so under the old rule 82.5 could not be typed in the
   * one place logging 82.5 mid-set matters most.
   *
   * So this is opt-in for the rare genuinely-integral field rather than
   * inferred from the step. If you are tempted to set it because the step
   * happens to be 1, that is the old rule coming back — ask instead whether a
   * user could ever legitimately want a fraction. Height steps by 1 and
   * 180.5cm is still a real measurement.
   */
  integer?: boolean
}

/**
 * Large-touch-target numeric stepper. Hold a button to repeat — nobody
 * should tap "+" ten times between sets.
 *
 * **Alignment and label style live here, not in the caller** — which is the
 * whole reason `variant` exists. A container can move the stepper, but only
 * this file can move the label relative to its own buttons or change its
 * style, so the profile form could not be made consistent from its call
 * sites at all: it carried two label styles and two alignments with nothing
 * a caller could do about it.
 *
 * The fix is a prop rather than a flat change (owner ruling, 30 Jul), so the
 * seven call sites across profile, check-in and Workout Mode keep their
 * current behaviour unless they ask for the other one. Workout Mode's set
 * entry stays `'focal'` deliberately: a centred stepper there is plausibly
 * the right call for a one-decision screen, and it is not the screen anyone
 * reported a problem with.
 */
export function Stepper({
  label,
  value,
  step,
  min,
  max,
  unit,
  onChange,
  startFrom,
  variant = 'focal',
  size = 'md',
  integer = false,
}: StepperProps) {
  const { t, i18n } = useTranslation('common')
  const form = variant === 'form'
  const slotKind = size === 'lg' ? 'lg' : 'form'
  const slot = VALUE_SLOT[slotKind]
  // The number as shown, once: the display renders it and `valueEm` measures it.
  const shown = value === null ? null : formatNumber(value, i18n.language)
  /**
   * Direct entry. Reaching 82.5 from 70 at `step={0.1}` is ~125 taps, which
   * is what the buttons alone asked of anyone with a real number in mind.
   * Typing is additive — the buttons are untouched — so this adds a route to
   * the same value rather than replacing one.
   */
  // Nothing to announce while absent — a live region saying "dash" is noise,
  // and the first real value announces on the press that creates it.
  const spoken = (v: number | null) =>
    v === null ? '' : `${formatNumber(v, i18n.language)}${unit ? ` ${unit}` : ''}`
  // Seeded with the current value so the effect's first run writes the same
  // string and React bails out — a live region announces changes, and a value
  // nobody touched is not one.
  const [announced, setAnnounced] = useState(() => spoken(value))
  const [draft, setDraft] = useState<string | null>(null)
  const editing = draft !== null
  const inputRef = useRef<HTMLInputElement>(null)
  const repeat = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdTick = useRef(0)
  const latest = useRef({ value, step, min, max, onChange, startFrom })
  latest.current = { value, step, min, max, onChange, startFrom }

  useEffect(() => stopRepeat, [])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  // Every change restarts the timer, so a sustained hold announces once — on
  // settling — rather than once per tick.
  useEffect(() => {
    const id = setTimeout(() => setAnnounced(spoken(value)), ANNOUNCE_DEBOUNCE_MS)
    return () => clearTimeout(id)
  })

  /**
   * **Validation happens here and nowhere else.** Clamping per keystroke
   * looks equivalent and makes the field unusable: height has `min={120}`, so
   * the "1" of "180" would be rewritten to "120" before the user reached the
   * "8", and the value becomes unreachable by typing.
   *
   * Anything unparseable — empty, `-`, `abc`, a lone `.` — restores the
   * previous value. Never `NaN`, and never `0`: a silent zero in a weight
   * field is a data-integrity bug, and coercing a missing weight to 0 once
   * produced false "stagnant" claims (M4).
   */
  function commit() {
    const parsed = draft === null ? null : parseDecimal(draft)
    setDraft(null)
    if (parsed === null) return
    const next = clamp(round(parsed), min, max)
    // Unchanged means no write — which is what keeps "focus the field and
    // blur again" from persisting a body-fat reading nobody entered.
    if (next !== value) onChange(next)
  }

  function apply(direction: 1 | -1) {
    const { value, step, min, max, onChange, startFrom } = latest.current
    // From absent, the first press *materialises* a value rather than stepping
    // from one — in either direction, because the press means "give me a
    // number to work from" before it means "up" or "down". Stepping continues
    // normally from there.
    const next =
      value === null
        ? clamp(round(startFrom ?? min), min, max)
        : clamp(round(value + direction * step), min, max)
    if (next !== value) onChange(next)
  }

  function startRepeat(direction: 1 | -1) {
    apply(direction)
    stopRepeat()
    // A self-rescheduling timeout rather than an interval, because the delay
    // has to change between ticks.
    const schedule = () => {
      repeat.current = setTimeout(() => {
        apply(direction)
        holdTick.current += 1
        schedule()
      }, intervalForTick(holdTick.current))
    }
    schedule()
  }

  function stopRepeat() {
    if (repeat.current !== null) {
      clearTimeout(repeat.current)
      repeat.current = null
    }
    // Reset on release, so a second press starts slow again rather than
    // resuming at whatever speed the last one reached.
    holdTick.current = 0
  }

  return (
    <div className={`flex flex-col gap-2 ${form ? 'items-start' : 'items-center'}`}>
      <span className={form ? 'text-sm text-ink-secondary' : 'eyebrow'}>{label}</span>
      {/*
        **The buttons never move.** A press that changes the value's width must
        not move the button under the finger: `StepButton` applies the value on
        pointerdown, and on a touch screen the click that follows is delivered to
        whatever is under the finger when it lifts. With a value cell that grew
        with its content ("—" to "41.75kg" widened the row by 33px) the "+" slid
        out from under the thumb and its click landed on the display, opening the
        editor with the soft keyboard. So the value lives in one slot with one
        fixed width (`VALUE_SLOT`, above) whatever it shows, and the editor fills
        the same slot, so opening or committing it cannot shift the buttons
        either. The row is capped at its container and the slot may shrink, so a
        narrow screen compresses the slot, not the buttons — and the text is
        sized from the slot, so it never spills into them. That the width is
        content-independent is what keeps the buttons still; how narrow it gets,
        and that the text fits, are measured in a browser (see
        Stepper.test.tsx), not by jsdom.
      */}
      <div className="flex max-w-full items-center gap-1">
        <StepButton
          symbol="−"
          ariaLabel={t('stepper.decrease', { label })}
          onPress={() => startRepeat(-1)}
          onRelease={stopRepeat}
        />
        <div className={`${slot.slot} min-w-0 shrink @container`}>
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              /*
                `type="text"` rather than `type="number"`, because a French user
                on a decimal keypad types `82,5` and `type="number"` rejects the
                comma outright — yielding an empty value, so their weight would
                silently fail to save. parseDecimal accepts both separators.

                The keypad defaults to `decimal` and only integral fields opt
                out — see `integer` above for why that asymmetry is deliberate.

                appearance-none / min-w-0 / box-border from the start — the iOS
                width class we already met on the date input.
              */
              inputMode={integer ? 'numeric' : 'decimal'}
              aria-label={label}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commit()
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  setDraft(null)
                }
              }}
              // The editor's text is sized as the display's is for an ordinary
              // value, so the digits keep their size when the editor opens. A long
              // draft scrolls inside the input; it cannot widen the slot.
              style={fitVars(CELL_EM[slotKind])}
              className={`box-border w-full min-w-0 appearance-none rounded-card border border-amber bg-raised text-center font-semibold text-ink ${slot.box} ${slot.fit}`}
            />
          ) : (
            <button
              type="button"
              aria-label={t('stepper.edit', { label })}
              onClick={() => setDraft(value === null ? '' : formatNumber(value, i18n.language))}
              className="flex w-full min-w-0 justify-center rounded-card transition-colors hover:bg-raised"
            >
              {/*
                The value keeps its own `role="status"` so a change made with the
                buttons is still announced. The button around it carries a
                separate name for the edit affordance, so the two never compete:
                only one of them is ever the control being described.

                `overflow-x-clip` is the last line of defence, not the mechanism:
                the font shrinks to fit (`valueEm`), and only a number so long
                that even the browser's smallest text would not fit (hundreds of
                digits) is cut off rather than allowed to widen the page. `clip`
                rather than `hidden` so a descender is not cropped vertically.

                The 4px of padding (`px-1`) is on the output, not the button, so
                the clip edge sits 4px outside the cell the font is fitted to:
                Chromium's advances at ~40px come out ~2% wider than a linear
                scale predicts (136px of text in a 134px cell), and that overshoot
                lands in the padding instead of being shaved off the last glyph.
              */}
              <output
                data-numeric
                aria-label={label}
                // Silent, the same way TimerRing's `<time>` is: visually live,
                // and announced only by the debounced region below.
                aria-live="off"
                // The size an ordinary value (and the "—") takes in this slot;
                // a longer number overrides it on the span inside.
                style={fitVars(CELL_EM[slotKind])}
                className={`flex w-full items-center justify-center overflow-x-clip px-1 text-center font-semibold text-ink ${slot.box} ${slot.fit}`}
              >
                {shown === null ? (
                  // Visibly not a number. The test is whether someone could
                  // mistake it for a measurement — a plausible figure here is
                  // the same defect as the one this replaced, in a new costume.
                  <span className="text-ink-tertiary">—</span>
                ) : (
                  <span className={`whitespace-nowrap ${slot.fit}`} style={fitVars(valueEm(slotKind, shown))}>
                    {shown}
                    {unit && <span className={`ml-0.5 font-normal text-ink-tertiary ${slot.unit}`}>{unit}</span>}
                  </span>
                )}
              </output>
            </button>
          )}
        </div>
        {/*
          The announcement, separated from the number on screen so the two can
          run at different rates: the display updates every tick, this one
          settles first. Deliberately unlabelled, so it is not a second
          competing name for the value.
        */}
        <span role="status" className="sr-only">
          {announced}
        </span>
        <StepButton
          symbol="+"
          ariaLabel={t('stepper.increase', { label })}
          onPress={() => startRepeat(1)}
          onRelease={stopRepeat}
        />
      </div>
    </div>
  )
}

interface StepButtonProps {
  symbol: string
  ariaLabel: string
  onPress: () => void
  onRelease: () => void
}

function StepButton({ symbol, ariaLabel, onPress, onRelease }: StepButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-xl text-ink-secondary transition-colors active:bg-raised active:text-ink"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        onPress()
      }}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onContextMenu={(event) => event.preventDefault()}
      onClick={(event) => {
        // Keyboard activation (Enter/Space) arrives as a click with detail 0
        if (event.detail === 0) {
          onPress()
          onRelease()
        }
      }}
    >
      {symbol}
    </button>
  )
}

/**
 * Accepts either decimal separator, and rejects everything that is not a
 * number outright rather than letting `Number()` produce a plausible-looking
 * result. `''`, `'-'`, `'abc'` and `'.'` all return null; `'82,5'`, `'82.5'`,
 * `'5.'` and `'.5'` all parse.
 */
function parseDecimal(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.')
  if (!/^-?(\d+(\.\d*)?|\.\d+)$/.test(normalized)) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function clamp(value: number, min: number, max?: number): number {
  const lower = Math.max(value, min)
  return max === undefined ? lower : Math.min(lower, max)
}

/**
 * The displayed value, with **the separator the reader's locale uses**.
 *
 * It was always a dot, so a French user typed `82,5` and read back `82.5` —
 * the app disagreeing with the input it had just accepted. Pre-existing, but
 * invisible until direct entry gave the user a separator of their own to
 * supply. `parseDecimal` accepts both, so the round trip holds: the field is
 * seeded from this string, and whatever it shows can be retyped.
 *
 * Grouping is off deliberately. No stepper field reaches four digits, and a
 * thousands separator would put a comma on screen in English right next to a
 * French decimal comma — two meanings, one glyph, in the same control.
 */
/** Locale-aware, tabular-friendly number formatting — shared with the rest screen's hero numbers so a value never renders differently on the two screens that must not disagree (see `nextSetTarget`). */
export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    // Stored precision (`round` keeps two decimals), trailing zeros trimmed:
    // 17.75 -> "17.75", 17.5 -> "17.5", 18 -> "18". One decimal showed a
    // 17.75 kg barbell load as 17.8 (F5/F5b); the number on screen must be the
    // number on the bar, and the edit field seeds from this same string.
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(value)
}
