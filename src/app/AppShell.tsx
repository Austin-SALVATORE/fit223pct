import { Outlet } from 'react-router'

/**
 * There is no tab bar — Today is the app, everything else is a supporting
 * surface reached in context (see docs/Design.md, Navigation).
 */
export function AppShell() {
  return (
    <div className="mx-auto w-full max-w-md">
      <main className="min-h-dvh px-5 pb-16 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <Outlet />
      </main>
    </div>
  )
}
