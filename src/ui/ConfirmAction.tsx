import { useId } from 'react'
import { useFocusOnMount } from '@/lib/useFocusOnMount'

interface ConfirmActionProps {
  heading: string
  /** The destructive consequence, wired as the heading's description. */
  warning: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * A confirm step that replaces, in place, the control the user just acted on.
 *
 * Extracted from SwapSheet's ConfirmClear (d5fdb34, backlog A1) because the
 * pattern is not sheet-specific — it is what a destructive confirm has to do
 * anywhere: the branch swap unmounts the focused element, so this subtree
 * must claim the focus its predecessor lost, or focus falls to `<body>` and
 * the user is told nothing.
 *
 * Two details carry that, and both are load-bearing:
 *  - the heading takes focus on mount (`tabIndex={-1}` + useFocusOnMount), so
 *    focus never leaves the surrounding dialog and Escape handlers bound to
 *    it keep working;
 *  - the warning is the heading's `aria-describedby`, not a live region. It
 *    is present at mount, which is exactly when a live region is least
 *    reliable, and the destructive consequence is the one thing the user
 *    must hear before confirming.
 *
 * Owns no copy — callers pass resolved strings, so it works across
 * namespaces and stays free of i18n.
 */
export function ConfirmAction({
  heading,
  warning,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmActionProps) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  const warningId = useId()
  return (
    <>
      <h2 ref={headingRef} tabIndex={-1} aria-describedby={warningId} className="eyebrow">
        {heading}
      </h2>
      <p id={warningId} className="mt-3 text-sm text-ink-secondary">
        {warning}
      </p>
      <button
        type="button"
        onClick={onConfirm}
        className="mt-4 w-full rounded-card bg-amber py-3 text-center text-sm font-semibold text-bg"
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="mt-2 w-full rounded-card border border-border py-3 text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
      >
        {cancelLabel}
      </button>
    </>
  )
}
