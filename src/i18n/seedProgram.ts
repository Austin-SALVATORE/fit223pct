import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type {
  ActivityKind,
  ActivityTemplate,
  ExercisePrescription,
  Program,
  SessionTemplate,
} from '@/domain/types'
import type { IsoWeekday } from '@/lib/dates'

/**
 * Seed content that has already been through this layer. Structurally
 * identical to its `@/domain/types` counterpart — the distinct name is the
 * point: it says "these strings are resolved", so a reader (and the
 * seed-field-access guard, src/i18n/seedFieldAccess.guard.test.ts) can tell
 * a localized `.title` from a raw one at the type level rather than by
 * tracing where the value came from.
 */
export interface LocalizedActivityItem {
  label: string
  detail?: string
  /** Carried through from ActivityItem — see useLocalizedActivity. */
  routineId?: string
  /** Carried through from ActivityItem — see useLocalizedActivity. */
  recordable?: 'ride'
}

export interface LocalizedActivity {
  kind: ActivityKind
  title: string
  items: LocalizedActivityItem[]
}

/**
 * The seed lookups as plain functions, taking the 'seed' `t` rather than
 * calling `useTranslation` themselves. The hooks below are thin wrappers;
 * call these directly from a `.map()` or any other spot where Rules of
 * Hooks forbid a hook (PlanPage's PhaseHeader). Keeping one implementation
 * here is what stops a call site from re-deriving the origin guard — the
 * duplication §4 of docs/review-backlog.md is about.
 */
export function resolveSessionName(
  t: TFunction<'seed'>,
  programId: string,
  session: SessionTemplate,
  programOrigin?: Program['origin'],
): string {
  if (programId === '' || session.id === '' || programOrigin === 'imported') return session.name
  return t(`program.${programId}.session.${session.id}.name`, { defaultValue: session.name })
}

export function resolveSessionFocus(
  t: TFunction<'seed'>,
  programId: string,
  session: SessionTemplate,
  programOrigin?: Program['origin'],
): string {
  if (programId === '' || session.id === '' || programOrigin === 'imported') return session.focus
  return t(`program.${programId}.session.${session.id}.focus`, { defaultValue: session.focus })
}

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
  return resolveSessionName(t, programId, session, programOrigin)
}

export function useSessionFocus(
  programId: string,
  session: SessionTemplate,
  programOrigin?: Program['origin'],
): string {
  const { t } = useTranslation('seed')
  return resolveSessionFocus(t, programId, session, programOrigin)
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
 *
 * Also guards on an empty *activity* title (7 Aug) — `PlanPage.tsx`'s
 * `DayRow` calls this unconditionally, `day.activity ?? EMPTY_ACTIVITY`,
 * for the same hook-order reason `useProgramName`/`resolveSessionName`
 * guard on an empty id above. A training day with no `weekdayActivities`
 * entry for its weekday still round-tripped that placeholder through
 * `t()` under a real program id, logging a phantom "missing key" — the
 * empty-id guard covers a placeholder *program*, not a placeholder
 * *activity* under a real one. `title: ''` is the same sentinel
 * `EMPTY_ACTIVITY` already uses and no real seeded activity can have
 * (`activityMissingTitle` makes it a schema error).
 */
export function useLocalizedActivity(
  programId: string,
  weekday: IsoWeekday,
  activity: ActivityTemplate,
  programOrigin?: Program['origin'],
): LocalizedActivity {
  const { t, i18n } = useTranslation('seed')
  if (programId === '' || activity.title === '' || programOrigin === 'imported') return activity
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
      // Carried through explicitly. This rebuilds each item as a fresh
      // literal rather than spreading, so any field not named here is
      // silently dropped — and the failure mode for routineId (and now
      // recordable) is invisible: no error, the affordance simply never
      // appears. Hence its own test, in a non-English locale, since this
      // branch is the localized one.
      ...(item.routineId !== undefined ? { routineId: item.routineId } : {}),
      ...(item.recordable !== undefined ? { recordable: item.recordable } : {}),
    }
  })
  return { ...activity, title, items }
}

/**
 * `morningActivation` is one program-level field — the same round every
 * training day (docs/design/ActivityPrescriptionPhaseA.md §2), not a
 * weekday-keyed one — so it needs its own key path
 * (`program.<id>.morningActivation.*`) rather than `useLocalizedActivity`'s
 * `program.<id>.activity.<weekday>.*`, which would key three identical
 * copies under three different weekdays. Same origin guard, same index-
 * keyed items, same reasoning as above — duplicated rather than
 * parameterised over "does this have a weekday" because the two call
 * sites read differently: an imported program's activation must render
 * exactly as authored, same as its weekday activities.
 */
export function useLocalizedActivation(
  programId: string,
  activation: ActivityTemplate,
  programOrigin?: Program['origin'],
): LocalizedActivity {
  const { t, i18n } = useTranslation('seed')
  if (programId === '' || programOrigin === 'imported') return activation
  const base = `program.${programId}.morningActivation`
  const title = t(`${base}.title`, { defaultValue: activation.title })
  const items = activation.items.map((item, index) => {
    const labelKey = `${base}.item.${index}.label`
    const detailKey = `${base}.item.${index}.detail`
    return {
      label: i18n.exists(`seed:${labelKey}`) ? t(labelKey) : item.label,
      ...(item.detail !== undefined
        ? { detail: i18n.exists(`seed:${detailKey}`) ? t(detailKey) : item.detail }
        : {}),
      ...(item.routineId !== undefined ? { routineId: item.routineId } : {}),
      ...(item.recordable !== undefined ? { recordable: item.recordable } : {}),
    }
  })
  return { ...activation, title, items }
}
