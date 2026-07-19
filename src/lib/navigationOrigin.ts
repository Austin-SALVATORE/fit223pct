/**
 * Where a detail-page visit came from. Passed as router state so Back
 * always returns to the user's actual origin — never forces a trip through
 * an intermediate page. Direct URLs fall back to Today: history can't be
 * trusted to contain an in-app entry.
 */
export type NavigationOrigin = 'today' | 'library' | 'workout' | 'progress' | 'plan' | 'plan-day'

export interface OriginState {
  from: NavigationOrigin
  /** Only meaningful for 'plan-day' — which day to return to */
  date?: string
}

export interface OriginTarget {
  path: string
  /** Namespace-qualified i18next key — resolve via t() at render time */
  labelKey: string
}

const STATIC_ORIGIN_TARGETS: Record<Exclude<NavigationOrigin, 'plan-day'>, OriginTarget> = {
  today: { path: '/', labelKey: 'common:nav.today' },
  library: { path: '/library', labelKey: 'common:nav.library' },
  workout: { path: '/workout', labelKey: 'common:nav.workout' },
  progress: { path: '/progress', labelKey: 'common:nav.progress' },
  plan: { path: '/plan', labelKey: 'common:nav.plan' },
}

const KNOWN_ORIGINS: readonly NavigationOrigin[] = [
  'today',
  'library',
  'workout',
  'progress',
  'plan',
  'plan-day',
]

export function resolveOrigin(state: unknown): OriginState {
  if (
    typeof state === 'object' &&
    state !== null &&
    'from' in state &&
    typeof state.from === 'string' &&
    (KNOWN_ORIGINS as readonly string[]).includes(state.from)
  ) {
    const date = 'date' in state && typeof state.date === 'string' ? state.date : undefined
    return { from: state.from as NavigationOrigin, date }
  }
  return { from: 'today' }
}

export function originTarget(origin: OriginState): OriginTarget {
  if (origin.from === 'plan-day') {
    return origin.date
      ? { path: `/plan/${origin.date}`, labelKey: 'library:backLink.day' }
      : { path: '/plan', labelKey: 'common:nav.plan' }
  }
  return STATIC_ORIGIN_TARGETS[origin.from]
}
