import { NavLink, Outlet } from 'react-router'

const tabs = [
  { to: '/', label: 'Today', icon: TodayIcon },
  { to: '/library', label: 'Library', icon: LibraryIcon },
] as const

export function AppShell() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main className="flex-1 px-5 pb-28 pt-6">
        <Outlet />
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 border-t border-border bg-bg/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex max-w-md">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  isActive ? 'text-amber' : 'text-ink-tertiary hover:text-ink-secondary'
                }`
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

function TodayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  )
}

function LibraryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4h3A1.5 1.5 0 0 1 10 5.5v13A1.5 1.5 0 0 1 8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-13Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M13.5 6.2a1.5 1.5 0 0 1 1.1-1.8l2.9-.7a1.5 1.5 0 0 1 1.8 1.1l3 12.6a1.5 1.5 0 0 1-1.1 1.8l-2.9.7a1.5 1.5 0 0 1-1.8-1.1l-3-12.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}
