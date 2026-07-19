import { useTranslation } from 'react-i18next'
import type { MuscleGroup } from '@/domain/types'

const MUSCLE_MESSAGE_KEY: Record<MuscleGroup, string> = {
  quads: 'common:muscle.quads',
  hamstrings: 'common:muscle.hamstrings',
  glutes: 'common:muscle.glutes',
  chest: 'common:muscle.chest',
  back: 'common:muscle.back',
  shoulders: 'common:muscle.shoulders',
  biceps: 'common:muscle.biceps',
  triceps: 'common:muscle.triceps',
  core: 'common:muscle.core',
}

export function useMuscleGroupLabels(muscles: readonly MuscleGroup[]): string[] {
  const { t } = useTranslation()
  return muscles.map((muscle) => t(MUSCLE_MESSAGE_KEY[muscle]))
}
