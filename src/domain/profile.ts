import {
  CUNNINGHAM,
  MIFFLIN,
  PAL_BANDS,
  PAL_ORDER,
  type PhysicalActivityLevel,
} from './energyReference'

/**
 * The user's stable facts, and the energy baseline derived from them.
 *
 * The governing rule of this module is that **a missing input yields no
 * derived figure** — never a partial estimate assembled from defaults. Every
 * field of ResolvedProfile is nullable so the *type* forces each consumer to
 * handle absence, rather than absence being a convention someone remembers.
 *
 * The reason is concrete rather than stylistic: the seed writes
 * `heightCm: 180` for the owner, a value nothing has ever displayed or asked
 * him to confirm. While nothing reads it, it is harmless. The moment a
 * baseline is computed from it, an invented number becomes load-bearing and
 * silently shifts every calorie figure downstream. A never-confirmed height
 * is **missing, not data**.
 */

export type Sex = 'male' | 'female'

/**
 * The `UserSettings` fields this module reads. Declared structurally so the
 * domain layer can be built and tested before the storage schema gains them
 * (they land with the Dexie v4 migration); `UserSettings` satisfies this
 * shape once it does.
 */
export interface ProfileSettings {
  heightCm?: number | null
  /**
   * ISO date (yyyy-mm-dd). **A birth date, never a stored age** — an age is
   * silently wrong within a year, with nothing to detect the staleness.
   */
  birthDate?: string | null
  /**
   * **Required for a baseline, and deliberately not optional in spirit.**
   * Mifflin–St Jeor is two equations differing by a constant term, selected
   * by sex; without it there is no baseline at all — not a less precise one,
   * none. Relaxing this to "optional" for tidiness would mean either
   * refusing to compute for whoever skips it, or silently picking a default,
   * which is inventing the user's body. It is nullable here only because a
   * stored record may not have it yet, which §4's contract already defines
   * as missing.
   */
  sex?: Sex | null
  /**
   * The user's stated PAL band. **Absent is a normal state of a confirmed
   * profile**, not an incomplete one: installs confirmed before this field
   * existed carry no band, and they must keep their resting figure. Nothing
   * about `confirmed`, and nothing in `restingEnergyExpenditure`, may come to
   * depend on it — a missing band suppresses exactly one thing, the single
   * maintenance range.
   */
  activityLevel?: PhysicalActivityLevel | null
  targetWeightKg?: number | null
  targetBodyFatPercent?: number | null
  /** ISO date of the user's first profile save — see UserSettings. */
  profileConfirmedAt?: string | null
}

/** The `CheckIn` fields this module reads — the weight series, plus body fat once it exists. */
export interface ProfileCheckIn {
  date: string
  weightKg: number | null
  bodyFatPercent?: number | null
}

export interface ResolvedProfile {
  heightCm: number | null
  /** Derived from birthDate at read time, never stored. */
  age: number | null
  sex: Sex | null
  /**
   * Null means the user has not said, which is why maintenance is shown as
   * all three bands rather than one. It is never inferred — not from the
   * program, not from training frequency, not from a default.
   */
  activityLevel: PhysicalActivityLevel | null
  /** Most recent check-in with a non-null weight — resolved from the series, never copied. */
  currentWeightKg: number | null
  currentBodyFatPercent: number | null
  targetWeightKg: number | null
  targetBodyFatPercent: number | null
  /**
   * Whether the user has ever been through the profile form. Lets a surface
   * tell "never asked" from "asked, and left this blank" — the two look
   * identical in the values alone and want different copy.
   */
  confirmed: boolean
}

export interface KcalRange {
  min: number
  max: number
}

/**
 * Whole years elapsed, counting a birthday that has not yet occurred this
 * year as not yet reached. Returns null for an absent or unparseable date.
 */
export function ageOn(birthDate: string | null | undefined, today: Date): number | null {
  if (!birthDate) return null
  const born = new Date(`${birthDate}T00:00:00`)
  if (Number.isNaN(born.getTime())) return null
  let age = today.getFullYear() - born.getFullYear()
  const monthDelta = today.getMonth() - born.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < born.getDate())) age -= 1
  return age
}

/**
 * Reconciles the stable facts with the measurement series.
 *
 * **Current weight is resolved, never copied.** A duplicated current weight
 * drifts the first time someone logs a check-in without opening the profile,
 * and nothing reports the disagreement — so the profile reads the series
 * rather than shadowing it. Weight and body fat are resolved independently:
 * the most recent check-in carrying a weight may not be the one carrying a
 * body-fat reading.
 */
export function resolveProfile(
  settings: ProfileSettings,
  checkins: readonly ProfileCheckIn[],
  today: Date = new Date(),
): ResolvedProfile {
  const newestFirst = [...checkins].sort((a, b) => b.date.localeCompare(a.date))
  // Until the profile has been confirmed, nothing sourced from settings is
  // trusted — not merely the seeded height. Gating here rather than inside
  // restingEnergyExpenditure is what makes the baseline fall away for free:
  // the existing null-on-missing rule already refuses to compute from a null
  // height or sex, so no separate "is it confirmed" branch is needed anywhere
  // downstream, and none can be forgotten.
  //
  // Measurements are exempt on purpose. Weight and body fat come from
  // check-ins the user entered deliberately, which is its own confirmation.
  const confirmed = settings.profileConfirmedAt != null
  return {
    heightCm: confirmed ? settings.heightCm ?? null : null,
    age: confirmed ? ageOn(settings.birthDate, today) : null,
    sex: confirmed ? settings.sex ?? null : null,
    // Gated with the other settings-sourced facts, and read-only here: note
    // that `confirmed` above is computed before this and never consults it.
    activityLevel: confirmed ? settings.activityLevel ?? null : null,
    currentWeightKg: newestFirst.find((c) => c.weightKg != null)?.weightKg ?? null,
    currentBodyFatPercent: newestFirst.find((c) => c.bodyFatPercent != null)?.bodyFatPercent ?? null,
    targetWeightKg: confirmed ? settings.targetWeightKg ?? null : null,
    targetBodyFatPercent: confirmed ? settings.targetBodyFatPercent ?? null : null,
    confirmed,
  }
}

/** Fat-free mass. Null unless both a weight and a body-fat reading exist. */
export function leanBodyMassKg(profile: ResolvedProfile): number | null {
  const { currentWeightKg, currentBodyFatPercent } = profile
  if (currentWeightKg == null || currentBodyFatPercent == null) return null
  return currentWeightKg * (1 - currentBodyFatPercent / 100)
}

/**
 * Resting energy expenditure, in kcal/day. **Null when any input is
 * missing** — never a partial estimate from a default.
 *
 * Uses Mifflin–St Jeor, which needs weight, height, age and sex. Cunningham
 * is offered separately rather than substituted automatically: the two
 * disagree in opposite directions depending on body composition, so choosing
 * between them is a judgement about the person, not a fallback.
 */
export function restingEnergyExpenditure(profile: ResolvedProfile): number | null {
  const { currentWeightKg, heightCm, age, sex } = profile
  if (currentWeightKg == null || heightCm == null || age == null || sex == null) return null
  return (
    MIFFLIN.weightCoefficient * currentWeightKg +
    MIFFLIN.heightCoefficient * heightCm +
    MIFFLIN.ageCoefficient * age +
    (sex === 'male' ? MIFFLIN.maleConstant : MIFFLIN.femaleConstant)
  )
}

/**
 * Resting energy expenditure from lean body mass (Cunningham). Null without
 * both a weight and a body-fat reading.
 *
 * Carried alongside Mifflin because the two diverge in *opposite* directions
 * with body composition — Cunningham reads lower at high body fat and higher
 * at low — so neither is a strict improvement on the other.
 */
export function restingEnergyExpenditureFromLeanMass(profile: ResolvedProfile): number | null {
  const lean = leanBodyMassKg(profile)
  if (lean == null) return null
  return CUNNINGHAM.constant + CUNNINGHAM.leanMassCoefficient * lean
}

/**
 * Daily maintenance energy, as a **range** rather than a point.
 *
 * The FAO/WHO/UNU activity bands are themselves ranges (sedentary
 * 1.40–1.69), so returning a single figure would manufacture precision the
 * source does not have. The width of this range is honest reporting of how
 * uncertain the activity multiplier is — and it is the largest uncertainty
 * in the whole chain.
 *
 * This is a bootstrap, not the destination. The weakest link here is exactly
 * the link measurement removes: observed intake against the bodyweight trend
 * gives maintenance with no equation and no multiplier to defend. Keeping
 * that behind this one function makes the eventual swap a substitution
 * rather than a refactor.
 */
export function maintenanceKcal(ree: number, pal: PhysicalActivityLevel): KcalRange {
  const band = PAL_BANDS[pal]
  return { min: ree * band.min, max: ree * band.max }
}

export interface MaintenanceBand {
  level: PhysicalActivityLevel
  range: KcalRange
}

/**
 * Every band's range, lightest first — what to show when the user has not
 * said how active they are.
 *
 * The alternative was picking a band and labelling the output with it, which
 * is what this replaced: the card asserted "sedentary" about someone who had
 * never been asked, breaking its own rule against showing a figure whose
 * provenance is a default. Showing all three asserts nothing while still
 * answering the question, and seeing what each band implies is how a person
 * recognises which one they are.
 *
 * No band is marked recommended and none is derived from the program. Which
 * band a trainee belongs in is a training-content judgement, which belongs to
 * the owner's coach and not to this repo.
 */
export function maintenanceByBand(ree: number): MaintenanceBand[] {
  return PAL_ORDER.map((level) => ({ level, range: maintenanceKcal(ree, level) }))
}
