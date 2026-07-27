import { useEffect, useRef } from 'react'

/**
 * Focuses the returned ref's element when `active` flips false → true —
 * never on the first render.
 *
 * The sibling of `useFocusOnMount`, for the case that one gets wrong: a
 * conditional branch that swaps *in place* as a result of the user acting.
 * When the branch the user was inside unmounts, focus falls to `<body>` —
 * outside any dialog, past the end of the page for a screen reader, and
 * with nothing announcing what just happened (docs/review-backlog.md A1,
 * A2).
 *
 * Mount-triggered focus can't express this. The collapsed check-in card
 * also mounts on an ordinary page load, where stealing focus would be
 * wrong; only the *transition* into it deserves focus. Hence the
 * skip-the-first-render behaviour, which is the whole difference between
 * the two hooks.
 *
 * Pair with `tabIndex={-1}` when the target isn't already a tab stop.
 */
export function useFocusOnChange<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null)
  const wasActive = useRef(active)
  useEffect(() => {
    if (active && !wasActive.current) ref.current?.focus()
    wasActive.current = active
  }, [active])
  return ref
}
