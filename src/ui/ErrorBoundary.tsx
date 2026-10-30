import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  /** What to show instead of the children while one of them is failing. */
  fallback: (state: { error: Error; reset: () => void }) => ReactNode
  /**
   * A value that, when it changes, clears a standing failure and tries the
   * children again — a route boundary passes the pathname, so leaving a failed
   * screen is enough to recover from it. Omitted, only `reset` clears the error.
   */
  resetKey?: string
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches a render-time throw below it and shows a fallback instead of a blank
 * page. Without one, a single failing component unmounts the whole React tree
 * (React 19 removes the root on an uncaught render error), including Today.
 *
 * **It only ever shows a fallback.** It reads and writes no storage, calls no
 * network, and sends nothing anywhere (no telemetry — the app has no backend): an
 * in-progress workout lives in Dexie and a boundary must be unable to touch it.
 * The error goes to `console.error`, which is where a person debugging a device
 * looks, and nowhere else. `ErrorBoundary.guard.test.ts` holds the import list to
 * that.
 *
 * **Reset retries on fresh instances.** While the fallback shows, the children
 * are unmounted, so clearing the error mounts them anew, with none of the state
 * that failed (a `useLiveQuery` keeps the rejection it caught only while it is
 * mounted). "Try again" is therefore a real retry, not a replay.
 *
 * A class component because React has no hook for this: `getDerivedStateFromError`
 * and `componentDidCatch` exist only on classes.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('A screen failed to render', error, info.componentStack)
  }

  componentDidUpdate(previous: ErrorBoundaryProps): void {
    if (this.state.error !== null && previous.resetKey !== this.props.resetKey) this.reset()
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    if (this.state.error !== null) {
      return this.props.fallback({ error: this.state.error, reset: this.reset })
    }
    return this.props.children
  }
}
