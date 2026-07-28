import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { routineById } from '@/data/seed/routines'
import type { LocalizedActivityItem } from '@/i18n/seedProgram'

interface ActivityItemListProps {
  items: readonly LocalizedActivityItem[]
}

/**
 * The list of things a recovery day suggests — shared by Today's activity
 * hero and the Plan day detail, which rendered identical markup separately
 * before this.
 *
 * **An item without a resolvable routine keeps exactly its previous markup,
 * byte for byte.** That is the point rather than an implementation detail:
 * most items are prose and must go on reading as prose, so the absence of an
 * affordance reads as normal rather than as something broken. "Complete rest
 * is a fine choice too" is not a degraded row; it is the row it always was.
 *
 * Resolution is null-safe in both directions — no routineId, or one naming a
 * routine that does not exist, both render as plain text. An imported
 * program citing an unknown routine therefore degrades to today's behaviour
 * instead of to a dead link.
 */
export function ActivityItemList({ items }: ActivityItemListProps) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((item, index) => (
        <li key={index} className="leading-relaxed text-ink-secondary">
          <ActivityItemRow item={item} />
        </li>
      ))}
    </ul>
  )
}

function ActivityItemRow({ item }: { item: LocalizedActivityItem }) {
  const { t } = useTranslation('recovery')
  const routine = item.routineId ? routineById(item.routineId) : undefined

  const text = (
    <>
      <span className="text-ink">{item.label}</span>
      {item.detail && <span className="text-ink-tertiary"> — {item.detail}</span>}
    </>
  )

  if (!routine) return text

  return (
    <Link
      to={`/routine/${routine.id}`}
      className="group inline-flex items-baseline gap-2 rounded-sm transition-colors hover:text-ink"
    >
      {text}
      <span aria-hidden className="text-amber transition-transform group-hover:translate-x-0.5">
        ›
      </span>
      <span className="sr-only">{t('startRoutine')}</span>
    </Link>
  )
}
