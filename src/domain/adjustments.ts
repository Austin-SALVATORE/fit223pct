import { describeDrivers, type Readiness } from './readiness'
import type { MessageDescriptor } from './message'
import type { SessionTemplate } from './types'

export interface Adjustment {
  kind: 'effort' | 'volume'
  reason: MessageDescriptor
}

export interface AdjustedSession {
  session: SessionTemplate
  adjustments: Adjustment[]
}

const MAX_TARGET_RIR = 4

/**
 * Readiness modulation — deliberately small and capped (docs/Readiness.md):
 * an easier day means +1 rep in reserve everywhere and one set less on
 * accessories. Never a rewritten workout, never a reduced main lift, and
 * ready days add nothing — pulling back is better supported than pushing
 * harder. The user can always override in the moment.
 */
export function applyReadiness(
  session: SessionTemplate,
  readiness: Readiness,
): AdjustedSession {
  if (readiness.tier !== 'easier') {
    return { session, adjustments: [] }
  }

  const items = session.items.map((item) => ({
    ...item,
    targetRir: Math.min(item.targetRir + 1, MAX_TARGET_RIR),
    sets: (item.role ?? 'main') === 'accessory' ? Math.max(1, item.sets - 1) : item.sets,
  }))

  const trimmedAccessories = session.items.some(
    (item) => (item.role ?? 'main') === 'accessory' && item.sets > 1,
  )

  const adjustments: Adjustment[] = [
    { kind: 'effort', reason: reasonFor('domain:adjustments.effort', readiness) },
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
