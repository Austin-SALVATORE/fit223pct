import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import { PRODUCT_NAME } from '@/lib/brand'

const ROUTE_TITLES: Record<string, string> = {
  '/': PRODUCT_NAME,
  '/library': `${PRODUCT_NAME} — Library`,
  '/progress': `${PRODUCT_NAME} — Progress`,
  '/plan': `${PRODUCT_NAME} — Plan`,
}

/**
 * There is no tab bar — Today is the app, everything else is a supporting
 * surface reached in context (see docs/Design.md, Navigation).
 */
export function AppShell() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  // The pathname actually seen last, not just "have we mounted yet" — a
  // boolean flip is consumed by StrictMode's dev-only double-invoke of
  // mount effects, which would fire focus on first load too.
  const previousPathname = useRef<string | null>(null)

  // SPA navigation gives neither a title update nor a focus move for free —
  // move focus to the new view on route *changes* only, never on first load
  // (that would steal focus the browser already placed correctly).
  useEffect(() => {
    document.title =
      ROUTE_TITLES[location.pathname] ?? `${PRODUCT_NAME} — Exercise`
    if (previousPathname.current !== null && previousPathname.current !== location.pathname) {
      mainRef.current?.focus()
    }
    previousPathname.current = location.pathname
  }, [location.pathname])

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
