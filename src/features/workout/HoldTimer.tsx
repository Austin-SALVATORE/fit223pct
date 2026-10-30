import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface HoldTimerProps {
  onComplete: (seconds: number) => void
}

/**
 * Seconds between the times a screen reader is told (batch A1, backlog A11).
 *
 * Ten, and for a reason: the holds in this program run 20 to 60 seconds, so
 * this speaks two to six times per hold, each a one-second phrase. Every second
 * is the flood A10 measured on the Stepper (7 to 18 announcements a second at
 * the time) and would talk over the athlete's own breathing and form cues; five
 * is a metronome (12 a minute); and under ten seconds nothing is said at all, so
 * a short hold is not narrated. It is a constant, not a setting: whether to
 * speak at all, and how often, is a preference this app has no screen for yet.
 */
const ANNOUNCE_EVERY_SECONDS = 10

/**
 * Tap-to-start count-up for hold-mode sets (side plank, dead hang) — there's
 * otherwise no way to time a hold, only to manually enter a guess in the
 * Stepper below. Stopping here pre-fills that Stepper; it stays editable
 * after, so a mistimed tap is never unrecoverable.
 *
 * **Reaching the time without a flood (A11).** The visible count lives inside
 * the Stop button, and that was unreachable to a screen reader twice over: the
 * button's `aria-label` overrides its content, and a button's children are
 * presentational anyway. In the browser's accessibility tree the elapsed count
 * was carried by no node at all; the only way to learn it was to stop and read
 * the Stepper. Three pieces now carry it, none of which announces every second:
 *
 *   - A visually hidden `role="timer"` ("12 seconds elapsed") before the button
 *     in reading order. A timer is not live by default, so it updates every
 *     second without speaking, and a screen reader user swipes to it and hears
 *     the current value whenever they want it.
 *   - A visually hidden polite `role="status"`, mounted before the hold starts
 *     (a live region inserted with its text already in it is often not
 *     announced) that says "Hold started" and then the time every
 *     `ANNOUNCE_EVERY_SECONDS`.
 *   - The Stop button keeps a stable name ("Stop hold"), as before: a label that
 *     changed every second is the thing this comment used to refuse, and screen
 *     readers disagree about re-announcing a focused control's changing name.
 *
 * The visible `<time>` is hidden from assistive technology, since the timer
 * carries it in words ("12 seconds elapsed" rather than "12 s").
 *
 * The button is one element in both states, at the same position among its
 * siblings, so React keeps the DOM node and keyboard focus survives starting and
 * stopping; the timer sits before it and is absent when idle, which keeps the
 * button's position fixed.
 */
export function HoldTimer({ onComplete }: HoldTimerProps) {
  const { t } = useTranslation('workout')
  const timerId = useId()
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (startedAt === null) return
    const tick = setInterval(() => setElapsed(secondsSince(startedAt)), 250)
    return () => clearInterval(tick)
  }, [startedAt])

  const running = startedAt !== null
  // Derived from `elapsed`, so the text changes only at multiples of the cadence
  // and the live region needs no effect or extra state of its own.
  const announcement = !running
    ? ''
    : elapsed >= ANNOUNCE_EVERY_SECONDS
      ? t('holdTimer.elapsed', { count: Math.floor(elapsed / ANNOUNCE_EVERY_SECONDS) * ANNOUNCE_EVERY_SECONDS })
      : t('holdTimer.startedAnnouncement')

  return (
    <>
      {running && (
        <time id={timerId} role="timer" dateTime={`PT${elapsed}S`} className="sr-only">
          {t('holdTimer.elapsed', { count: elapsed })}
        </time>
      )}
      {running ? (
        <button
          type="button"
          onClick={() => {
            onComplete(Math.max(1, elapsed))
            setStartedAt(null)
          }}
          // Stable while running, deliberately; the time is in the timer above.
          aria-label={t('holdTimer.stopAriaLabel')}
          className="inline-flex min-h-11 items-center rounded-full border border-amber bg-amber/10 px-4 text-sm font-semibold text-amber transition-colors"
        >
          <time aria-hidden="true" data-numeric>
            {elapsed}s
          </time>{' '}
          {t('holdTimer.stopSuffix')}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setElapsed(0)
            setStartedAt(Date.now())
          }}
          className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-medium text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
        >
          {t('holdTimer.start')}
        </button>
      )}
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </>
  )
}

function secondsSince(startedAt: number): number {
  return Math.floor((Date.now() - startedAt) / 1000)
}
