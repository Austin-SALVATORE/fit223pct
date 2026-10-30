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

  // **The button is the same width in every state (batch A2, QA).** The two states
  // print different words ("Démarrer le maintien" idle, "12s — Arrêter" running), so
  // the pill used to change width the instant it was pressed: fr 172 -> 124px, en
  // 99 -> 107, zh 91 -> 113. Nothing around it moved, but the target the thumb had
  // just pressed changed size under it, and, on the running side, again at 10 s and
  // at 100 s when the count gained a digit. The cure is to size the pill by what it
  // *could* say, not by what it says: both states carry the same two invisible
  // lines, the idle label and the longest running label with its count reserved at
  // three digits, stacked in one grid cell, so the width is the widest of them in
  // whichever language this is, with no per-language number to keep right. They are
  // `aria-hidden`, so the accessible name is untouched, and `font-semibold`, the
  // heavier weight, so the reserved width is the same whichever state is drawn.
  const sizing = (
    <>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 font-semibold">
        {t('holdTimer.start')}
      </span>
      {/* The same inline structure as the real running label (a `<time>`, a space, the suffix), not one text run:
          measured, a single run was 0.03px narrower than the real label at 100s, from how the text is shaped.
          Even so, "100s" came out one layout unit (1/64px) wider than "000s". `pr-px` is 1px of slack on the widest
          line, so the real label can never exceed it and the button's width is exactly the ghost's in every state. */}
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 pr-px font-semibold">
        <time data-numeric>000s</time>{' '}
        {t('holdTimer.stopSuffix')}
      </span>
    </>
  )

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
          className="inline-grid min-h-11 place-items-center rounded-full border border-amber bg-amber/10 px-4 text-sm font-semibold text-amber transition-colors"
        >
          {/* The real label first: tests and readers take the first `<time>` in the button as the count. */}
          <span className="col-start-1 row-start-1">
            <time aria-hidden="true" data-numeric>
              {elapsed}s
            </time>{' '}
            {t('holdTimer.stopSuffix')}
          </span>
          {sizing}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setElapsed(0)
            setStartedAt(Date.now())
          }}
          className="inline-grid min-h-11 place-items-center rounded-full border border-border px-4 text-sm font-medium text-ink-secondary transition-colors hover:border-border-strong hover:text-ink"
        >
          <span className="col-start-1 row-start-1">{t('holdTimer.start')}</span>
          {sizing}
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
