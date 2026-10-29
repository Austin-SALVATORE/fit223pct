# Coach confirmation CC1–CC4 (29 Oct 2026): substitution history and swap-back

Relayed by the owner on 29 Oct 2026, in answer to the team's four confirmations
on the CQ2–CQ4 readings. The text below is verbatim.

---

# [Fit223PCT — Coach Confirmation: CC1–CC4]

These decisions finalize the substitution-history and carry-forward semantics.

## CC1 — Valid substitution history

**CONFIRMED. Agree with the Team's interpretation.**

A substitute exercise can establish valid independent exercise history when it is correctly logged under the new exercise-specific substitution rules.

- Valid substitute logs belong to the substitute exercise's history.
- They must not modify the original exercise's progression.
- Pre-fix substitution records are excluded from progression and weight suggestions unless independently verified and explicitly corrected.
- The corrupted 24 October Barbell Bench Press record remains excluded.
- Future valid Barbell Bench Press substitute logs may establish its own exercise history, even if no active program directly prescribes it.

Do not permanently exclude all substitution records. That would incorrectly prevent substitute-only exercises from developing their own performance history.

## CC2 — Program-phase boundaries

**CONFIRMED.**

Only valid logs from the same program progression context are eligible.

- Mesocycle 2 Build, including its approved revisions, is one continuous program.
- Phase 1 is a separate program.
- No automatic carry-forward between Phase 1 and Mesocycle 2 is authorized.

Exercise identity alone does not establish progression continuity across programs.

## CC3 — Missing historical rung

**Decision: Leave the weight without a suggestion.**

Example:

The substitute's last valid session contained three sets, but today's substituted slot contains four.

For set 4:

- Do not invent a historical weight.
- Do not automatically reuse the weight from set 3.
- Leave the weight for explicit athlete selection.
- Once the athlete selects and logs the weight, preserve that actual performance.

This is deliberately conservative.

The previous set's weight is valid evidence of what the athlete just lifted, but not necessarily the appropriate prescription for a different rung, particularly in ascending pyramids.

The UI may make manual selection convenient, but should not silently turn that observation into a recommendation.

## CC4 — Swapping back to the original exercise

**Decision: YES — a genuine return to the original exercise should count for progression.**

The current behavior should be corrected.

If the athlete:

1. Opens exercise A.
2. Selects substitute B.
3. Changes back to exercise A.
4. Performs and correctly logs exercise A.

Then the completed exercise should be treated as exercise A, not permanently classified as substituted merely because the swap UI was previously used.

The governing information is the **actual exercise performed and logged**, not whether the athlete interacted with the swap control.

Requirements:

- If the final performed exercise is the original, and the exposure meets normal completion requirements, it is eligible for original-exercise carry-forward.
- If the final performed exercise is the substitute, its valid logs belong to the substitute.
- If original and substitute sets were both performed, preserve each set's actual identity; never reinterpret substitute sets as original sets.
- A partially completed original exercise must not become eligible merely because the athlete switched back.
- Preserve existing explicit-skip and complete-exposure requirements.

Do not use a sticky `everSwapped` state as the deciding factor for progression eligibility.

## Final principle

**Progression follows valid completed performance of the actual exercise, within the correct program context.**

It does not follow:

- The original exercise slot's identity.
- The heaviest historical set.
- An unrelated program's logs.
- A temporary UI swap state.
- An inferred weight for a missing rung.

These four decisions are approved for implementation.

No A/B/C program-content changes are requested.
