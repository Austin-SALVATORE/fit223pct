# Milestone 10 — user profile & energy baseline

**Status: in implementation.** This is the review contract: what must
be true of the result. The *how* lives in the implementation plan; this
document outlives it. Owner-requested 29 Jul, sequenced ahead of
nutrition (M11) because M11's evaluation needs something citable to
measure "too much" against.

## Why it exists

Nutrition evaluation is meaningless without a reference. Saying protein
is low requires a target, and a target requires knowing the person —
weight, height, age, sex, body composition. None of that was stored.

It also earns its place alone: a baseline is useful to training targets
and progress independently of nutrition, and it needs no backend, so it
ships while M11's hosting question is still open.

## Where each fact lives — reconciled, never duplicated

| fact | home | kind |
|---|---|---|
| height | `UserSettings.heightCm` — existing field, first UI ever | stable |
| date of birth | `UserSettings.birthDate` | stable; age derived |
| sex | `UserSettings.sex` — **required** | stable |
| current weight | `CheckIn.weightKg` — existing series, unchanged | series |
| body fat % | `CheckIn.bodyFatPercent` | series |
| target weight / body fat % | `UserSettings.target*` | intention |

**Current weight is never copied into settings.** It resolves as the
most recent check-in carrying a non-null weight. A second copy would
drift the first time a check-in is logged without opening the profile,
and nothing would report the disagreement.

**Birth date, not age.** A stored age is wrong within a year, silently,
with nothing to detect the staleness.

**Targets are settings, not dated records.** Putting a goal on a
check-in would imply a per-day goal and invite the "were you on track
that day" scoring M11 has already ruled out.

## Invariants

- **A never-confirmed value is missing, not data.** The seed has
  carried `heightCm: 180` — an invented number for the owner — since
  the beginning, read by nothing. The moment a baseline reads it, a
  guess becomes load-bearing and shifts every downstream calorie
  figure. No migration writes a default for any profile field.

  **The mechanism is `UserSettings.profileConfirmedAt`** — an optional,
  **non-indexed** ISO date set when the user first saves the profile
  form. Absent means never asked, whatever values happen to sit in the
  record. Being non-indexed is why it needed no Dexie version: the
  version schema declares indexes, not fields.

  This exists because the invariant above was, for one release,
  unrepresentable. `heightCm` was a required `number` seeded to 180, so
  "never asked" could not be expressed, and the contract forbidding a
  guess from becoming load-bearing was violated *inside* the milestone
  written to prevent it. Found by the dev during implementation, not by
  review.

  Two consequences worth keeping:

  - **The seeded 180 is not deleted.** Removing a value the owner may
    since have verified is its own invention. It is offered back as a
    prefilled control to accept or correct — which is different from
    presenting it as fact.
  - **The gate lives in `resolveProfile`, not in the calculation.** The
    existing null-on-missing rule then refuses to compute from a null
    height or sex, so the baseline falls away with no separate
    "is it confirmed" branch anywhere downstream, and none to forget.
    Measurements are deliberately exempt: weight and body fat come from
    check-ins the user entered themselves, which is its own
    confirmation.

- **Confirmation is an act, not a side effect.** The profile is the only
  card in the app with an explicit Save rather than per-field
  auto-save. A marker that can be set by brushing a stepper is not a
  confirmation, so the inconsistency with the check-in cards is
  deliberate — do not "fix" it.
- **Sex is required, and the reason lives at the declaration.**
  Mifflin–St Jeor differs by sex; without it there is no citable
  baseline at all. The copy says what the field is for — a required
  field with no stated purpose reads as data collection, while one that
  explains itself reads as a tool. Purpose written beside the field is
  also what makes it hard to relax to optional later.
- **Predict nothing.** Goal progress returns a **distance, never a
  duration**. `CLAUDE.md` forbids promising body-transformation
  outcomes, and a target weight beside a trend line is precisely the
  shape that invites a projection. Enforced structurally: the existing
  `TrendResult` has nowhere to put a forecast (its evidence points are
  dated *observations*), the new weight and body-fat trends clone the
  waist trend and inherit that, and a guard test asserts no exported
  symbol matches `/eta|forecast|project|predict|willReach|timeTo|byDate/i`.
- **Every constant carries its citation, its units, its population and
  its provenance strength** — in one module. These numbers are not
  equally solid and the code must not imply they are.

## The energy baseline — verified 29 Jul

Three corrections came out of verification, all now load-bearing:

- **It is resting energy expenditure, not BMR.** Mifflin–St Jeor
  measured REE by indirect calorimetry. "BMR" is the standard consumer
  imprecision; the code uses the accurate term.
- **The lean-mass equation is Cunningham 1991**
  (*Am J Clin Nutr* 54(6):963–969), not Katch–McArdle. That name comes
  from a textbook restatement, not a derivation by those authors. Cite
  Cunningham; treat the familiar name as an alias.
- **The activity multiplier everyone uses has no traceable source.**
  The ubiquitous 1.2 / 1.375 / 1.55 / 1.725 / 1.9 scale appears in no
  paper, textbook table or guideline — only in calculators repeating it
  uncited. Replaced by **FAO/WHO/UNU (2001) PAL bands**, which come
  from doubly-labelled-water studies: sedentary 1.40–1.69, moderately
  active 1.70–1.99, vigorous 2.00–2.40.

  **This is the largest uncertainty in the chain** — at a ~1,650 kcal
  REE, the gap between 1.2 and FAO's 1.40 floor is ~660 kcal/day,
  bigger than the disagreement between the two equations. Consequence:
  our maintenance figure reads materially higher than other apps' for
  the same person. Owner-accepted knowingly: ours has a source.

  A test asserts `sedentary.min > 1.2`, so restoring the familiar scale
  fails loudly rather than silently moving every figure.

**Because the bands are ranges, maintenance returns a range.**
Collapsing 1.40–1.69 into one number would manufacture precision the
source does not have — the same error as a false threshold, in a
different place.

**Measurement is the destination; the formula is a bootstrap.** Intake
observed against the weight trend *measures* maintenance for this
person, where a formula estimates it from demographics and a band
nobody can source. It needs intake history M11 produces, so it is not
first — but maintenance resolves through one function with stated
provenance so an empirical source later replaces the formula behind it
rather than rippling outward.

## Acceptance

Sourced constants in one module with the seven golden cases as an
executable test, asserted **unrounded** — a rounded expectation that
sits on `toBeCloseTo`'s boundary is both weaker and flakier than the
real number. **Never validated against third-party calculators**: one
widely used one silently inserts a nonstandard activity tier while its
own prose claims the standard scale.

Phases ship in order — domain, storage, the profile surface, then the
baseline and goal display. **The surface must precede the display**, or
a baseline computed from data the user was never given a chance to
enter shows the seeded 180 cm as though it were theirs.

## Provenance, at its real strength

Not flattened, because the gate is about whether anyone opened the
source:

| source | strength |
|---|---|
| ISSN protein position stand (Jäger 2017) | **primary full text**, open access |
| Mifflin–St Jeor 1990, Cunningham 1991 | abstracts + two independent implementations; **full texts paywalled**, DOIs resolve |
| FAO/WHO/UNU PAL bands | report text |
| IOM fat AMDR | **triangulated, table never opened** |

A misremembered figure is worse than an invented one, because it
arrives wearing a source. During this milestone's verification an AI
tool produced a **fabricated verbatim "ISSN position statement"** of a
figure that belongs to a different paper, in different units, in a
different journal — caught only by opening the PDF. Which is why "open
the source" cannot be softened to "check the source looks right."
