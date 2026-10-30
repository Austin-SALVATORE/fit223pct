import { createContext, useContext, type ReactNode, type Ref } from 'react'

/**
 * Whether a `<main>` landmark is already rendered above. A page may only have
 * one (WCAG 1.3.1, and the landmark navigation screen readers offer), but two
 * different things render a screen's main: `AppShell` for every ordinary route,
 * and a full-screen takeover that mounts outside the shell (Workout Mode:
 * "no shell chrome", `App.tsx`). Each asks for `Main`; whichever is outermost
 * gets the `<main>`, and one nested inside it gets a plain `<div>`, so the page
 * has exactly one however the screens are composed, and a screen that moves in
 * or out of the shell later cannot start a duplicate.
 */
const InsideMain = createContext(false)

interface MainProps {
  className?: string
  /** AppShell moves focus to the landmark on route changes, so it needs the element. */
  ref?: Ref<HTMLElement>
  tabIndex?: number
  children: ReactNode
}

export function Main({ className, ref, tabIndex, children }: MainProps) {
  const inside = useContext(InsideMain)
  if (inside) {
    // Nested: no second landmark. A `<div>` keeps the layout classes; the ref and
    // tab stop belong to the outermost landmark only.
    return <div className={className}>{children}</div>
  }
  return (
    <InsideMain.Provider value>
      <main ref={ref} tabIndex={tabIndex} className={className}>
        {children}
      </main>
    </InsideMain.Provider>
  )
}
