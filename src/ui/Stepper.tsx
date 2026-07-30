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
}

/**
 * Large-touch-target numeric stepper. Hold a button to repeat — nobody
 * should tap "+" ten times between sets.
 *
 * **Left-aligned, with a sentence-case label** (owner ruling, 30 Jul). Both
 * were previously centred and uppercase *inside this component*, which is why
 * the profile form could not be made consistent from its call sites: a
 * container can move the stepper, but only this file can move the label
 * relative to the buttons or change its style. That made a form of four
 * fields carry two label styles and two alignments with no way to reconcile
 * them short of changing this.
 *
 * The blast radius was known and accepted rather than discovered: seven call
 * sites across profile, check-in and Workout Mode. A caller that wants the
 * whole control centred still centres it from its own container — what is
 * fixed here is the relationship between a stepper's label and its own
 * buttons, which was never the caller's to decide.
 */
export function Stepper({ label, value, step, min, max, unit, onChange }: StepperProps) {
  const { t } = useTranslation('common')
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
    <div className="flex flex-col items-start gap-2">
      <span className="text-sm text-ink-secondary">{label}</span>
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
