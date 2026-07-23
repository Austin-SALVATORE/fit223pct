import { useTranslation } from 'react-i18next'
import type { ActivityTemplate, ExercisePrescription, Program, SessionTemplate } from '@/domain/types'
import type { IsoWeekday } from '@/lib/dates'

/**
 * Program/session/note content is dual-purpose — the one built-in seeded
 * program (phase-1-home) gets a locale-keyed override, but a user's own
 * imported program never will, and must keep showing exactly what they
 * typed. So these fall through to the literal stored field instead of
 * requiring a key to exist, unlike Exercise's hooks in seedExercise.ts.
 *
 * That fallback used to key on the program's id alone — but an imported
 * file can reuse the seed's id (`phase-1-home`), and an id match isn't
 * evidence the content is the seed's own. `Program.origin` is the
 * explicit signal instead: 'imported' always wins with the stored
 * literal, in every locale, with no key lookup at all. Absent/'seed'
 * keeps today's locale-key behavior.
 *
 * Each also guards on an empty id ('') — callers pass placeholder
 * Program/SessionTemplate objects to keep hook order stable before their
 * real data loads (see call sites' Rules-of-Hooks comments); without the
 * guard, that transient placeholder still round-trips through t() and
 * logs a phantom "missing key" that no translator could ever fix.
 */
export function useProgramName(program: Program): string {
  const { t } = useTranslation('seed')
  if (program.id === '' || program.origin === 'imported') return program.name
  return t(`program.${program.id}.name`, { defaultValue: program.name })
}

export function useSessionName(
  programId: string,
  session: SessionTemplate,
  programOrigin?: Program['origin'],
): string {
  const { t } = useTranslation('seed')
  if (programId === '' || session.id === '' || programOrigin === 'imported') return session.name
  return t(`program.${programId}.session.${session.id}.name`, { defaultValue: session.name })
}

export function useSessionFocus(
  programId: string,
  session: SessionTemplate,
  programOrigin?: Program['origin'],
): string {
  const { t } = useTranslation('seed')
  if (programId === '' || session.id === '' || programOrigin === 'imported') return session.focus
  return t(`program.${programId}.session.${session.id}.focus`, { defaultValue: session.focus })
}

export function usePrescriptionNote(
  programId: string,
  sessionId: string,
  item: ExercisePrescription,
  programOrigin?: Program['origin'],
): string | undefined {
  const { t, i18n } = useTranslation('seed')
  if (programId === '' || sessionId === '' || programOrigin === 'imported') return item.note
  const key = `program.${programId}.session.${sessionId}.exercise.${item.exerciseId}.note`
  return i18n.exists(`seed:${key}`) ? t(key) : item.note
}

/**
 * Same origin-keyed treatment as sessions/prescriptions above, applied to
 * weekdayActivities — items are keyed by array index (this content is
 * hand-authored and index-stable, unlike a user-reorderable list) rather
 * than a natural id, since ActivityItem has none. Returns a whole resolved
 * ActivityTemplate so call sites (TodayPage's ActivityHero, PlanDayPage's
 * ActivityDetail) can destructure title/items exactly as before.
 */
export function useLocalizedActivity(
  programId: string,
  weekday: IsoWeekday,
  activity: ActivityTemplate,
  programOrigin?: Program['origin'],
): ActivityTemplate {
  const { t, i18n } = useTranslation('seed')
  if (programId === '' || programOrigin === 'imported') return activity
  const base = `program.${programId}.activity.${weekday}`
  const title = t(`${base}.title`, { defaultValue: activity.title })
  const items = activity.items.map((item, index) => {
    const labelKey = `${base}.item.${index}.label`
    const detailKey = `${base}.item.${index}.detail`
    return {
      label: i18n.exists(`seed:${labelKey}`) ? t(labelKey) : item.label,
      ...(item.detail !== undefined
        ? { detail: i18n.exists(`seed:${detailKey}`) ? t(detailKey) : item.detail }
        : {}),
    }
  })
  return { ...activity, title, items }
}
