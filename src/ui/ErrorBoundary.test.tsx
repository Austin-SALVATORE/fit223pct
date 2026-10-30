import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from './ErrorBoundary'

/**
 * The generic boundary: a render-time throw below it becomes a fallback instead
 * of unmounting the app, "reset" really retries (the children come back as new
 * instances), a changed `resetKey` recovers by itself, and the error is logged to
 * the console and nowhere else.
 *
 * React itself logs a caught render error, so `console.error` is silenced and
 * asserted on instead of being left to clutter the run.
 *
 * Negative controls, run 30 Oct (mutation applied, the whole suite run, restored and
 * `cmp`ed):
 *   `getDerivedStateFromError` removed (the throw escapes the boundary)
 *                         -> "shows the fallback ... leaves its siblings alone",
 *                            "reset retries", "a changed resetKey" here (3), and eleven
 *                            App.crash tests (14 red in all)
 *   `reset` does not clear the error
 *                         -> "reset retries on fresh instances", "a changed resetKey"
 *                            here, and two App.crash tests (4 red)
 *   `componentDidUpdate` (the `resetKey` recovery) removed
 *                         -> "a changed resetKey clears the failure" and App.crash's
 *                            "navigating away from a failed shell screen" (2 red)
 *   `componentDidCatch` removed
 *                         -> "logs the error to the console" (1 red)
 */

let errorSpy: MockInstance<typeof console.error>
beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  errorSpy.mockRestore()
})

function Bomb({ message = 'boom' }: { message?: string }): never {
  throw new Error(message)
}

/** Works until its button is pressed, then fails on the next render; a fresh instance works again. */
function Breakable() {
  const [broken, setBroken] = useState(false)
  if (broken) throw new Error('broke after a press')
  return <button onClick={() => setBroken(true)}>break</button>
}

describe('ErrorBoundary', () => {
  it('renders its children when nothing throws', () => {
    render(
      <ErrorBoundary fallback={() => <p>fallback</p>}>
        <p>fine</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('fine')).toBeInTheDocument()
    expect(screen.queryByText('fallback')).toBeNull()
  })

  it('shows the fallback instead of unmounting the app when a child throws, and leaves its siblings alone', () => {
    render(
      <>
        <p>sibling</p>
        <ErrorBoundary fallback={({ error }) => <p>fallback: {error.message}</p>}>
          <Bomb message="kaboom" />
        </ErrorBoundary>
      </>,
    )
    expect(screen.getByText('fallback: kaboom')).toBeInTheDocument()
    expect(screen.getByText('sibling')).toBeInTheDocument()
  })

  it('logs the error to the console, with the component stack', () => {
    render(
      <ErrorBoundary fallback={() => <p>fallback</p>}>
        <Bomb message="logged" />
      </ErrorBoundary>,
    )
    const ours = errorSpy.mock.calls.find((call) => call[0] === 'A screen failed to render')
    expect(ours).toBeDefined()
    const logged = ours?.[1] as Error | undefined
    expect(logged?.message).toBe('logged')
    expect(typeof ours?.[2]).toBe('string')
  })

  it('reset retries on fresh instances: the state that failed is gone', async () => {
    render(
      <ErrorBoundary fallback={({ reset }) => <button onClick={reset}>retry</button>}>
        <Breakable />
      </ErrorBoundary>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'break' }))
    await userEvent.click(screen.getByRole('button', { name: 'retry' }))
    // A new Breakable, whose state starts unbroken — not the failed one re-rendered.
    expect(screen.getByRole('button', { name: 'break' })).toBeInTheDocument()
  })

  it('a changed resetKey clears the failure', () => {
    const view = (key: string, fails: boolean) => (
      <ErrorBoundary resetKey={key} fallback={() => <p>fallback</p>}>
        {fails ? <Bomb /> : <p>working</p>}
      </ErrorBoundary>
    )
    const { rerender } = render(view('/a', true))
    expect(screen.getByText('fallback')).toBeInTheDocument()
    // Same key: a standing failure stays.
    rerender(view('/a', false))
    expect(screen.getByText('fallback')).toBeInTheDocument()
    // A new key (the athlete navigated away): it recovers.
    rerender(view('/b', false))
    expect(screen.getByText('working')).toBeInTheDocument()
  })
})
