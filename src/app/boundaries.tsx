import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import { ErrorBoundary } from '@/ui/ErrorBoundary'
import { AppCrashFallback, RouteCrashFallback } from './CrashFallback'

/**
 * One failing screen must not take the app, or its neighbours, down:
 *
 *   - `RouteErrorBoundary` wraps a route's screen (Workout Mode, the routine
 *     player, and — inside `AppShell` — whichever shell screen is on). A failure
 *     shows `RouteCrashFallback` in that screen's place and leaves the rest of the
 *     app running; it clears by itself when the athlete navigates elsewhere, and
 *     "try again" remounts the screen.
 *   - `AppErrorBoundary` wraps everything in `App`, for what is not one screen:
 *     the shell, the providers, the route table. It does not reset on navigation
 *     (the failure is not tied to a route); the way out is a reload.
 *
 * Neither touches data — see `ErrorBoundary`.
 */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary resetKey={pathname} fallback={({ reset }) => <RouteCrashFallback onRetry={reset} />}>
      {children}
    </ErrorBoundary>
  )
}

export function AppErrorBoundary({
  children,
  onReload = () => window.location.reload(),
}: {
  children: ReactNode
  /** Reloads the page. A parameter so a test can observe the click; production uses the default. */
  onReload?: () => void
}) {
  return <ErrorBoundary fallback={() => <AppCrashFallback onReload={onReload} />}>{children}</ErrorBoundary>
}
