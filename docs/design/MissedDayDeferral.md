# Missed-day deferral — implementation plan

> **PARTIALLY SHIPPED, PARTIALLY RETIRED — 6 Aug 2026.**
>
> - **The abandonment half shipped.** `abandonedAt` exists on the
>   workout type and in the repository layer; the stuck-workout case
>   this plan opens with is closed.
> - **The phase-boundary carry was retired before it was built.**
>   `grep -rn carryPendingFrom src/` returns **nothing** — verified,
>   not assumed. The coach ruled that Phase 2 is a newly authored
>   mesocycle rather than a continuation: sessions are re-authored and
>   all three recalibrated together, so a phase boundary now means a
>   new mesocycle by definition. That answers this plan's hardest
>   question — supersession — by construction: everything is
>   superseded. §6 and everything downstream of it describe a design
>   that will not be built.
>
> Read §3 and Phase 0 as shipped; read §6 onward as a record of a
> design overtaken by a coaching decision. It is kept rather than
> deleted because the *reasoning* about undecidable preconditions is
> still the best account of why that boundary is hard, and the question
> will return when a program is ever genuinely extended rather than
> replaced.

**Status: ruled and executable.** Revised after the 9 August question
came back and changed the boundary assumption.

**What changed in this revision.** §3 (abandonment) and Phase 0 are
**unchanged and must stay unchanged** — the dev is building against them
now, and a plan being executed is a contract. Everything about the phase
boundary is rewritten: the old §6 assumed the boundary writes missed
sessions off, and that assumption was wrong. New: §6 (boundary carry),
§7 (the empty-boundary state, which is live in three days), a rewritten
invariant 1 in §11, and revised phasing.

## The ruling

1. **An abandoned workout is closed automatically.**
2. **Closing a workout must not consume the planned session.**
   - **Scheduled Session** — the coach's plan. Sequential. Pending until
     completed.
   - **Workout Instance** — history. Calendar-accurate. Closed when
     abandoned.

   > *"The workout history remains historically correct, while the
   > coaching plan remains sequential."*
3. **Today resolves to the next pending session**, not to a weekday's
   identity.
4. **The program progresses by completed sessions, not rigid calendar
   dates.** Weekday pinning is released.
5. **The delayed session is labelled** — `Chest & Back (Delayed from
   Monday)`.
6. **The delayed session waits for the next scheduled training day.**
   Recovery days are part of the prescription and stay fixed.
7. **This is the canonical scheduling model for Fit223.**
8. **The next phase stays Home** — adjustable dumbbells, adjustable
   bench, indoor cycling — so the upcoming boundary is
   **equipment-compatible**.
9. **Boundary carry, bounded at one.** The next pending strength session
   carries into a compatible phase, provided its exercises still exist in
   the Library, it is compatible with the current equipment tier, it has
   not been superseded by a coach-authored replacement, and it does not
   duplicate a session in the new phase. It becomes the first pending
   session of the new phase. Everything older closes as not-completed and
   stays visible in history.
10. **Recovery and cardio never carry.** They are calendar-based and
    start fresh under the new phase.

### The coach's worked example (acceptance case)

```
Normal:          Mon Chest&Back · Tue Recovery · Wed Legs&Core · Thu Recovery · Fri Shoulders&Arms
Monday missed:   Tue Recovery · Wed Chest&Back (deferred) · Thu Recovery · Fri Legs&Core · Mon Shoulders&Arms
```

### The invariants the tests must assert

1. **(Revised — §11.2)** *"The next pending compatible strength session
   is preserved across a compatible Home-to-Home phase transition, unless
   the coach explicitly replaces it."*
2. The intended recovery spacing between strength sessions is preserved.

---

## 1. Baseline and method

- HEAD `455164d`, working tree clean. `npm test` → **80 files, 960
  tests, 0 failures.**
- Every measurement was produced by running code. Behavioural probes ran
  in an isolated copy of the tree under the scratchpad which reproduces
  the baseline exactly (80/960) before and after each control. **Nothing
  was written to `src/**`.**

---

## 2. The ruling is already implemented, arithmetically

`sessionAt` (`src/domain/schedule.ts:172-181`) is
`rotation[completedCount % rotation.length]`, and `sessionForDay`
(`schedule.ts:192-208`) delegates to it whenever `schedulingMode !==
'weekday-pinned'` (`schedule.ts:197`).

Run against the coach's example, that branch reproduces it exactly
(scratchpad `ruling.mjs`):

```
2026-07-20 Monday    -> Chest&Back                          [MISSED]
2026-07-22 Wednesday -> Chest&Back (Delayed from Monday)    [completed]
2026-07-24 Friday    -> Legs&Core                           [completed]
2026-07-27 Monday    -> Shoulders&Arms                      [completed]
```

**So the scheduling arithmetic is not the deliverable.** The label, the
abandoned-workout fix, the boundary carry, and the copy are.

**Within-phase sequence integrity, measured:** across all 2^9 = 512 miss
patterns over the phase's 9 training dates, the served sequence is always
a prefix of the repeating rotation — **0 out-of-sequence completions**.
(This is now a within-phase property, no longer the boundary invariant —
see §11.2.)

**Invariant 2 holds by construction.** `resolveDayPlan` reads
`program.weekdayActivities?.[isoWeekday(date)]` (`schedule.ts:49`) and
`projectSchedule` does the same (`schedule.ts:138`) — **no
`completedCount` term in either expression**. Recovery rhythm cannot be
disturbed by completion history. Guarded in §11.3.

---

## 3. Scheduled Session vs Workout Instance — UNCHANGED, Phase 0 is live

**This section is being implemented now. Do not revise it.**

### 3.1 The conflation

One record, `Workout` (`types.ts:187-207`), one binary field
`completedAt: string | null` (`types.ts:194`), doing two jobs: history
(`PlanDayPage.tsx:88`, `workout.ts:143-171`) and the plan pointer
(`schedule.ts:94`; `repositories.ts:48-51`). Two states representable;
the ruling needs three.

### 3.2 The defect the ruling sanctions

`workoutRepo.getActive()` (`repositories.ts:54-57`) filters `completedAt
=== null` **with no date filter**. `TodayPage.tsx:51` calls it and
`TodayPage.tsx:140-144` renders `<InProgress>` whenever it is defined,
short-circuiting `PlannedDay` (`TodayPage.tsx:150-160`) so
`resolveDayPlan` is never called. **This blocks the feature**: while it
stands, the owner's *"skip yesterday plan"* case never reaches the
scheduling logic.

### 3.3 Representation — decision and rejected alternatives

**Decision: additive, non-indexed `abandonedAt?: string | null` on
`Workout`. `completedAt` stays `null`.**

`completedAt` is read at **12 non-test sites**:

```
repositories.ts:50,55,60   schedule.ts:94,128,140   trends.ts:104,129
weeklyReview.ts:63   stagnation.ts:48   workout.ts:154,171
```

- **Chosen.** Touches exactly **one** (`repositories.ts:55`, gaining
  `&& !w.abandonedAt`). Every completion count stays correct untouched.
  **The Workout Instance gains a field; the Scheduled Session gains
  nothing.**
- **Rejected — delete the row.** Destroys the calendar-accurate history
  the ruling requires; orphans logged sets (`docs/Roadmap.md:305`:
  *"Prefer refusing over doing something clever"*).
- **Rejected — set `completedAt`, flag partial.** Advances the plan
  pointer, which ruling 2 forbids, and silently corrupts seven of the
  twelve.

### 3.4 Where closure happens

`closeStaleWorkouts(todayKey)` in `repositories.ts`, invoked at boot from
`src/main.tsx:10` beside `seedDatabase()` — same idempotent-on-every-boot
precedent (`seed/index.ts:17-24`). Rejected: doing it inside TodayPage's
`useLiveQuery`, a read path.

Rule: close where `completedAt === null`, `abandonedAt == null`, `date <
todayKey`. Same-day in-progress workouts untouched, so resuming across a
lunch break still works.

### 3.5 Dexie version

Additive, non-indexed (`getActive` is a JS-side `.filter()`), so an empty
`stores({})` with **no upgrade callback**, mirroring v4
(`db.ts:79-89`). Absent means not-abandoned; nothing backfilled; **no
destructive migration**. `db.ts:86-88` reserves the number — **the dev
reads `db.ts` and takes the next free version** rather than trusting a
number written here.

---

## 4. The canonical model, and retiring `schedulingMode`

Four existing fields carry the whole model:

| Field | Answers |
|---|---|
| `trainingWeekdays` (`types.ts:135`) | **When** strength happens |
| `rotation` (`types.ts:137`) | **What order** |
| `weekdayActivities` (`types.ts:160`) | What non-strength days hold |
| completed count (derived) | **Which** session is pending |

**`schedulingMode` is retired, not reframed** — `trainingWeekdays`
already means "which weekdays are strength days" and is what
`resolveDayPlan:40` and `projectSchedule:109,127,135` actually branch on.
Keeping it for imported programs is rejected: ruling 7 makes rotation
canonical, and a retained mode keeps the false copy of §10 alive.

**Retirement must be loud.** `programSchema`
(`programImport.ts:141-166`) is **not** `.strict()` (verified —
`.strict()` appears only at `programImport.ts:78,97`), so deleting the
field means an old export carrying `schedulingMode: 'weekday-pinned'` is
**silently stripped and imported as rotation**. Right outcome, wrong
mechanism — the documented `routineId` defect
(`docs/Roadmap.md:311-317`). **Keep the field in the schema with a
refinement that rejects the value by name**, following the shipped
`pinnedNeedsWeekdaySessions` shape (`programImport.ts:163-166`).

**`weekdaySessions` is dead**, and does not survive as an ordering
source: `rotation` already is that and is *required*
(`programImport.ts:149`) while `weekdaySessions` is optional. Readers:
`schedule.ts:200`, `PlanPage.tsx:262-269,280-284`,
`programImport.ts:136-140,156,163-165,218-231`, `types.ts:142,154`,
`seed/program.ts:82`, plus tests at `schedule.test.ts:111` and
`programImport.test.ts:422-465,524`.

**The old equivalence precondition is dissolved, not guarded.** Phase 3
removes `weekdaySessions` from the only shipped program; Phase 5 removes
the field. §10.3's guard covers the interim.

---

## 5. Blast radius

| File | Change | Phase |
|---|---|---|
| `types.ts:187-207` | `abandonedAt?` on `Workout` | 0 |
| `db.ts` | next free version, empty `stores({})` | 0 |
| `repositories.ts:54-57` | `getActive` excludes abandoned | 0 |
| `repositories.ts` | new `closeStaleWorkouts(todayKey)` | 0 |
| `main.tsx:10` | call at boot | 0 |
| `schedule.ts:10-17,183-190` | correct docblocks (§9) | 1 |
| `seed/program.ts:81-82` | remove 2 lines | 3 |
| `schedule.ts` | pending-origin derivation for the label | 4 |
| `TodayPage.tsx:313`, `PlanPage.tsx:169,195`, `PlanDayPage.tsx:253` | label render | 4 |
| `locales/{en,fr,zh-CN}/common.json` | 2 keys × 3 locales | 4 |
| `types.ts:139-154` | remove `schedulingMode` + `weekdaySessions` | 5 |
| `schedule.ts:192-208` | collapse `sessionForDay` → `sessionAt` (5 call sites `:36,41,47,146,159`) | 5 |
| `programImport.ts:136-165,218-231` | rejection replaces cross-refs | 5 |
| `PlanPage.tsx:259-284`, `PlanDayPage.tsx:120,127,231,238,246` | drop branch, unthread prop | 5 |
| `types.ts` + `programImport.ts` | `carryPendingFrom?` (§6) | 6 |
| `schedule.ts:18,86` + 3 call sites + 2 loaders | carry threading (§6.4) | 6 |

**No migration is destructive.** The one destructive precedent (v3 RIR
purge, `db.ts:39-70`) needed explicit owner approval; nothing here is in
that class.

---

## 6. The boundary carry

### 6.1 The four preconditions, and which are mechanically decidable

Measured against the schema as it actually is (scratchpad `carry.mjs`):

| Precondition | Status | Basis |
|---|---|---|
| Exercises still exist in the Library | **decidable** | every `item.exerciseId` ∈ `exerciseRepo.getAll()` ids; the Library is closed seeded content (`types.ts:27-33`) |
| Compatible with the current equipment tier | **not declared** | **there is no `Program.equipmentTier` field** (`types.ts:127-169`). Only `Exercise.equipment` (`types.ts:20,38`) and per-prescription `maxWeightKg` exist |
| Not superseded by a coach-authored replacement | **not decidable** | nothing distinguishes "this replaces that" from "this is new" |
| Does not duplicate a session in the new phase | **decidable** | carried id vs the new `rotation[0]` |

**I agree with the coordinator on supersession, and I am adding a
second.** Equipment compatibility is *also* not answerable from the data.
It could be *inferred* from the union of `Exercise.equipment` across the
new program's items — but that infers **availability from usage**, so a
phase that simply happens not to program a bench would read as "no bench
available" and falsely veto a valid carry. Inference here produces silent
false negatives, which is the failure class this repo keeps hitting.

### 6.2 The consequence: the coach declares, the machine may veto

All three undecidable-or-undeclared facts collapse into one thing the
coach already knows: *does the pending session from the previous phase
carry into this one?* The coach knows the equipment and knows what
supersedes what.

**Design: one authored field expressing intent; the two decidable
preconditions act as safety rails that can only refuse a carry the coach
requested, never invent one.**

```
Program.carryPendingFrom?: string   // the previous program's id
```

- **Rejected — infer the carry entirely.** Impossible: supersession is
  undecidable, and equipment inference is unsafe (§6.1).
- **Rejected — three separate fields** (tier, supersedes map, carry
  flag). Two of the three exist only to answer a question the coach
  answers directly by authoring the next phase; the third is the answer.
- **Chosen — one field, machine veto.** Consistent with
  `docs/Roadmap.md:305` (*"Prefer refusing over doing something
  clever"*), and it fails safe: a missing field means no carry, which is
  the pre-ruling behaviour.

**Open — the coach's, and already asked.** How a replacement is
distinguished from a new session. If the answer is "by reusing the
session id", `carryPendingFrom` alone suffices and the duplicate rail
catches it. If it is "by an explicit list", the field grows a
`supersedes` member. **Do not build Phase 6 until this returns** — the
shape of the field depends on it.

### 6.3 Does the derivation survive? Yes — with one extra input

The pending session becomes:

```
n === 0  ->  carried
n >= 1   ->  rotation[(n - 1) % rotation.length]
```

where `n` is completions in the *new* phase. Prototyped
(`carry.mjs`):

```
carried=null  ->  CB2 LC2 SA2 CB2 LC2 SA2 CB2
carried=CB    ->  CB  CB2 LC2 SA2 CB2 LC2 SA2
```

The carried session is served **once**, then the new rotation resumes at
index 0 — nothing skipped, nothing repeated. The duplicate rail fires
exactly when `carried === rotation[0]`.

**The carry does not break the derivation, and it does not become user
state.** Which session is pending in the old phase stays derived —
`prevRotation[prevCompletedCount % len]` — and it is stable in practice
because no new workout can be logged against a phase whose `endDate` has
passed.

**Why this does not contradict §3's argument.** I argued the *debt* must
not live on `Program` because `Program` round-trips through export
(`programExport.ts:13-16`) and a history-dependent value would be
re-imported into a different history. `carryPendingFrom` is not
history-dependent: it is a coach declaration of intent ("this phase
continues that one"), stable content that exports and re-imports
correctly. The history-dependent half stays derived. The split is the
same one, applied consistently.

### 6.4 Minimum stored state, measured

| | This design | Materialise the carry into a stored record |
|---|---|---|
| New fields | **1 optional string on `Program`** | 1 record + table/keying decision |
| Of the 12 `completedAt` sites | **0 touched** | 0 touched |
| New Dexie version beyond Phase 0's | **0** | 1 |
| Signatures changed | 2 (`schedule.ts:18`, `:86`) | 2 |
| Call sites | 3 (`TodayPage.tsx:199`, `PlanPage.tsx:92`, `PlanDayPage.tsx:41`) | 3 |
| Loaders that must fetch more | **2** (`TodayPage.tsx:49`, `PlanDayPage.tsx:36`) — `PlanPage.tsx:59` already calls `getAll()` | 3 |
| Write path | none | needs one, plus "when does it run" |
| Can go stale | no | yes |

**Strictly dominated.** Same read-side cost, less machinery, no
staleness. So: **one optional field, two signatures, three call sites,
two loaders — and zero new tables.**

`carryPendingFrom` **must be declared in `programSchema`** or it is
silently stripped on round-trip (`programImport.ts:141-166` is not
`.strict()`). Same trap as §4.

### 6.5 Recovery and cardio: zero work

Ruling 10 maps onto the existing model at no cost. `weekdayActivities` is
per-program and keyed by weekday (`types.ts:160`,
`seed/program.ts:269-311`), carries no completion state, and is read only
as `program.weekdayActivities?.[isoWeekday(date)]`. A new phase's
activities are its own by construction; nothing carries because there is
nothing to carry.

Worth noting for the coach's benefit: **indoor cycling already has a
home** — `ActivityKind` includes `'cardio'` (`types.ts:101`), so cycling
is authored as a `weekdayActivities` entry, not as a strength session.
It therefore falls under "never carries" automatically. (`Equipment`
(`types.ts:20`) has no bike member, which is consistent: cardio is not a
Library-prescribed lift.)

---

## 7. The boundary where the next phase does not exist — live in three days

`endDate` is `2026-08-09` (`seed/program.ts:79`) and there is no Phase 2
program in the database. `docs/programs/phase-2-gym.md` is a document
parsed only by a test (`phase2Program.test.ts:10`), not seeded.

### 7.1 What the app actually does — the "shows nothing" claim is not right

`programRepo.getActive` (`repositories.ts:22-33`) has a three-tier
fallback ending in *"the most recent program that has already started"*,
so after 9 Aug it returns the **expired** `phase-1-home`. Its docblock
(`repositories.ts:18-21`) says this is deliberate:

> *"a finished phase with no successor yet lined up still resolves to a
> program (and to `resolveDayPlan`'s 'ended' state) rather than reading
> as if no program had ever been set up."*

`resolveDayPlan` then returns `{ kind: 'ended' }` (`schedule.ts:25-27`)
and Today renders a complete hero — present in all three locales:

```
en   Phase complete / That's a wrap on this phase / Your next program will appear here once it begins.
fr   Phase terminée / Cette phase est bouclée / Ton prochain programme apparaîtra ici dès qu'il commencera.
zh   阶段完成 / 这个阶段圆满结束 / 你的下一个计划开始后会显示在这里。
```

(`en/today.json:24-26`, `fr:24-26`, `zh-CN:22-24`.) Plan still renders
the whole phase correctly.

**So the state is designed and graceful, not broken.** The correction
matters because it changes the urgency: this is not a crash to patch.

### 7.2 What is genuinely missing

**There is no way to train.** The ended branch renders a `Hero` and the
check-in card and nothing else (`TodayPage.tsx:270-279`) — no
`StartButton`, not even the quiet early-start affordance, which exists
only on the `upcoming` and `rest` branches (`TodayPage.tsx:397-404`). So
from 10 August the owner can check in and cannot lift, and the app's own
copy tells him to wait.

The only route in is the Markdown import on the Plan page
(`ProgramDataActions.tsx:59,86,92` → `programRepo.put`).

### 7.3 Options, costed — not chosen

**This is the owner's call, not mine**, because it is about what the app
promises when the coach has not delivered yet.

- **A — Do nothing.** Zero cost. The owner imports Phase 2 before 10 Aug
  and never sees the state. Correct if the program will exist in time.
  Risk: the plan cannot verify that it will.
- **B — Offer the pending session on the ended screen.** Add the existing
  quiet `StartButton` to the ended branch, previewing the pending session
  of the just-finished phase. Small and precedented — `UnscheduledDay`
  already composes exactly this pair (`TodayPage.tsx:388-404`) — plus one
  copy change, since *"Your next program will appear here once it
  begins"* would no longer be the whole story, in three locales.
  **Recommended** if there is any chance Phase 2 slips: it keeps the
  owner training on the sequence he is mid-way through, which is exactly
  what ruling 9 values.
- **C — Extend Phase 1's `endDate`.** Cheapest in code (one seed line)
  and the worst fit: it silently rewrites a coach-authored phase
  boundary, and `docs/Training.md` treats phase dates as content.

Note that **B and the carry are complementary, not alternatives** — B
keeps the sequence moving while Phase 2 is authored, and the carry then
brings whatever is pending into Phase 2 when it lands.

---

## 8. The label

### 8.1 Derivation — no stored state

The pending session's originally-scheduled date is *the first scheduled
training day at or after the last completed workout (or program start)
which has no completed workout and is strictly before today*. Prototyped
(`ruling.mjs`):

| Case | Origin | Label |
|---|---|---|
| Missed Mon, today Wed | `2026-07-20` | *Delayed from Monday* |
| Missed Mon, did Wed, today Fri | `null` | **no label** |
| 3 weeks missed, today 7 Aug | `2026-07-20` | date form (18-day gap) |

Row 2 matters: **the label vanishes once caught up**, matching the
coach's own example, which marks only Wednesday.

### 8.2 Render sites

Today's hero eyebrow (`TodayPage.tsx:310-313`), Plan's `DayRow`
(`PlanPage.tsx:169,195`), and `ProjectedDetail`'s heading
(`PlanDayPage.tsx:253`). **Only on the pending session — never on a
projected future day**, which would assert a fact about completions that
have not happened (`docs/Plan.md:36-46`).

### 8.3 Keys

Two, not one — an 18-day gap still resolves to "Monday". In
`common.json`, because the label renders across the `today` and `plan`
namespaces and `middotJoin` sets that precedent
(`TodayPage.tsx:300,313`):

```
common:delayedSession.fromWeekday   "{{sessionName}} (Delayed from {{weekday}})"
common:delayedSession.fromDate      "{{sessionName}} (Delayed from {{date}})"
```

Weekday form ≤ 6 days, date form beyond. `{{weekday}}`/`{{date}}` come
from `Intl` via `src/lib/dates.ts:38-45`, not from locale files.

**One interpolated key per locale, never concatenation.** This repo has
been bitten twice by treating joining as punctuation rather than grammar:
`Intl.ListFormat` (`PlanPage.tsx:229-235`) and per-locale `middotJoin`
(`TodayPage.tsx:310-313`, which exists because zh-CN sets the middot
without surrounding spaces). Locale parity is a test
(`src/i18n/localeParity.test.ts`).

---

## 9. Stale references — five sites

`docs/PyramidProgression.md` contains **zero** occurrences of "Question
A", "Question B", or "pinn" (`grep -ci`), and has no scheduling section.

| Site | Claim | Status |
|---|---|---|
| `schedule.ts:189-190` | "…scheduling section, Question A consequence #4" | target does not exist |
| `schedule.ts:10-17` | identity is "not by the calendar" | **false today; true again after Phase 3** |
| `PlanPage.tsx:260-261` | "Question A consequence #2" | target does not exist |
| `schedule.test.ts:163-164` | "A consequence #5" | target does not exist |
| `types.ts:145` | "…PyramidProgression.md's scheduling section" | no such section |

Out of scope, file separately: `programMarkdown.ts:318` and
`progression.ts:105` cite a "Question B" that also does not exist.

**Why Phase 1.** Whoever implements the label reads `schedule.ts:10-17`
while doing it. Precedent — a defect *"documented as intended"* that
passed CI for months (`docs/PyramidProgression.md:141-183`):

> *"A wrong comment is not neutral; it is a guard against being
> checked."*

---

## 10. Copy that dies, and the guard that replaces it

### 10.1 What dies

| Key / doc | Fate |
|---|---|
| `plan:projectedNotePinned` (`en:4`, `fr:4`, `zh-CN:4`) | **dies** (Phase 5) |
| `plan:dayDetail.nothingLoggedPinned` (`en:16`, `fr:16`, `zh-CN:15`) | **dies** (Phase 5) |
| `plan:import.schema.pinnedNeedsWeekdaySessions` (`en:72`, `fr:72`, `zh-CN:69`) | replaced by §4's rejection message |
| `plan:import.weekdaySessionNotTrainingDay` (`en:43`, `fr:43`, `zh-CN:40`) | **dies** |
| `plan:import.unknownWeekdaySession` (`en:44`, `fr:44`, `zh-CN:41`) | **dies** |
| `plan:projectedNote` (`en:3`, `fr:3`, `zh-CN:3`) | **becomes live, already correct** |
| `plan:dayDetail.nothingLogged` (`en:15`, `fr:15`, `zh-CN:14`) | **becomes live, already correct** |
| `today:plannedDay.endedSubtitle` (`en:26`, `fr:26`, `zh-CN:24`) | changes **only if §7.3 option B is taken** |
| `docs/Training.md:84-86` | **false** — rewrite |
| `docs/Plan.md:36-46` | **already false today**; true again after Phase 3 |

**The rotation copy the app needs already exists and already says the
right thing in all three locales.** The label (§8) is the only genuinely
new user-facing copy, unless §7.3 B is taken.

### 10.2 The measured hazard

Making identity depend on completion history while leaving
`schedulingMode: 'weekday-pinned'` in place turns only 4 tests red, and
these three stay **green**:

```
PlanDayPage.test.tsx  future training day: ... the pinned-mode honesty line
PlanDayPage.test.tsx  past scheduled day, nothing logged: honest empty state
PlanPage.test.tsx     labels only future sessions as projected, pinned-mode line once
```

The suite checks *"pinned mode renders the pinned copy"*, never *"the
pinned copy is true"*.

### 10.3 The replacement guard — written, run, seen red

```ts
function identityFollowsCompletions(program: Program): boolean {
  const d = firstTrainingDate(program)
  const ids = new Set(
    Array.from({ length: program.rotation.length + 1 },
      (_, n) => sessionForDay(program, d, n).id),
  )
  return ids.size > 1
}

// The exact predicate PlanPage.tsx:111 / PlanDayPage.tsx:127,246 branch on.
expect(program.schedulingMode === 'weekday-pinned')
  .toBe(!identityFollowsCompletions(program))
```

Proven in three states, not asserted:

| State | Result |
|---|---|
| Current tree — pinned seed, pinned copy | **passes** |
| Behaviour becomes deferral, mode stays pinned | **fails** — `expected true to be false` |
| Post-ruling — rotation seed, rotation behaviour | **passes** |

In the failing run the three §10.2 copy tests stayed green. **This guard
sees what they cannot**, and it fails in both directions.

---

## 11. Test strategy

Every guard is written, broken on purpose, watched red, and restored.
Where a wrong all-clear would be silent
(`.claude/rules/verification.md`), **QA runs the negative controls for
§10.3, §11.2 and §11.3** — not the dev who wrote them.

### 11.1 Phase 0 — abandonment (unchanged)

- A prior-day incomplete workout is closed and no longer returned by
  `getActive`. Control: remove the date condition → red.
- **Closing does not move the plan pointer.** Assert `countCompleted` and
  `resolveDayPlan`'s session are identical before and after closure.
  Control: set `completedAt` instead of `abandonedAt` → red. This test
  encodes ruling 2.
- A same-day in-progress workout is **not** closed — fails in both
  directions.
- Migration test beside `db.test.ts:52`'s v3 precedent: a stored workout
  survives with `abandonedAt` absent, and absent reads as not-abandoned.

### 11.2 Invariant 1 — REWRITTEN against the ruling

Asserted statement: *"The next pending compatible strength session is
preserved across a compatible Home-to-Home phase transition, unless the
coach explicitly replaces it."*

**Scope is "a compatible transition", declared by `carryPendingFrom` —
not the phase window.** The old scoping ("within the phase") is retired
along with the assumption behind it.

- Phase 2 declaring `carryPendingFrom: 'phase-1-home'` serves the carried
  session as its **first** pending session.
- After that session is completed, the next pending is the new
  `rotation[0]` — **not** `rotation[1]`. This is the "nothing skipped"
  half and it is the one most likely to be got wrong.
- **Refusal rails, each seen red:** exercises missing from the Library →
  refuse; carried id equals new `rotation[0]` → refuse. In both refusals
  the first pending is `rotation[0]` and nothing is lost.
- **Omission control:** without `carryPendingFrom`, the first pending is
  `rotation[0]`. This is the both-directions half — without it the test
  cannot distinguish a working carry from a carry that always fires.
- **Bounded at one:** two or more previously-pending sessions never
  produce two carries.

Separately, keep the **within-phase** sequence test (the 512-pattern
sweep of §2) under its own name. It is still true and still worth having;
it is simply no longer the boundary invariant.

### 11.3 Invariant 2 — recovery spacing

Sweep `completedCount` over `0, 1, 5, 100` on a Tuesday and a Thursday
and assert the activity and `kind: 'rest'` are unchanged — mirroring the
existing sweep shape at `schedule.test.ts:115-124`. Control: give the
activity lookup a `completedCount` term → red.

Plus, for ruling 10: a new phase's `weekdayActivities` are its own,
regardless of the previous phase's, and no activity is ever carried.

### 11.4 Phase 3 — the acceptance case

- **The coach's worked example, verbatim, as a domain table test.** The
  scratchpad sweep is a ready oracle.
- Update the 9 tests measured as failing when the seed flips
  (`PlanPage.test.tsx`, `PlanDayPage.test.tsx`, `TodayPage.test.tsx`,
  `TodayPage.earlyStart.test.tsx`); three are pure copy-key swaps.
- **Keep every `schedule.test.ts` pinned test until Phase 5.**

### 11.5 Phase 4 — the label

Present on the pending session; **absent once caught up**; never on a
projected future day; weekday form ≤ 6 days, date form beyond, with the
boundary tested at exactly 6 and 7.

### 11.6 Phase 5 — retirement

An imported file declaring `schedulingMode: 'weekday-pinned'` is
**rejected with a named message**, not silently stripped. Control: delete
the refinement, confirm the file imports as rotation — that silent
failure must be seen once.

---

## 12. Phasing

**Phase 0 — Abandoned workouts close automatically.** *Dispatched, in
progress, spec unchanged.*

**Phase 1 — Correct the false statements; add the copy/behaviour guard.**
§9 plus `docs/Plan.md`, and §10.3's guard. No behaviour change. Before
Phase 3, because the dev implementing the label reads
`schedule.ts:10-17`, **and because the guard must exist before the
behaviour it guards changes** — added afterwards it would be written to
match whatever shipped.

**Phase 1b — §7.3 decision, if option B.** Independent of everything
else and the only phase with a calendar deadline: it is worth nothing
after Phase 2 content lands. **Owner decides; do not build on spec.**

**Phase 2 — Plan-page `workout: null`** (`schedule.ts:168` drops an
incomplete past workout, contradicting `ScheduleDay.workout`'s docblock
at `:58-59`). Queued separately by the lead; listed for sequencing — it
touches the same function as Phase 3 and must not run concurrently
(`.claude/rules/team-roles.md`).

**Phase 3 — The ruling.** Remove `seed/program.ts:81-82`. Acceptance case
and invariant 2. Changes behaviour.

**Phase 4 — The label.**

**Phase 5 — Retire `schedulingMode` and `weekdaySessions`.**

**Phase 6 — The boundary carry.** **Blocked on two things**: the coach's
answer on how a replacement is distinguished (§6.2), and a Phase 2
program existing to carry into. Sequenced last because it is the only
phase whose *input* does not exist yet.

**Release choreography** (`.claude/rules/release-choreography.md`):
pushing to `main` deploys. **Phase 3 and its copy travel in one commit** —
a tree where the schedule defers while the copy says days never shift is
internally inconsistent. Targeted `git add` only; commits route through
`git-op`.

---

## 13. What I could not verify

- **Whether the owner's install carries an `origin: 'imported'`
  program.** `seedDatabase` deliberately does not overwrite one
  (`seed/index.ts:20-24`), so Phase 3's seed edit would not reach it.
  Lives in IndexedDB. **Ask, or have QA check on device, before Phase 3.**
- **Whether a Phase 2 program will exist before 10 August.** This decides
  whether §7.3 is urgent or moot, and I cannot see the coach's queue.
- **Real-device behaviour of the abandoned-workout hijack**, and of the
  ended state after 9 Aug. Both derived by reading; I did not run the app.
- **Prose truth of the French and Chinese copy.** Key presence and parity
  verified across all three locales; the English read. Whether the fr/zh
  sentences assert the same property is a translation review.
- **Whether any exported program JSON exists outside the repo** carrying
  `schedulingMode`, which Phase 5 would start refusing. Nothing in the
  repo is affected — `phase-2-gym.md` is Markdown and
  `programMarkdown.ts:83` parses only `rotation`.

---

## 14. Decisions outside my remit

- **Coach — blocks Phase 6.** How a coach-authored replacement is
  distinguished from a new session (§6.2). The field's shape depends on
  the answer.
- **Owner — has a calendar deadline.** §7.3: whether the ended screen
  offers the pending session while the next phase is unauthored. Option B
  recommended *if* Phase 2 might slip; option A is correct if it will not.

Everything else the earlier drafts left open is now closed: the B1/B2
fork (ruling 6), the scheduling model (rulings 4, 7), the debt bound
(dissolved — rotation has no queue, so there is exactly one pending
session at any moment), whether catch-up is opt-in (moot), and what
happens at the phase boundary (rulings 8-10).
