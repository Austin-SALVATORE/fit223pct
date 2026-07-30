import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

interface StepperProps {
  label: string
  value: number
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
  variant?: 'focal' | 'form'
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
export function Stepper({ label, value, step, min, max, unit, onChange, variant = 'focal' }: StepperProps) {
  const { t } = useTranslation('common')
  const form = variant === 'form'
  const repeat = useRef<ReturnType<typeof setInterval> | null>(null)
  const latest = useRef({ value, step, min, max, onChange })
  latest.current = { value, step, min, max, onChange }

  useEffect(() => stopRepeat, [])

  function apply(direction: 1 | -1) {
    const { value, step, min, max, onChange } = latest.current
    const next = clamp(round(value + direction * step), min, max)
    if (next !== value) onChange(next)
  }

  function startRepeat(direction: 1 | -1) {
    apply(direction)
    stopRepeat()
    repeat.current = setInterval(() => apply(direction), 140)
  }

  function stopRepeat() {
    if (repeat.current !== null) {
      clearInterval(repeat.current)
      repeat.current = null
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${form ? 'items-start' : 'items-center'}`}>
      <span className={form ? 'text-sm text-ink-secondary' : 'eyebrow'}>{label}</span>
      <div className="flex items-center gap-1">
        <StepButton
          symbol="−"
          ariaLabel={t('stepper.decrease', { label })}
          onPress={() => startRepeat(-1)}
          onRelease={stopRepeat}
        />
        <output
          data-numeric
          aria-label={label}
          className="min-w-14 text-center text-3xl font-semibold text-ink"
        >
          {formatNumber(value)}
          {unit && <span className="ml-0.5 text-lg font-normal text-ink-tertiary">{unit}</span>}
        </output>
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
      className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-xl text-ink-secondary transition-colors active:bg-raised active:text-ink"
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

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function clamp(value: number, min: number, max?: number): number {
  const lower = Math.max(value, min)
  return max === undefined ? lower : Math.min(lower, max)
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
