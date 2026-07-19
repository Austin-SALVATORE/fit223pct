import { useTranslation } from 'react-i18next'
import type { ExercisePrescription, Program, SessionTemplate } from '@/domain/types'

/**
 * Program/session/note content is dual-purpose — the one built-in seeded
 * program (phase-1-home) gets a locale-keyed override, but a user's own
 * imported program never will, and must keep showing exactly what they
 * typed. So these fall through to the literal stored field instead of
 * requiring a key to exist, unlike Exercise's hooks in seedExercise.ts.
 *
 * Each also guards on an empty id ('') — callers pass placeholder
 * Program/SessionTemplate objects to keep hook order stable before their
 * real data loads (see call sites' Rules-of-Hooks comments); without the
 * guard, that transient placeholder still round-trips through t() and
 * logs a phantom "missing key" that no translator could ever fix.
 */
export function useProgramName(program: Program): string {
  const { t } = useTranslation('seed')
  if (program.id === '') return program.name
  return t(`program.${program.id}.name`, { defaultValue: program.name })
}

export function useSessionName(programId: string, session: SessionTemplate): string {
  const { t } = useTranslation('seed')
  if (programId === '' || session.id === '') return session.name
  return t(`program.${programId}.session.${session.id}.name`, { defaultValue: session.name })
}

export function useSessionFocus(programId: string, session: SessionTemplate): string {
  const { t } = useTranslation('seed')
  if (programId === '' || session.id === '') return session.focus
  return t(`program.${programId}.session.${session.id}.focus`, { defaultValue: session.focus })
}

export function usePrescriptionNote(
  programId: string,
  sessionId: string,
  item: ExercisePrescription,
): string | undefined {
  const { t, i18n } = useTranslation('seed')
  if (programId === '' || sessionId === '') return item.note
  const key = `program.${programId}.session.${sessionId}.exercise.${item.exerciseId}.note`
  return i18n.exists(`seed:${key}`) ? t(key) : item.note
}
