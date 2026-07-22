import { describeDrivers, type Readiness } from './readiness'
import type { MessageDescriptor } from './message'
import type { SessionTemplate } from './types'

export interface Adjustment {
  kind: 'volume'
  reason: MessageDescriptor
}

export interface AdjustedSession {
  session: SessionTemplate
  adjustments: Adjustment[]
}

const MIN_LADDER_RUNGS = 2

/**
 * Readiness modulation — deliberately small and capped (docs/Readiness.md):
 * an easier day drops the top (heaviest) rung of every ladder — the day's
 * stress peak — never below two rungs, and trims one set off accessories.
 * Never a rewritten workout, never a reduced rep-range main lift (the
 * reserve-based easing that used to live here is gone with RIR; rep-range
 * work's own easing is suggestProgression's readinessTier branch, a
 * separate mechanism), and ready days add nothing. The user can always
 * override in the moment.
 *
 * A session can genuinely have zero adjustments on an easier day now — no
 * ladder to shorten, no accessory to trim — and that's reported honestly
 * as an empty list, not padded with an adjustment that didn't happen. The
 * readiness tier itself still displays elsewhere; this only governs the
 * session-specific "Adjusted" badge.
 */
export function applyReadiness(
  session: SessionTemplate,
  readiness: Readiness,
): AdjustedSession {
  if (readiness.tier !== 'easier') {
    return { session, adjustments: [] }
  }

  const items = session.items.map((item) => {
    if (item.setPlan) {
      const setPlan =
        item.setPlan.length > MIN_LADDER_RUNGS ? item.setPlan.slice(0, -1) : item.setPlan
      return { ...item, setPlan, sets: setPlan.length }
    }
    if ((item.role ?? 'main') === 'accessory') {
      return { ...item, sets: Math.max(1, item.sets - 1) }
    }
    return item
  })

  const shortenedLadder = session.items.some(
    (item) => item.setPlan && item.setPlan.length > MIN_LADDER_RUNGS,
  )
  const trimmedAccessories = session.items.some(
    (item) => !item.setPlan && (item.role ?? 'main') === 'accessory' && item.sets > 1,
  )

  const adjustments: Adjustment[] = [
    ...(shortenedLadder
      ? [{ kind: 'volume' as const, reason: reasonFor('domain:adjustments.ladderTopSet', readiness) }]
      : []),
    ...(trimmedAccessories
      ? [{ kind: 'volume' as const, reason: reasonFor('domain:adjustments.volume', readiness) }]
      : []),
  ]

  return { session: { ...session, items }, adjustments }
}

/**
 * Composes a translated sentence around the driver phrase via i18next
 * nesting (`$t({{driversKey}})` in the locale file) — the driver
 * descriptor's own key varies by driver count, so it's passed through as a
 * param rather than resolved here, keeping this function locale-blind.
 */
function reasonFor(key: string, readiness: Readiness): MessageDescriptor {
  const because = describeDrivers(readiness.drivers)
  return { key, params: { driversKey: because.key, ...because.params } }
}
