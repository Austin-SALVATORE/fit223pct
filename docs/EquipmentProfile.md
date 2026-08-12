# Verified Equipment Profile

**Status: measurement-complete 12 Aug 2026 — a hardware upgrade
superseded the 7 Aug profile (see "Current hardware" below); every
physical fact for the new tier is coach-confirmed across the day's eight
documents (archived
`~/.claude/agent-memory/program-spec-validator/spec-archive/*-2026-08-12.md`).
"Verified" in the app's sense still requires the owner confirming the
profile in the app once the settings flow exists (equipment plan
Phase 3); the progression gate stays closed until then (D5,
`equipment-upgrade-m2-migration.md`).**

This document is the durable home for the athlete's real equipment. It
exists because the inventory below arrived in a coach *message*, appears
in no versioned spec file, and the coach's spec files overwrite
themselves on revision. Facts that live only in messages are the next
thing to vanish.

The authority split, per the coach's 7 Aug amendment:

> **Coach prescribes the training target; the equipment profile defines
> which physical loads actually exist.**

## Current hardware (coach-confirmed, 12 Aug 2026)

Two 2 kg adjustable dumbbell handles sharing **one** plate pool — no
bore separation, unlike the retired 7 Aug tier below — plus a 7.75 kg
barbell drawing the same pool. No rack: floor/bench-start movements
only.

| Component | Value |
|---|---|
| Handle weight (`handleKg`) | 2 kg, each |
| Plate pool | 8 × 1 kg · 4 × 2 kg · 4 × 5 kg (36 kg total) |
| Bar weight (`barKg`) | 7.75 kg |
| Sleeve rating (`maxSideKg`) | Absent — owner-confirmed "no practical limit, everything fits" (12 Aug), so unconstrained is a verified fact, not an assumption |

**Verified achievable loads** (`src/domain/equipment.ts`'s
`NEW_PROFILE`, cross-checked against an independent re-derivation
written without the repo code — Mesocycle-2-Barbell-Calibration-
Follow-up-Rulings' own preamble lists the identical barbell ladder):

| List | Values |
|---|---|
| Bilateral (per dumbbell, matched pair) | 2, 4, 6, 8, 10, 12, 14, 16, 18, 20 kg — 10 rungs, uniform 2 kg step |
| Single-implement (one dumbbell) | 2, 4, …, 38 kg — 19 rungs, uniform 2 kg step |
| Barbell (total load, symmetric) | 7.75, 9.75, …, 43.75 kg — 19 rungs, uniform 2 kg step |

Every value happens to fall on a clean, uniform step — a hardcoded list
would be indistinguishable from a correct enumeration without a
negative control (`equipment.test.ts`'s NEG-A: dropping the 5 kg plates
collapses bilateral to `[2,4,6,8,10]`, confirming the enumerator reads
`plates`, not a constant).

**Barbell weight is total load including the bar, never per side** —
distinct from every dumbbell weight in the program, which stays
per-dumbbell (`.claude/rules/program-content.md`). The buildability
guard (`mesocycle2Build.conformance.test.ts`) pins this structurally by
routing barbell exercise ids to the `barbell` list.

## Retired 12 Aug 2026

Everything below this heading describes the 7 Aug two-bore hardware,
superseded by the upgrade above. Kept, not deleted: it is the
provenance for `equipment.test.ts`'s `RETIRED_PROFILE_2026_08_07`
fixture, which stays in the suite to exercise the enumerator's
cross-set-matching branch (D6, `equipment-upgrade-m2-migration.md`) —
the new hardware is a single bore, so no other fixture reaches that
code path.

## Hardware (coach-confirmed, 7 Aug 2026)

Two traditional **plate-loaded** dumbbell sets. NOT selectorized/dial
dumbbells — there is no fixed weight ladder.

| Set | Plates |
|---|---|
| A | 4 × 1.0 kg · 4 × 1.25 kg · 4 × 2.5 kg |
| B | 8 × 1.0 kg · 4 × 2.0 kg |

## Measured — 7 Aug 2026

| Fact | Value | Source |
|---|---|---|
| Empty handle weight, **collars on** | **1.2 kg** | Owner, kitchen scale, reported in chat 7 Aug 2026 ~16:00 |
| Set A ↔ Set B plate interchangeability | **No — different bore, the sets do not mix** | Owner, physical test, board answer 7 Aug 2026 ~16:35 (confirmed choice) |

**Consequence of the no-mix answer (preliminary, pending Phase 2):** each
handle draws from one set's inventory only. Set A carries 19 kg of
plates total, Set B 16 kg — so a *matching bilateral pair* is capped by
what one set can put on two handles symmetrically, far below the pooled
inventory. The prescribed **12 / 14 / 15 kg bilateral tops are likely
unreachable as matching pairs** — exactly the executability risk this
file flagged when the question was posed. The Phase 2 enumerator
computes the true per-set and cross-set-matched lists; the resulting
ceiling finding goes to the coach for program correction, per ruling ⑤.

**Immediate consequence (preliminary, pending Phase 2's proper
enumeration):** every buildable load is `1.2 + 2 × (side sum)`, and side
sums step in 0.25 kg — so achievable loads all end in **.2 or .7**.
**None of the coach's written targets (5 / 6 / 8 / 10 / 12 / 14 / 15 kg)
is exactly buildable.** Under ruling ③ (round down, globally) every
prescription maps to its nearest lower achievable neighbour (10 → 9.7,
15 → 14.7, …). This is the outcome the 7 Aug amendment's sensitivity
finding predicted for a near-1.25 kg handle, and it makes the Phase 5
revalidation report's expected classification for essentially the whole
program: *intentionally approximate (mapped)* — for the coach to confirm,
never silently rounded by the app.

## Measured — 7 Aug 2026 (continued, board answers ~16:35)

| Fact | Value | Notes |
|---|---|---|
| Handle count | **4** | With non-matching bores this is presumed **2 Set A + 2 Set B** — the one assumption in this file; owner can correct it in one line. |
| Max plates per side | ~~"4 or more"~~ **superseded 7 Aug ~19:00** | Initial coarse answer; enumeration briefly used a conservative 4/side count cap. |
| Sleeve capacity, per side (owner, board answer ~19:00) | **Set A handles: 15 kg/side · Set B handles: 8 kg/side** | The real constraint is *weight*, not plate count. Both ratings sit at or above each set's physical plate supply (A maxes at 9.5 kg/side, B at exactly 8.0), so the sleeve is effectively **non-binding** and the count cap is retired. Consequence: the previously "cap-excluded" loads are real — bilateral ceiling **15.2 kg**, single-implement ceiling **20.2 kg**. The round-down mappings are unchanged (15.2 exceeds every written target, so 14 and 15 still map to 13.2) — but **15.2 becomes directly prescribable**, which is the coach's cheapest path to preserving a top rung. Enumerator amendment (weight-based per-set side cap) queued; recomputed lists re-verify independently before the coach report goes out. |

Nothing physical remains unmeasured. Open items are now *decisions and
computation*: the Phase 2 enumerator (two per-set lists + the
cross-set-matched bilateral list), the Phase 3 in-app confirmation flow,
and the Phase 5 revalidation report that sends the mapped/unreachable
findings to the coach.

## Standing rules (coach, 7 Aug amendment — do not weaken)

- The equipment layer's product is an **ordered list of achievable
  loads per dumbbell**. Never a step size.
- **One available load step = one position forward or backward in that
  list.** Applies uniformly: pyramid progression, Yellow-day reduction,
  multi-miss rebuild, Deload mapping.
- **Never hardcode 2 kg / 2.5 kg / any arithmetic increment.**
- Until the list is verified: prescribed loads stay visible,
  **automatic next/previous-load calculation stays disabled**, missing
  settings are never inferred.
- An unachievable written Deload load maps to the **nearest
  coach-approved lower** achievable load — never silent arithmetic.
  (The general tie-break outside the Deload is an open coach question —
  deliberately not extrapolated.)
- Once verified: one revalidation pass classifies every written load as
  *directly achievable* / *intentionally approximate (mapped)* /
  *invalid (coach corrects)*. **No silent rounding.** The pass produces
  a report for the coach, not automatic corrections.

## Known findings against this inventory (measured, 7 Aug)

- Prototype enumeration (2.0 kg handle placeholder, sets mixable,
  composition-symmetric handles): **28 achievable loads, 2–19.5 kg**,
  largest gap 1.5 kg (between 4.5 and 6).
- **5 kg is unbuildable in every configuration** (needs 1.5 kg/side; no
  subset of {1, 1.25, 2, 2.5} sums to 1.5). It is prescribed today
  (phase-1-home rear-delt fly). With the coach as *invalid — needs
  correction*.
- The engine's committed `DUMBBELL_STEP_KG = 2` / `DUMBBELL_MAX_KG = 15`
  and scalar `weightStepKg` are the arithmetic the rules above forbid —
  knowingly wrong pending the equipment-aware progression design
  (`~/.claude/plans/equipment-aware-progression.md`).

## Coach rulings — 7 Aug 2026 (board answer, all eight questions)

- **① 5 kg rear-delt fly:** map to the nearest achievable **lower** load.
  Isolation work never progresses by exceeding the technical standard to
  hit a number.
- **②/⑦ Bilateral loading:** the two dumbbells **always carry identical
  loads**. Asymmetric loading is never prescribed for bilateral
  movements; if a target cannot be built as a matching pair, use the
  next lower achievable matching pair. Single-dumbbell exercises are
  exempt by nature. *(Residual nuance, not extrapolated: the coach
  ruled on equal **weight**; whether two equal-weight handles may differ
  in plate **composition** — the only way to reach 14 kg — was the
  question's edge and reads as permitted, but is flagged for explicit
  confirmation in the revalidation report.)*
- **③ Global tie-break: always round down.** Long-term progression over
  arbitrary numbers; technique over load. Applies everywhere, not just
  the Deload.
- **④ Load-ceiling variation ladder:** confirmed, and **per-pyramid
  independently** — each exercise progresses against its own ceiling
  without waiting for the session.
- **⑤ Revalidation pass:** confirmed as specified. Three classes, no
  silent rounding.
- **⑥ Single-dumbbell movements may use the single-implement list** —
  any load physically achievable on one handle, unconstrained by what
  can be built as a pair. (The bilateral and single-implement lists are
  officially two lists.)
- **⑧ Max plates per side:** a hardware fact — wait for the athlete's
  measurement, implement no assumption.
- **Spec correction accepted:** the "imports cannot preserve fixed
  weekdays" sentence will be removed (untrue since M8).

**One discrepancy surfaced by ②'s own examples, needs coach
confirmation:** the coach's single-dumbbell list includes **Bulgarian
Split Squat**, but spec v2.16 §4 writes it as *"12 kg in each hand"*
(two dumbbells). One of the two is stale. `implementCount` for that
exercise is blocked on the answer; do not seed it from either source
alone.

> **Resolved 11 Aug 2026 — two dumbbells.** The Build Prescription
> Revision writes B1 as "7.2 kg per dumbbell" using the same bilateral
> phrasing as every matched-pair movement, and carries no "Use one
> dumbbell" instruction (which that spec adds explicitly to every
> single-implement movement). Validator confirmed the reading is
> unambiguous by the document's own convention; the earlier
> single-dumbbell example list is superseded.

## Coach rulings on the verified report — 7 Aug 2026 ~15:55 (board answer, verbatim decisions)

The hardware report was **accepted**, with seven rulings that supersede
the mapping-centric reading of the amendment:

1. **Verified achievable loads become the only valid working loads.**
   Future coach specifications are authored directly in achievable
   loads — no more idealised 5/6/8/10/12/14/15 values, and therefore no
   mapping in future programs.
2. **Duplicate pyramid rungs are unacceptable.** Where two written
   rungs collapse onto one achievable load (14 and 15 → 13.2), the
   pyramid is rewritten, not left duplicated — if 15.2 is safe, 15.2
   becomes the top rung. Progression must stay meaningful.
3. **Current mesocycle: temporary mapping is acceptable.** No seed
   rewrite is required before Monday; the app's written loads stand as
   the coach's authored values for M2, mapped in practice. Future
   mesocycles: direct achievable loads.
4. **Rear delt fly opens at 3.7 kg** (confirmed; isolation quality over
   absolute load). Folded into the next authored spec rather than a
   pre-launch seed edit, per ruling 3.
5. **Single-dumbbell exercises use the single-implement list freely** —
   never limited by the matched-pair table.
6. **Bilateral matching stands** unchanged.
7. The coach revises all future prescriptions from this profile.

**Consequences for tooling:** the spec validator gains two structural
checks for every future spec — every prescribed load must be a member
of the verified achievable list for its exercise's implement count, and
no pyramid may contain duplicate consecutive loads. The Phase 5
"classification report" as originally designed is superseded: there is
nothing left to classify when specs are authored from the lists.

## Change discipline

Update this file when a measurement lands or the coach revises the
inventory — dated, appended, never silently rewritten. The spec
validator archives coach spec revisions at
`~/.claude/agent-memory/program-spec-validator/spec-archive/`.
