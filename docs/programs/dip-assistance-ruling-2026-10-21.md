# [Coach/product ruling — received verbatim 21 Oct 2026, pasted in chat. Answers the board question "Would a two-state Unassisted / Assisted control under the reps on the dip's set screen fit the one-decision-at-a-time principle?" and the coach's open interim on dip assistance. Unblocks batch A of the Mesocycle 2 optimization (architect addendum 2 §A).]

**[Coach/Product Ruling — Dip Assistance State]**

Decision: **Option 1 — APPROVED.**

Add a two-state control to the Parallel Bar Dip set screen:

- Unassisted
- Assisted

This control is specific to Parallel Bar Dip and should not trigger a broader set-screen redesign.

### Interaction

- Position the control beneath the repetitions input.
- Preselect the previously logged assistance state when available.
- For the first exposure, default to **Unassisted**, but allow immediate switching.
- Do not require an additional confirmation step.
- Preserve the existing one-decision-at-a-time interaction principle.

### Logging and progression

The assistance state is part of the actual set performance and must be persisted with the set log.

Carry-forward must preserve both the repetitions and their assistance classification.

**Assisted and Unassisted performances are not equivalent.**

For example:

Previous completed set:
Assisted × 8

Next prescription:
Assisted × 8

NOT:
Unassisted × 8

An athlete changing from Assisted to Unassisted must explicitly log that change.

Do not automatically infer readiness for Unassisted Dips from assisted repetition counts.

### Mixed assistance within one session

Allow individual sets to have different assistance states.

Example:

Set 1: Unassisted × 5  
Set 2: Assisted × 7

Each set carries its own assistance state into the corresponding next-session prescription.

Do not collapse the entire exercise into one global assistance flag.

### Limits

The two-state control identifies assistance status, not assistance magnitude.

It must not claim that Assisted × 10 represents a precisely measurable external load.

Do not calculate effective bodyweight, estimated 1RM or load progression from this flag.

If the athlete changes assistance magnitude while remaining Assisted, that is not quantitatively captured by this v1 feature.

Keep the implementation limited to the demonstrated need. Do not add a general assistance-management engine or extra tracking complexity.

### Acceptance

The set screen remains fast to use, normally requiring no additional tap.

Historical records remain unchanged.

New dip logs accurately distinguish Assisted from Unassisted performance.

Carry-forward never silently converts assisted repetitions into unassisted repetitions.
