interface RatingOption {
  value: number
  /** Visible glyph, e.g. "3" or "4+" */
  display: string
}

interface RatingPickerProps {
  label: string
  options: RatingOption[]
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
}

/**
 * A small set of mutually-exclusive numeric choices (e.g. a 1–5 readiness rating).
 *
 * Deliberately plain toggle buttons (`aria-pressed`), not `role="radio"`:
 * the ARIA radio pattern promises arrow-key roving-tabindex navigation,
 * which this component does not implement, so claiming the role would
 * promise screen-reader and keyboard behavior that isn't there. A labelled
 * button group is honest about what it actually does — Tab moves through
 * every option, Enter/Space selects.
 */
export function RatingPicker({ label, options, value, onChange, disabled }: RatingPickerProps) {
  return (
    <div role="group" aria-label={label} className="flex justify-center gap-1.5">
      {options.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            aria-label={`${label}: ${option.display}`}
            disabled={disabled}
            data-numeric
            onClick={() => onChange(option.value)}
            className={`h-11 w-11 rounded-full border text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 ${
              selected
                ? 'border-amber bg-amber/15 text-amber'
                : 'border-border text-ink-secondary hover:border-border-strong'
            }`}
          >
            {option.display}
          </button>
        )
      })}
    </div>
  )
}
