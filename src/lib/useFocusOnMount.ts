import { useEffect, useRef } from 'react'

/**
 * Focuses the returned ref's element once, on mount. Pair with
 * `tabIndex={-1}` on a heading or landmark that isn't normally a tab stop —
 * this gives keyboard and screen-reader users a landing point when a whole
 * subtree is swapped (AnimatePresence phase changes, SPA route changes),
 * instead of silently losing focus to `<body>`.
 */
export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return ref
}
