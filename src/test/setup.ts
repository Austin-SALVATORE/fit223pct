import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import '@/i18n/i18next'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Auto-cleanup does not register itself when vitest globals are disabled
afterEach(() => {
  cleanup()
})

// jsdom doesn't implement the Pointer Events capture API — Stepper (and
// anything else using onPointerDown/setPointerCapture) throws without this.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {}
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {}
}

// jsdom doesn't implement IntersectionObserver — FrameStepper's
// active-frame tracking is deliberately live-verified only (see its own
// comment); this inert stub exists purely so mounting it in jsdom-based
// page tests (e.g. ExercisePage.test.tsx) doesn't throw. It never fires,
// so no test may assert on active-frame behavior from it.
if (typeof IntersectionObserver === 'undefined') {
  class IntersectionObserverStub implements IntersectionObserver {
    readonly root: Element | Document | null = null
    readonly rootMargin: string = ''
    readonly scrollMargin: string = ''
    readonly thresholds: ReadonlyArray<number> = []
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }
  globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver
}
