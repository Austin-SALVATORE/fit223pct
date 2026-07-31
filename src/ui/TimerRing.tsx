interface TimerRingProps {
  /** Seconds left. */
  remaining: number
  /** Seconds the ring represents when full. */
  total: number
  /**
   * `lg` (default) is the routine player's 208px ring with 48px digits — the
   * size this component was extracted at, and the one screen where the
   * countdown *is* the content.
   *
   * `md` is 160px with 36px digits, for the rest screen, where the countdown
   * has to share the screen with the next set's load. The argument is about
   * which number is actionable: **the countdown asks nothing of you** — when
   * it ends the screen changes by itself — while the load asks you to go
   * change the dumbbells. The big number should be the one attached to an
   * action.
   */
  size?: 'md' | 'lg'
}

/**
 * A countdown ring with the remaining time in its centre.
 *
 * Extracted from RestScreen so the routine player doesn't hand-roll a second
 * SVG ring that drifts from this one.
 *
 * The digits live in `<time aria-live="off">`, which is load-bearing rather
 * than incidental: an implicit live region ticking once a second is a slower
 * version of backlog A10, where Stepper's `<output>` announced ~7 times a
 * second under press-and-hold. Visually live, silent to assistive tech —
 * announcements belong at phase boundaries, carried by focus moves.
 */
export function TimerRing({ remaining, total, size = 'lg' }: TimerRingProps) {
  const md = size === 'md'
  const radius = 88
  const circumference = 2 * Math.PI * radius
  const fraction = total > 0 ? remaining / total : 0
  // Final-seconds emphasis lives on the ring only — the digit itself is a
  // data-critical number and stays a plain, stable readout.
  const almostDone = remaining > 0 && remaining <= 3

  return (
    <div className={`relative mt-6 ${md ? 'h-40 w-40' : 'h-52 w-52'}`}>
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r={radius} fill="none" strokeWidth="6" className="stroke-raised" />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className={`transition-[stroke-dashoffset,stroke] duration-300 ease-linear ${
            almostDone ? 'stroke-clay' : 'stroke-amber'
          }`}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
        />
      </svg>
      <time
        aria-live="off"
        className={`absolute inset-0 flex items-center justify-center font-semibold text-ink ${md ? 'text-4xl' : 'text-5xl'}`}
      >
        {formatClock(remaining)}
      </time>
    </div>
  )
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
