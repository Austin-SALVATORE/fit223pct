# Mesocycle 2 optimization — prescription draft for coach sign-off

**Status:** DRAFT, lead-owned review artifact (proposal §12: nothing mutates the live program until this is signed). Every ⟨COACH⟩ cell is the coach's to fill; the team fills nothing here. Baseline: seed at `f8b20ccd`, rendered mechanically, not retyped. Plan: `~/.claude/plans/m2-optimization-revision-boundary.md` (architect, 21 Oct 2026).

**How to read "which old rungs stay":** the app carries the athlete's last logged performance by rung position. When a 4-rung ladder becomes 3, say which of the old rungs 1–4 each new rung is, in order (for example "keep 2, 3, 4"), so the athlete's logged numbers on those rungs follow him. Write "restate" instead if the new rungs should start from the numbers you write, ignoring his logs for that exercise.

## 1. Continuing exercises whose structure changes (8)

| Session | Exercise | Old prescription (seed) | New set count (proposal) | New rungs or range ⟨COACH⟩ | Which old rungs stay, in order, or "restate" ⟨COACH⟩ | Model: ladder or straight sets ⟨COACH⟩ | Rest (s) |
|---|---|---|---|---|---|---|---|
| A | Dumbbell lateral raise | 4 kg × 15 / 6 kg × 12 / 6 kg × 10 / 6 kg × 8 | 3 | ⟨COACH⟩ | ⟨COACH⟩ | ⟨COACH⟩ | 60 (keep?) |
| A | Plank | 40 s / 50 s / 60 s / 70 s | 2 | ⟨COACH⟩ | ⟨COACH⟩ | ⟨COACH⟩ | 60 (keep?) |
| B | Single-arm dumbbell row | 10 kg × 12 / 12 kg × 10 / 14 kg × 8 / 16 kg × 6 | 3 | ⟨COACH⟩ | ⟨COACH⟩ | ⟨COACH⟩ | 90 (keep?) |
| B | Rear delt fly | 4 kg × 15 / 6 kg × 12 / 6 kg × 10 / 6 kg × 8 | 3 | ⟨COACH⟩ | ⟨COACH⟩ | ⟨COACH⟩ | 60 (keep?) |
| B | Bicycle crunch | 16 / 20 / 24 / 28 | 3 | ⟨COACH⟩ | ⟨COACH⟩ | ⟨COACH⟩ | 60 (keep?) |
| C | Barbell overhead press | 11.75 kg × 12 / 13.75 kg × 10 / 15.75 kg × 8 / 17.75 kg × 6 | 3 | ⟨COACH⟩ | ⟨COACH⟩ | ⟨COACH⟩ | 120 (keep?) |
| C | Incline push-up | 4 × 10–15 bodyweight | 3 | ⟨COACH⟩ | ⟨COACH⟩ | ⟨COACH⟩ | 60 (keep?) |
| C | Hammer curl | 8 kg × 12 / 10 kg × 10 / 12 kg × 8 / 14 kg × 6 | 2 | ⟨COACH⟩ | ⟨COACH⟩ | ⟨COACH⟩ | 75 (keep?) |

Notes the coach should have:
- Lateral raise and rear delt fly: the app never carries their load, only reps and sets; the new rungs' weights will be exactly what you write.
- Plank is a timed ladder (seconds); the import format cannot carry it, which is one reason this ships as seed.
- Bicycle crunch moves from C to B; its logged history follows the exercise, not the session.
- After the first exposure of any prescription, the app offers a per-set echo of what was logged, so "straight sets" describes the starting prescription only.

## 2. New exercises (3)

| Session | Exercise | Starting prescription ⟨COACH⟩ | Rest (s) ⟨COACH⟩ | Temporary substitution if unsafe, by exercise name ⟨COACH⟩ | Technique note for the set screen ⟨COACH, optional⟩ |
|---|---|---|---|---|---|
| A | Parallel bar dip | 2 × 5–8 (proposal §3, provisional) | ⟨COACH⟩ | ⟨COACH⟩ | assisted reps acceptable; 2–3 reps in reserve; comfortable shoulder range |
| C | Inverted row | 3 × 8–12 (proposal §5, provisional) | ⟨COACH⟩ | ⟨COACH⟩ | body angle sets difficulty |
| C | Supported knee raise | 3 × 8–12 (proposal §5, provisional) | ⟨COACH⟩ | ⟨COACH⟩ | posterior pelvic tilt, no swing |

## 3. Removed from the program (5)

Overhead triceps extension (A), barbell curl (B), Russian twist (B), barbell hip thrust (C), dumbbell squeeze press (C). They stay in the exercise Library; only the prescriptions go.

## 4. Warm-ups ⟨COACH⟩

| Session | Today (seed) | Proposal §10 asks | ⟨COACH⟩ |
|---|---|---|---|
| A | 3 min bike · bodyweight squat × 8 · goblet squat 8 kg × 5 | keep, plus shoulder and elbow preparation before the dip | name the preparation movements, if any |
| B | 3 min bike · hip hinge × 8 · RDL 7.75 × 8 · RDL 15.75 × 5 | keep | — |
| C | 3 min bike · glute bridge × 8 · hip thrust 11.75 × 8 · hip thrust 19.75 × 5 | remove hip thrust ramps; prepare reverse lunge and overhead press | does glute bridge stay? what is ramped, at what load? The app attaches ramp sets to the session's first movement (13 Aug rule); if OHP needs a ramp while not first, say so and the team will change that rule. |

## 5. Other coach questions

- Q3: an extra set the athlete added under the old 4-set structure. Should it carry into the new structure? Team recommendation: no, per your §9.
- Q4: incline push-up 4→3 is a uniform range; "keep the first three sets" assumed unless you say otherwise.
- Session C focus line: "Lower Body & Shoulder Emphasis" replaces "Lower Body & Glute Emphasis"? The session id stays.
- Bicycle crunch currently lists dead bug as its swap in the Library; your §4 says dead bug must not replace it. Keep or remove the swap?
- Q7 (separate live defect, found while measuring): on an "easier" readiness day the app drops the top rung, then carry-forward puts it back from history. When fixed, what should the next normal day's top rung be after an easier day: the carried value from before the easier day, or the authored value?

## 6. Owner questions

- O1: export the app's data so the coach sees the actual carried numbers, not the seed's week-one numbers.
- O2: the revision takes effect at the next app launch after deploy, at whatever rotation position you are in. Fine, or align to the next Session A?
- Station: exact Domyos model, rated load, assembled and stable.

