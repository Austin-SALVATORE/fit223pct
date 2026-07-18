import type { ReactNode } from 'react'
import { Link } from 'react-router'

/**
 * The grouped-list primitive: a rounded, bordered group of interactive rows.
 *
 * Geometry contract (regression-tested):
 * - The container clips its children (`overflow-hidden`), so no hover/active/
 *   selected background can ever bleed past the rounded corners — first, last,
 *   middle and single rows all inherit correct geometry for free.
 * - Rows therefore MUST use an inset focus ring (`focus-inset`), never the
 *   global offset ring, or clipping would swallow the keyboard indicator.
 * - Rows must not carry shadows or elements that extend outside the group.
 */
export function GroupedList({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <ul
      aria-label={label}
      className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface"
    >
      {children}
    </ul>
  )
}

const rowClassName =
  'flex w-full items-baseline justify-between gap-4 px-4 py-3.5 text-left ' +
  'transition-colors hover:bg-raised active:bg-raised focus-inset'

interface GroupedRowProps {
  children: ReactNode
  /** Link destination; rendered as a plain row when omitted */
  to?: string
  /** Router state passed along with `to` (e.g. navigation origin) */
  state?: unknown
}

export function GroupedRow({ children, to, state }: GroupedRowProps) {
  return (
    <li>
      {to ? (
        <Link to={to} state={state} className={rowClassName}>
          {children}
        </Link>
      ) : (
        <div className={rowClassName}>{children}</div>
      )}
    </li>
  )
}
