import { vi } from 'vitest'

/**
 * Test-only stand-in for the `virtual:pwa-register` module, aliased in
 * vitest.config.ts. Vite resolves that specifier via the VitePWA plugin at
 * build time, which isn't wired into the test environment — vi.mock can't
 * intercept a specifier Vite's import analysis fails to resolve at all.
 */
export const applyUpdate = vi.fn().mockResolvedValue(undefined)
export let onNeedRefresh: (() => void) | null = null

export function registerSW(options: { onNeedRefresh?: () => void } = {}) {
  onNeedRefresh = options.onNeedRefresh ?? null
  return applyUpdate
}

export function resetPwaRegisterMock() {
  applyUpdate.mockClear()
  onNeedRefresh = null
}
