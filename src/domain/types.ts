import type { ReadinessSignal, ReadinessTier } from './readiness'
import type { IsoWeekday } from '@/lib/dates'
// Imported rather than redeclared, unlike Sex above: PhysicalActivityLevel is
// `keyof typeof PAL_BANDS`, so a hand-written copy would silently stop
// matching if a band were ever added. energyReference imports nothing, so
// there is no cycle to worry about.
import type { PhysicalActivityLevel } from './energyReference'

export type MuscleGroup =
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
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

/**
 * A closed vocabulary for how a rung differs from the default form — never
 * free prose, so a stored value stays translatable without persisting
 * locale-specific text (architecture.md: storage is locale-free, the
 * `RoutineStep.id` precedent). Shared across every exercise via
 * common:setVariant rather than a key per level per exercise.
 *
 * This exact eight-token list is now spec-mandated, not just our design
 * choice: Mesocycle-2-Home-Progressive-Coach-Spec-v2.7.md §4 "Stored
 * variation vocabulary" names these eight and states a prescription must
 * select one label per level — it must not store an either/or choice
 * (the earlier draft's `harder-leverage-or-pause` was that either/or,
 * and the coach resolved it rather than approved it). Widening this enum
 * is a coach decision, not an engineering one.
 */
export type SetVariant =
  | 'normal'
  | 'slow'
  | 'slow-pause'
  | 'with-pause'
  | 'longer-reach'
  | 'reach-pause'
  | 'harder-leverage'
  | 'hands-elevated'

/** One rung of a pyramid ladder — weight climbs, reps descend, in prescription order. */
export interface SetTarget {
  weightKg: number | null
  reps: number
  /**
   * How this rung differs from the default form, when the coach prescribed
   * one — e.g. a bodyweight ladder whose levels step through range, tempo,
   * or leverage rather than load. Absent for the common case (a rung that
   * varies only by weight/reps).
   */
  variantKey?: SetVariant
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
  /**
   * Names a pre-strength warm-up (src/data/seed/warmups.ts) shown on Today
   * before this session and while it's in progress. Absent is the norm —
   * most sessions have no dedicated warm-up content yet.
   *
   * This is `ActivityItem.routineId` reproduced exactly: a pointer into the
   * app's own closed catalogue, not into the Library and not into program
   * content. What it points at structurally cannot carry sets, weights or
   * progression (see domain/warmup.ts) — ramp-up loads are display text,
   * never a route into the progression engine.
   */
  warmupId?: string
}

export type ActivityKind = 'recovery' | 'mobility' | 'cardio' | 'optional' | 'checkpoint'

export interface ActivityItem {
  label: string
  detail?: string
  /**
   * Names a built-in routine (src/data/seed/routines.ts) that this item can
   * be tapped to play. Absent is the norm — most items are plain text and
   * must keep looking that way, so "Complete rest is a fine choice too"
   * never reads as a broken link.
   *
   * This is a pointer into the app's own closed catalogue, not into the
   * Library and not into program content. What it points at structurally
   * cannot carry weights, sets or progression (see domain/routine.ts), so it
   * admits guided playback and nothing else.
   */
  routineId?: string
  /**
   * Marks this item as the day's ride, so Today can attach a record
   * control without guessing from label text — coach spec v2.11 §3 makes
   * ride recording platform behavior for any current or future program,
   * not a Mesocycle-2 special case, so the marker is structural rather
   * than an inferred match on "Zone 2" or similar prose that could drift.
   * At most one recordable item is expected per day.
   */
  recordable?: 'ride'
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
   * Authored content for any weekday, training or not — a training day's
   * entry renders as its post-strength cardio (docs/design/
   * ActivityPrescriptionPhaseA.md §1); a non-training day's entry
   * replaces the bare rest hero, as before. Before Phase A this could
   * never claim a training weekday (import validation rejected the
   * overlap); that restriction is gone — modelling the same ride two
   * different ways depending on the weekday would have been worse than
   * allowing both. Absent on a non-training day = today's behavior, a
   * bare rest day.
   */
  weekdayActivities?: Partial<Record<IsoWeekday, ActivityTemplate>>
  /**
   * One preparation round, shown above the session on training days only
   * — the same six-item routine every training day per the coach
   * (docs/design/ActivityPrescriptionPhaseA.md §2), so one program-level
   * field rather than a per-weekday map that would triplicate it. Folding
   * this into `weekdayActivities` instead was rejected: one
   * `ActivityTemplate` has one title and one flat item list, so the
   * renderer could not place activation above the session and a ride
   * below it, and preparation belongs before training starts, not after.
   */
  morningActivation?: ActivityTemplate
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
  /**
   * Session-only extra set opened by `Add Set` (coach spec §4). Never a
   * Pyramid level — does not satisfy a rung, does not trigger load or
   * variation progression. Storage only for now: nothing writes this yet,
   * the set-screen controls that produce it land separately.
   */
  custom?: true
}

export interface WorkoutExercise {
  exerciseId: string
  /** Snapshot of the prescription at workout time, so history survives program edits */
  prescription: ExercisePrescription
  sets: LoggedSet[]
  substitutedForId?: string
  /**
   * Prescribed level indices removed this session (coach spec §4, "Skipped
   * this session"). Audit and display only — nothing in the progression
   * engine reads it; the prescription itself is retained, not erased.
   * Storage only for now: nothing writes this yet.
   */
  skippedLevels?: number[]
  /**
   * Extra set slots opened by `Add Set`, 0-2 (coach spec §4). Storage only
   * for now: nothing writes this yet.
   */
  customSlots?: number
}

export interface Workout {
  id: string
  programId: string
  sessionTemplateId: string
  /** ISO date the session belongs to */
  date: string
  startedAt: string
  completedAt: string | null
  /**
   * Set when `closeStaleWorkouts` (repositories.ts) closes an in-progress
   * workout dated before today — history is calendar-accurate the moment
   * it's abandoned, without pretending it finished. `completedAt` is
   * deliberately left `null`: closing must never advance the Scheduled
   * Session (docs/design/MissedDayDeferral.md ruling 2), and `completedAt`
   * is what every completion count reads. Absent means not abandoned —
   * optional rather than defaulted, so a pre-Phase-0 record needs no
   * migration to read correctly.
   */
  abandonedAt?: string | null
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

/**
 * A completed activity outside the strength workout — coach spec v2.11
 * §3 "Monday recording release ruling" makes this platform behavior for
 * any current or future program, not a Mesocycle 2 special case.
 *
 * Lives in its own table, entirely outside `Workout` and `CheckIn` — §3's
 * hardest requirement, that recording one activity must never create,
 * overwrite or complete another, is satisfied by this boundary rather
 * than by discipline at every call site. A ride record cannot touch the
 * day's `Workout`; there is no shared row for two writers to race on.
 */
/**
 * Plain `Omit<T, K>` does not distribute over a union — `keyof (A | B)`
 * only returns keys common to every member, so `Omit<ActivityRecord,
 * 'id'>` collapses the discriminated union into one shape instead of
 * "each variant, minus id". This forces the distribution explicitly, so
 * `repositories.ts`'s `activityRecordRepo.put` can accept either variant
 * without its `kind`-specific fields (`actualMinutes`, `avgHeartRate`)
 * being rejected.
 */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

export type ActivityRecordKind = 'ride' | 'activation'

export type ActivityRecord =
  | {
      id: string
      /** ISO date the activity belongs to. */
      date: string
      programId: string
      kind: 'activation'
      completedAt: string
    }
  | {
      id: string
      date: string
      programId: string
      kind: 'ride'
      completedAt: string
      /**
       * Both fields are required by the type, not just by validation —
       * spec §12: "a duration-only entry does not count as a completed
       * ride until average heart rate is added." Making a half-filled
       * ride record structurally unrepresentable means "both required
       * before complete" cannot be bypassed by a future call site; a
       * draft belongs in component state, never in a saved record.
       * Zone is deliberately absent — §12 is explicit that zone is the
       * prescription, never a result field.
       */
      actualMinutes: number
      avgHeartRate: number
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
  /**
   * Body-fat percentage. A **series**, not a stable fact — it changes over
   * time exactly as weight does, so it belongs on the dated record rather
   * than on UserSettings. Absent on every pre-v4 check-in.
   */
  bodyFatPercent?: number | null
}

/**
 * Defined here, not in src/i18n/, so UserSettings.locale below can
 * reference it without domain/ importing anything from the i18n/React
 * layer — src/i18n/i18next.ts imports SupportedLocale from here instead
 * of defining its own copy.
 */
export type Sex = 'male' | 'female'

export const SUPPORTED_LOCALES = ['en', 'fr', 'zh-CN'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

/**
 * One physically distinct plate bore — plates in this set never load a
 * handle alongside plates from a different set (coach measurement, 7 Aug
 * 2026: the owner's two dumbbell sets do not share a bore).
 *
 * A fully-mixable inventory (any plate loads any handle) is represented
 * as a single-element `EquipmentProfile.plateSets` array holding every
 * plate; a non-mixing inventory like the owner's is one element per
 * bore. This is what replaces the earlier flat `plates` + `mixable`
 * shape — see `EquipmentProfile`'s own doc for why that shape changed.
 */
export interface PlateSet {
  /** Plate inventory for this bore, as {weightKg, count} pairs, e.g. "4×1.0, 4×1.25, 4×2.5". */
  plates: { weightKg: number; count: number }[]
  /** How many handles draw from this set's plates. Fewer than 2 means no bilateral pair can be built from this set alone (only single-implement, or a cross-set pair). */
  handleCount: number
  /**
   * The physical sleeve's weight rating for one side of a handle drawing
   * from this set, in kg — a hardware fact, per set, not a plate count.
   * Superseded 7 Aug from an earlier "4 plates/side" placeholder once the
   * owner measured the actual rating (15kg/side Set A, 8kg/side Set B) —
   * both sit at or above each set's own physical plate supply, so the
   * cap is non-binding for the real profile; it exists for whatever
   * hardware isn't. Absent means unconstrained.
   */
  maxSideKg?: number | null
}

/**
 * The athlete's actual dumbbell hardware — coach spec v2.16 §4: "An
 * available weight step means the next entry in the dumbbell's verified
 * hardware-setting list. It never means an assumed arithmetic increase."
 *
 * **Absent, or `confirmedAt` unset, means unverified — never defaulted.**
 * Same defect class as the seeded `heightCm` below: a handle weight off by
 * a quarter kg makes every coach-prescribed integer unreachable (measured,
 * `equipment-aware-progression.md` §1.3 — four of nine candidate handle
 * weights reach 0 of 8 prescribed loads). `hasVerifiedLoadList`
 * (`domain/workout.ts`) is the one gate every automatic load-step
 * computation must consult before trusting this over the coach's own
 * prescription.
 *
 * **`plates`/`mixable` (Phase 1's provisional shape) are replaced by
 * `plateSets` (Phase 2).** Phase 1's own doc comment on this type flagged
 * the shape as provisional — nothing consumed `plates`/`mixable`/
 * `handleCount` before Phase 2, so this is the first and intended point
 * of correction, not a breaking change to a shipped contract. A single
 * flat `plates` array plus a `mixable` boolean could not represent the
 * owner's real, measured hardware: two dumbbell sets that do **not**
 * share a bore, which is two independent inventories, not one inventory
 * with a yes/no mixing flag on it.
 */
export interface EquipmentProfile {
  /** kg per bare handle, no plates. */
  handleKg?: number | null
  /**
   * kg of the bar alone, no plates — the barbell equivalent of `handleKg`.
   * Draws from the same `plateSets` pool as the dumbbell handles (12 Aug
   * 2026 hardware upgrade): a bar is symmetric-loading like a single
   * handle's two ends, so it shares `singleHandleWeightsQ`'s enumeration
   * rather than needing a second algorithm. **Known limitation:**
   * `computeAchievableLoads` filters plate sets to `handleCount >= 1`
   * before enumerating — a set with no dumbbell handle assigned would be
   * invisible to the bar even though a bar doesn't need one. Non-binding
   * for the current hardware (`handleCount: 2`); stated here rather than
   * silently assumed general. Absent or null means no bar in this
   * profile — never defaulted, same T4 contract as `handleKg`.
   */
  barKg?: number | null
  /** One entry per non-mixing plate bore — see `PlateSet`'s own doc, including its own `maxSideKg` sleeve rating. */
  plateSets?: PlateSet[] | null
  /**
   * ISO date the athlete confirmed this profile. Same contract as
   * `profileConfirmedAt` below — absent means never verified, whatever
   * values happen to sit in the other fields.
   */
  confirmedAt?: string | null
}

export interface UserSettings {
  id: 'user'
  name: string
  /**
   * **Optional because "never asked" has to be representable.** The seed used
   * to write 180 for the owner — a value nothing displayed and nobody
   * confirmed. It was harmless while nothing read it; the moment an energy
   * baseline reads it, an invented number silently shifts every calorie
   * figure downstream. New installs therefore carry no height until the
   * profile surface asks (M10 phase 3), and absent reads as missing.
   *
   * Records created before M10 still hold their seeded 180. The v4 migration
   * deliberately does not clear it — deleting a value the owner may have
   * since verified would be its own kind of invention — so the surface must
   * present it as unconfirmed rather than as fact.
   */
  heightCm?: number | null
  weeklyGoal: number
  /** weekStart (Monday date key) of the last weekly review shown — null if none has been */
  lastSeenWeeklyReviewWeekStart: string | null
  /** Absent on pre-M7 records and until LocaleSync's first-launch write lands one. */
  locale?: SupportedLocale

  // --- profile (M10). All optional: an installed app holds a v3 record
  // without them, and the v4 migration deliberately writes NO defaults.
  // Absent means missing (src/domain/profile.ts's contract), because a
  // default here would recreate exactly the problem heightCm already has —
  // an invented value that becomes load-bearing the moment something reads
  // it.

  /**
   * ISO date (yyyy-mm-dd). **A birth date, never a stored age**: an age is
   * silently wrong within a year and nothing detects the staleness.
   */
  birthDate?: string | null
  /**
   * **Required for an energy baseline — do not relax the requirement.**
   * Mifflin–St Jeor is two equations differing by a constant term, selected
   * by sex, so without it there is no baseline at all: not a less precise
   * one, none. Optional here only because a stored record may predate the
   * field; the profile surface asks for it, and a missing value yields no
   * figure rather than a guessed one. Making it genuinely optional would
   * mean either refusing to compute for whoever skips it, or silently
   * picking a default, which is inventing the user's body.
   */
  sex?: Sex | null
  /**
   * The user's stated FAO/WHO/UNU PAL band, set in the profile form.
   *
   * **A stated fact about the person, not a measurement** — which is why it
   * lives here with height, birth date and sex rather than as a live control
   * on the baseline card, and why it is part of what `profileConfirmedAt`
   * confirms. A segmented control outside the form would make a profile fact
   * editable outside the form that owns profile facts, and confirmation would
   * stop being an act.
   *
   * **Absent is normal, including on a confirmed profile.** Records confirmed
   * before this field existed carry no band and must keep their resting
   * figure: a missing band suppresses the single maintenance range and
   * nothing else. It must never be defaulted — attributing "sedentary" to
   * someone who was never asked is the same defect as the seeded `heightCm`,
   * and it shifted every maintenance figure by ~660 kcal/day when it was one.
   *
   * Not indexed, so no Dexie version — the version schema declares indexes,
   * not fields. v5 is M11's.
   */
  activityLevel?: PhysicalActivityLevel | null
  /** An intention, not a measurement — hence settings, not a dated record. */
  targetWeightKg?: number | null
  targetBodyFatPercent?: number | null
  /**
   * ISO date the user first saved the profile form. **This is what makes
   * "never confirmed" representable**, which the missing-data contract
   * requires and nothing in the schema could previously express: a stored
   * value and a value the user actually gave were indistinguishable.
   *
   * Absent means the user has never been through the profile, *whatever
   * values happen to sit in the record*. In particular the owner's install
   * carries a seeded `heightCm: 180` that nothing asked him to confirm; it
   * stays where it is — deleting a value he may since have verified would be
   * its own invention — but it is not trusted until this is set.
   *
   * Not indexed, so it needs no Dexie version of its own: the version schema
   * declares indexes, not fields.
   *
   * Deliberately not inferred from whether other fields are populated. That
   * works until someone fills in a birth date and nothing else, and then a
   * guess is load-bearing again with no way to tell.
   */
  profileConfirmedAt?: string | null

  /**
   * The athlete's verified dumbbell hardware (coach spec v2.16 §4). Absent
   * means unverified — `hasVerifiedLoadList` (`domain/workout.ts`) is the
   * single gate every automatic load-step computation must consult before
   * showing a computed number instead of the coach's own prescription.
   *
   * Not indexed, so no Dexie version — the version schema declares
   * indexes, not fields (same reasoning as `activityLevel`/
   * `profileConfirmedAt` above; `types.ts:445-447`'s rule, restated at the
   * site of the field that first established it).
   */
  equipment?: EquipmentProfile | null
}
