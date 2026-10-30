import type { IsoWeekday } from '@/lib/dates'
import type { ActivityItem, ActivityTemplate, Program, SessionTemplate } from './types'

/**
 * A session's own cooldown: the coach's ruling is that each session has its own
 * named stretching ("Full Body A Stretching") and that it travels with the
 * session, whatever weekday the session lands on.
 *
 * The seed authors it by weekday instead (`weekdayActivities`: Monday carries "Full
 * Body A Stretching", Wednesday B, Friday C). That is right while the rotation
 * and the calendar agree and wrong the moment they do not: Mesocycle 2 Build runs
 * in `rotation` mode (identity follows the completed count, never the calendar), so
 * after a missed session a Monday is session C and still showed A's stretching
 * under "Also today" (QA Q34). The program is frozen, so the fix is here:
 * `activityForSession` swaps the stretching item the weekday brought for the one
 * that belongs to the session actually shown.
 *
 * **How a cooldown is recognised: by its label, `"<session name> Stretching"`.**
 * Nothing in the seed links the two structurally (an `ActivityItem` has no session
 * id), and the repo's own preference is a structural marker over prose
 * (`ActivityItem.recordable`). The convention is real and total in the seeded
 * Mesocycle 2 Build, and `sessionCooldown.test.ts` pins it for that program, so a
 * rename in a later revision fails loudly instead of quietly bringing the bug
 * back. The structural fix, which needs the coach: `ActivityItem` gains an optional
 * `sessionId`, the three stretching items carry it, and this function prefers it.
 * Until then, no match means no change: an item is only ever replaced by another
 * item the program itself authored, and nothing is invented or removed.
 *
 * An item that is not another session's cooldown (the ride, a generic "Optional
 * gentle stretching") is never touched, and a day whose weekday already brought
 * the right cooldown comes back as the same object.
 */

/** Where a swapped-in item was authored, so its text still resolves under its own locale keys. */
export interface ItemSource {
  weekday: IsoWeekday
  index: number
}

/**
 * An item that came from another weekday's activity. `useLocalizedActivity` reads
 * `source` so the item's label and detail translate under THEIR keys
 * (`program.<id>.activity.<weekday>.item.<index>.*`), not under the weekday the rest
 * of the activity belongs to.
 */
export interface ResolvedActivityItem extends ActivityItem {
  source?: ItemSource
}

const COOLDOWN_SUFFIX = ' Stretching'

/** The label a session's own cooldown carries in the seed. */
export function cooldownLabelFor(session: Pick<SessionTemplate, 'name'>): string {
  return `${session.name}${COOLDOWN_SUFFIX}`
}

const WEEKDAYS: readonly IsoWeekday[] = [1, 2, 3, 4, 5, 6, 7]

function findCooldown(
  program: Program,
  label: string,
): { weekday: IsoWeekday; index: number; item: ActivityItem } | undefined {
  for (const weekday of WEEKDAYS) {
    const items = program.weekdayActivities?.[weekday]?.items ?? []
    const index = items.findIndex((item) => item.label === label)
    if (index >= 0) return { weekday, index, item: items[index] }
  }
  return undefined
}

/**
 * `activity` as it should read on a day whose session is `session`: any other
 * session's cooldown in it is replaced by `session`'s own, taken from wherever the
 * program authored it. Pure: returns `activity` itself when nothing changes.
 */
export function activityForSession(
  program: Program,
  activity: ActivityTemplate,
  session: SessionTemplate,
): ActivityTemplate {
  const others = new Set(program.sessions.filter((s) => s.id !== session.id).map(cooldownLabelFor))
  if (!activity.items.some((item) => others.has(item.label))) return activity

  const own = findCooldown(program, cooldownLabelFor(session))
  if (own === undefined) return activity

  return {
    ...activity,
    items: activity.items.map((item): ResolvedActivityItem =>
      others.has(item.label) ? { ...own.item, source: { weekday: own.weekday, index: own.index } } : item,
    ),
  }
}
