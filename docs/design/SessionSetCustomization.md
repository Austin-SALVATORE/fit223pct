# Activity records + session set customization — one schema change

> **SHIPPED 6 Aug 2026** — `6198cc9`, `cff4df4`, `7afa9fe`, `85933fd`,
> `b31567b`, `33791ab`, `5200b7b`, `83b152e`, all pushed. Read the rest
> of this document as the design that was executed, not as current
> truth. Known divergences, recorded rather than edited away:
>
> - **The Authority line below cites v2.11; the current coach spec is
>   v2.15.** The implementation tracks v2.15 — verified independently
>   at acceptance. No prescription number moved between the two.
> - **§4's "surfaces in four places" was not true on delivery.** An
>   exercise with *every* level removed and no custom set vanished from
>   Session Summary and Plan history entirely, because both filtered on
>   `sets.length > 0`. Caught by acceptance, fixed in `83b152e`. Every
>   test on those surfaces logged a set first, so the zero-set case was
>   never constructible in any of them — the scenario was unimagined,
>   not under-tested.
> - **§9's open question about storing a custom set's `variation` is
>   still open.** It was neither implemented nor called out by the
>   commits that closed the rest of §4. A custom set has no rung to
>   inherit a variant from and `LoggedSet` has no field to hold one.
> - **The schema change in the title did not happen.** The set-
>   customization fields needed no Dexie version bump — they are nested
>   inside a record that is not indexed on them. Proven by writing and
>   reading a record back, then reverting the types and watching it
>   fail. Only the activity-records half took version 6.
>
> Two owner rulings arrived after this was written and govern where
> they conflict: **Add Set stays unavailable once every prescribed set
> is logged** (6 Aug, "one decision per screen wins"), and Saturday
> 8 Aug is **not** re-pinned as a training day.

**Authority:** coach spec **v2.11** (736 lines, md5
`c29cae53580912a3414659624fd900f8`) — §3 "Monday recording release ruling",
§3 "Training-day activity slots", §4 "Session set customization", §12 "Ride
record", §14 "Stretching record ruling".

**Owner rulings carried:** *"Add and remove from the set you are on, one at
a time"* — no set list; every §4 behaviour holds, only the control location
changed.

**Baseline:** HEAD `b460822`. The dev holds an uncommitted content batch
(`seed/program.ts`, three `seed.json`, `mesocycle2Build.conformance.test.ts`,
`docs/I18n.md`). All measurements were produced against a `git archive HEAD`
copy under the scratchpad, so the dev's in-flight work is excluded.
**Nothing was written to `src/**`.**

**This supersedes** `ActivityPrescriptionPhaseA.md`'s display-only scope and
the standalone set-customization draft of this file.

---

## 0. Still unfixed, and it ships wrong: the dev's ride content

Flagged before v2.11 arrived and still uncommitted in `seed/program.ts`:

```
+ Monday and Friday both prescribe 30 min Zone 2 after lifting
+ detail: '30 min, after lifting (optional 2-3 min easy spin cool-down)'
+ '...reduce to 20 min on a Yellow day...'
```

**§12 prescribes 20 min Zone 2 on Monday/Wednesday/Friday** (0-2 min
transition, 20 min main, up to 3 min cool-down, ~25 min total). The
"reduce to 20 if Yellow" clause is gone — §15 now says *"Keep the
post-strength ride at the prescribed 20 minutes."* And §3's fourth element,
the **session-specific post-ride stretch routine (§14)**, has no seed slot
at all.

**This is a content correction, not a design change. It needs to reach the
dev before that batch commits.**

---

## 1. One migration, and the argument for it

**Answering the question directly: yes — one Dexie version, and the reason
is stronger than convenience. There is only one migration here, because
three of the four changes are index-free.**

| Change | Index diff? | Migration logic |
|---|---|---|
| `LoggedSet.custom?` | no | none |
| `WorkoutExercise.skippedLevels?` | no | none |
| `WorkoutExercise.customSlots?` | no | none |
| **`activityRecords` table** | **yes — `id, date`** | none (empty table) |

`db.ts:76-77,96-97` states the rule: *"the version schema declares indexes,
not fields."* So the three set-customization fields need **no version at
all**; only the new table does.

**This corrects my own earlier recommendation.** The standalone draft
proposed taking a version for the set-customization fields "by precedent"
(v4 and v5 both bumped with an empty `stores({})` to record a generation).
With a real table landing in the same week, following that precedent would
manufacture a second version for zero schema effect — exactly the outcome
you asked me to avoid. **Fold them in and document that they rode along.**

### 1.1 Version allocation — take **v6**, and this is a correctness point

`db.ts:99` reserves **v6 for M11 (nutrition)**, which is unbuilt and
unscheduled (`docs/Roadmap.md:231`).

**Honouring that reservation by taking v7 would be a live bug, not a style
choice.** Dexie applies upgrades in increasing version order. An install
that reaches v7 has passed v6; if nutrition later ships as v6, **its upgrade
never runs on that install.** Reserving a *lower* number for work that ships
*later* is backwards.

**Take v6. Re-point the comment: M11 takes v7.** One line in `db.ts`, and it
removes a trap rather than leaving it for whoever builds nutrition.

```ts
// Activity records (v2.11 §3) + session set customization (§4).
// The only index diff is the new table; the three Workout-shape fields
// are non-indexed and ride along rather than taking a version of their own.
// Nothing is backfilled — §3 forbids synthetic records for past dates.
// **M11 (nutrition) takes v7.**
this.version(6).stores({ activityRecords: 'id, date' })
```

**Additive, no upgrade callback, nothing destructive, no backfill.** A
stored pre-v6 `Workout` reads unchanged; a pre-v6 install simply has an
empty `activityRecords` table. That is also what makes §3's *"do not create
synthetic records for past dates"* structural: there is no callback that
could write one.

---

## 2. Activity records

§3 makes this *"platform behavior for any current or future program"*, not a
Mesocycle 2 exception — so the model is a general activity record, not two
special cases.

```ts
export type ActivityRecordKind = 'ride' | 'activation'

export type ActivityRecord =
  | { id: string; date: string; programId: string
      kind: 'activation'; completedAt: string }
  | { id: string; date: string; programId: string
      kind: 'ride'; completedAt: string
      actualMinutes: number; avgHeartRate: number }
```

- **`id` is `${date}-${kind}`** — deterministic, so re-saving *edits* the
  same row (§3: *"remain editable for the same scheduled day"*) and a
  duplicate for one day is unrepresentable. `db.put` is the whole write
  path.
- **Both ride fields are required by the type.** §12: *"A duration-only
  entry does not count as a completed ride until average heart rate is
  added."* Making them non-optional means a partial ride record **cannot
  exist**, so "both required before complete" is structural rather than
  validated. A half-filled form lives in component state; §3 requires
  *saved* records to survive reload, not drafts.
- **Independence is by construction.** The records live in their own table,
  entirely outside `Workout`. Saving one literally cannot create, overwrite
  or complete another — §3's hardest requirement is satisfied by the
  boundary, not by discipline.
- **Zone is absent**, per §12: prescription only, never a result field. No
  calories, distance, speed or cadence.

### 2.1 Alternatives rejected

- **Two tables (`rideRecords`, `activationRecords`).** ~5 permanent
  touchpoints each (`db.ts`, `repositories.ts`, `dataExport.ts:9-29`,
  `SettingsPage.tsx:32`, `dataExport.test.ts`), and a third would be needed
  for the next activity type — against §3's "any current or future program".
- **Fields on `CheckIn`.** `CheckIn` is one row per day of subjective state;
  a ride is a performed activity with its own completion. It would also make
  the records non-independent — saving a ride would touch the row the
  check-in owns, which §3 forbids in spirit.
- **Fields on `Workout`.** Fails outright: a Tuesday recovery ride has no
  `Workout` to hang off, and §3 requires independence from strength.
- **Optional flat fields instead of a discriminated union.** Allows a ride
  record with a duration and no heart rate — the exact state §12 says does
  not count.

> **OPEN — OWNER, small but real.** The strict shape means a ride entered
> before the athlete reads their average heart rate cannot be saved, and the
> typed duration is lost on reload. The window is short (the figure is on
> the Watch summary immediately), and persisting a draft would invent an
> "incomplete ride" state the coach declined to define. **Recommend strict.**

### 2.2 The guard this breaks — named, because it is the one that bites

`src/features/recovery/routineNoTracking.write.test.tsx:85` asserts
`db.tables.length === 5`, and `:87` asserts no table name matches
`/routine|completion/i`.

- **Adding the table breaks `:85`.** Unavoidable.
- **`:87` survives** provided the table is named `activityRecords` — no
  "routine", no "completion". That naming constraint is worth honouring
  rather than fighting.

**The guard's intent survives intact**: §14 keeps stretching non-persisted,
and nothing in this design writes on routine playback. So `:85` narrows from
a global table count to what it actually means, and the byte-identical
snapshot test at `:97` — the real guard — **must not be weakened**.

Per `.claude/rules/verification.md`, **QA re-runs that negative control, not
the dev who narrows the assertion.**

### 2.3 Red, for §3

§3: *"On a Red day … Strength and ride may remain incomplete, and Morning
Activation may be skipped."* Records are created only when the athlete acts,
so **absence already means incomplete. Nothing to build.**

---

## 3. Set-customization storage

```ts
export interface LoggedSet {
  /* …existing… */
  /** Session-only extra set (§4). Never a Pyramid level. */
  custom?: true
}

export interface WorkoutExercise {
  /* …existing… */
  /** Prescribed level indices removed this session (§4 `Skipped this session`). */
  skippedLevels?: number[]
  /** Extra set slots opened by `Add Set`. 0-2 (§4). */
  customSlots?: number
}
```

### 3.1 The defect this exists to prevent — measured, not theorised

Remove prescribed level 0, then log a custom set, against the real code:

```
IDX  stored indices = [0,1]
IDX  the custom set landed at index 0 — the level that was SKIPPED
IDX  gate = advance  ->  [6,8]
```

`logSet` (`workout.ts:76`) assigns `setIndex: exercise.sets.length`, so the
custom set *becomes* level 0. The gate reads it as prescribed, finds the
target met, and **advances the load** — violating §4's *"do not trigger load
or variation progression"* and *"make the Pyramid incomplete"* at once.

Control, showing the fix: `IDX-CTL indices = [1,2] → repeat`.

**The one required behaviour change:**

```ts
export function logSet(
  workout, exerciseIndex,
  set: Omit<LoggedSet, 'setIndex'>,
  setIndex: number,          // explicit — no longer derived from sets.length
): Workout
```

`WorkoutPage.handleLog` (`:96`) already holds it (`position.setIndex`,
`:269`). `workoutPosition` becomes the single authority: prescribed levels
first, skipping removed ones, then opened custom slots at
`prescription.sets + i`.

Custom indices start at `prescription.sets`, which equals `setPlan.length`
for every ladder — enforced by `programImport.ts:98`'s existing refinement
`p.sets === p.setPlan.length`. **That makes the index rule structural.**
`custom: true` is stored anyway: index position is what the *engine* relies
on, the marker is what *history and UI* read. Neither may be inferred from
the other.

### 3.2 What holds for free — measured both ways

```
Q3a  plan len 2, logged [0,1,2]  -> advance   (custom at 2 never visited)
Q3b  collided indices [0,1,1]    -> repeat    (custom shadows level 1)
Q2a  level 1 skipped, logged [0] -> repeat    (§4 satisfied, no engine change)
VOL  totalSets 3, volumeKg 192               (custom counts toward volume)
```

`suggestLadderProgression` (read at HEAD, post-`a282e89`) iterates the
**plan**, not the logs, so a custom set at or beyond `setPlan.length` is
structurally unreachable. **No engine change is needed** — but only because
§3.1's explicit index lands. `skippedLevels` is audit and display only;
nothing in the engine reads it.

### 3.3 Why `skippedLevels` is not a marked `LoggedSet`

`exercise.sets` is consumed by **10 non-test sites that all treat every
element as work that happened**: `workout.ts:148`, `weeklyReview.ts:75-76`,
`trends.ts:131-164`, `stagnation.ts:50-57`, `highlights.ts:27-50`,
`ProgressPage.tsx:146`, `PlanDayPage.tsx:258`, `SessionSummary.tsx:51,121`,
`SetScreen.tsx:229`, `WorkoutPage.tsx:152`. A skipped marker inside `sets`
makes every one count a set that never happened. Ten filters, ten
silent-wrong-number risks.

Also: `LoggedSet.completedAt` is required, and a skipped level has none —
verified that **no non-test code reads it**, so it could not even carry the
distinction.

Rejected too: mutating `prescription.setPlan` (destroys the record §4 says
to retain), and a separate skipped-sets table (session-scoped data with no
independent lifetime).

---

## 4. The interface, under the no-list ruling

`architecture.md:90` — *"One decision at a time in Workout Mode."*

**On the set screen, below the log action:** `Add Set` opens one extra slot
(max 2); `Remove this set` removes the set in front of you — a prescribed
level goes to `skippedLevels`, an unfilled custom slot decrements
`customSlots`.

**`Skipped this session` surfaces in four places**, because no one of them
carries it:

1. **At the moment** — inline confirmation with **Undo** (`ConfirmAction` /
   `UndoLastSetButton` precedent).
2. **At the end** — `SessionSummary.tsx:121`'s per-exercise line.
3. **In history** — `PlanDayPage.tsx:258`.
4. **The counter** — and this is the one most likely to be missed.
   "Set 2 of 4" reads `prescription.sets` today
   (`SetScreen.tsx:97`, `RestScreen.tsx:193,206,276`, and the last-set test
   at `RestScreen.tsx:89`). After a skip it must say "of 3", or the athlete
   is promised a level that will never come.

**Undo is a separate mechanism**, deliberately. `undoLastSet`
(`workout.ts:103-118`) is last-set-in-session and positional, and its
docblock depends on *"exercises fill strictly in order"* — which skipping
breaks. New pure functions `undoSkip` / `undoCustomSlot` restore exactly one
thing. Because a removal touches only `skippedLevels` / `customSlots` and
never `sets`, **undo cannot lose logged work.**

### 4.1 Gates, and Red

| Condition | `Add Set` | Remove |
|---|---|---|
| Green Build | up to 2/exercise | yes |
| Yellow (`tier === 'easier'`) | no | yes |
| Deload | no | yes |

`workout.readiness.tier` is already stored and already threaded to the set
screen, so the Yellow gate is free.

**There is no Red tier.** `ReadinessTier = 'ready' | 'steady' | 'easier'`
(`readiness.ts:5`), derived only from a `CheckIn`. Reading §15, Red is not a
rating but a **mid-session decision** — *"End the strength portion and treat
the day as Red"* — whose app expression is leaving Workout Mode, which
`abandonedAt` already closes. **So §4's Red rule is satisfied vacuously: no
state exists in which the app believes it is Red and still offers sets. Add
nothing.** Do not map `'easier'` to Red; §15 gives Yellow and Red different
rules.

**Deload gate:** `WorkoutPage` already loads the Program
(`programRepo.getById`, keeping only `origin`), so the gate costs no extra
query — it needs a coach-authored flag that should be defined when the
Deload program is built (14 Sep, five weeks of slack). Build the readiness
gate now.

---

## 5. Blast radius

**New:** `ActivityRecord` type, `activityRecordRepo`, ride form + activation
control on Today, `db.ts` v6.

**Changed:**

| Site | Change |
|---|---|
| `dataExport.ts:9-29` | `FullDataExport` + `buildFullDataExport` gain `activityRecords` |
| `SettingsPage.tsx:32` | loads them for backup |
| `routineNoTracking.write.test.tsx:85` | table count narrowed (§2.2) |
| `workout.ts:60-67` `workoutPosition` | skips + custom slots |
| `workout.ts:69-78` `logSet` | explicit `setIndex` |
| `nextSetTarget.ts:129` | `setPlan[setIndex]` is `undefined` for a custom index — fall back to last completed set (§4 inheritance) |
| `SetScreen.tsx:97`, `RestScreen.tsx:89,193,206,276`, `WorkoutPage.tsx:152-153,219` | session-aware counters |
| `SessionSummary.tsx:51,121`, `PlanDayPage.tsx:258` | `Custom` / `Skipped this session` |
| `types.ts`, `db.ts` | the fields and the version |

**Unchanged, verified:** `progression.ts` (§3.2), `summarizeWorkout`
(custom sets already count toward volume), and `weeklyReview` / `trends` /
`stagnation` / `highlights` / `ProgressPage` — every element of `sets`
remains work that happened.

---

## 6. Verdict: **Monday does not hold for all of it**

I have been asked for this plainly, so: **no.** Four days (Thu 6 → Mon 10),
one dev mid-batch, and the list is now:

| # | Item | State | Size |
|---|---|---|---|
| 1 | Training-day structural | **done** (`b460822`) | — |
| 2 | Training-day content, **corrected to 20 min** (§0) | in flight, **wrong** | half day |
| 3 | §14 post-ride stretch content, 3 routines × 3 locales | not started | half day |
| 4 | Activity records: table, repo, export, guard, **two UI surfaces**, 3 locales | not started | **~1.5 days** |
| 5 | Set customization: storage + set-screen UI + confirm/undo + 5 counter sites + 2 history surfaces + 3 locales | not started | **~1.5 days** |
| 6 | Localization | §3 fallback **removes the blocker** | — |

That is ~4 days of focused implementation with **zero slack for review, QA,
the negative controls, or the release verification** — and items 4 and 5 are
the two that touch storage, which is where being wrong is most expensive.

### 6.1 The ranked cut

**Cut item 5's *controls*, not its *storage*.** Ship the three
`Workout`-shape fields inside the v6 migration now, and land the set-screen
UI in week 1.

Ranked, with reasons:

1. **Never cut item 2/3 (content).** Without it Monday is wrong, and someone
   trains from it.
2. **Do not cut item 4 (records).** §3 makes persistence and record
   independence explicit **Monday acceptance criteria** and names display-only
   *"not an accepted launch state."* The coach has ruled; this is the one
   item whose absence the spec calls a failure.
3. **Cut item 5's UI.** §4 is a training *standard*, and the athlete can
   train a correct Monday session without it — it changes flexibility, not
   correctness. **Its schema rides along at zero migration cost**, so
   shipping the controls in week 1 needs **no second migration** — which is
   precisely the outcome this plan was asked to protect.

**And the input changed after the owner chose.** Set customization was
picked over my recommendation *before* §3's recording ruling existed. The
owner has since been handed a coach ruling that makes records a Monday
acceptance criterion. They should get to choose again, against the real
list — but if both go in, the risk is not that one is late, it is that a
storage change ships under-tested on the day someone starts training from
it.

**If the owner keeps both:** the honest mitigation is to cut item 5's
*scope* rather than its *quality* — `Add Set` only, with removal and skip
deferred. Adding is the half with no engine interaction (§3.2 shows the
whole risk lives in removal-then-logging). That is a real middle option and
it is measurably safer.

---

## 7. Sequencing against the dev

Dev currently holds: `seed/program.ts`, three `seed.json`,
`mesocycle2Build.conformance.test.ts`, `docs/I18n.md`.

| File | Dev | This plan | Verdict |
|---|---|---|---|
| `seed/program.ts`, `seed.json`, conformance | content | — | **dev only — do not touch** |
| `types.ts` | not currently modified | records + 3 fields | **free now, but confirm before starting** |
| `db.ts`, `repositories.ts`, `dataExport.ts` | — | records | **free** |
| `workout.ts`, `nextSetTarget.ts` | — | set customization | **free** |
| `src/features/workout/**` | — | set customization | **free** |
| `src/features/today/**` | — | record UI | **free** |
| `PlanDayPage.tsx` | Phase A reorder | history surfaces | **collides** |

**Start immediately:** `db.ts` v6, `repositories.ts`, `dataExport.ts`,
`workout.ts`, and the whole of `src/features/workout/**`. That is most of
the work and none of it is in the dev's batch.

**`types.ts` is the fulcrum** — everything else depends on it and it is not
currently modified. **Recommend landing a `types.ts`-only commit first**,
before the dev's next batch opens it.

**Wait:** `PlanDayPage.tsx`.

---

## 8. Test strategy, with negative controls

- **The index-inheritance regression** — *"remove a prescribed level, log a
  custom set, and the pyramid does not advance."* **Control: revert `logSet`
  to `setIndex: exercise.sets.length` → must go red**, reproducing
  `advance -> [6,8]`. Nothing catches this today.
- **Record independence** — saving a ride creates no activation record and
  does not touch the day's `Workout`; and the reverse. Control: have the
  ride write both → red. This is §3's acceptance criterion, so it is the
  test the release is judged by.
- **A ride record cannot exist with only a duration** — a type-level
  guarantee, asserted at the repo boundary.
- **Editable for the same day** — saving twice updates one row, never two.
  Control: switch the id to a UUID → duplicate rows, red.
- **No synthetic past records** — after migration, `activityRecords` is
  empty and existing workouts are unchanged. Beside `db.test.ts`'s v3
  precedent.
- **Custom sets never satisfy a level**; **a skipped level makes the pyramid
  incomplete and an unskipped one completes** — both directions, or the test
  cannot distinguish a working skip from one that always fires.
- **Volume includes custom sets; totalSets excludes skipped levels.**
- **Gates:** `Add Set` absent on `'easier'`, removal present; a third
  `Add Set` refused. Control: raise the cap → red.
- **`routineNoTracking` byte-identical snapshot still passes** after the
  table lands, with **QA running the control** (§2.2).

---

## 9. What I could not verify

- **Whether the owner reads the four-day estimate as acceptable.** §6 is my
  honest sizing, not a measurement — the code changes are measured, the
  hours are not.
- **Real-device ergonomics** of adding a set from inside the set you are on,
  and of two record forms on an already-dense training day.
- **The Deload flag's shape** — the program that needs it does not exist.
- **Whether a ride can ever occur twice in one day** under a future program.
  The `${date}-${kind}` id forbids it; every prescription in v2.11 is
  compatible, but §3 calls this platform behaviour and I cannot see future
  programs.
- **`variation` on a custom set** — §4 says store it and inheritance implies
  it comes from the last completed set. Whether the athlete may change it is
  not stated; I assume yes, editable before completion.
