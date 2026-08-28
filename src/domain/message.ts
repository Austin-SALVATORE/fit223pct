/**
 * A domain-originated user-facing string, deferred for translation.
 * Domain stays pure and framework-free — `key` is resolved to display
 * text only in the UI layer (see `src/i18n/useTranslatedMessage.ts`).
 */
export interface MessageDescriptor {
  /** Namespace-qualified key, e.g. 'domain:readiness.drivers.none' */
  key: string
  params?: Record<string, string | number>
}
