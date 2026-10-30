/**
 * What assistive technology would read out of a node: its text, with every
 * `aria-hidden="true"` subtree skipped and the whitespace collapsed (batch A2).
 *
 * A paragraph has no accessible name to ask for (naming is not allowed on one), so
 * the spoken-text tests, which have to say "this paragraph is read as X and not as
 * Y", need this instead of a role query. It follows the one rule those tests
 * depend on, `aria-hidden`, and nothing else: it knows no CSS (jsdom has none), so a
 * `sr-only` span counts as read, which is right, and a `display: none` would too,
 * which is why nothing here uses one. Anything that needs the full accessible-name
 * computation should use `getByRole(..., { name })` or `toHaveAccessibleName`.
 */
export function heard(node: Node): string {
  const parts: string[] = []
  const walk = (current: Node) => {
    if (current.nodeType === Node.TEXT_NODE) {
      parts.push(current.textContent ?? '')
      return
    }
    if (current instanceof Element && current.getAttribute('aria-hidden') === 'true') return
    current.childNodes.forEach(walk)
  }
  walk(node)
  return parts.join('').replace(/\s+/g, ' ').trim()
}
