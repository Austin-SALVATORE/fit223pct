/**
 * A Morning Posture Reset step — the domain vehicle for a program-
 * independent, low-fatigue daily motor-control routine (coach doc 23,
 * "Morning Posture Reset consolidated rulings, all 11 questions", 27 Aug
 * 2026 — governs over every earlier posture document per its own second
 * line; plan `~/.claude/plans/morning-posture-reset.md` §1.3/§1.4).
 * Modelled on `domain/warmup.ts`, not `ExercisePrescription` — same
 * defining property: what this type deliberately lacks. No `mode`, no
 * `EffortMode`, no `restSeconds`, no `range`, no `setPlan`, no
 * `recordable`, no `weightKg`, no `variantKey`. That absence is the
 * mechanism, not an omission — it is what keeps this content from
 * reaching `domain/progression.ts` without someone first writing a
 * conversion, a visible act rather than a quiet field addition — and it
 * is stricter than `WarmupStep` (whose `ramp` carries a `weightKg`):
 * doc 23 §3 forbids load-first progression here outright.
 *
 * **`rounds`, never `sets`.** The coach's own instruction ("use
 * 'rounds', not 'sets', in the Morning Posture Reset UI") is applied to
 * the field name, not only the copy — "sets" is the strength vocabulary
 * (`ExercisePrescription.sets`, `SetTarget`, `LoggedSet`, `SetScreen`),
 * and doc 23's own guiding principle opens "NOT a workout... NOT part
 * of Full Body A/B/C". A field named `sets` under UI copy that says
 * "rounds" would hide the strength vocabulary in the schema rather than
 * remove it — the next reader sees `sets: 2` and thinks *sets*.
 * `rounds` is a display multiplier only: nothing logs per round,
 * nothing completes per round, nothing but the row's own copy reads it.
 *
 * **Two kinds, two units, each stated not inferred** — `warmup.ts`'s own
 * ruling: distinct keys "rather than one key inferring the unit… a unit
 * should be stated, not inferred." `breathing`'s `breaths` field is what
 * satisfies doc 23 §2's "do NOT create rep semantics for breaths" and
 * "do not display '5 reps'" — folding breath counts into `reps` with a
 * unit flag would violate it. No `EffortMode`/seconds anywhere: this
 * schema never requires an effort value, so doc 23 §2's conditional
 * "30 seconds per round" fallback (permitted *only if* the structured
 * prescription requires seconds) is never triggered. The 6-second
 * exhale lives in copy only (a future `today.json` row and the
 * `ninety-ninety-breathing` Library cue), never in this schema — see
 * `seed/dailyRoutines.ts`'s own docblock for the dependency this
 * creates and why the design is immune to its collapse.
 *
 * **`repsMax?` exists solely to make the blocked Wall Slide dose a
 * one-line change**, and it is not a speculative field (contrast the
 * rejected `level` field — doc 23 §3 forbids widening the progression-
 * token vocabulary for this feature). Doc 23 states the dose two ways
 * in the same document — `2 × 10` (§3, graduation criteria) and
 * `2 × 8–10` (FINAL V1 PRESCRIPTION) — and one of the two live
 * candidate answers requires a range. See `seed/dailyRoutines.ts` for
 * which is currently carried and its provisional-not-settled marker.
 * **If the coach settles on `2 × 10`, delete this field in the same
 * change** — `warmup.ts`'s `cycle.minutes` is the precedent: a range
 * shape one careless edit from reintroducing a retired concept must not
 * survive once the question closes.
 *
 * **One optional field, not two `optional` steps.** The half-kneeling
 * hip-flexor stretch — the only member of an earlier `hold` kind and an
 * `optional` flag — is out of v1 entirely (doc 23 §8: must not be
 * promoted into the Library, and must not be used to force a
 * guided-player architecture). Both are deleted rather than left
 * unused; all six remaining movements are prescribed, so there is
 * nothing left for either to mark.
 *
 * **No pointer from `Program`.** `warmupId` and `routineId` both hang
 * off program content; doc 23 §10 puts this module outside any program
 * — it survives Mesocycle 2 ending 6 Sep 2026 and every mesocycle after
 * it (plan §1.7's measured fact: `seedDatabase()` unconditionally
 * re-puts every `Program` on every boot but writes `UserSettings` only
 * when absent, which is why activation lives on settings, not on a
 * program field). The catalogue is reached by a module-level constant,
 * never written to Dexie, same as `warmups.ts`/`routines.ts`.
 */
export type DailyRoutineStep =
  | { kind: 'movement'; exerciseId: string; rounds: number; reps: number; repsMax?: number; perSide?: boolean }
  | { kind: 'breathing'; exerciseId: string; rounds: number; breaths: number }

export interface DailyRoutine {
  id: string
  steps: DailyRoutineStep[]
}

/** The one v1 routine's id — a module-level constant, not a Dexie-stored program id (see docblock above). */
export const MORNING_POSTURE_RESET_ID = 'morning-posture-reset'
