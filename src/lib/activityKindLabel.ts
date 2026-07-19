import { useTranslation } from 'react-i18next'
import type { ActivityKind } from '@/domain/types'

const ACTIVITY_KIND_MESSAGE_KEY: Record<ActivityKind, string> = {
  recovery: 'common:activityKind.recovery',
  mobility: 'common:activityKind.mobility',
  cardio: 'common:activityKind.cardio',
  optional: 'common:activityKind.optional',
  checkpoint: 'common:activityKind.checkpoint',
}

export function useActivityKindLabel(kind: ActivityKind): string {
  const { t } = useTranslation()
  return t(ACTIVITY_KIND_MESSAGE_KEY[kind])
}
