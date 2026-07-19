import { useEffect, useState } from 'react'

interface HoldTimerProps {
  onComplete: (seconds: number) => void
}

/**
 * Tap-to-start count-up for hold-mode sets (side plank, dead hang) — there's
 * otherwise no way to time a hold, only to manually enter a guess in the
 * Stepper below. Stopping here pre-fills that Stepper; it stays editable
 * after, so a mistimed tap is never unrecoverable.
 */
export function HoldTimer({ onComplete }: HoldTimerProps) {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (startedAt === null) return
    const tick = setInterval(() => setElapsed(secondsSince(startedAt)), 250)
    return () => clearInterval(tick)
  }, [startedAt])

  if (startedAt === null) {
    return (
      <button
        type="button"
        onClick={() => {
          setElapsed(0)
          setStartedAt(Date.now())
        }}
        className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
      >
        Start hold
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        onComplete(Math.max(1, elapsed))
        setStartedAt(null)
      }}
      // Stable while running, deliberately — a label that re-announces
      // every second would interrupt a screen reader user mid-hold. The
      // visible/tabular count is enough; the final value lands in the
      // Stepper on stop.
      aria-label="Stop hold"
      className="rounded-full border border-amber bg-amber/10 px-4 py-2 text-sm font-semibold text-amber transition-colors"
    >
      <time aria-live="off" data-numeric>
        {elapsed}s
      </time>{' '}
      — Stop
    </button>
  )
}

function secondsSince(startedAt: number): number {
  return Math.floor((Date.now() - startedAt) / 1000)
}
