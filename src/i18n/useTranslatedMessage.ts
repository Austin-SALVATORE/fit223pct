import { useTranslation } from 'react-i18next'
import type { MessageDescriptor } from '@/domain/message'

/** Renders one domain-originated {@link MessageDescriptor} as display text. */
export function useTranslatedMessage(message: MessageDescriptor): string {
  const { t } = useTranslation()
  return t(message.key, message.params)
}
