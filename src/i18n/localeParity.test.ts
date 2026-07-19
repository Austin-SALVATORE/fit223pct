import { describe, expect, it } from 'vitest'
import { NAMESPACES, SUPPORTED_LOCALES } from './i18next'

/**
 * Every locale must declare the same keys as English (values may be
 * placeholders pending translation, but a missing key would silently fall
 * back — this test is what actually catches that drift).
 */
function collectKeyPaths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value).flatMap(([childKey, childValue]) =>
    collectKeyPaths(childValue, prefix ? `${prefix}.${childKey}` : childKey),
  )
}

describe('locale key parity', () => {
  const localeModules = import.meta.glob('../locales/*/*.json', { eager: true })

  for (const namespace of NAMESPACES) {
    it(`${namespace}.json has identical keys across every locale`, () => {
      const keysByLocale = new Map<string, string[]>()
      for (const locale of SUPPORTED_LOCALES) {
        const mod = localeModules[`../locales/${locale}/${namespace}.json`] as
          | { default: unknown }
          | undefined
        expect(mod, `missing locale file: src/locales/${locale}/${namespace}.json`).toBeDefined()
        keysByLocale.set(locale, collectKeyPaths(mod?.default).sort())
      }

      const [englishKeys, ...rest] = SUPPORTED_LOCALES.map((locale) => keysByLocale.get(locale))
      for (const [index, locale] of SUPPORTED_LOCALES.slice(1).entries()) {
        expect(rest[index], `${namespace}.json keys for ${locale} vs en`).toEqual(englishKeys)
      }
    })
  }
})
