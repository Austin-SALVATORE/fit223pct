import type { EffortMode, ExercisePrescription, LadderPrescription, LoggedSet, SetTarget, WorkoutExercise } from './types'
import { scopedExposuresFor } from './workout'
import type { Workout } from './types'

/**
 * Progression replacement, Phase 2 (`~/.claude/plans/
 * progression-carry-forward.md` §1/§2, coach ruling "simplify progression
 * and increase working volume", 28 Aug 2026). Pure, immutable, no React,
 * no i18next — this module returns data, never prose, same as every other
 * `src/domain/**` file.
 *
 * **Live since 99f27cf (28 Aug 2026).** Wired in through
 * `carrySessionForward`, called once from `TodayPage`'s start path (see that
 * function's docblock), and `nextSetTarget.ts` only reads the result.
 * `progression.ts` is deleted. This header once said nothing called this
 * file yet; that stopped being true the day Phase 3 landed.
 */

/**
 * The coach's rule, verbatim: "NEXT PRESCRIPTION = the athlete's actual
 * completed prescription from the previous completed exposure to that
 * exercise. […] Do not apply another automatic increment on top of it."
 * Stated as he asked it to be stateable: "each set starts where that set
 * finished last time."
 *
 * **Per-set positional, not a single flattened number.** Chosen over four
 * alternatives by measurement (plan §0.3/§1) — heaviest-set collapses a
 * three-rung ladder to one set, worst-set turns a pyramid into three sets
 * at the top rung, last-set silently manufactures an unauthored intensity
 * increase, modal-set collapses to the lightest rung. Two of those are the
 * exact heuristics this ruling retires by name (`progression.ts`'s
 * `maxWeight` and its worst-set `Math.min(...efforts)`); reintroducing
 * either under a new name here would ship the retired rule again. Per-set
 * is the only one of the five that is an identity on an exactly-executed
 * session — see the "identity" test below.
 *
 * **No `UserSettings`/equipment argument, deliberately.** This function
 * only ever echoes a load the athlete has already lifted — it computes
 * nothing. The coach drew a structural line: "`equipment.confirmedAt`
 * remains required for any future mechanism that GENERATES a different
 * load from the one actually demonstrated. […] This distinction should be
 * structural." A pure echo needs no gate to check, so this signature has
 * nowhere to put one. A future contributor adding arithmetic that
 * proposes a value the athlete never logged (e.g. "+2 kg once every rung
 * hits target") cannot thread it through silently — there is no
 * `confirmedAt` in scope here, so doing that honestly requires adding a
 * settings parameter, which is a visible, reviewable signature change, not
 * a line added inside this function's body.
 *
 * @param authored The current program's prescription for this exercise —
 *   remains authoritative for everything not actually demonstrated: mode,
 *   rest, equipment ceiling, and every prescribed rung the athlete did not
 *   perform (skipped, or a level a program revision added since the last
 *   exposure).
 * @param previous The most recent *complete* exposure to this exercise in
 *   this program, or `null`. Callers should pass the result of
 *   {@link mostRecentCompleteExposureFor}, not {@link previousExposureFor}
 *   (`workout.ts`) — see that function's own docblock for why a plain
 *   "has any sets logged" exposure is the wrong input here (rule (c)
 *   below). `null` — no history at all, or no *complete* exposure exists —
 *   returns `authored` unchanged, which is also rule (c)'s stated fallback.
 */
export function carryForwardPrescription(
  authored: ExercisePrescription,
  previous: WorkoutExercise | null,
): ExercisePrescription {
  if (previous === null) return authored

  const setPlan = buildSetPlan(authored, previous)
  // Narrows `authored` to LadderPrescription so `.rehearsal` is legal to
  // read; `undefined` on the RepRangePrescription branch is correct too —
  // that shape never carries a rehearsal set.
  const rehearsal = authored.setPlan !== undefined ? authored.rehearsal : undefined

  const carried: LadderPrescription = {
    exerciseId: authored.exerciseId,
    sets: setPlan.length,
    mode: authored.mode,
    restSeconds: authored.restSeconds,
    perSide: authored.perSide,
    role: authored.role,
    note: authored.note,
    substitutionIds: authored.substitutionIds,
    setPlan,
    maxWeightKg: authored.maxWeightKg,
    weightStepKg: authored.weightStepKg,
    rehearsal,
    // Persisted so the stored snapshot records which structure the athlete
    // was offered — the next exposure's projection compares against it.
    // `undefined` (the norm) leaves the literal key-for-key what it was.
    revision: authored.revision,
    // A display pointer, but the literal is built field by field and Workout
    // mode reads the stored *carried* prescription — without this line the
    // pointer is stripped for every exercise that has history.
    warmupId: authored.warmupId,
  }
  return carried
}

/**
 * Every prescribed rung (0..`authored.sets - 1`), then any *completed*
 * custom slots the athlete added, in `setIndex` order.
 *
 * **Consequence, not a bug (plan §2): every prescription becomes a
 * `setPlan` after its first completed exposure.** `sets === setPlan.length`
 * is maintained throughout — `programImport.ts`'s own refinement already
 * relies on that invariant holding for every stored prescription.
 */
function buildSetPlan(authored: ExercisePrescription, previous: WorkoutExercise): SetTarget[] {
  const authoredRungs = authoredSetPlan(authored)
  const skipped = new Set(previous.skippedLevels ?? [])
  const loggedByIndex = new Map(previous.sets.map((s) => [s.setIndex, s] as const))
  const gatesLoad = isLoadCarryForwardExcluded(authored.exerciseId)

  /**
   * (a) A skipped prescribed level does NOT disappear. Coach ruling: "A
   * skipped level is temporary under-performance, not programme deletion.
   * […] preserve the prescribed level for the next exposure … do not
   * convert 'skip this set today' into 'delete this rung forever.'" So a
   * skipped index — and any index a program revision added since the
   * logged exposure, which was never a decision the athlete made — falls
   * back to the authored rung rather than disappearing or reading as an
   * unauthored zero.
   */
  const prescribedRungs = authoredRungs.map((rung, index) => {
    if (skipped.has(index)) return rung
    const logged = loggedByIndex.get(index)
    if (logged === undefined) return rung
    return carriedRung(authored.mode, rung, logged, gatesLoad, rung.weightKg)
  })

  /**
   * (b) A deliberately added AND completed custom set DOES carry — but
   * only if it was actually logged, and never a skipped/unfilled slot
   * (which leaves no `LoggedSet` to read). Coach ruling: "prescribed 3
   * working sets; athlete performs and logs 4 complete working sets; next
   * exposure: 4 working sets. This supersedes the earlier statement that a
   * custom added set cannot affect progression" (see `types.ts`'s
   * `LoggedSet.custom` docblock for the superseded original).
   *
   * **Load fallback correction — lead ruling, 28 Aug 2026, not the
   * coach's words.** The first version of this function used the custom
   * set's own logged weight as its `gatesLoad` fallback, on the reasoning
   * that no authored rung exists for a slot that was never prescribed.
   * That inverts the technique-gate: "choosing a heavier dumbbell does NOT
   * automatically establish that heavier load as the next prescription;
   * the authored load remains authoritative until deliberately changed by
   * the coach/programme" does not carve out an exception for a *new* set
   * — it is a blanket rule about this lift's load, and a custom set is
   * still this lift. Concretely: authored 6×15 → 6×12, athlete adds a
   * 4th set at 8 kg — the original code would have carried 8 kg into next
   * week's prescription on a lift the coach specifically ruled must never
   * gain load except by his own decision. Fixed to fall back to the
   * *last authored rung's* weight (`startWeightKg` when the authored
   * prescription has no `setPlan` — `authoredSetPlan` already synthesizes
   * that uniformly, so no extra branch is needed here) — applying the
   * coach's rule rather than extending it, since the authored load stays
   * authoritative either way. Set count and reps still carry normally;
   * only the added rung's weight is pinned.
   */
  const lastAuthoredRung = authoredRungs.at(-1) ?? null
  const customRungs = previous.sets
    .filter((s) => s.setIndex >= authored.sets && !skipped.has(s.setIndex))
    .sort((a, b) => a.setIndex - b.setIndex)
    .map((logged) => carriedRung(authored.mode, null, logged, gatesLoad, lastAuthoredRung?.weightKg ?? null))

  return [...prescribedRungs, ...customRungs]
}

/**
 * One rung's carried value — the only place this file reads a `LoggedSet`.
 * `loadFallbackWeightKg` is the weight a `gatesLoad` exercise pins to
 * instead of the logged weight — the calling rung's own authored weight
 * for a prescribed level, the last authored rung's weight for an added
 * custom one (see `buildSetPlan`'s docblock on the custom-set case for
 * why it is not simply the logged weight).
 */
function carriedRung(
  mode: EffortMode,
  authoredRung: SetTarget | null,
  logged: LoggedSet,
  gatesLoad: boolean,
  loadFallbackWeightKg: number | null,
): SetTarget {
  // The defect class this guards against has shipped once already
  // (`mesocycle2Build.conformance.test.ts`, "the seeded plank actually
  // reaches load-not-the-lever…"): `SetScreen` logs a timed hold into
  // `seconds`, never `reps`, so reading `reps` unconditionally for a
  // seconds-mode ladder silently reads 0 forever.
  const loggedEffort = mode === 'seconds' ? logged.seconds : logged.reps
  const reps = loggedEffort ?? authoredRung?.reps ?? 0

  /**
   * Technique-gated lifts (12 Aug 2026 ruling): "Dumbbell Lateral Raise
   * and Rear Delt Fly are EXCLUDED from automatic load carry-forward. […]
   * choosing a heavier dumbbell does NOT automatically establish that
   * heavier load as the next prescription; the authored load remains
   * authoritative until deliberately changed by the coach/programme." Reps
   * and set count still carry normally for these two — only `weightKg` is
   * pinned, to `loadFallbackWeightKg`, never to what was logged.
   */
  /**
   * **A logged set with no load demonstrates nothing, so it cannot erase the
   * authored one** (owner report 20 Oct: "in a movement I can no more change
   * the kg"). `SetScreen` renders the weight Stepper only when the target
   * weight is non-null, so a `null` carried onto a loaded rung removes the
   * control — and the next set is logged `null` too, re-carrying it forever.
   * `swapExercise` keeps the slot's prescription while changing the exercise
   * id, so an unloaded slot swapped to a loaded movement logs `weightKg:
   * null` under that movement's id; this line then poisoned its next
   * authored exposure. Falls back like the technique-gate does.
   *
   * The swap route is now also closed upstream: a swapped exposure is
   * excluded from the carry basis (`isCarryBasisExposure`, addendum 2 §1), so
   * it never reaches this function — for reps as well as load. This fallback
   * stays regardless: a legacy snapshot whose carried target was already `null`
   * hides the Stepper and logs `null` again, and imported data can carry one.
   */
  const weightKg = gatesLoad ? loadFallbackWeightKg : (logged.weightKg ?? loadFallbackWeightKg)

  return authoredRung?.variantKey === undefined
    ? { weightKg, reps }
    : { weightKg, reps, variantKey: authoredRung.variantKey }
}

/**
 * The authored prescription's own per-set targets, synthesized for a
 * `RepRangePrescription` (which carries no `setPlan`). Only reached as a
 * fallback value — a skipped level, an unaccounted-for index, or a fresh
 * rung a program revision added — never for a level that was actually
 * logged.
 *
 * **Synthesis, stated so it can be argued with.** A `RepRangePrescription`
 * defines no single per-set target, only a uniform `startWeightKg` and a
 * `range`. `range.min` is not invented for this purpose — it is the same
 * fallback `progression.ts`'s `suggestProgression` already uses for a
 * fresh, no-history start (its `'start'` branch: `targetReps: range.min`),
 * reused here rather than a new convention.
 */
function authoredSetPlan(authored: ExercisePrescription): SetTarget[] {
  if (authored.setPlan !== undefined) return authored.setPlan
  return Array.from({ length: authored.sets }, () => ({
    weightKg: authored.startWeightKg,
    reps: authored.range.min,
  }))
}

/**
 * The named, testable exclusion list (12 Aug 2026 ruling) — a reviewer
 * should be able to see at a glance which exercises are load-gated and
 * why, rather than finding a scattered `exerciseId === '...'` condition
 * inline. His reasoning: "movement quality matters more than demonstrated
 * ability to complete one heavier exposure" — and explicitly "Do not
 * generalise it to all accessory exercises," so this stays a closed,
 * named list rather than a role- or equipment-derived rule.
 */
const LOAD_CARRY_FORWARD_EXCLUDED_EXERCISE_IDS: ReadonlySet<string> = new Set([
  'dumbbell-lateral-raise',
  'rear-delt-fly',
])

export function isLoadCarryForwardExcluded(exerciseId: string): boolean {
  return LOAD_CARRY_FORWARD_EXCLUDED_EXERCISE_IDS.has(exerciseId)
}

/**
 * An exposure is complete when every prescribed level (index
 * `0..exercise.prescription.sets - 1`) is accounted for — logged or
 * explicitly skipped — and at least one is logged. Custom slots
 * (`setIndex >= prescription.sets`) are not part of this check. An
 * offered-but-unused custom slot is not a gap in the prescription, because
 * the prescription never asked for it — only prescribed levels can be
 * "unaccounted for".
 *
 * **Confirmed by the coach, 28 Aug 2026 — this is his ruling, not an
 * inference.** Originally implemented as our own reading of rule (c) and
 * flagged as such; put to him and returned "CONFIRMED. The implemented
 * interpretation is correct," with "No predicate change is required." His
 * own formulation, crisper than the original docblock and worth quoting
 * directly:
 *
 * > Explicit skip = information.
 * > Missing entry = absence of information.
 * > But information about not performing a set is not evidence for
 * > deleting that set from the future prescription.
 *
 * He also settled the edge this predicate's second clause exists for —
 * every prescribed level explicitly skipped, nothing logged at all:
 * "that exercise exposure is NOT complete for carry-forward purposes. The
 * skips remain historical truth if the app records them, but they
 * establish no new prescription baseline. This is why the requirement 'at
 * least one level must contain a valid completed log' should remain." See
 * the "false when every prescribed level is skipped and none is logged"
 * test below for the case this rules out.
 */
export function isCompleteExposure(exercise: WorkoutExercise): boolean {
  const prescribedCount = exercise.prescription.sets
  const skipped = new Set(exercise.skippedLevels ?? [])
  const loggedIndices = new Set(
    exercise.sets.filter((s) => s.setIndex < prescribedCount).map((s) => s.setIndex),
  )

  let anyLogged = false
  for (let index = 0; index < prescribedCount; index += 1) {
    if (loggedIndices.has(index)) {
      anyLogged = true
      continue
    }
    if (skipped.has(index)) continue
    return false
  }
  return anyLogged
}

/**
 * The most recent *complete* exposure to this exercise, program-scoped —
 * `workout.ts`'s `previousExposureFor` walks the same ordered candidate
 * list ({@link scopedExposuresFor}) but stops at the first exposure with
 * any sets logged at all; this stops at the first that also satisfies
 * {@link isCompleteExposure}, per the coach's rule (c): "Use the most
 * recent COMPLETE exposure of that exercise. Session completion alone is
 * insufficient. […] If no previous complete exposure exists, fall back to
 * the current authored prescription." (The fallback itself is
 * `carryForwardPrescription`'s `previous === null` branch — this function
 * returning `null` and that branch firing are the same rule, split across
 * the lookup and the combinator.)
 *
 * This is the function `carryForwardPrescription`'s `previous` argument
 * should come from — not `previousExposureFor`, which would hand carry-
 * forward a partial exposure and let it silently become the next
 * prescription, exactly the outcome rule (c) forbids.
 *
 * **This is the one "carry basis" rule.** Three things, in this order, decide
 * which exposure may seed the next prescription:
 *  1. {@link isCarryBasisWorkout} — a workout started on an easier day is not a
 *     basis (coach Q7: easier-day logs "do not automatically redefine" the
 *     normal prescription).
 *  2. {@link isCarryBasisExposure} — a swapped slot is not a basis (the
 *     coach's swap ruling: a substitute was performed against the *original*
 *     exercise's sets and reps, so it changes the next prescription of neither
 *     exercise; the original resumes from its last real session). Applied
 *     inside the per-workout `find`, so a workout holding a swapped slot AND a
 *     real slot of the same exercise still counts via the real one.
 *  3. {@link isCompleteExposure} — judged last, on what survived both
 *     filters, so an excluded session can never end the search early.
 * "Last time" (`previousSetsFor`), stagnation and trends are deliberately
 * unfiltered: they describe what was actually done.
 */
export function mostRecentCompleteExposureFor(
  workouts: readonly Workout[],
  programId: string,
  exerciseId: string,
): WorkoutExercise | null {
  return (
    scopedExposuresFor(workouts.filter(isCarryBasisWorkout), programId, exerciseId, isCarryBasisExposure).find(
      isCompleteExposure,
    ) ?? null
  )
}

/**
 * Whether one exposure may serve as the carry basis. A swapped slot
 * (`substitutedForId` set) was performed against another exercise's
 * prescription — e.g. push-ups done as the Dip's 2 x 5-8 — and carry is
 * positional, so its logs would land on rungs they were never performed
 * against. Excluded at the lookup (addendum 2 §1), so neither the
 * substitute's own slot nor the replaced slot reads it; it stays in history
 * and in "Last time".
 */
export function isCarryBasisExposure(exercise: WorkoutExercise): boolean {
  return exercise.substitutedForId === undefined
}

/**
 * Whether a workout may serve as the carry basis. An easier-day session never
 * redefines the normal prescription (coach Q7, 21 Oct: "easier-day logs … do
 * not automatically redefine" it), so a workout started with
 * `readiness.tier === 'easier'` is excluded. A workout with no `readiness`
 * field counts as normal.
 *
 * **Filtered here, not in `scopedExposuresFor`** (`workout.ts`): that function
 * is shared with `previousExposureFor`, which serves the "Last time" display,
 * and "Last time" must keep showing what was actually lifted. Same precedent as
 * `detectStagnation`, which judges only non-easier sessions.
 */
export function isCarryBasisWorkout(workout: Workout): boolean {
  return workout.readiness?.tier !== 'easier'
}

/**
 * Carry-forward applied to a whole session's prescriptions **at the moment a
 * workout is created**, so the snapshot a workout stores is the plan that is
 * actually offered.
 *
 * **Why this exists (QA F3, 20 Oct).** `createWorkout` used to snapshot the
 * authored prescriptions while `SetScreen`/`RestScreen` carried them at render
 * time. The two disagreed whenever carry changed the set count — a completed
 * custom 4th set made the screen say "of 4" while `workoutPosition`, which
 * walks the stored `prescription.sets`, moved on after set 3. Set 4 was
 * counted and never offered. Storing the carried plan makes position, counts,
 * summary and history one source by construction. The render-time carry stays
 * as a re-application, which is idempotent over the same exposure.
 */
export function carrySessionForward(
  items: readonly ExercisePrescription[],
  completed: readonly Workout[],
  programId: string,
): ExercisePrescription[] {
  return items.map((item) =>
    carryForwardPrescription(
      item,
      projectExposureAcrossRevision(item, mostRecentCompleteExposureFor(completed, programId, item.exerciseId)),
    ),
  )
}

/**
 * Re-expresses an exposure logged under an older structure in the **new**
 * structure's set positions, in memory only, so the unchanged
 * `carryForwardPrescription` can read it positionally.
 *
 * **Why (plan `~/.claude/plans/m2-optimization-revision-boundary.md` §1-§2).**
 * Carry is positional and treats any logged `setIndex >= authored.sets` as an
 * athlete-added set. After a coach drops a rung under the same program id,
 * the old last set therefore carried straight back in (4 sets again), and
 * dropping an earlier rung gave the new rung 0 the removed rung's load. The
 * coach's 21 Oct §9: a reduction is authoritative, history is never
 * rewritten. Nothing is written here — the returned exposure is a throwaway.
 *
 * - `authored.revision` absent, or equal to the id the exposure was offered
 *   under (`previous.prescription.revision`): `previous` unchanged, so every
 *   prescription without a marker behaves exactly as before.
 * - Otherwise new rung `i` is seeded by the logged set at old `setIndex`
 *   `carryFrom[i]`; a `null`, unlogged, skipped or out-of-range source leaves
 *   that rung to fall back to the authored one. Old custom sets (indices at or
 *   past the old structure's `sets`) and unmapped old rungs are dropped.
 * - Nothing maps: `null`, the existing "no history" branch.
 */
export function projectExposureAcrossRevision(
  authored: ExercisePrescription,
  previous: WorkoutExercise | null,
): WorkoutExercise | null {
  if (previous === null) return null
  const revision = authored.revision
  if (revision === undefined || previous.prescription.revision?.id === revision.id) return previous

  const oldSets = previous.prescription.sets
  const projected: LoggedSet[] = []
  revision.carryFrom.forEach((source, newIndex) => {
    if (source === null || source >= oldSets) return
    const logged = previous.sets.find((s) => s.setIndex === source)
    if (logged !== undefined) projected.push({ ...logged, setIndex: newIndex })
  })
  if (projected.length === 0) return null

  return { ...previous, prescription: authored, sets: projected, skippedLevels: [], customSlots: 0 }
}
