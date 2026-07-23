import type { ReadinessSignal, ReadinessTier } from './readiness'
import type { IsoWeekday } from '@/lib/dates'

export type MuscleGroup =
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'core'

export type Equipment = 'barbell' | 'dumbbell' | 'bench' | 'band' | 'bodyweight' | 'machine'

export interface TeachingConcept {
  title: string
  body: string
}

/**
 * The Library is fully closed, seeded content — no exerciseRepo.put/add
 * exists. Display content (name, cues, teachingConcept) is locale-keyed
 * by id in src/locales/*'/seed.json, resolved at render via
 * src/i18n/seedExercise.ts — never persisted here, so it can't drift out
 * of sync with the active locale.
 */
export interface Exercise {
  id: string
  muscles: MuscleGroup[]
  equipment: Equipment[]
  substitutionIds: string[]
  isUnilateral: boolean
}

export type EffortMode = 'reps' | 'seconds'

export interface RepRange {
  min: number
  max: number
}

/** One rung of a pyramid ladder — weight climbs, reps descend, in prescription order. */
export interface SetTarget {
  weightKg: number | null
  reps: number
}

interface ExercisePrescriptionBase {
  exerciseId: string
  sets: number
  mode: EffortMode
  restSeconds: number
  perSide: boolean
  /** Volume adjustments only ever trim accessories; absent means 'main' (older snapshots) */
  role?: 'main' | 'accessory'
  note?: string
  /** Contextual fallbacks this program declares for this slot (e.g. "rack's taken") — layered over the Library's generic Exercise.substitutionIds, never replacing it. See effectiveSubstitutions. */
  substitutionIds?: string[]
}

/**
 * The two progression models (docs/PyramidProgression.md), chosen by
 * `setPlan` presence — never inferred from equipment or role. Rep-range
 * covers bodyweight/band/timed work and loaded isolation accessories;
 * setPlan ladders are primary compound lifts only.
 */
export interface RepRangePrescription extends ExercisePrescriptionBase {
  range: RepRange
  startWeightKg: number | null
  /** Hard equipment ceiling at home; null = load is not the lever (bands, bodyweight) */
  maxWeightKg: number | null
  weightStepKg: number | null
  setPlan?: undefined
}

export interface LadderPrescription extends ExercisePrescriptionBase {
  setPlan: SetTarget[]
  /** Hard equipment ceiling at home — the top rung's cap, see suggestLadderProgression */
  maxWeightKg: number | null
  weightStepKg: number | null
  range?: undefined
  startWeightKg?: undefined
}

export type ExercisePrescription = RepRangePrescription | LadderPrescription

export interface SessionTemplate {
  id: string
  name: string
  focus: string
  items: ExercisePrescription[]
}

export type ActivityKind = 'recovery' | 'mobility' | 'cardio' | 'optional' | 'checkpoint'

export interface ActivityItem {
  label: string
  detail?: string
}

/** Free-text program content, not a Library reference — no weights, no logging, no prescription. */
export interface ActivityTemplate {
  kind: ActivityKind
  title: string
  items: ActivityItem[]
}

export interface Program {
  id: string
  name: string
  phase: number
  /** ISO date (yyyy-mm-dd), first day the program is active */
  startDate: string
  endDate: string | null
  /** ISO weekday numbers of scheduled training days (1 = Monday … 7 = Sunday) */
  trainingWeekdays: number[]
  /** Session ids cycled across training days, driven by completed count — missed days never skip a session */
  rotation: string[]
  sessions: SessionTemplate[]
  /**
   * 'rotation' (absent = 'rotation', zero migration for every existing
   * program): session identity follows `rotation`, driven by completed
   * count. 'weekday-pinned': session identity follows `weekdaySessions`
   * instead — every weekday always offers the same session, so skipping
   * one day can never change what a later day offers, unlike rotation
   * mode. See docs/PyramidProgression.md's scheduling section.
   */
  schedulingMode?: 'rotation' | 'weekday-pinned'
  /**
   * Session id per pinned weekday — only meaningful when
   * schedulingMode is 'weekday-pinned'. Every key here should also be a
   * member of trainingWeekdays (trainingWeekdays still decides whether a
   * date is a training day at all; this decides which session it is).
   */
  weekdaySessions?: Partial<Record<IsoWeekday, string>>
  /**
   * Authored content for non-training weekdays — may never claim a weekday
   * that's also in trainingWeekdays (import validation rejects the
   * overlap). Absent = today's behavior, a bare rest day.
   */
  weekdayActivities?: Partial<Record<IsoWeekday, ActivityTemplate>>
  /**
   * Where this record came from — decides whether name/focus/note fields
   * resolve through a locale key or always render the stored literal.
   * Absent means 'seed' (the pre-M7 installed record needs no migration).
   * Never trust the id to distinguish these: an imported file can reuse
   * the seed program's id, and its authored content must still win.
   */
  origin?: 'seed' | 'imported'
}

export interface LoggedSet {
  setIndex: number
  weightKg: number | null
  reps: number | null
  seconds: number | null
  completedAt: string
}

export interface WorkoutExercise {
  exerciseId: string
  /** Snapshot of the prescription at workout time, so history survives program edits */
  prescription: ExercisePrescription
  sets: LoggedSet[]
  substitutedForId?: string
}

export interface Workout {
  id: string
  programId: string
  sessionTemplateId: string
  /** ISO date the session belongs to */
  date: string
  startedAt: string
  completedAt: string | null
  exercises: WorkoutExercise[]
  /**
   * Readiness applied at start, kept for future intelligence (additive,
   * optional). `drivers` stores signal keys, not display copy — labels are
   * derived at render time (see readiness.ts `describeDrivers`) so stored
   * workouts stay analyzable even after wording changes.
   */
  readiness?: {
    tier: ReadinessTier
    drivers: ReadinessSignal[]
  }
  notes?: string
}

export type Rating = 1 | 2 | 3 | 4 | 5

export interface CheckIn {
  id: string
  date: string
  sleep: Rating | null
  energy: Rating | null
  soreness: Rating | null
  stress: Rating | null
  motivation: Rating | null
  weightKg: number | null
  waistCm: number | null
}

/**
 * Defined here, not in src/i18n/, so UserSettings.locale below can
 * reference it without domain/ importing anything from the i18n/React
 * layer — src/i18n/i18next.ts imports SupportedLocale from here instead
 * of defining its own copy.
 */
export const SUPPORTED_LOCALES = ['en', 'fr', 'zh-CN'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export interface UserSettings {
  id: 'user'
  name: string
  heightCm: number
  weeklyGoal: number
  /** weekStart (Monday date key) of the last weekly review shown — null if none has been */
  lastSeenWeeklyReviewWeekStart: string | null
  /** Absent on pre-M7 records and until LocaleSync's first-launch write lands one. */
  locale?: SupportedLocale
}
