import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router'
import { PRODUCT_NAME } from '@/lib/brand'

const ROUTE_TITLE_KEYS: Record<string, string> = {
  '/': 'routeTitle.today',
  '/library': 'routeTitle.library',
  '/progress': 'routeTitle.progress',
  '/plan': 'routeTitle.plan',
  '/settings': 'routeTitle.settings',
}

function titleKeyFor(pathname: string): string {
  if (pathname in ROUTE_TITLE_KEYS) return ROUTE_TITLE_KEYS[pathname]
  // /plan/:date is a Plan sub-route; everything else dynamic is a Library detail.
  if (pathname.startsWith('/plan/')) return 'routeTitle.plan'
  return 'routeTitle.exercise'
}

/**
 * There is no tab bar — Today is the app, everything else is a supporting
 * surface reached in context (see docs/Design.md, Navigation).
 */
export function AppShell() {
  const { t, i18n } = useTranslation('common')
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  // The pathname actually seen last, not just "have we mounted yet" — a
  // boolean flip is consumed by StrictMode's dev-only double-invoke of
  // mount effects, which would fire focus on first load too.
  const previousPathname = useRef<string | null>(null)

  // SPA navigation gives neither a title update nor a focus move for free —
  // move focus to the new view on route *changes* only, never on first load
  // (that would steal focus the browser already placed correctly). Also
  // re-runs on a live language switch (i18n.language in the deps) so the
  // title announces in the active language without needing a navigation.
  useEffect(() => {
    document.title = t(titleKeyFor(location.pathname), { productName: PRODUCT_NAME })
    if (previousPathname.current !== null && previousPathname.current !== location.pathname) {
      mainRef.current?.focus()
    }
    previousPathname.current = location.pathname
  }, [location.pathname, i18n.language, t])

  return (
    <div className="mx-auto w-full max-w-md">
      <main
        ref={mainRef}
        tabIndex={-1}
        className="min-h-dvh px-5 pb-16 pt-[max(1.5rem,env(safe-area-inset-top))]"
      >
        <Outlet />
      </main>
    </div>
  )
}
