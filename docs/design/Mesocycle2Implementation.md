# Mesocycle 2 — implementation plan

> **Authority moved seven times while this plan was being executed.**
> The line below cites **v2.5**; the current spec is **v2.15**. Resolve
> every §-reference in this document **by content, not by number** —
> find the rule it names in v2.15 and treat the section number as a
> hint. No prescription number moved across v2.7 → v2.10 → v2.11
> (byte-identical, negative-controlled), so the *training* content this
> plan transcribes is unchanged; what moved was surrounding policy.
>
> Corrections already applied inline, dated, where they were found:
> the stored variation vocabulary is **eight** tokens, not nine (§6.1)
> — a correction sent only as a message while this document still said
> nine, which shipped as nine before it was caught.
>
> **Still stale below and not worth rewriting**, since it is a record
> of a plan rather than current truth: §12's ride prescription reads
> "30/35/45 min" (training-day rides are 20 min since v2.11), and the
> deload is dated 14–20 Sep, which the owner has since superseded — the
> block must now end **6 September** because they fly on the 7th, and
> how the two removed weeks are absorbed is an open coach question.

**Authority:** `Mesocycle-2-Home-Progressive-Coach-Spec-v2.5.md` (624 lines,
md5 `dc452ff3666422726a33a7e277855a3f`), read in full. Where this plan and
the spec disagree, the spec wins on training content; this plan rules only
on how the app holds it.

**Go-live: Monday 10 August 2026.** Today is Thursday 6 August. Phase 1
ends Sunday 9 August.

**Verdict up front: Monday holds for the strength core, but only with four
named deferrals, and the binding constraint is French/Chinese translation,
not code.** §11 gives the hard numbers.

---

## 1. Baseline and method

- **HEAD `a66ea5d`**, working tree clean apart from untracked design docs.
  `npm test` → **80 files, 972 tests, 0 failures.**
- Every measurement below was produced by running code in an isolated
  `rsync` copy of the tree under the scratchpad, which reproduces the
  baseline exactly before and after each patch. **Nothing was written to
  `src/**`.**
- Citations resolved by content. Where a number in the brief proved to be
  a different line, the content is named so it cannot go stale again.

---

## 2. Corrections to the brief — read these first

Three of the eight findings were materially different from their
description. Each changes the work.

### 2.1 The Yellow-day defect is worse and narrower than reported

Reported as: *"the app displays the remaining rungs 2 kg heavier than
authored."* True, but **the cause is not a missing parameter alone**, and
the blast radius is data-dependent in a way that matters.

**Mechanism, measured.** `applyReadiness` (`adjustments.ts:41-51`)
truncates `setPlan` *before* the truncated ladder ever reaches
`suggestLadderProgression`. That engine's completion gate
(`progression.ts:121-124`) then checks only the rungs that survive —
**so truncation removes the very rung whose failure would have forced a
`repeat`.** The athlete who missed the top rung last week (the single most
likely reason to be Yellow this week) is handed an *advance* on their
worst day.

Measured against every weighted pyramid in spec §6-§8, with last week's
top rung missed and all lower rungs completed:

```
   ok     A1 Incline DB Bench Press   authored [10,12,14,15] -> eased [10,12,14] -> OFFERED [10,12,14]
   ok     A2 Single-arm DB Row        authored [10,12,14,15] -> eased [10,12,14] -> OFFERED [10,12,14]
   ok     A3 Dumbbell Fly             authored [4,6]         -> eased [4,6]      -> OFFERED [4,6]
   ok     A4 Chest-supported Row      authored [10,12]       -> eased [10,12]    -> OFFERED [10,12]
   ok     A6 DB Lateral Raise (Mon)   authored [6,8]         -> eased [6,8]      -> OFFERED [6,8]
INFLATED  B1 Bulgarian Split Squat    authored [8,10,12]     -> eased [8,10]     -> OFFERED [10,12]
   ok     B2 DB Romanian Deadlift     authored [10,12,14,15] -> eased [10,12,14] -> OFFERED [10,12,14]
INFLATED  B4 Standing Calf Raise      authored [8,10,12]     -> eased [8,10]     -> OFFERED [10,12]
   ok     B6 Dumbbell Pullover        authored [8,10]        -> eased [8,10]     -> OFFERED [8,10]
INFLATED  C1 DB Shoulder Press        authored [6,8,10]      -> eased [6,8]      -> OFFERED [8,10]
INFLATED  C2 DB Lateral Raise (Fri)   authored [4,6,8]       -> eased [4,6]      -> OFFERED [6,8]
INFLATED  C3 Rear Delt Fly            authored [4,6,8]       -> eased [4,6]      -> OFFERED [6,8]
INFLATED  C4 Dumbbell Curl            authored [8,10,12]     -> eased [8,10]     -> OFFERED [10,12]
INFLATED  C5 OH Triceps Extension     authored [10,12,14]    -> eased [10,12]    -> OFFERED [12,14]

INFLATED 7 of 14 weighted pyramids on a Yellow day
```

**Session C is affected in all five of its weighted pyramids. Session A in
none.** The four-level pyramids are spared *only because the 15 kg ceiling
happens to block the step* — `14 + 2 > 15` (`progression.ts:130-138`), not
because the logic is right. **The ceiling is masking the defect, so raising
the dumbbell tier later would silently expose all fourteen.** My first
probe used incline press, predicted inflation, and the probe refuted me —
which is exactly why the sweep exists.

### 2.2 The 31 Jul ruling is *fulfilled*, not reversed

The brief says `docs/Training.md` records a ruling that the new one
reverses. It does not. `Training.md:56-68` has two parts, and only the
first is a prohibition:

> *"The two-rung ladders stay as written. A third rung must **not** be
> added to restore easy-day trimming… If low-readiness sessions prove too
> demanding, **the readiness model is what changes** — easing a two-rung
> ladder by load or by reps rather than by removing a rung. That work is
> open and unowned; until it exists, the reduced easing is accepted
> behaviour."*

Spec §15 is that work arriving: *"a two-level Pyramid becomes one. Reduce
the remaining prescribed weights by one available step."* **The prohibition
(do not author around the engine) still holds; the promised follow-up is
now owned.** So `Training.md:49-68` needs a *rewrite recording the
fulfilment*, not a contradiction notice — a materially different edit, and
one that preserves the standing boundary in its last line: *"program
content answers to the coach, and the engine adapts to it — never the
reverse."*

### 2.3 §15's weight step-down is a **control**, not an automatic rule

§15: *"Reduce the remaining prescribed weights by one available step
**when warm-up technique is below normal**."* And §15's priority list:
*"Build the Yellow-session **control** that removes the heaviest level and
can step every remaining weight down."*

**Warm-up technique is not observable by the app.** So this cannot be
automatic without inventing a judgement — the failure class this repo has
paid for repeatedly. It is a user-invoked affordance on the Yellow session,
which is both smaller than an engine change and consistent with
`adjustments.ts:29` (*"The user can always override in the moment"*).

That reclassification is what lets §15's fallback carry Monday (§11.3).

---

## 3. Findings 4-8, verified

| # | Claim | Verdict |
|---|---|---|
| 4 | Bodyweight pyramids freeze at `at-equipment-max` | **Confirmed** — measured `type = at-equipment-max`, `progressionType = at-equipment-max`, even when fully completed. But see §6: this is *correct behaviour* wearing wrong copy |
| 5 | Side plank cannot be a reps pyramid | **Partly wrong — a seconds-mode ladder already works.** See §7 |
| 6 | Multi-miss rebuild has no regression path | **Confirmed** — `suggestLadderProgression` returns only `advance`/`repeat`/`at-equipment-max` (`progression.ts:94-97`) |
| 7 | Six exercises absent; art for four; `KNOWN_MISSING` empty | **Confirmed, with a naming trap.** See §8 |
| 8 | Gym file and its test pin 10 Aug | **Confirmed, and there is a second consumer the brief missed.** See §9 |

---

## 4. Priority 1 — the Yellow-day fix. **7 lines, 0 regressions.**

`readinessTier` is **already threaded end to end** and simply not
forwarded to the ladder branch:

```
WorkoutPage.tsx:262,272  →  SetScreen.tsx:69 / RestScreen.tsx:78
                         →  nextSetTarget(…, readinessTier)   [nextSetTarget.ts:106]
                         →  suggestProgression(…, readinessTier)  [:117]   ✓ forwarded
                         →  suggestLadderProgression(prescription, previousSets)  [:112]  ✗ NOT forwarded
```

**Decision: forward it, and defer the increase — symmetric with the
rep-range engine's shipped `consolidate` branch (`progression.ts:62-69`).**

Prototyped and measured:

- `progression.ts` — add optional `readinessTier` param; return
  `{ type: 'repeat', setPlan }` before the advance branch. **+6 lines.**
- `nextSetTarget.ts:112` — pass it. **1 line.**
- **Result: 7 of 14 inflated → 0 of 14.**
- **Full suite against the patched tree: 80 files, 972 tests, 0 failures.**

**That zero is itself the finding.** A change that alters real behaviour on
half the program's pyramids breaks nothing, which proves the brief's claim
that *no test pins this in either direction*. §12 names the guard.

### 4.1 The earned increase is deferred, not lost — verified by composition

After a Yellow week the athlete logs only the truncated ladder, so the
next week's completion gate finds no logged set at the top rung index and
returns `repeat` again. The increase resumes when a **complete** ladder is
logged. That is exactly §10's model (*"If one level misses its target,
repeat the same Pyramid"*), so ladder and rep-range differ here on purpose:
rep-range re-offers the increase next session, a ladder waits for a
complete pyramid.

### 4.2 Alternatives rejected

- **Rejected — reorder the pipeline so progression runs on the authored
  ladder and easing is applied after.** Architecturally cleaner, but
  `applyReadiness` runs at session start (`TodayPage.tsx:303,378`) and the
  eased prescription is **snapshotted into `Workout.exercises[].prescription`**
  (`types.ts:181`), so the authored ladder is genuinely gone by set time.
  Recovering it means changing the snapshot contract — a migration and a
  history-semantics change, for a defect fixable in 7 lines.
- **Rejected — make `applyReadiness` mark the item "do not advance".** A new
  field on the prescription that exists only to carry a UI state into an
  engine; it would persist into every workout snapshot forever.
- **Rejected — leave it and rely on the ceiling.** The ceiling only masks
  it for 4-level pyramids and would stop masking it if the tier changed.

---

## 5. Priority 1 — the rung floor. **3 tests, 2 files, measured.**

`MIN_LADDER_RUNGS = 2` (`adjustments.ts:15`) blocks §15's *"a two-level
Pyramid becomes one."* The owner has ruled the floor gives way.

Patched `2 → 1` in the probe tree and ran the full suite. **Exactly 3
tests fail, in 2 files:**

```
src/domain/adjustments.test.ts        never drops a ladder below two rungs                    (:106)
src/domain/adjustments.test.ts        reports zero adjustments — honestly — when nothing …    (:122)
src/features/today/TodayPage.earlyStart.test.tsx
                                      applies readiness to an early start exactly as a
                                      training day would                                      (~:124)

Test Files  2 failed | 78 passed (80)      Tests  3 failed | 969 passed (972)
```

**All three are rewritten, never deleted** — each still encodes something
true:

- `:106` becomes *"never drops a ladder below **one** rung"* — the floor
  moved, it did not disappear. A one-rung ladder must still be one rung.
- `:122`'s premise dies: a two-rung ladder is no longer at the floor, so it
  now *does* produce an adjustment. Rewrite with a **one-rung** ladder,
  preserving the honest-empty-list property it exists for.
- `TodayPage.earlyStart` asserts early-start easing matches a training day;
  update the expected rung count, keeping the equality it actually guards.

**Also update, in the same change:** `seed/program.ts:205-212`, whose
comment states *"a two-rung ladder is already at `MIN_LADDER_RUNGS` and
cannot be eased further"* — false the moment the floor moves, and it is the
kind of stale comment `.claude/rules/verification.md` calls *"a guard
against being checked."* Plus `Training.md:49-68` per §2.2.

---

## 6. Bodyweight pyramids — the behaviour is right, the copy is wrong

Measured: a ladder whose top rung has `weightKg: null` returns
`at-equipment-max` permanently (`progression.ts:130-137`), which
`nextSetTarget.ts:181-183` surfaces as `progressionType:
'at-equipment-max'`, which renders **`MAX`** (`workout.json:71`,
`SetScreen.tsx:379`, `RestScreen.tsx:321`) with the line *"Every rung is
maxed for this setup — hold the ladder and own the reps."*
(`domain.json:27`).

**Not advancing is correct.** §10's bodyweight progression is manual —
range, then tempo, then pause, then leverage, then load — and §10 forbids
the app inventing a load progression. **The defect is that the copy asserts
an equipment ceiling that does not exist**: push-ups are not "maxed for
this setup."

The two cases are cleanly distinguishable and already are, in the same
condition: a genuine ceiling has `weightStepKg`, `maxWeightKg` and
`topRung.weightKg` all non-null and fails only the arithmetic; bodyweight
has all three **null**. Split the result type:

```ts
export type LadderProgressionResult =
  | { type: 'advance'; setPlan: SetTarget[] }
  | { type: 'repeat'; setPlan: SetTarget[] }
  | { type: 'at-equipment-max'; setPlan: SetTarget[] }
  | { type: 'load-not-the-lever'; setPlan: SetTarget[] }   // NEW
```

with its own caption. Two new keys × 3 locales.

### 6.1 Where the variation label lives — `SetTarget.variantKey`

§6-§8 prescribe levels that differ by *variation*, not load: *"Bodyweight
x 12 / bodyweight slow x 10"*, *"longer reach x 8 / reach plus pause x 6"*,
*"8 x 20 normal / 10 x 15 slow / 12 x 12 slow plus pause"*. Measured:
`SetTarget` keys are exactly `["reps","weightKg"]` — there is nowhere to
put it.

Note the goblet squat case: it varies **weight and variation together**, so
this is not a bodyweight-only field.

```ts
export interface SetTarget {
  weightKg: number | null
  reps: number
  /** Closed vocabulary key, never prose — storage stays locale-free. */
  variantKey?: SetVariant
}

export type SetVariant =
  | 'normal' | 'slow' | 'slow-pause' | 'with-pause'
  | 'longer-reach' | 'reach-pause' | 'harder-leverage'
  | 'hands-elevated'
```

**CORRECTED 6 Aug, by the lead, against coach spec v2.7 §4 ("Stored
variation vocabulary").** This section originally specified nine tokens
including `harder-leverage-or-pause`. v2.7 deletes it: the Week 1 push-up's
second level is `with pause`, and `harder leverage` is a separate later
progression, never an alternative label for the same level. v2.7 §4 also
rules that a prescription "must not store an either/or choice". The
vocabulary is a **spec contract**, not a design choice — cite the spec
section, not this plan.

Eight tokens cover every variation in §6-§8 and §11. Rendered from
`common:setVariant.<token>` — **24 strings, translated once, reused across
every exercise.**

- **Chosen — a closed enum of keys.** Honours the architecture invariant
  *"Storage is locale-free. No translated string is ever persisted."*
  Follows the shipped `RoutineStep.id` precedent (`routine.ts:21`: *"Stable
  id — serves as both the locale key and the art id"*). It also survives the
  workout snapshot: a stored `SetTarget` stays analysable after wording
  changes, the same reason `Workout.readiness.drivers` stores signal keys
  (`types.ts:208-216`).
- **Rejected — `SetTarget.note?: string` free prose.** Persists a translated
  string into every workout snapshot, violating the invariant outright, and
  needs a locale key *per level per exercise per program* instead of 9
  shared tokens.
- **Rejected — reuse `ExercisePrescription.note`** (`types.ts:63`). It is
  per-exercise, so it cannot say "level 1 normal, level 2 slow" — which is
  the whole requirement.
- **Rejected — encode the variation in the exercise id** (`push-up-slow`).
  Multiplies the Library, breaks the art-coverage contract, and makes
  history incomparable across variations.

**What is lost:** the coach's exact phrasing collapses into nine buckets.
*"harder leverage or pause"* becomes one token rather than an either/or the
athlete chooses between. If the coach needs the full phrase preserved
verbatim, that is a per-level prose field and the invariant discussion
above reopens — **flagged, not decided** (§14).

---

## 7. Timed holds — a seconds-mode ladder already works. **Correction.**

The brief says a reps pyramid *"is silently accepted and then rendered as
repetitions."* True if `mode: 'reps'`. But **a ladder with `mode:
'seconds'` already renders per-level seconds correctly** — measured:

```
PLANK level0 = {"reps":null,"seconds":40}
PLANK level1 = {"reps":null,"seconds":30}
```

because `nextSetTarget.ts:167-169` routes `prescribedEffort` into `seconds`
when the mode is seconds. So §8's *"40 sec / 30 sec"* and §10's *"store two
timed sets under one exercise, preserve seconds"* are **satisfiable today
with no new type**.

One real gap, measured: the completion gate reads `logged.reps`
(`progression.ts:123`), which is `null` for a timed set, so a seconds
ladder returns `repeat` **even when both holds are met**:

```
PLANK engine with both holds MET = repeat   (reads logged.reps, which is null)
```

For side plank specifically that is the **behaviour the coach wants** —
§8: *"Progress leverage only after the first hold is stable"*, manual. So
this can ship as-is on Monday and be corrected later by having the gate
read the mode-appropriate field, mirroring `effortOf`
(`progression.ts:149-152`), which already does exactly that and is right
there in the same file.

- **Chosen — `mode: 'seconds'` ladder, two levels, `variantKey: 'normal'`
  and `'harder-leverage'`.** Zero schema change. Preserves seconds. Never
  converts to reps.
- **Rejected — rep-range with a seconds band.** Measured: it carries one
  `{min,max}` for *all* sets and structurally cannot express 40 then 30.
- **Rejected — writing 40/30 as reps in a reps-mode ladder.** Renders as
  repetitions; §8 forbids the conversion explicitly.

---

## 8. Library additions — six exercises, and a naming trap

Verified: the Library holds **33** exercises (`seed/exercises.ts`). Absent:
**dumbbell fly, chest-supported row, hamstring walkout, standing dumbbell
calf raise, dumbbell pullover, push-up.**

**The art directory name is the id contract.** `exerciseAsset` resolves by
id against the generated manifest, and the manifest already contains:

```
dumbbell-fly ✓   chest-supported-row ✓   push-up ✓   standing-calf-raise ✓
hamstring-walkout ✗              dumbbell-pullover ✗
```

So the ids **must** be `dumbbell-fly`, `chest-supported-row`, `push-up`,
`standing-calf-raise` — note the last is *not* `standing-dumbbell-calf-raise`,
which is what §18's prose would suggest and would silently fail to resolve.

`KNOWN_MISSING` is `new Set<string>()` at
`src/lib/exerciseAsset.coverage.test.ts:22`, and the guard asserts every
Library id resolves **or** is listed (`:25-35`). **So `hamstring-walkout`
and `dumbbell-pullover` must enter `KNOWN_MISSING` in the same commit that
adds them, or the suite goes red on that commit.** The guard also rejects
stale entries (`:38-44`), so they must be removed when art lands.

§18 supplies English cues and teaching ideas for all six, so Library
promotion is unblocked — **in English**. Each exercise needs ~6 strings
(name, ~3 cues, teaching title, teaching body): **~36 strings × 3 locales
≈ 108**, of which 72 are fr/zh and are not supplied. §11 treats that as the
critical path.

---

## 9. Retiring the gym program — **two consumers, not one**

The brief names `phase2Program.test.ts`. There is a second:

- `src/domain/phase2Program.test.ts:10` — `PHASE_2_PATH = docs/programs/phase-2-gym.md`
- **`src/features/plan/PlanPage.phase2Transition.test.tsx:18`** — same file,
  and `:73` asserts `active?.id === 'phase-2-gym'`

Both must go with the file. Both assert gym-specific facts that are
backwards for a Home phase (`phase2Program.test.ts:76-88` asserts main
lifts have `maxWeightKg === null`, i.e. *no* ceiling — the opposite of a
15 kg home tier).

**Decision, per the lead: retire rather than retarget.** But the *coverage*
those tests provided must not be lost — a hand-authored program failing the
build instead of a training session on the owner's phone is the property
worth keeping. It is re-established in §12 as a **spec-conformance test over
the seeded programs**, which is strictly stronger: the seed is what actually
ships, whereas the Markdown file never was.

Stale prose to correct in the same change (all now false):
`docs/Training.md:88-93`, `docs/Vision.md:35`, `docs/Roadmap.md:48`,
`docs/DataPortability.md:69`, and `src/data/seed/exercises.ts:194`
(*"Phase 2 (Fitness Park) additions"*).

Unaffected, checked: `repositories.test.ts:59,73-83` and
`programImport*.test.ts` use `phase-2*` only as synthetic fixture ids with
no dependency on the file.

---

## 10. Seeding two programs — keep the singular export

**Measured: 26 files import the singular `seedProgram` const** (25 tests +
`seed/index.ts:3`). Changing its shape touches all 26.

**Decision: keep `seedProgram` exactly as it is; add new exports beside it.**

```ts
export const seedProgram: Program = { … }        // phase-1-home, untouched
export const mesocycle2Build: Program = { … }    // 10 Aug – 13 Sep
export const mesocycle2Deload: Program = { … }   // 14 – 20 Sep
export const seedPrograms: readonly Program[] = [seedProgram, mesocycle2Build, mesocycle2Deload]
```

`seed/index.ts:21-24` loops `seedPrograms`, applying the clobber guard
**per id**. **26 test files untouched.**

### 10.1 The seed-clobber guard, since the lead asked specifically

`seedDatabase` currently skips the upsert when a stored program shares the
seed's id and has `origin: 'imported'` (`seed/index.ts:20-24`). Per the
lead's ruling the new programs get **ids distinct from `phase-1-home`**,
so:

- The guard's blast radius is **zero** — a distinct id cannot collide with
  the owner's install, whatever it holds.
- The guard must be applied **per program inside the loop**, not once
  before it. Applying it once would let one imported program suppress
  seeding of the other two. This is the single easiest thing to get wrong
  here, and it fails silently.
- `phase-1-home` **stays in the array**. Removing it changes nothing for
  the owner (the row already exists) but would leave a fresh install with
  no Phase 1 in the Plan page's phase history.

Distinct session ids likewise mean `Workout.sessionTemplateId` cannot
collide across the boundary, so `PlanDayPage`'s lookup
(`schedule.ts:141`) stays unambiguous.

### 10.2 Scheduling

§3 pins sessions to Monday/Wednesday/Friday. That is
`trainingWeekdays: [1,3,5]` with `schedulingMode: 'weekday-pinned'` and
`weekdaySessions`.

> **CONFLICT — LEAD MUST SEQUENCE.** `docs/design/MissedDayDeferral.md`
> rulings 4 and 7 **retire weekday pinning** and make rotation canonical,
> and its Phase 5 deletes both fields. Spec §3 requires *"fixed weekday
> assignments"* and cites our own finding that the import format cannot
> preserve them. **These two are in direct opposition and the dev cannot
> resolve it mid-edit.**
>
> **Recommendation: Mesocycle 2 seeds `weekday-pinned`, and
> MissedDayDeferral Phase 5 (field removal) is put on hold.** Rationale:
> the coach has ruled on the calendar, §3 is dated after the deferral
> ruling, and deleting a field the live program depends on would break
> Monday. The deferral doc's *within-phase* work is unaffected.
>
> This needs the lead's explicit call before the dev seeds anything.

### 10.3 Migration cost

**Zero.** Programs are data in an existing table. `SetTarget.variantKey?`
is additive, optional and non-indexed; `db.ts:76-77,96-97` state the rule —
*"the version schema declares indexes, not fields."* Precedent (v4, v5)
bumps anyway to record the generation; if the dev bumps, it **reads
`db.ts` and takes the next free version** — `db.ts:99` reserves **v6 for
M11**, so this would be **v7**. `docs/Roadmap.md:319-320` is stale on this
and should be corrected. **No destructive migration anywhere in this plan.**

---

## 11. Phasing, and the honest verdict on Monday

### 11.1 Monday-critical path

| # | Work | Size | Blocks Monday? |
|---|---|---|---|
| 1 | Yellow-day fix (§4) | **7 lines, 0 regressions** | **Yes** — live defect, entirely-pyramid program |
| 2 | Rung floor 2→1 + 3 test rewrites + comment/doc fixes (§5) | Small | **Yes** — §15 depends on it |
| 3 | `SetTarget.variantKey` + 8-token vocabulary + 24 strings (§6.1) | Small–medium | **Yes** — §6-§8 cannot be seeded without it |
| 4 | `load-not-the-lever` result + caption, 2 keys × 3 (§6) | Small | **Yes** — otherwise 4 bodyweight lifts show a false `MAX` from day one |
| 5 | Six Library exercises, structural (§8) | Small | **Yes** |
| 6 | Six exercises, **en/fr/zh content ≈108 strings** (§8) | **Large** | **Yes — the long pole** |
| 7 | `KNOWN_MISSING` += 2, same commit (§8) | Trivial | **Yes** |
| 8 | Build program seed: 3 sessions, ~20 prescriptions, exact §6-§8 weights | **Large** | **Yes** |
| 9 | Build program locale keys (sessions, focus) × 3 | Medium | **Yes** |
| 10 | Retire gym file + 2 test files + 5 stale doc sites (§9) | Small | **Yes** — `startDate` 10 Aug fails otherwise |
| 11 | Cardio + Morning Activation, **display only** | Medium | **Yes**, minimally |

### 11.2 Deferred, with the reason each is safe to defer

- **Deload program (§11 of the spec).** Not needed until **14 September** —
  five weeks of slack. Its three session tables are explicit and will not
  drift. **Defer.** This is the single largest saving.
- **Ride record (§12).** The *prescription* ships Monday (30/35/45 min
  Zone 2 per day). The two-field record is adherence measurement the coach
  evaluates at week's end; week 1 adherence can be reconstructed from the
  Apple Watch. Needs a table, a repo, backup-envelope wiring and a Dexie
  version (`docs/design/ActivityPrescription.md` §7). **Defer to week 1.**
- **Morning Activation completion record (§13).** Same shape: display the
  six-item sequence Monday, add the yes/no flag in week 1.
- **§15 weight step-down control (§2.3).** See below.
- **§10 multi-miss rebuild.** The coach supplies the interim explicitly:
  *"repeat the current Pyramid and flag it for a Coach adjustment; it must
  not invent a different load progression."* Repeat-on-miss is **already
  the shipped behaviour** (`progression.ts:125-126`), so the interim costs
  a flag, not an engine. **Defer the flag to week 1.**

### 11.3 The one deferral that needs saying out loud

§15 calls the step-down **priority 1**. Deferring it is only acceptable
because **§15 itself supplies the fallback**:

> *"If the current app cannot step the remaining weights down and warm-up
> technique is still below normal after removing the heaviest level, do not
> force the listed weights. End the strength portion and treat the day as
> Red."*

That fallback is **copy, not code** — one sentence on the eased-session
surface, 3 locales. It ships Monday; the control follows in week 1.

**But it only works if item 1 ships.** Today an eased day *raises* the
weights on 7 of 14 pyramids, so the coach's fallback ("do not force the
listed weights") is being violated in the opposite direction from the one
he anticipated. Item 1 is what makes the deferral honest.

### 11.4 Verdict

**Monday holds — for the strength core, with §11.2's deferrals — and the
binding constraint is translation, not engineering.**

Items 1, 2, 4, 5, 7, 10 are hours of work in total; item 1 is seven lines
and I have run the suite against it. Item 8 is a day of careful
transcription whose risk is arithmetic, mitigated by §12's conformance
test. **Items 6 and 9 are the risk**: roughly 108 + ~20 strings, of which
about two thirds are French and Chinese coaching cues that are not supplied
by the spec and cannot be rushed without shipping bad coaching language in
two languages.

**And they cannot be skipped.** `localeParity.test.ts:55-57` asserts every
locale declares the same key families as English, so missing fr/zh keys
turn the suite **red** — a hard gate, not a soft one. The usual escape,
importing the program so it renders verbatim
(`programImport.ts:271-275` stamps `origin: 'imported'`), is **closed by
§3**: *"Both programs are written directly into the app… Program content
uses the app's existing localization path so French and Chinese remain
available."*

> **OPEN — OWNER, and it is the Monday decision.** If fr/zh translation
> cannot be completed to a good standard by Sunday, choose:
> - **(a) Slip the fr/zh content**, seeding English text into all three
>   locale files so parity passes. Ships on time; the French and Chinese
>   apps show English coaching cues for a week. **Visible, not silent** —
>   and reversible.
> - **(b) Slip Monday's start** by the days translation needs.
> - **(c) Reduce scope**: seed the Build program with the six new movements
>   *substituted* by existing Library exercises (§17 supplies approved
>   substitutions for most), and add the new six in week 1.
>
> **Recommendation: (a), with a dated note in the plan and the fr/zh
> content landing in week 1.** It is the only option that keeps the coach's
> start date and the coach's localization requirement simultaneously, and
> the defect it ships is legible rather than hidden. **(c) is worse than it
> looks** — it changes the training stimulus, which is the coach's
> territory, not ours.

### 11.5 Release choreography

Pushing to `main` deploys (`.claude/rules/release-choreography.md`). Commit
boundaries that must not be split:

- **Library additions + `KNOWN_MISSING` entries + all three locale files
  travel in one commit.** Any split leaves the tree red.
- **The seeded program + its locale keys travel in one commit**, same
  reason.
- **Item 1 ships on its own, first, and can deploy today** — it is a live
  defect fix, independent of everything else, and independently verifiable.

Targeted `git add` only; commits route through `git-op`.

---

## 12. Test strategy, with negative controls

Every guard is broken on purpose, watched red, and restored. Where a wrong
all-clear would be silent, **QA runs the control, not the dev who wrote
it** (`.claude/rules/verification.md`).

### 12.1 The Yellow-day guard — the lead asked for this by name

**No test exists today in either direction**, proven: the 7-line fix
changed behaviour on 7 of 14 pyramids and the full suite stayed
**972/972 green**.

The test that would fail if the bug were reintroduced:

> **`suggestLadderProgression` returns `repeat`, never `advance`, when
> `readinessTier === 'easier'` — even when every rung of the (truncated)
> ladder was completed last session.**

and its end-to-end companion, which is the one that actually pins the
defect:

> **Given spec §8's Shoulder Press `6/8/10` and a previous session that
> completed rungs 1-2 and missed rung 3, an eased day offers `[6, 8]` —
> never `[8, 10]`.**

**Negative control:** revert `nextSetTarget.ts:112` to drop the third
argument; both tests must go red. Watch it, then restore. A control on the
domain function alone is not enough — the argument-forwarding line is the
actual defect, and only the end-to-end test can see it.

**Table-drive it over all 14 weighted pyramids of §6-§8**, asserting
offered === authored-after-truncation for every one. That converts §2.1's
sweep from a scratchpad measurement into a standing guard, and it fails in
both directions.

### 12.2 Spec conformance — replacing what §9 retires

A test that reads the **seeded** Build program and asserts, against
spec §6-§8:

- every prescription's `setPlan` weights and reps match the table exactly;
- no `weightKg` exceeds the 15 kg tier ceiling;
- every `exerciseId` exists in the Library;
- Monday and Friday lateral raises have **different** `setPlan`s (§10
  forbids deduplication — this is the assertion that catches a
  well-meaning refactor);
- side plank is `mode: 'seconds'` with two levels, 40 then 30 (§8/§10);
- `trainingWeekdays` is `[1,3,5]` and `startDate`/`endDate` are
  `2026-08-10` / `2026-09-13` (§3).

**Negative control:** perturb one seeded weight by 2 kg; the test names
that exercise. This is stronger than the retired gym test because it
guards what actually ships.

*(A `program-spec-validator` is separately running a numeric cell-by-cell
check of the spec's own weights against ceiling and step size. That
validates the **spec**; this test validates the **transcription**. Both are
needed and neither substitutes for the other.)*

### 12.3 The rung floor

- A one-rung ladder is never reduced below one rung. Control: set the
  constant to 0 → red.
- A two-rung ladder **now** eases to one rung and reports an adjustment —
  the inverse of the retired `:122` assertion, so the rewrite is provably
  not a deletion.

### 12.4 Bodyweight and timed holds

- A null-weight ladder returns `load-not-the-lever`, **not**
  `at-equipment-max`, and renders the new caption. Control: a genuine
  ceiling ladder (14 kg top, 15 kg max, 2 kg step) must still return
  `at-equipment-max` — this is the both-directions half, and without it the
  test cannot distinguish the two states it exists to separate.
- Side plank offers 40 s then 30 s, and `reps` is null at both levels.
  Control: flip `mode` to `'reps'` → the values must surface as reps, going
  red.

### 12.5 Asset coverage

`exerciseAsset.coverage.test.ts` already fails both ways (`:25-44`): an
unlisted missing asset fails, and a stale `KNOWN_MISSING` entry fails. **No
new guard needed** — but confirm on the commit that adds the six that it
went red *before* `KNOWN_MISSING` was populated. If it never went red, the
ids do not match the art directory names (§8) and the exercises are
resolving to nothing.

---

## 13. What I could not verify

- **Whether the owner's install carries an `origin: 'imported'` program
  under any id.** It lives in IndexedDB and I cannot read it. §10.1's
  distinct-id ruling makes this moot for seeding, but **QA should confirm
  on device** before Monday that the Plan page shows Phase 1 plus
  Mesocycle 2 Build and nothing unexpected.
- **The numeric correctness of the spec's own weights** against the 15 kg
  ceiling and 2 kg step — deliberately not duplicated; the
  `program-spec-validator` owns it. I did observe that §6's `15 x 6` sits
  exactly at the ceiling, so those pyramids can never advance and will
  correctly surface `at-equipment-max` from week 1. **Whether the coach
  intends that** is a question for the coach, not a defect.
- **Real-device behaviour.** Everything here was derived by reading and by
  running the suite. I did not run the app.
- **How long fr/zh translation actually takes**, which is §11.4's entire
  risk. I can size the string count (~130) but not the human hours.
- **Whether `docs/programs/` should keep a Mesocycle 2 Markdown copy** for
  the record even though §3 rules out importing it. A documentation
  decision, not mine.

---

## 14. Decisions outside my remit

- **LEAD — §10.2, and it blocks seeding.** Weekday-pinning is required by
  spec §3 but retired by `MissedDayDeferral.md` rulings 4/7, whose Phase 5
  deletes the fields. Recommendation: seed pinned, put Phase 5 on hold.
- **OWNER — §11.4, and it is the Monday call.** If fr/zh translation cannot
  be finished by Sunday: ship English in all three locales (recommended),
  slip the start date, or reduce scope by substitution.
- **~~COACH — §6.1~~ ANSWERED 6 Aug by spec v2.7 §4: the vocabulary is
  eight tokens and is now spec-mandated.** The original question below is
  kept for the record. The nine-token variation vocabulary collapses phrasings
  like *"harder leverage or pause"* into one label. Confirm the buckets
  preserve the coaching intent, or tell us the phrase must be verbatim.
- **COACH — §13.** Spec §6 tops several pyramids at exactly 15 kg, the tier
  ceiling, so those cannot progress by load at all and the app will say so
  from week 1. Confirm that is intended rather than an oversight.
- **COACH — all content.** Sessions, weights, reps, zones, activation
  contents, progression rules.

---

## 15. Out of scope

Nutrition; the weekly checkpoint's photo storage (§16 lists progress photos
— no media type exists and none is designed here); and everything in
`docs/design/ActivityPrescription.md` beyond what Mesocycle 2 needs on
10 August. Cardio's model shrinks for Monday to **prescription display
only** — the ride record, its table and its Dexie version defer to week 1
(§11.2), which is the only part of that plan Monday actually forces.
