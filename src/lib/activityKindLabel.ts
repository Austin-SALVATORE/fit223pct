import type { ActivityKind } from '@/domain/types'

export const ACTIVITY_KIND_LABEL: Record<ActivityKind, string> = {
  recovery: 'Recovery',
  mobility: 'Mobility',
  cardio: 'Cardio',
  optional: 'Optional',
  checkpoint: 'Checkpoint',
}
