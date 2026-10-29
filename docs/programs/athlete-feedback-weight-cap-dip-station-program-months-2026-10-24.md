# Athlete feedback (24 Oct 2026): weight cap, dip station, Program page months

Relayed by the owner on 29 Oct 2026. The text below is verbatim. Lead notes,
if any, go after it under a separate heading.

---

# Fit223PCT — Athlete Feedback
## Bug Reports & Home Training Enhancements
**Date:** 24 October 2026  
**Baseline:** Mesocycle 2 Build v3

After training with the revised program, I identified three areas that need attention.

These are direct observations from actual usage, not a request to redesign the entire application.

## 1. BUG — Weight selector incorrectly enforces the program's maximum load

**Priority: High — UX / Workout Logging**

### Current behavior

The weight adjustment cursor/control is capped at what Fit223 considers the maximum permitted weight.

This prevents me from freely selecting and logging the weight I actually use.

The predefined equipment ceiling should not function as a hard input limit.

### Expected behavior

**Remove the hard maximum weight restriction from the workout logging control.**

Requirements:

- Allow the athlete to manually enter or adjust weights beyond the program's configured equipment ceiling.
- Preserve the exact load entered by the athlete.
- Do not silently clamp, round down or overwrite the input to match the program maximum.
- Keep the configured equipment ceiling available as informational metadata or for future automatically generated load recommendations.
- If the entered load exceeds a known equipment capability, a non-blocking warning is acceptable, but logging must remain possible.
- Do not interpret an above-ceiling entry as automatic confirmation that the athlete owns heavier equipment.

### Progression consideration

Fit223 uses completed logs for next-session carry-forward.

Please verify that removing the UI restriction does not introduce invalid state or inconsistent load display in the next session.

The distinction should remain:

**Actual logged load = athlete-controlled historical fact.**

**Equipment ceiling = program/equipment guidance, not an input restriction.**

Please inspect whether the maximum is enforced only by the UI control or also by form validation, data persistence, and carry-forward.

---

## 2. ENHANCEMENT — Better integration of the Dip Station into Home Full Body training

**Priority: High — Program / Equipment Utilization Review**

Today's Full Body B session revealed an opportunity for improvement.

### What I changed during training

**Change A — Inverted Row**

The current Full Body B does not include a Dip Station movement.

I manually replaced:

Single-Arm Dumbbell Row

with:

**Inverted Row**, performed using my Domyos TS 100 parallel bars.

I would like the Coach to evaluate whether this is a better permanent distribution of pulling exercises across A/B/C.

For example, Inverted Row could move from C to B, with the remaining back-training work redistributed accordingly.

Do not simply duplicate Inverted Row in both sessions without considering weekly pulling volume.

**Change B — Barbell Bench Press**

I replaced:

Dumbbell Bench Press

with:

**Barbell Bench Press**.

I experimented with using the freestanding Dip Station as a barbell support.

The improvised setup appeared workable during my session, but it has not been formally verified as safe.

This observation should prompt an equipment-compatibility review, not immediate approval of the setup.

### Broader intent

When I originally asked to integrate the Dip Station into my home program, I did not mean only adding conventional parallel-bar exercises.

I wanted the Coach and Agent Team to explore **creative, practical and safe ways to use my existing home equipment together**.

Available equipment includes:

- Decathlon Domyos TS 100 freestanding adjustable parallel bars.
- Barbell and weight plates.
- Adjustable dumbbells.
- Adjustable training bench.
- Indoor cycling equipment.

Potential equipment combinations worth investigating include:

- Parallel-bar calisthenics movements.
- Inverted Row variations.
- Supported bodyweight movements.
- Other barbell or bench configurations, but only when mechanically stable and supported by manufacturer guidance.

Barbell Bench Press and squat-rack-like configurations should undergo explicit safety assessment.

**Important safety boundary:** Independent parallel bars must not be treated as a certified barbell rack, safety stand, or Smith machine. A Smith squat requires a guided-bar mechanism that the TS 100 does not provide.

Do not automatically add unsupported loaded barbell movements merely because the equipment can physically hold a bar.

### What I want from the Agent Team

Please work with the Coach to review:

1. Whether Inverted Row should become the regular pulling movement in Full Body B.
2. Whether Full Body C needs a different pulling movement after that reassignment.
3. Whether Barbell Bench Press is appropriate for my home environment, including safe unracking, reracking and failure management.
4. Which additional training movements can safely utilize the Dip Station.
5. Whether the exercise Library and equipment taxonomy adequately represent multi-equipment setups.
6. How these changes affect weekly muscle-group coverage, session fatigue and progression history.

Do not make permanent A/B/C program changes until the Coach has reviewed the revised exercise distribution and safety considerations.

The goal is to make better use of existing equipment without increasing unnecessary training volume.

---

## 3. UI ENHANCEMENT — Collapsible months on the Program page

**Priority: Medium — Navigation / Usability**

### Current behavior

The Program page displays a long sequence of monthly sections.

Navigating through the entire program requires excessive scrolling.

This makes it inconvenient to locate the current month and review the relevant training schedule.

### Requested improvement

**Make monthly sections collapsible.**

Suggested behavior:

- Group program content by month.
- Allow each month to expand or collapse independently.
- Show a compact month header when collapsed.
- Expand the current month by default.
- Collapse other months by default.
- Make expanding or collapsing a month a simple one-tap interaction.
- Preserve existing session and program content.
- Provide a clear visual indication of expanded/collapsed state.

If useful, the header may display the month and year, with a small summary of scheduled activities.

### UX principles

- Do not redesign the entire Program page.
- Do not introduce additional navigation screens unnecessarily.
- Do not change program scheduling, completion or progression logic.
- Prefer a lightweight accordion-style interaction.
- Ensure keyboard accessibility and correct expanded/collapsed semantics.

The objective is simple:

**The athlete should be able to find the current month immediately without scrolling through the entire program.**

---

## 4. Requested Team Response

Please separate the work into three tracks:

### Track A — Bug Fix

Investigate and resolve the weight-input maximum restriction.

Report the cause, the affected controls and any carry-forward implications.

### Track B — Coach / Equipment Review

Review today's athlete-initiated Full Body B substitutions and the broader use of the Dip Station.

Return a proposed A/B/C redistribution for Coach approval.

Do not assume that a physically possible improvised barbell setup is safe.

### Track C — UI Improvement

Propose the smallest implementation for collapsible monthly sections on the Program page.

Preserve all existing program data and behavior.

### Scope

This feedback does not authorize a wholesale redesign of Mesocycle 2.

Do not change the current approved program automatically.

Historical workout logs should remain accurate, including today's manual exercise substitutions.

**The objective is to improve Fit223 based on real training experience while keeping the application simple, safe and predictable.**
