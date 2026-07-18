import { describeDrivers, type Readiness } from './readiness'
import type { SessionTemplate } from './types'

export interface Adjustment {
  kind: 'effort' | 'volume'
  reason: string
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

  const because = reasonFrom(readiness)

  const items = session.items.map((item) => ({
    ...item,
    targetRir: Math.min(item.targetRir + 1, MAX_TARGET_RIR),
    sets: (item.role ?? 'main') === 'accessory' ? Math.max(1, item.sets - 1) : item.sets,
  }))

  const trimmedAccessories = session.items.some(
    (item) => (item.role ?? 'main') === 'accessory' && item.sets > 1,
  )

  const adjustments: Adjustment[] = [
    {
      kind: 'effort',
      reason: `Keeping an extra rep in reserve today — ${because}.`,
    },
    ...(trimmedAccessories
      ? [
          {
            kind: 'volume' as const,
            reason: `One set less on the small stuff — ${because}.`,
          },
        ]
      : []),
  ]

  return { session: { ...session, items }, adjustments }
}

function reasonFrom(readiness: Readiness): string {
  return describeDrivers(readiness.drivers)
}
