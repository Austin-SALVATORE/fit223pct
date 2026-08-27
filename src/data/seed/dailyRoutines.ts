import { MORNING_POSTURE_RESET_ID, type DailyRoutine } from '@/domain/dailyRoutine'

/**
 * The Morning Posture Reset catalogue — six movements, transcribed
 * verbatim from the FINAL V1 PRESCRIPTION section of the coach's
 * consolidated ruling (doc 23, "Morning Posture Reset consolidated
 * rulings, all 11 questions", 27 Aug 2026 — governs over every earlier
 * posture document per its own second line). Same shape as
 * `warmups.ts`/`routines.ts` and the same reason: never written to
 * Dexie (nothing stored references this catalogue), covered by
 * `.claude/rules/program-content.md`'s `src/data/seed/**` glob — which
 * movements, which dose, which order is the coach's call, not this
 * repo's. Looked up by `dailyRoutineById`, not imported directly — the
 * function lives here rather than in `domain/dailyRoutine.ts` for the
 * same reason `routineById`/`warmupById` live in their own seed files:
 * `architecture.md`'s one-way dependency direction (domain depends on
 * nothing but itself) forbids the domain type file from importing this
 * one.
 *
 * **Seven items became six.** The optional Half-Kneeling Hip Flexor
 * Stretch is omitted from v1 (doc 23 §8) — it must not be promoted into
 * the Library, and its removal is also what closes plan §1.5's
 * guided-player question (the 30 s hold was the only timer-shaped item;
 * with it gone, every remaining movement is rep- or breath-based and
 * self-paced, so `DailyRoutineStep` needs no `hold` kind at all).
 *
 * **All four reused Library ids carry their own Phase 1 cues** —
 * `dead-bug`, `glute-bridge`, `bird-dog`, `wall-slide` — none renamed,
 * none duplicated (doc 23 §6/§7 explicitly forbid a "with Pelvic
 * Control" duplicate of Glute Bridge and a posture-specific duplicate
 * of Wall Slide; both reuse the existing entry, dose and purpose only).
 *
 * **Wall Slide's dose is PROVISIONAL, not settled** (plan §9.6). Doc 23
 * contradicts itself — §3's graduation criteria says `2 × 10`, but its
 * own FINAL V1 PRESCRIPTION section says `2 × 8–10` — and its
 * precedence rule ("where this conflicts with earlier draft wording,
 * THIS MESSAGE governs") orders *documents*, not sections within one,
 * so it cannot settle the contradiction. `2 × 8–10` is carried here
 * because the FINAL V1 PRESCRIPTION section is the one whose job is to
 * state the prescription — a structural reason, not a preference — and
 * the lead is asking the coach directly. **If he rules `2 × 10`, delete
 * this row's `repsMax` in the same change** (`dailyRoutine.ts`'s own
 * note on why the field exists at all).
 *
 * **Dead Bug and Bird Dog are `perSide`; Glute Bridge and Wall Angel are
 * not** — doc 23's own notation (`2 × 6/side` vs `2 × 10`), transcribed
 * exactly, not inferred from `isUnilateral` on the Library entry (Glute
 * Bridge and Wall Slide are bilateral movements dosed as a plain rep
 * count).
 *
 * **90/90 Breathing carries no seconds anywhere** — `breaths: 5` is the
 * whole of its dose. Doc 23 §2 permits a `30 seconds per round` encoding
 * only if the schema requires an effort value; `DailyRoutineStep` does
 * not (`domain/dailyRoutine.ts`), so the condition is never met. The
 * 6-second exhale this figure would have been derived from
 * (`5 × 6 = 30`) lives in copy only — a future row instruction (Phase 3,
 * `today.json`) and the `ninety-ninety-breathing` Library cue — never in
 * this schema, so a future revision to the exhale duration is a
 * locale-string change here, not a schema one.
 */
export const seedDailyRoutines: readonly DailyRoutine[] = [
  {
    id: MORNING_POSTURE_RESET_ID,
    steps: [
      { kind: 'breathing', exerciseId: 'ninety-ninety-breathing', rounds: 2, breaths: 5 },
      { kind: 'movement', exerciseId: 'dead-bug', rounds: 2, reps: 6, perSide: true },
      { kind: 'movement', exerciseId: 'glute-bridge', rounds: 2, reps: 10 },
      { kind: 'movement', exerciseId: 'bird-dog', rounds: 2, reps: 6, perSide: true },
      // PROVISIONAL — see this file's own docblock. Carries the FINAL V1
      // PRESCRIPTION section's `2 × 8–10`, not §3's `2 × 10`.
      { kind: 'movement', exerciseId: 'wall-slide', rounds: 2, reps: 8, repsMax: 10 },
      { kind: 'movement', exerciseId: 'wall-angel', rounds: 2, reps: 10 },
    ],
  },
]

/** The routine with this id, or undefined — an unknown id degrades to nothing rendered, never a dead link. */
export function dailyRoutineById(id: string): DailyRoutine | undefined {
  return seedDailyRoutines.find((routine) => routine.id === id)
}
