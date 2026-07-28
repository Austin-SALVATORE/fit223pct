import { StrictMode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { useWakeLock } from './useWakeLock'

/**
 * The wake lock's lifecycle, driven against a fake platform.
 *
 * **What these tests cannot prove.** jsdom has no display and no power
 * management; `platformAutoRelease()` below is *my model of the browser, not
 * the browser*. Everything here shows the hook's logic is correct given that
 * model. In particular a passing re-acquisition test (test 3) is not
 * evidence that re-acquisition works on iOS — there is a real report of iOS
 * refusing exactly that request with NotAllowedError. Confirming it needs a
 * device: play a routine, background the app mid-routine, return, and check
 * the screen still stays awake.
 */

interface FakeSentinel {
  released: boolean
  release: () => Promise<void>
}

function fakePlatform(options: { deferRequests?: boolean } = {}) {
  const sentinels: FakeSentinel[] = []
  let requests = 0
  let releases = 0
  const pending: (() => void)[] = []

  const wakeLock = {
    request: (_type: string) => {
      requests += 1
      const sentinel: FakeSentinel = {
        released: false,
        release: () => {
          if (!sentinel.released) {
            sentinel.released = true
            releases += 1
          }
          return Promise.resolve()
        },
      }
      sentinels.push(sentinel)
      if (!options.deferRequests) return Promise.resolve(sentinel)
      return new Promise<FakeSentinel>((resolve) => pending.push(() => resolve(sentinel)))
    },
  }

  return {
    wakeLock,
    get requests() {
      return requests
    },
    get releases() {
      return releases
    },
    get held() {
      return sentinels.filter((s) => !s.released).length
    },
    /** What the browser does on hide: it releases the lock itself. */
    platformAutoRelease() {
      for (const sentinel of sentinels) {
        if (!sentinel.released) sentinel.released = true
      }
    },
    resolvePending() {
      for (const resolve of pending.splice(0)) resolve()
    },
  }
}

function install(wakeLock: unknown) {
  Object.defineProperty(navigator, 'wakeLock', {
    value: wakeLock,
    configurable: true,
    writable: true,
  })
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

function Probe({ active = true }: { active?: boolean }) {
  useWakeLock(active)
  return <p>routine</p>
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'wakeLock')
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  vi.restoreAllMocks()
})

describe('useWakeLock', () => {
  // 1 — harness sanity: if this fails, nothing below means anything.
  it('jsdom can drive visibilityState and the event', () => {
    const seen: string[] = []
    const listener = () => seen.push(document.visibilityState)
    document.addEventListener('visibilitychange', listener)

    setVisibility('hidden')
    setVisibility('visible')

    document.removeEventListener('visibilitychange', listener)
    expect(seen).toEqual(['hidden', 'visible'])
  })

  // 2
  it('acquires on mount and releases on unmount', async () => {
    const platform = fakePlatform()
    install(platform.wakeLock)

    const { unmount } = render(<Probe />)
    await waitFor(() => expect(platform.requests).toBe(1))

    unmount()
    await waitFor(() => expect(platform.releases).toBe(1))
    expect(platform.held).toBe(0)
  })

  // 3 — the lifecycle case the whole design turns on.
  it('re-acquires after the platform releases the lock on hide', async () => {
    const platform = fakePlatform()
    install(platform.wakeLock)

    render(<Probe />)
    await waitFor(() => expect(platform.requests).toBe(1))

    // The browser releases it itself; our handler must notice on the way back.
    platform.platformAutoRelease()
    setVisibility('hidden')
    setVisibility('visible')

    await waitFor(() => expect(platform.requests).toBe(2))
    expect(platform.held).toBe(1)
  })

  // 4
  it('does not stack locks when visibilitychange fires while one is held', async () => {
    const platform = fakePlatform()
    install(platform.wakeLock)

    render(<Probe />)
    await waitFor(() => expect(platform.requests).toBe(1))

    setVisibility('visible')
    setVisibility('visible')

    await waitFor(() => expect(platform.requests).toBe(1))
    expect(platform.held).toBe(1)
  })

  // 5
  it('never throws when the request is refused', async () => {
    install({ request: () => Promise.reject(new Error('NotAllowedError')) })

    const { getByText } = render(<Probe />)

    await waitFor(() => expect(getByText('routine')).toBeInTheDocument())
  })

  // 6
  it('is a no-op on a platform without the API', async () => {
    Reflect.deleteProperty(navigator, 'wakeLock')

    const { getByText, unmount } = render(<Probe />)

    expect(getByText('routine')).toBeInTheDocument()
    unmount()
  })

  // 7 — StrictMode double-invokes effects, and this app runs in StrictMode.
  it('leaves exactly one lock held under StrictMode double-invocation', async () => {
    const platform = fakePlatform()
    install(platform.wakeLock)

    render(
      <StrictMode>
        <Probe />
      </StrictMode>,
    )

    await waitFor(() => expect(platform.requests).toBe(2))
    await waitFor(() => expect(platform.held).toBe(1))
    expect(platform.releases).toBe(1)
  })

  // 8 — the race: leaving while request() is still in flight.
  it('releases a sentinel that arrives after unmount', async () => {
    const platform = fakePlatform({ deferRequests: true })
    install(platform.wakeLock)

    const { unmount } = render(<Probe />)
    await waitFor(() => expect(platform.requests).toBe(1))

    unmount()
    platform.resolvePending()

    await waitFor(() => expect(platform.held).toBe(0))
  })

  // 9
  it('holds nothing when inactive', async () => {
    const platform = fakePlatform()
    install(platform.wakeLock)

    render(<Probe active={false} />)

    await waitFor(() => expect(platform.requests).toBe(0))
  })
})
