import { useEffect } from 'react'

/**
 * Keeps the screen awake while `active`.
 *
 * A hands-free routine means no touch input for ten minutes, so the display
 * sleeps exactly when the next stretch needs to be visible (owner ruling 4,
 * docs/RecoveryRoutines.md).
 *
 * **The types are optimistic.** TypeScript's DOM lib declares
 * `navigator.wakeLock` as non-optional, so `navigator.wakeLock.request(…)`
 * typechecks cleanly and throws at runtime on any platform without the API
 * (iOS before 16.4, any non-secure context). This codebase has met that
 * before and handled it in one line — `navigator.storage?.persist()` in
 * main.tsx, where `storage` is likewise declared non-optional. Same
 * treatment here: feature-detect despite the type, swallow the rejection, no
 * `@ts-expect-error` and no ambient redeclaration.
 *
 * **The platform releases the lock itself whenever the document is hidden**,
 * so re-acquiring on `visibilitychange` is not a refinement — without it the
 * first glance at a notification ends the lock for the rest of the routine.
 *
 * `active` tracks "is a routine playing", not "is the timer running": pause
 * keeps the lock, because a screen going dark while you adjust your position
 * is the identical defect this exists to prevent. The end screen sets it
 * false, so a finished routine lets the screen sleep normally.
 *
 * Degrades silently and completely — if the API is missing or the request is
 * refused, the routine runs identically with a screen that may sleep.
 * Nothing is surfaced to the user, because it is advice they cannot act on.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    let cancelled = false
    let sentinel: WakeLockSentinel | null = null

    const acquire = async () => {
      // Requesting while hidden rejects by specification; no point generating
      // a rejection just to catch it.
      if (cancelled || document.visibilityState !== 'visible') return
      const api = navigator.wakeLock as WakeLock | undefined
      if (!api) return
      try {
        const next = await api.request('screen')
        if (cancelled) {
          // Left the routine while the request was still pending. Without
          // this the sentinel arrives after unmount and is never released —
          // the screen then stays awake on the Today page.
          void next.release().catch(() => {})
          return
        }
        sentinel = next
      } catch {
        // NotAllowedError, low battery, platform policy — degrade, never block.
      }
    }

    const handleVisibility = () => {
      // The `released` check prevents stacking a second lock when
      // visibilitychange fires while one is still held.
      if (document.visibilityState === 'visible' && (sentinel === null || sentinel.released)) {
        void acquire()
      }
    }

    void acquire()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      const held = sentinel
      sentinel = null
      if (held && !held.released) void held.release().catch(() => {})
    }
  }, [active])
}
