/**
 * A pre-strength warm-up — a sequence the app *displays*, not data it feeds
 * to the progression engine (Mesocycle 2 Pre-Strength Warm-up Prescription,
 * 11 Aug 2026, rules 6 and 9: ramp-up sets must not count toward
 * completion, volume or Pyramid progression, and must not auto-progress
 * alongside the working ladder).
 *
 * The defining property of these types is what they deliberately lack —
 * the same guarantee `domain/routine.ts`'s own docblock states for guided
 * stretch routines. `WarmupStep` has no `sets`, no `mode`, no
 * `restSeconds`, no `range`, no `setPlan`, no `recordable`, so it is not an
 * `ExercisePrescription` and cannot reach `domain/progression.ts` without
 * someone first writing a conversion — a visible, reviewable act rather
 * than a quiet field addition. A `ramp` step's `weightKg` is display text
 * formatted at the UI layer, never a `setPlan` rung.
 *
 * `cycle.minutes` is a single fixed value (12 Aug 2026, doc 4 §5): the
 * coach retired the 2–3 min range as a written prescription, so the range
 * is unrepresentable rather than merely rendered as `min === max` — a
 * range shape one careless edit from reintroducing the retired concept
 * was rejected for exactly that reason.
 *
 * `ramp.implement` (12 Aug 2026, U-1) states which implement `weightKg`
 * is measured on — **per-dumbbell for `'dumbbell'`, total load including
 * the bar for `'barbell'`** — because unlike a `setPlan` rung (a bare
 * number, backed by the buildability guard), a ramp row renders a prose
 * unit claim, and a wrong claim here is an athlete-facing falsehood, not
 * an ambiguity a docblock can settle. The two conventions get distinct
 * locale keys (`warmup.rampWeightRepsDumbbell` / `rampWeightRepsBarbell`)
 * rather than one key inferring the unit from the exercise's equipment
 * tag — a unit should be stated, not inferred.
 */

/**
 * How a `drill` is dosed. A closed union, each unit stated rather than
 * inferred (U-1) — only the two doses the coach's Q6 needs. The hold is a
 * **fixed** number of seconds (coach's final arbitration A3, 21 Oct: "8
 * seconds"; the earlier "approximately 5–10" was withdrawn). It is a single
 * value for the same reason `cycle.minutes` is (above): a range shape is one
 * careless edit from reintroducing a concept the coach retired, and rendering
 * `min === max` as one number was the rejected alternative.
 */
export type DrillDose =
  | { unit: 'reps-each-direction'; reps: number }
  | { unit: 'seconds'; seconds: number }

/**
 * A `movement` step may name a **warm-up rendition** of a Library movement
 * with `variantId` (coach's final arbitration C11: "do not create a duplicate
 * Library exercise merely for this warm-up"). The row shows
 * `seed:warmupVariant.<variantId>.name` instead of the Library name and no
 * thumbnail (the Library art would show the loaded version), but the link
 * stays on `exerciseId`, so the cues a visitor reads are that Library page's
 * own. A variant is never a Library entry and never prescribable.
 */

/**
 * `drill` is a prep step that is **not a Library exercise** (coach Q6: do not
 * force these into the browsable Library). It follows the routine-step
 * convention: `id` is the locale key (`seed:warmupDrill.<id>.name`) and there
 * is no Library link and no thumbnail. Like every step it has no `sets`,
 * `weightKg` or `exerciseId`, so it still cannot reach progression.
 */
export type WarmupStep =
  | { kind: 'cycle'; minutes: number }
  | { kind: 'drill'; id: string; dose: DrillDose }
  | { kind: 'movement'; exerciseId: string; reps: number; perSide?: boolean; variantId?: string }
  | { kind: 'ramp'; exerciseId: string; implement: 'dumbbell' | 'barbell'; weightKg: number; reps: number; perSide?: boolean }

export interface Warmup {
  id: string
  steps: WarmupStep[]
}
