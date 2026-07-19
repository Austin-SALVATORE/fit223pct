import { useTranslation } from 'react-i18next'
import type { TeachingConcept } from '@/domain/types'

export function useExerciseName(exerciseId: string): string {
  const { t } = useTranslation('seed')
  // Guards against the pre-load placeholder callers pass ('') so the empty
  // id doesn't produce a real-but-permanently-unresolvable 'exercise..name'
  // lookup — that's not a translator-actionable missing key, just a hook
  // called unconditionally before its real id is known (see call sites'
  // Rules-of-Hooks comments).
  if (exerciseId === '') return ''
  return t(`exercise.${exerciseId}.name`)
}

export function useExerciseCues(exerciseId: string): string[] {
  const { t } = useTranslation('seed')
  if (exerciseId === '') return []
  const cues = t(`exercise.${exerciseId}.cues`, { returnObjects: true })
  return Array.isArray(cues) ? (cues as string[]) : []
}

export function useExerciseTeachingConcept(exerciseId: string): TeachingConcept | undefined {
  const { t, i18n } = useTranslation('seed')
  if (exerciseId === '') return undefined
  if (!i18n.exists(`seed:exercise.${exerciseId}.teachingConcept.title`)) return undefined
  return {
    title: t(`exercise.${exerciseId}.teachingConcept.title`),
    body: t(`exercise.${exerciseId}.teachingConcept.body`),
  }
}
