/**
 * Where an exercise-detail visit came from. Passed as router state so Back
 * always returns to the user's actual origin — never forces a trip through
 * Library ("Today is the app"). Direct URLs fall back to Today: history
 * can't be trusted to contain an in-app entry.
 */
export type NavigationOrigin = 'today' | 'library' | 'workout'

export interface OriginTarget {
  path: string
  label: string
}

const ORIGIN_TARGETS: Record<NavigationOrigin, OriginTarget> = {
  today: { path: '/', label: 'Today' },
  library: { path: '/library', label: 'Library' },
  workout: { path: '/workout', label: 'Workout' },
}

export function resolveOrigin(state: unknown): NavigationOrigin {
  if (
    typeof state === 'object' &&
    state !== null &&
    'from' in state &&
    typeof state.from === 'string' &&
    state.from in ORIGIN_TARGETS
  ) {
    return state.from as NavigationOrigin
  }
  return 'today'
}

export function originTarget(origin: NavigationOrigin): OriginTarget {
  return ORIGIN_TARGETS[origin]
}
