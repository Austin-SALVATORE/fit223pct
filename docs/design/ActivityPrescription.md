# Activity prescription — implementation plan

> **SHIPPED 6 Aug 2026**, across `b460822`, `6f5139c`, `8cb2f63`,
> `6198cc9` and `cff4df4`, all pushed. The activity model this plan
> designs — cycling, recovery-day and morning-activation prescriptions
> on a program's weekdays — exists, is seeded, and records.
>
> Read as the executed design. Two things it does not carry:
>
> - **The durations in it are Mesocycle 2's.** `phase-1-home`'s rides
>   were ruled directly by the owner on 6 Aug and are different
>   (40 / 20 / 35 min, `def02a1`).
> - **Guided stretch routines were deliberately not built.** Four of
>   the coach's nine named positions have no step id, and a step id is
>   both a locale key and an art id. Post-ride stretching ships as
>   plain text. That is a scoping decision on hold, not an omission.
>
> The coach's model has since moved from v2 to v2.15; where a
> §-reference here disagrees with that spec, the spec wins on training
> content exactly as this plan's own opening states.

**Status: designed against the coach's settled model (v2).** Supersedes
the v1 draft written before the coach's rulings arrived; §2.1 records
which of my own decisions those rulings overturned and why I withdrew
them.

The coach's rulings define the **coaching model**; the implementation is
ours. This plan designs what the app needs in order to hold that model.
It prescribes no training content
(`.claude/rules/program-content.md`).

---

## 1. Baseline and method

- **HEAD `a66ea5d`**, working tree clean apart from untracked design
  docs. `npm test` → **80 files, 972 tests, 0 failures.**
- **Correction to the brief's premise.** The brief said the dev holds
  uncommitted Phase 0 work in `db.ts`, `repositories.ts`, `types.ts`,
  `main.tsx` and two tests. Those are exactly the six files of commit
  `a66ea5d`, which is **committed and unpushed** (`git log
  origin/main..HEAD` → one commit). Every measurement below is against a
  clean tree that already contains Phase 0. Nothing here touches those
  files.
- Probes ran in an isolated `rsync` copy under the scratchpad,
  reproducing the baseline before and after each control. **Nothing was
  written to `src/**`.**

---

## 2. What the coach settled, and what it costs

| Ruling | Consequence for the app |
|---|---|
| 1. Cycling prescription: type, duration, HR zone, optional warm-up/cool-down. **No** cadence/resistance/distance/calorie/RPE targets | A small, closed prescription type. Duration must admit a **range** ("35–40 min"); zone enum must admit **Zone 3** without prescribing it |
| 2. Completion is recorded | **Retires the do-nothing option.** Storage is now required — §7 |
| 3. Post-strength cycling is **not** part of the strength workout; presentation may group them | Cardio is an **independent day-scoped prescription**, not an attachment on `SessionTemplate` — §5 |
| 4. Morning Activation: completion only, no timing/scoring/progression | The lightest record in the system — §7.3 |
| 5. Three modalities; do not fit them into one workout model | §4 — honoured, with one deliberate exception argued explicitly |

### 2.1 What I withdrew, and why

- **v1 §5 attached post-strength cardio to `SessionTemplate.finisher`.**
  **Withdrawn.** I had measured (PROBE C) that a weekday-keyed finisher
  desynchronises from a deferred session — Wednesday serving Monday's
  session but Wednesday's ride, and staying wrong all week. That
  measurement was correct and is now **moot**: it measured drift between
  a session and *its own* finisher. Ruling 3 says there is no finisher —
  there are two independent activities with different goals. Drift
  between two things that were never coupled is not drift. Cardio is
  therefore calendar-fixed, exactly as recovery days already are
  (`MissedDayDeferral.md` ruling 6: *"Recovery days are part of the
  prescription and stay fixed"*).
- **v1 §4 escalated persistence to the owner.** **Answered by ruling 2.**
  One collision survives and is *not* answered — §8.

### 2.2 What still stands from v1, verified

- `ActivityItem` is `{label, detail?, routineId?}` (`types.ts:103-118`) —
  no duration, intensity, zone, distance or target. **Confirmed.**
- `'cardio'` exists as a word only: the literal appears in exactly **two**
  places repo-wide (`types.ts:101`, `programImport.ts:126`) and
  **nothing branches on it**. Its sole effect is selecting a label
  (`activityKindLabel.ts:7`). **Confirmed — the name is a trap, as you
  suspected.**
- **Nothing about a non-strength activity is persisted.** `db.ts:15-19`
  declares exactly five tables — `exercises`, `programs`, `workouts`,
  `checkins`, `settings`. `repositories.ts` exports 5 repos / 23 methods,
  none activity-related. **You were right.**
- **A day already holds more than one prescribed thing.**
  `ActivityTemplate.items` is an array (`types.ts:124`) and the shipped
  seed puts five items on one day (`seed/program.ts:273-282`). Probed
  end-to-end: a Tuesday carrying both a structured cycling item and the
  guided stretch imports and resolves today, unchanged.
- **A training day cannot carry an activity, in three independent
  places** — each made to fire, not inferred:
  1. `programImport.ts:256-269` rejects it →
     `{"key":"plan:import.weekdayIsTrainingDay",…}`
  2. `schedule.ts:138` returns `activity: null` on a training day even
     with the data present
  3. `DayPlan`'s `training` variant has no `activity` member at all
     (`schedule.ts:6`; measured `'activity' in plan === false`)

  This is why ruling 3 needs new structure and not a relaxed rule.

---

## 3. The PWA reality — Apple Watch data is unreachable

**You asked for judgement rather than an assumption. The honest answer
is: manual entry or nothing, with one exception.**

**Verified stack:** `vite-plugin-pwa` (`vite.config.ts:4,12`), browser-
only. Dependencies are React, Dexie, i18next, Zod, motion, react-router
— **no Capacitor, no native shell, no Bluetooth, no health integration
anywhere in the repo** (grep for `HealthKit|bluetooth|capacitor` across
`src/`, `vite.config.ts`, `package.json` → zero hits).

**Platform facts** (stated as my knowledge, not as a repo measurement —
see §12):

- **HealthKit has no Web API.** It is an iOS/watchOS native framework.
  No browser exposes it; there is no permission prompt, no polyfill, no
  origin trial. A PWA cannot read it.
- **Apple Watch exports only into HealthKit.** Even a native iOS app
  needs a HealthKit entitlement. There is no Watch → PWA path.
- **Web Bluetooth** could in principle read a BLE chest strap (GATT Heart
  Rate Service `0x180D`), but **Safari/iOS does not implement it**, and
  on iOS every browser is WebKit. That route is closed on the owner's
  platform specifically.

**So, against the coach's completion list:**

| Field | Coach's status | Actually achievable |
|---|---|---|
| completed yes/no | required | **Yes** — one tap |
| **actual duration** | required | **Yes, app-measured.** The only automatable field. Precedent: the routine player already times holds (`routine.ts:109-115`, `RoutinePlayer.tsx`) |
| average heart rate | required | **Manual entry only** |
| average HR zone | required | **Manual only** (see the caution below) |
| calories | optional, "when available from Apple Watch" | **Unreachable.** Manual only |
| distance | optional, same | **Unreachable.** Manual only |
| average speed | optional, same | **Unreachable.** Manual only |
| cadence | optional, same | **Unreachable.** Manual only |

**The whole "when available from Apple Watch" set is unreachable except
by typing.** I recommend **not modelling those four at all** rather than
shipping fields nothing can fill — a dead optional field reads to every
future maintainer as a feature that exists.

**A caution on deriving zone from heart rate.** It is tempting to ask
only for average HR and derive the zone. That requires a max-HR value,
and the usual `220 − age` estimate is exactly the invented-precision
failure this repo has already paid for twice: the seeded `heightCm: 180`
that *"nothing displayed and nobody confirmed"* (`types.ts:254-266`) and
the defaulted `activityLevel` that *"shifted every maintenance figure by
~660 kcal/day"* (`types.ts:305-311`). It also runs into the project rule
*"Never fabricate scientific claims"*. **Ask for the zone directly**, or
derive only from an owner-supplied measured max HR.

**Design consequence, and it is the important one:** a required field
with no data source is a field the owner types after every ride, and if
the schema enforces it, the flow blocks when he doesn't. **Model average
HR and average zone as optional with absent-means-missing**, which is the
shipped pattern in this exact codebase (`types.ts:287-296`,
`profileConfirmedAt` at `types.ts:321-340` exists precisely so *"never
asked"* is representable). The **UI** asks; the **schema** does not
demand.

> **BACK TO THE COACH.** Average heart rate and average zone cannot be
> read from the watch and must be typed in after every ride. Is the
> prescription still adherence-judged on duration and zone if the zone is
> self-reported? And should a ride logged with **duration only** count as
> complete? I recommend yes — otherwise the most common case fails the
> model.

---

## 4. Three modalities — the directive, honoured

Ruling 5 is a directive and I am taking it literally at the layer where
it bites: **the domain model.**

| Modality | Prescription | Completion | Progression |
|---|---|---|---|
| **Strength Workout** | `ExercisePrescription` (ladder / rep-range) | `Workout` + `LoggedSet` | ladder & rep-range engines |
| **Cardio Activity** | `CardioPrescription` (§5.1) — duration + zone | `CardioSession` (§7.2) | **none in code** — the coach authors week to week |
| **Preparation Routine** | `ActivityTemplate` | completion flag only (§7.3) | **none, by ruling 4** |

**Nothing is shared between these.** No union member is added to
`ExercisePrescription`; nothing cardio-shaped enters
`domain/progression.ts`; no `CardioSession` reaches
`suggestLadderProgression`. This preserves the boundary `routine.ts:6-13`
already documents: *"every function in domain/progression.ts takes a
prescription plus logged sets… Nothing here can be fed to the progression
engine without someone first writing a conversion, which is a visible,
reviewable act."*

### 4.1 The one place I argue *against* separation, explicitly

**Storage.** I recommend **one** new Dexie table holding a discriminated
record, not two.

The coach's sentence is *"treat these as different training modalities
rather than trying to fit them into the same **workout model**"*. The
hazard it names is forcing a bike ride into sets/reps/weights — a
**model** concern, and §4 above refuses that absolutely. A shared table is
a storage detail invisible to the model: the domain types stay distinct,
the prescriptions stay distinct, the progression stays absent.

Measured cost of the second table: a new table is not one line. Every
table must be declared in `db.ts`, given a repo in `repositories.ts`,
**added to `FullDataExport` and `buildFullDataExport`
(`dataExport.ts:9-29`)**, loaded in `SettingsPage.tsx:32`'s
`exportAllData`, and covered in `dataExport.test.ts` — **~5 touchpoints
each, permanently, in the backup envelope of a local-first app whose
entire durability story is that export.** A second table buys no query
benefit: every reader (Today, Plan, weekly review) asks *"what happened
on this date"*, which is one scan.

**If the lead or owner disagrees, two tables is a small and safe change
— but it should be a decision, not a drift.**

---

## 5. Prescription shapes

### 5.1 Cardio

```ts
/** Zone 3 is admitted but nothing prescribes it yet (coach ruling 1). */
export type HeartRateZone = 1 | 2 | 3

export interface CardioPrescription {
  /** Closed set of one today; extending it is an additive enum widening. */
  activityType: 'indoor-cycling'
  /** Always a range. min === max renders as a single number. */
  minutes: { min: number; max: number }
  zone: HeartRateZone
  warmupMinutes?: number
  cooldownMinutes?: number
}
```

- **`minutes` is always a range**, following the shipped `RepRange`
  precedent (`types.ts:44-47`, used as `range: RepRange` on every
  rep-range prescription). The renderer collapses `min === max` to
  `"40 min"` and otherwise emits `"35–40 min"`.
  - *Rejected — `number | {min,max}` union.* Awkward in Zod, awkward at
    every render site, and buys nothing: `{min:40,max:40}` is unambiguous.
  - *Rejected — `minMinutes` + optional `maxMinutes`.* "Absent means
    exact" is a defaulting semantic, and this codebase has been burned
    twice by absent-means-something (`types.ts:254-266, 305-311`).
- **No cadence, resistance, distance, calorie or RPE field**, per ruling
  1. Recording the coach's reasoning in the type's docblock is worth
  doing: *"Those are outcomes, not prescriptions"* is exactly the kind of
  rationale that stops a well-meaning field addition later.
- **`HeartRateZone` is `1|2|3` exactly as ruled.** Widening to `4|5` later
  is one additive line in the type and one in the Zod enum.

### 5.2 Preparation / Morning Activation

Ruling 4 makes this the lightest thing in the system: *"No timing. No
scoring. No progression."* It needs **no new prescription type at all** —
`ActivityTemplate` already is a titled list of items, which is exactly
what a short preparation routine is.

```ts
interface Program {
  /** Day-scoped: precedes the session, the activity, or nothing. */
  morningActivation?: ActivityTemplate
}
```

A guided routine for it *"may come later and is not required for
Mesocycle 2"* — and `routineId` on its items is the existing, shipped
door to that (`types.ts:106-117`), needing no change now.

---

## 6. Where each attaches, and the ordering question

### 6.1 Cardio is a parallel weekday map — **not** an `ActivityTemplate`

```ts
interface Program {
  /** Independent of the strength session (coach ruling 3) and of
   *  weekdayActivities. Calendar-fixed, like recovery days. */
  weekdayCardio?: Partial<Record<IsoWeekday, CardioPrescription>>
}
```

**This sidesteps the training-day rejection entirely rather than relaxing
it.** `programImport.ts:256-269` guards `weekdayActivities`; a new field
is not subject to it, so **the overlap rule, its 3 locale strings
(`{en,fr,zh-CN}/plan.json` `weekdayIsTrainingDay`) and its 2 tests
(`programImport.test.ts:481`, `programImportSources.test.ts:137`) are
untouched.** That rule is still correct for what it guards: two
*activities* competing for one day.

- **Rejected — relax the overlap rule and carry cardio in
  `weekdayActivities`.** Costs `programImport.ts:256-269`,
  `schedule.ts:6,41,138`, 2 tests and 3 locale strings, **and** it would
  force `CardioPrescription` to masquerade as an `ActivityTemplate`,
  which is precisely the modality-collapsing ruling 5 forbids.
- **Rejected — `SessionTemplate.finisher`** (my v1 design). Overturned by
  ruling 3; see §2.1.
- **Rejected — `Record<weekday, ActivityTemplate[]>`.** A breaking shape
  change to a field that is persisted *and* exported
  (`programExport.test.ts:113-134`), needing a real data migration, to
  buy ordering nobody needs (§6.3).

### 6.2 What `resolveDayPlan` must now return

This is the one unavoidable change in `src/domain/schedule.ts`. Today
`DayPlan`'s `training` variant carries only a session
(`schedule.ts:6`), so a training day structurally cannot report a ride.

```ts
export type DayPlan =
  | { kind: 'upcoming'; …; cardio: CardioPrescription | null }
  | { kind: 'training'; session: SessionTemplate; cardio: CardioPrescription | null }
  | { kind: 'rest'; …; activity: ActivityTemplate | null; cardio: CardioPrescription | null }
  | { kind: 'ended' }
```

plus `ScheduleDay.cardio` (`schedule.ts:53-71`) so the Plan page and its
projection see it too. Both are read as
`program.weekdayCardio?.[isoWeekday(date)] ?? null` — **no
`completedCount` term**, which keeps `MissedDayDeferral.md`'s invariant 2
(recovery rhythm is immune to completion history) true for cardio as
well. That is worth an explicit test (§10).

### 6.3 Ordering — still **no** time-of-day field

The coach's own Today sketch settles it:

```
Today's Training
  ✓ Strength Workout
  ○ Zone 2 Ride
```

The order is **static**: Activation → Strength → Ride. A
`timeOfDay: 'morning' | 'evening'` enum earns its place only if content
must be **sorted at runtime**, and with three fixed slots there is
nothing to sort. Order is carried by render position, which is already
how every Today surface composes (`TodayPage.tsx:307-343`). A field would
persist, export, validate and translate a fact the layout already states
and nothing reads.

**Prefer the smaller model — and it does not fail here.** Activation is
day-scoped and the ride is day-scoped; they differ in *what they are*,
which is already encoded by living in different fields, not in a shared
slot enum.

### 6.4 The Today composition question

The grouped view is a **render** over what `resolveDayPlan` already
returns; it needs no extra state. The one product judgement inside it:

**An unticked circle next to a completed tick is the closest this app has
ever come to a checkbox**, and `docs/DailyProgram.md:47-51` calls a
checkbox on a walk *"a streak mechanic in disguise"*. The coach has
authorised completion for cardio, so the tick is sanctioned — but the
**empty** state must not read as a reproach. Concretely: no red, no
count, no "1 of 2", no streak, and the ride's row stays a plain
affordance when undone. `TodayPage.tsx:611-615` and
`ActivityItemList.tsx:14-23` are the shipped tone to match — *"the
absence of an affordance reads as normal rather than broken."*

---

## 7. Completion storage — measured

Ruling 2 retires "do nothing". The remaining question is *where*.

### 7.1 The measurement

| Option | New tables | Existing call sites touched | Backup-envelope touchpoints | Can go stale |
|---|---|---|---|---|
| One `activityLogs` table, discriminated | 1 | **0** | 5 (`db.ts`, `repositories.ts`, `dataExport.ts:9,20`, `SettingsPage.tsx:32`, `dataExport.test.ts`) | no |
| Two tables (`cardioSessions` + `routineCompletions`) | 2 | **0** | ~9 | no |
| Field on `Workout` | 0 | 0 | 0 | no — **but cannot represent a rest-day ride** (no `Workout` exists on a rest day), so it fails ruling 3's independence outright |
| Activation flag on `CheckIn` | 0 | 0 | 0 | no |

**Zero existing call sites are touched by any option** — no completion
count, no plan pointer, nothing in the 12 `completedAt` read sites
(`MissedDayDeferral.md:137-140`) learns that cardio exists. That is the
same property that made `abandonedAt` cheap, and it holds here.

### 7.2 Cardio → one new table

```ts
export interface CardioSession {
  id: string
  /** ISO date the ride belongs to. */
  date: string
  programId: string
  activityType: 'indoor-cycling'
  /** Snapshot of the prescription, so history survives program edits —
   *  the same discipline as WorkoutExercise.prescription (types.ts:181). */
  prescription: CardioPrescription
  actualMinutes: number
  /** Manual entry only — no watch can supply it (§3). Absent = not given. */
  avgHeartRate?: number | null
  avgZone?: HeartRateZone | null
  completedAt: string
}
```

**A record exists only if the ride happened.** Absence means not done —
nothing stores a negative judgement, and there is no "skipped" row to
render or count. That is the cheapest possible reading of *"skipping is
always fine"* while still satisfying ruling 2.
- *Rejected — rows with `completed: false`.* Manufactures a persistent
  record of a non-event, which is the streak mechanic wearing a schema.

### 7.3 Activation → a flag on `CheckIn`, not a table

Ruling 4 gives this record **no payload, ever**: no timing, no scoring,
no progression. That is not a ledger entry; it is a property of the day.

```ts
interface CheckIn {
  /** ISO timestamp the morning activation was marked done. Absent = not
   *  done; never backfilled. */
  morningActivationAt?: string | null
}
```

**The precedent is shipped and exact:** an activity surface already
writes into `CheckIn`. `TodayPage.tsx:384-386` renders `MeasurementCard`
on a `kind === 'checkpoint'` activity day, and it writes
`CheckIn.weightKg`/`waistCm` through `checkinRepo.mergeByDate`
(`MeasurementCard.tsx:74-75`). `mergeByDate` (`repositories.ts:159-178`)
is already a transactional read-modify-write built for exactly the
double-write race this would otherwise reintroduce.

- *Rejected — a `routineCompletions` table.* A two-column table plus a
  repo plus four backup touchpoints, to store one boolean per day that a
  per-day record already exists for. It also collides head-on with §8.
- *Accepted risk:* `CheckIn` becomes slightly less purely "how I feel".
  The checkpoint precedent already crossed that line, and crossing it
  once more is cheaper than a table.

---

## 8. The guard collision — **this will stop the dev on day one**

`src/features/recovery/routineNoTracking.write.test.tsx:82-87` asserts,
as a hard global property:

```ts
it('adds no storage at all — no table exists for routine data', () => {
  expect(db.tables.length).toBe(5)
  …expect(table.name).not.toMatch(/routine|completion/i)
})
```

**Adding any table breaks this test. Naming one `routineCompletions`
breaks it twice.** It is not a vacuous guard — it carries its own
negative control at `:117` (*"detects a write — the snapshot is not
vacuously equal"*) and a sibling import-graph guard
(`routineNoTracking.guard.test.ts`).

**And the ruling behind it is not one the coach overrode.**
`docs/RecoveryRoutines.md:30-35` is about the **guided stretch routine**:
*"The routine guides and ends; nothing is written… it is the ruling most
likely to be eroded later by a well-meaning 'wouldn't it be nice to see
consistency'. It would not be nice."* The coach's ruling 4 is about
**Morning Activation**, explicitly *"not a workout, not a stretch
sequence"*. **These are different objects.** The stretch routine's
no-tracking ruling survives untouched, and §7.3 deliberately does not
write anything when a routine is played.

What must happen:

- The guard's **intent** — playing a guided stretch routine writes
  nothing — stays, and the byte-identical snapshot test at `:97` is the
  real guard and must not be weakened.
- Its **implementation** is over-broad: it asserts a global property
  (`db.tables.length === 5`) to protect a local one. The table count must
  be replaced with an assertion scoped to what it means.
- **This is a weakening of the guard the owner named as most likely to
  erode, so it must not be done quietly mid-edit.** It needs the lead's
  explicit sign-off, and **QA — not the dev who changes it — re-runs the
  negative control afterwards** (`.claude/rules/verification.md`: where a
  wrong all-clear would be silent, the control belongs to a different
  role than the author).

> **OPEN — OWNER.** Does completion tracking extend to the **guided
> stretch routine**, or only to cardio and morning activation?
> **Recommendation: only cardio and activation.** Nothing the coach said
> touches the stretch player, and `RecoveryRoutines.md` ruling 1 predicted
> this exact erosion. §7.3 writes nothing on routine playback.

---

## 9. Migration cost, precisely

**Additive only. Nothing destructive. No owner approval needed for any
migration in this plan.**

| Change | Persisted | Indexed | Notes |
|---|---|---|---|
| `Program.weekdayCardio?` | yes (inside `Program`) | no | additive |
| `Program.morningActivation?` | yes | no | additive |
| `CheckIn.morningActivationAt?` | yes | no | additive, no backfill; absent = not done |
| `cardioSessions` / `activityLogs` table | yes | **`date`** | **a genuine index diff — a real `stores()` change, unlike v4/v5** |

### 9.1 Version allocation, and a stale doc

`db.ts:76-77` and `:96-97` both state the rule: *"the version schema
declares indexes, not fields"*. The three new **fields** need no bump on
their own. **The new table does** — it is the first real `stores()` diff
since v2.

Two things the dev must not guess:

- **`db.ts:99` reserves v6 for M11 (nutrition).** This work therefore
  takes **v7** unless the lead re-allocates. Per
  `MissedDayDeferral.md:169-171`, the dev **reads `db.ts` and takes the
  next free version rather than trusting a number written in a plan —
  including this one.**
- **`docs/Roadmap.md:319-320` is stale.** It says *"Dexie versions are
  allocated M10 → v4, M11 → v5"*; v5 was consumed by Phase 0
  (`db.ts:91-100`) and `db.ts:99` reassigns M11 to v6. `db.ts` is ground
  truth. One-line doc fix, filed separately.

### 9.2 The silent-strip trap — applies to **both** new `Program` fields

`programSchema` is **not** `.strict()` (`programImport.ts:141-166`;
`.strict()` appears only at `:78,97`), so an undeclared field is
**silently stripped on round-trip**, not rejected. This is exactly how
`routineId` once deleted every recovery link — documented at
`programImport.ts:115-122` and `docs/Roadmap.md:311-317`, with the export
round-trip as the only symptom.

**`weekdayCardio` and `morningActivation` must be declared in
`programSchema`, and the Markdown parser extended, in the same change.**
Note `parseActivityItem` (`programMarkdown.ts:283`) returns
`{label, detail?}` and therefore **already drops `routineId` today** —
the same hole will swallow a new field authored in Markdown.

---

## 10. i18n

### 10.1 The fork that decides whether any locale work exists

`validateProgramImport` stamps `origin: 'imported'` **unconditionally**
(`programImport.ts:271-275`) and every seed hook short-circuits on it
(`seedProgram.ts:47,57,83,112,132`). So:

- **An imported Phase 2 renders verbatim, needs zero locale keys — and
  gets zero French or Chinese translation.** Its content displays in the
  coach's language in all three locales.
- **A seeded Phase 2 gets all three locales** — and needs the full key
  set plus a structural change to `seed/index.ts`, which upserts exactly
  **one** `seedProgram` (`seed/index.ts:21-24`; `seed/program.ts:73` is a
  single exported const).

> **OPEN — OWNER.** Import (fast, verbatim, untranslated) or seed
> (translated, slower, second seeded program)?
> **Recommendation: import for Monday.** Phase 1 was itself authored as
> `docs/programs/phase-1-home-v3.md` before becoming seed content, so
> this is the established path, and it is reversible — the seed-clobber
> guard (`seed/index.ts:20-24`) exists so an imported program is not
> overwritten later.

### 10.2 Keys needed

**The cardio prescription needs almost none, and that is a real
advantage of structuring it.** `minutes`, `zone`, `warmupMinutes`,
`cooldownMinutes` are **numbers**, not prose — they carry no locale key
at all and cannot drift between locales. Only the *frame* is translated:

```
common:cardio.zone            "Zone {{zone}}"
common:cardio.minutesRange    "{{min}}–{{max}} min"
common:cardio.minutesExact    "{{minutes}} min"
common:cardio.warmup / .cooldown
common:cardio.activityType.indoor-cycling
today:cardio.heading / .markDone / .logHeartRate …
```

Contrast the measured status quo, where every prescribed number is
duplicated three times as prose:

```
en "6,000–10,000 steps"  fr "6 000 à 10 000 pas"  zh "6000–10000 步"
en "8–10 min"            fr "8 à 10 minutes"      zh "8–10 分钟"
en "At least 7.5 hours"  fr "Au moins 7h30"       zh "至少 7.5 小时"
```

Note the third row: French renders 7.5 hours as **"7h30"**. Interpolated
numeric keys are right for cardio's simple `min`/`max`, but this is the
evidence that a *general* "structure all durations" push would produce
un-idiomatic French. Keep the structuring to the cardio prescription the
coach specified.

`morningActivation` is an `ActivityTemplate` and needs the shipped shape
(`seedProgram.ts:133-137`):

```
program.<programId>.morningActivation.title
program.<programId>.morningActivation.item.<index>.{label,detail}
```

**All keys land in en, fr and zh-CN in the same change** —
`localeParity.test.ts:55-57` asserts every locale has the same key
families as English across all 12 namespaces (`i18next.ts:10-23`). No new
namespace: these extend `common`, `today` and `seed`.

**Imported programs still render verbatim** — confirmed at
`seedProgram.ts:132` (`useLocalizedActivity` returns the stored object
unchanged when `origin === 'imported'`), covered by
`ActivityItemList.test.tsx:125-135` and
`TodayPage.activityLocale.test.tsx`. A new `useLocalizedActivation` hook
must reproduce that origin guard, or imported activation content gets
shadowed by seed translations — the exact bug the guard exists for.

### 10.3 A measured hole in the seed-field guard, and a free fix

`seedFieldAccess.guard.test.ts:49` lists
`LOCALIZED_FIELDS = {name, focus, title, cues, note, label}` — **`detail`
is not in it.**

Made to fail on purpose: injecting **both** a raw `activity.title` read
and a raw `activity.items[0].detail` read into `TodayPage.tsx` produced
exactly one finding —

```
+ "src/features/today/TodayPage.tsx:629  ActivityTemplate.title  →  activity.title"
```

The `.detail` read was **invisible to the guard**. Then measured the fix:
adding `'detail'` to `LOCALIZED_FIELDS` and re-running → **passes, zero
existing violations**. Closing the hole is a genuinely free one-line
change with no tail, and it should land **before** new content, not
after.

---

## 11. Phasing against the deadline

**Hard constraint: the spec arrives Sunday 9 August and must be live
Monday 10 August — effectively zero engineering time between them.** So
everything must be built **against the shape, before the content
exists**. That is possible: nothing in §5-§10 depends on what the coach
actually prescribes.

### Phase A — before the spec lands. **Deadline-critical. Prescription only, no completion.**

Independently shippable and suite-green.

1. Close the guard hole (§10.3) — one line, measured free. **First**, so
   the guard is watching before new content arrives.
2. `CardioPrescription` + `HeartRateZone` (§5.1); `Program.weekdayCardio?`
   and `Program.morningActivation?` (§6.1, §5.2).
3. Declare **both** in `programSchema` **and** extend
   `parseProgramMarkdown` in the same commit (§9.2).
4. `DayPlan.cardio` and `ScheduleDay.cardio` (§6.2).
5. Render: the grouped Today view (§6.3, §6.4) and the Plan day detail,
   **read-only** — no ticks yet.
6. Locale keys × 3 (§10.2).

**Sequencing constraints that are not obvious:** step 1 precedes 2-3;
step 3's two halves must travel in **one commit** (a schema that accepts
a field the parser cannot read is an internally inconsistent tree, and
`.claude/rules/release-choreography.md` makes every push a deploy); and
**no Dexie version is needed for Phase A at all** — every field is
non-indexed.

### Phase B — Sunday/Monday. Transcription. **Zero app changes.**

**The transcription path already exists and is already CI-guarded** —
the most useful finding here for the deadline.
`src/domain/phase2Program.test.ts` reads
`docs/programs/phase-2-gym.md`, runs it through the **real** parser and
the **real** validator against the **real** Library, and already asserts
`startDate === '2026-08-10'` and `seedProgram.endDate === '2026-08-09'`
(`phase2Program.test.ts:33-39`).

So: replace `phase-2-gym.md` with the Home Progressive file, retarget
`PHASE_2_PATH` (`phase2Program.test.ts:10`), and update the gym-specific
assertions (`:40-88` reference `barbell-squat`, `cable-row`,
`lat-pulldown` and assert `maxWeightKg === null` — all false for a home
phase; **they will fail loudly, which is correct**). The owner imports
from the Plan page.

### Phase C — after Monday. Completion.

The table + `CheckIn.morningActivationAt` (§7), the Dexie version (§9.1),
the guard renegotiation (§8), the mark-done and log-a-ride UI, and the
backup-envelope touchpoints. **Blocked on §8's owner sign-off.**

### Phase D — later, optional. The manual-entry form for average HR/zone,
once §3's question comes back from the coach.

### 11.1 If not all of it fits — the minimum viable Monday

**Phase A + B is roughly a day of work and can start immediately**,
because none of it depends on the spec's content. It fits.

**If Phase A slips, the MVM is Phase B alone:** the recovery-day ride and
the checkpoint ship with **zero code changes** through the existing
import path, expressed as ordinary `ActivityItem`s with the prescription
in `detail` ("35–40 min · Zone 2"). Already CI-guarded, already
translated-verbatim. What is lost, precisely:

- **Post-strength cycling cannot appear on a training day at all** — the
  three blockers in §2.2. There is **no honest zero-code workaround**;
  the nearest is putting it on the following day, which misstates when it
  happens. **State it as deferred rather than fake it.**
- **Morning Activation** is expressible on rest days only — the wrong
  half.
- Completion is not recorded anywhere (that is Phase C regardless).

That is a real but bounded degradation: the owner trains Monday against a
correct program, with two prescriptions rendering late until Phase A
lands.

### 11.2 Release choreography

Pushing to `main` deploys (`.claude/rules/release-choreography.md`).
Phase A's schema and parser changes travel in **one** commit; Phase B's
program file and its retargeted test travel together. Targeted `git add`
only; commits route through `git-op`. Note `a66ea5d` is **unpushed** and
ships with whatever goes next.

---

## 12. Test strategy

Every guard written, **broken on purpose, watched red, restored**. Where
a wrong all-clear would be silent, **QA runs the control, not the
author**.

- **Round-trip, both new `Program` fields.** Export → import → assert
  they survive. **Control: remove the field from `programSchema` and
  confirm it is silently stripped** — that failure must be seen once,
  because it is the shape that shipped as the `routineId` defect.
- **Markdown parity.** Cardio and activation authored in Markdown survive
  `parseProgramMarkdown` → `validateProgramImport`. Control: revert the
  parser → red.
- **Cardio is immune to completion history.** Sweep `completedCount` over
  `0, 1, 5, 100` on a training day and a rest day; assert the returned
  `cardio` is unchanged — mirroring the existing sweep at
  `schedule.test.ts:115-124` and preserving `MissedDayDeferral.md`'s
  invariant 2. Control: add a `completedCount` term → red.
- **A training day now reports a ride** — the direct regression for
  §2.2's three blockers, asserted on all three (`DayPlan`,
  `ScheduleDay`, and the import validator not rejecting).
- **The overlap rule still rejects two *activities* on one day.** The
  existing tests (`programImport.test.ts:481`,
  `programImportSources.test.ts:137`) must stay green — evidence that
  §6.1 sidestepped the rule rather than eroding it.
- **Imported-verbatim for activation**, in fr and zh-CN, mirroring
  `ActivityItemList.test.tsx:104-135`.
- **Locale parity** is already a test and fails on its own.
- **The guard fix (§10.3)** — already seen red and green here; re-run in
  the suite.
- **Phase C only:** the renegotiated `routineNoTracking` guard (§8), with
  the byte-identical snapshot preserved and **its negative control re-run
  by QA**.
- **`phase2Program.test.ts`** stays the safety net: hand-authored content
  fails the build, not a training session on the owner's phone.

---

## 13. What I could not verify

- **The coach's actual specification.** It does not exist yet. Every
  shape decision here is deliberately content-independent. Two remain
  contingent: whether **Morning Activation varies by weekday** (a
  one-line change from `ActivityTemplate` to
  `Partial<Record<IsoWeekday, ActivityTemplate>>`), and whether **more
  than one ride per day** is ever prescribed (the map holds one per
  weekday; a second would need an array). Both are cheap **after** Phase
  A; neither blocks it.
- **The platform claims in §3 are my knowledge, not a repo
  measurement.** I verified the *stack* (PWA, no native deps, no health
  or Bluetooth code). I could not verify HealthKit/Web-Bluetooth
  availability by running anything — no device, no browser. **If a
  native or Watch companion is ever on the table, §3's conclusion
  changes completely**, so treat it as "true for a PWA", not "true
  forever".
- **Whether the owner's install carries an `origin: 'imported'`
  program.** It lives in IndexedDB. `seedDatabase` will not overwrite one
  (`seed/index.ts:20-24`), so a seeded Phase 2 would not reach it.
  **Have QA check on device before choosing §10.1's route.**
- **Real-device behaviour.** Everything was derived by reading and by
  running the suite; I did not run the app.
- **Prose truth of the French and Chinese copy.** Key presence and parity
  verified; whether the sentences assert the same thing is a translation
  review.
- **Whether `docs/programs/phase-2-gym.md` should be deleted or kept.** A
  content decision, not mine.

---

## 14. Decisions outside my remit

- **COACH — §3, and I recommend asking before Sunday.** Average heart
  rate and average zone **cannot be read from an Apple Watch by a PWA**
  and must be typed after every ride. Is adherence still judged on
  duration and zone when the zone is self-reported, and does a
  duration-only ride count as complete? The four "when available from
  Apple Watch" fields are unreachable; I recommend not modelling them.
- **OWNER — §8.** Does completion tracking extend to the **guided stretch
  routine**, or only to cardio and activation? Recommendation: only
  cardio and activation; nothing the coach said touches the stretch
  player.
- **OWNER/LEAD — §8.** Sign-off to narrow
  `routineNoTracking.write.test.tsx:82-87` so a new table is possible at
  all. This is a deliberate weakening of a guard the owner flagged as
  most erosion-prone; QA re-runs the control.
- **OWNER — §10.1.** Import (verbatim, untranslated) or seed
  (translated)? Recommendation: import for Monday.
- **LEAD — §4.1.** One discriminated table or two. Recommendation: one.
- **LEAD — §9.1.** Dexie version: take v7, or re-allocate v6 from M11.
  Plus the stale `docs/Roadmap.md:319-320` line.
- **COACH — all content.** Sessions, days, durations, zones, activation
  contents, progression, checkpoint cadence, phase-transition behaviour.
  This plan builds the vehicle and states what shape it accepts.

---

## 15. Explicitly out of scope

The phase-boundary carry-forward, `carryPendingFrom`, and both
undecidable preconditions — retired by the ruling that Phase 2 is a newly
authored mesocycle. Not revisited.

`docs/design/MissedDayDeferral.md` keeps its within-phase deferral work
and **is not modified by this plan**. §6.2 depends on its invariant 2
(recovery rhythm immune to completion history) continuing to hold, and
extends the same property to cardio.
