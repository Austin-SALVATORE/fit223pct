# Phase 1 — Home v3: transcription notes

**The authoritative content is the coach's specification:
[phase-1-home-v3-coach-spec.md](./phase-1-home-v3-coach-spec.md)
(received and structurally validated 22 Jul — all loads within the
15 kg/hand cap, completion-only progression, no RIR).** This file
holds only the PM-side technical notes for turning it into the import
file. The earlier reviewer-drafted tables that lived here are
superseded by the coach spec and were removed.

## Blockers before transcription

1. **M8 ships** — `setPlan` ladder schema, Markdown ladder syntax,
   RIR removal, seed-clobber guard (docs/PyramidProgression.md).
2. **incline-dumbbell-press promoted** to the Library (prompt
   delivered; art exists).
3. **Weekday-pinned sessions decision** — the coach spec retires A/B
   rotation for fixed day identities (Mon Chest & Back, Wed Legs &
   Core, Fri Shoulders & Arms). The current engine rotates by
   completed count; pinning sessions to weekdays is a scheduling
   semantics change that must be designed in the M8 plan (affects
   Plan-page projections and early-start behavior).

## Technical mapping notes

- **Identity:** `id: phase-1-home`, `startDate: 2026-07-20`
  (owner-ruled final; replaces the live 07-21), `endDate: 2026-08-09`,
  Mon/Wed/Fri.
- **Ladder-at-cap semantics:** every compound ladder tops at the
  15 kg equipment max on day one. The M8 plan must define engine
  behavior when a rung cannot rise (clamp-and-raise-lower-rungs vs
  hold-and-surface "at equipment max"). `maxWeightKg: 15` is the cap
  carrier.
- **Isolation start weights (coach-ruled 23 Jul, resolves the open
  question):** rear-delt-fly **5 kg**, dumbbell-lateral-raise
  **5 kg**, dumbbell-curl **8 kg** — per hand, as `startWeightKg`;
  progression per the coach spec's straight-set rule (step up only
  after both sets consistently reach the top of the range).
- **Tempo:** carried in `note` per exercise ("3-1-1" etc.), same
  mechanism as the existing tempo cues. No schema field in v1.
- **Weekday activities:** Tue recovery (steps/stretch/hydration/
  protein/sleep as checklist text), Thu optional recovery, Sat
  optional activity, Sun checkpoint — all fit the M6
  `weekdayActivities` model as authored text. The Sunday "coach
  summary" items are human-side per the owner; the app's weekly
  review remains the in-app reference.
- **"Training focus" lists** per session are declared intent — the
  future muscle-regions feature validates them against derived
  coverage (early fixture, no action in this milestone).
- **Exercise ids:** all resolve to Library entries once
  incline-dumbbell-press lands. overhead-triceps-extension is a
  future promotion (coach-flagged), not in this program.
