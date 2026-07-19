import { afterEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n/i18next'

/**
 * M7 Phase 10's other acceptance test: a key present only in English must
 * still render (via i18next's fallbackLng, not a raw key or blank string),
 * and dev mode must not swallow the gap — missingKeyHandler in i18next.ts
 * should log it, matching the spec's "never silent" invariant.
 *
 * A synthetic namespace (not one of the app's real NAMESPACES) keeps this
 * isolated from the real locale files and the parity test.
 */
const NAMESPACE = 'i18nFallbackProbe'
const KEY = 'onlyInEnglish'
const ENGLISH_TEXT = 'Fallback text works'

afterEach(async () => {
  i18n.removeResourceBundle('en', NAMESPACE)
  await i18n.changeLanguage('en')
})

describe('missing-key fallback', () => {
  it('falls back to the English string when the active locale lacks the key', async () => {
    i18n.addResourceBundle('en', NAMESPACE, { [KEY]: ENGLISH_TEXT })
    await i18n.changeLanguage('fr')

    expect(i18n.t(`${NAMESPACE}:${KEY}`)).toBe(ENGLISH_TEXT)
  })

  it('logs a key missing from every locale instead of failing silently', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const missingKey = 'notDefinedAnywhere'

    i18n.t(`${NAMESPACE}:${missingKey}`)

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining(`${NAMESPACE}:${missingKey}`))
    errorSpy.mockRestore()
  })
})
