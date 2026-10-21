# Mesocycle 2 optimization — prescription draft for coach sign-off

**Status:** DRAFT, lead-owned review artifact. **Coach arbitration of 21 Oct received in full: all nine points answered** (see `mesocycle-2-optimization-coach-arbitration-2026-10-21.md`). carryFrom values below are the lead's derivation from the coach's 'keep original rungs' wording and are to be checked by the validator (proposal §12: nothing mutates the live program until this is signed). Every ⟨COACH⟩ cell is the coach's to fill; the team fills nothing here. Baseline: seed at `f8b20ccd`, rendered mechanically, not retyped. Plan: `~/.claude/plans/m2-optimization-revision-boundary.md` (architect, 21 Oct 2026).

**How to read "which old rungs stay":** the app carries the athlete's last logged performance by rung position. When a 4-rung ladder becomes 3, say which of the old rungs 1–4 each new rung is, in order (for example "keep 2, 3, 4"), so the athlete's logged numbers on those rungs follow him. Write "restate" instead if the new rungs should start from the numbers you write, ignoring his logs for that exercise.

## 1. Continuing exercises whose structure changes (8)

| Session | Exercise | Old prescription (seed) | New set count (proposal) | New rungs or range ⟨COACH⟩ | Which old rungs stay, in order, or "restate" ⟨COACH⟩ | Model: ladder or straight sets ⟨COACH⟩ | Rest (s) |
|---|---|---|---|---|---|---|---|
| A | Dumbbell lateral raise | 4 kg × 15 / 6 kg × 12 / 6 kg × 10 / 6 kg × 8 | 3 | 4×15 / 6×12 / 6×10 (coach Q1) | keep 1, 2, 3 → carryFrom [0,1,2]; inherit (Q2) | ladder (Q3) | 60 (unchanged; coach gave no change) |
| A | Plank | 40 s / 50 s / 60 s / 70 s | 2 | 50 s / 60 s (Q1) | keep 2, 3 → carryFrom [1,2]; inherit (Q2) | duration ladder (Q3) | 60 (unchanged) |
| B | Single-arm dumbbell row | 10 kg × 12 / 12 kg × 10 / 14 kg × 8 / 16 kg × 6 | 3 | 10×12 / 12×10 / 14×8 per side (Q1) | keep 1, 2, 3 → carryFrom [0,1,2]; inherit (Q2) | ladder (Q3) | 90 (unchanged) |
| B | Rear delt fly | 4 kg × 15 / 6 kg × 12 / 6 kg × 10 / 6 kg × 8 | 3 | 4×15 / 6×12 / 6×10 (Q1) | keep 1, 2, 3 → carryFrom [0,1,2]; inherit (Q2) | ladder (Q3) | 60 (unchanged) |
| B | Bicycle crunch | 16 / 20 / 24 / 28 | 3 | 16 / 20 / 24 total reps (Q1) | keep 1, 2, 3 → carryFrom [0,1,2]; inherit (Q2) | rep ladder (Q3) | 60 (unchanged) |
| C | Barbell overhead press | 11.75 kg × 12 / 13.75 kg × 10 / 15.75 kg × 8 / 17.75 kg × 6 | 3 | 11.75×12 / 13.75×10 / 15.75×8, strict (Q1) | keep 1, 2, 3 → carryFrom [0,1,2]; inherit (Q2) | ladder (Q3) | 120 (unchanged) |
| C | Incline push-up | 4 × 10–15 bodyweight | 3 | 3 × 10–15 (Q1) | first three sets → carryFrom [0,1,2]; inherit (Q2) | straight sets, rep range (Q3) | 60 (unchanged) |
| C | Hammer curl | 8 kg × 12 / 10 kg × 10 / 12 kg × 8 / 14 kg × 6 | 2 | 8×12 / 10×10 (Q1) | keep 1, 2 → carryFrom [0,1]; inherit (Q2) | ladder (Q3) | 75 (unchanged) |

Notes the coach should have:
- Lateral raise and rear delt fly: the app never carries their load, only reps and sets; the new rungs' weights will be exactly what you write.
- Plank is a timed ladder (seconds); the import format cannot carry it, which is one reason this ships as seed.
- Bicycle crunch moves from C to B; its logged history follows the exercise, not the session.
- After the first exposure of any prescription, the app offers a per-set echo of what was logged, so "straight sets" describes the starting prescription only.

## 2. New exercises (3)

| Session | Exercise | Starting prescription ⟨COACH⟩ | Rest (s) ⟨COACH⟩ | Temporary substitution if unsafe, by exercise name ⟨COACH⟩ | Technique note for the set screen ⟨COACH, optional⟩ |
|---|---|---|---|---|---|
| A | Parallel bar dip | 2 × 5–8, bodyweight, assistance allowed (arbitration Q5) | 120 | Incline push-up | controlled descent, comfortable shoulder range, no momentum, 2–3 clean reps in reserve; assisted reps must not be recorded as unassisted |
| C | Inverted row | 3 × 8–12, bodyweight, angle sets difficulty (Q5) | 90 | Single-arm dumbbell row | stable body line, pull without jerking, control the lowering |
| C | Supported knee raise | 3 × 8–12, bodyweight (Q5) | 75 | Bicycle crunch | no swinging, posterior pelvic tilt near the top, slow lowering |

## 3. Removed from the program (5)

Overhead triceps extension (A), barbell curl (B), Russian twist (B), barbell hip thrust (C), dumbbell squeeze press (C). They stay in the exercise Library; only the prescriptions go.

## 4. Warm-ups ⟨COACH⟩

| Session | Today (seed) | Proposal §10 asks | ⟨COACH⟩ |
|---|---|---|---|
| A | 3 min bike · bodyweight squat × 8 · goblet squat 8 kg × 5 | keep | ANSWERED (Q6): keep the three steps; before the dip add shoulder circles 8+8, easy scapular push-ups × 6 if comfortable, supported dip position hold 5–10 s. Drills need not be Library entries unless the architecture requires it (architect question). |
| B | 3 min bike · hip hinge × 8 · RDL 7.75 × 8 · RDL 15.75 × 5 | keep | — |
| C | 3 min bike · glute bridge × 8 · hip thrust 11.75 × 8 · hip thrust 19.75 × 5 | remove hip thrust ramps | ANSWERED (Q6): 3 min bike · glute bridge × 8 · bodyweight reverse lunge 5/side · DB reverse lunge 2 kg × 5/side · DB reverse lunge 4 kg × 3/side; plus an OHP-specific ramp, empty bar 7.75 × 5, immediately before OHP and attached to OHP, not to reverse lunge (architect: smallest change for a later-movement warm-up). |

## 5. Other coach questions

- Q4: an extra set the athlete added under the old 4-set structure does NOT cross the revision boundary; after the revision, newly added completed sets follow the 28 Aug rule again (arbitration Q4, full text).
- Incline push-up: first three sets, confirmed (Q1).
- Session C focus line: CONFIRMED "Lower Body & Shoulder Emphasis" in en, fr, zh-CN (Q8). The session id stays.
- Bicycle crunch swap: REMOVE dead bug from its substitutionIds; leave it with no swap for now; dead bug stays in the Library and in Morning Posture Reset (Q9).
- Easier-day rule RULED (Q7): the next normal session inherits from the last valid NORMAL session, not the authored baseline; eased sessions are temporary and never redefine the normal prescription; an eased session must not revive a rung the revision removed. Architect to design.

## 6. Owner questions

- O1: export the app's data so the coach sees the actual carried numbers, not the seed's week-one numbers.
- O2: the revision takes effect at the next app launch after deploy, at whatever rotation position you are in. Fine, or align to the next Session A?
- Station: exact Domyos model, rated load, assembled and stable.


## 7. Open after the validator's second pass (21 Oct, evening)

Blockers the architect is designing (addendum): the OHP ramp needs a per-movement warm-up carrier; the dip-prep drills need a step shape (seconds, 8+8) and a mid-session slot; a swap's performance currently feeds the substitute's own slot elsewhere in the program; dip assistance has no representation in a logged set.

Coach questions sent 21 Oct evening: swap attribution; shoulder circles as one step of 16, two of 8, or prose; dip hold as one number or prose; dip assistance interim (hold on incline push-up, or log unassisted reps only); confirm that an easier day trims plank and hammer curl from 2 rungs to 1 under the new structure.

Resolved 21 Oct, afternoon (owner/coach ruling, `dip-assistance-ruling-2026-10-21.md`): dip assistance is a per-set two-state Unassisted / Assisted flag on the dip's set screen, first exposure Unassisted, each set's state carried as logged, yes/no only. The interim question is withdrawn; addendum 2 CQ-A1 and CQ-A2 are closed, CQ-A3 (inverted-row angle) stays open. The owner also accepted the six French and Chinese names (board, 14:23).
