# Phase A delta — training-day cardio and Morning Activation

> **SHIPPED 6 Aug 2026** — `b460822` (structure), `6f5139c` (content),
> `8cb2f63` (correction), pushed. **This document contains a number
> that was wrong when the dev read it, and the cost is recorded here
> because the lesson outlived the defect.**
>
> - **Every "30 min Zone 2" in this plan is stale** (§2, §5, and the
>   `detail` string it specifies). Coach spec v2.11 reduced the
>   training-day ride to **20 min**. This document was not updated, the
>   dev seeded 30 min into three locales from it (`6f5139c`), and it
>   took a follow-up commit to correct (`8cb2f63`). The correction had
>   been made in conversation an hour earlier and lived only in a
>   message. **A correction that lives only in a message competes with
>   a document, and the document wins.** That is the second time in one
>   evening the same failure shipped.
> - **The v2.7 citations in §3 are stale**; the current spec is v2.15.
>   The rule they describe — never assume load increments, never
>   compute a next or previous load — is unchanged and still holds.
> - **The durations here apply to Mesocycle 2 only.** They were later
>   mapped onto `phase-1-home` by day type, which was a guess the lead
>   made and withdrew; the dev refused the instruction before it
>   shipped, and the owner then ruled the real values directly:
>   **Fri 7 Aug 40 min, Sat 8 Aug 20 min, Sun 9 Aug 35 min**
>   (`def02a1`). Nothing in this plan governs `phase-1-home`.

**A delta, not a re-plan.** Supersedes `ActivityPrescription.md` §5, §6 and
§7 for this phase only; everything else in that document stands.

**Scope:** display only. No records, no table, no schema version, no
repository, no Markdown parser work. Ships before **Monday 10 August**.

**Baseline:** committed tree at `eb861ed` — `npm test` → **79 files, 1019
tests, 0 failures**. (The working tree shows 1023: the dev holds 4 local
tests in `LibraryPage.test.tsx` and `setVariant.guard.test.ts`.) Every
number below was produced by patching a `git archive HEAD` copy under the
scratchpad, so the dev's in-flight work is excluded. **Nothing was written
to `src/**`.**

---

## 1. `weekdayCardio` is withdrawn. Reuse `weekdayActivities`.

**Asked directly: no, the parallel map is no longer the right shape.** It
was justified in `ActivityPrescription.md` §6.1 on two grounds, and the
owner's ruling removes both.

- *"Modality separation per coach ruling 5"* — that ruling is about the
  **domain model**. With records out of scope there is no domain model
  here, only display. A `CardioPrescription` type would be a model nothing
  consumes.
- *"It sidesteps the import overlap guard"* — that was a workaround for a
  guard we are now authorised to change. Sidestepping a rule we may
  legitimately amend is the worse of the two.

**The decisive argument is coherence, not cost.** The dev has already
shipped the ride as free text on Tuesday, Thursday and Saturday
(`seed/program.ts` `weekdayActivities`, e.g. *"Zone 2 ride — 35 min (5 min
easy warm-up, 5 min easy cool-down)"*). A structured `weekdayCardio` for
Monday/Wednesday/Friday would model **the same ride two different ways
depending on the weekday**. That is worse than either choice made
consistently.

### Why not put cardio on `DayPlan`'s training variant directly?

**That is not an alternative — it is the same thing one layer down.**
`DayPlan` is derived, not authored; the content has to come from a field on
`Program` either way. So the real question is *which* `Program` field, and
`weekdayActivities` already exists, is already exported, already localized,
already rendered by `ActivityItemList`, and already holds four days of
exactly this content. A second field would duplicate all five.

**Verified free:** the localization key space for training weekdays is
unused. `useLocalizedActivity` keys on
`program.<programId>.activity.<weekday>` (`seedProgram.ts:133`), and
`en/seed.json` under `program.mesocycle-2-build.activity` currently holds
exactly `['2','4','6','7']`. **Weekdays 1, 3 and 5 collide with nothing, so
the i18n path needs no code change at all — only new keys.**

### No structured prescription. Free text, deliberately.

v2.7 forbids assuming increments and forbids computing a next or previous
load. A `{minutes, zone}` model is the first step toward computing on it,
and nothing would read it. **`detail` carries "30 min Zone 2, after
lifting" today.** This is the *"true and thin"* option, chosen on purpose.

---

## 2. Morning Activation — one program-level field

§13 prescribes **the same six-item round on all three training days**. A
per-weekday map would triplicate six items and their locale keys three
times over.

```ts
interface Program {
  /** One preparation round, shown above the session on training days only. */
  morningActivation?: ActivityTemplate
}
```

- **Rejected — fold activation into `weekdayActivities[1|3|5]` alongside
  the ride.** One `ActivityTemplate` has one title and one flat item list,
  so the renderer **cannot** place activation above the session and the
  ride below it. §13 is morning preparation; rendering it beneath *"Start
  session"* instructs the athlete to prepare after training. That is the
  one place where the cheaper model is actually wrong, so it loses.
- **Rejected — a `timeOfDay` field.** Still unnecessary
  (`ActivityPrescription.md` §6.3): two fixed slots, static render order,
  nothing to sort at runtime.

**Cost of correctness here: one optional field, one extra `DayPlan`
member.**

---

## 3. The three blocking points — each cited by content

### 3.1 Import-time overlap guard

`src/domain/programImport.ts`, the `weekdayActivities` loop that returns
`plan:import.weekdayIsTrainingDay` (currently `:256-269`). **Delete the
block.** Measured error today:
`{"key":"plan:import.weekdayIsTrainingDay","params":{"weekdayKey":"plan:import.weekdayName.1"}}`

**Pinned by exactly 2 tests**, both of which must be rewritten:

| Test | Currently asserts | Should assert |
|---|---|---|
| `programImport.test.ts:481` *"rejects an activity claiming a training weekday, naming it"* | rejection | **accepts** an activity on a training weekday and round-trips it |
| `programImportSources.test.ts:137` *"an activity claiming a training weekday is rejected end to end, same as JSON"* | rejection via Markdown | **accepts** end to end, same as JSON |

Also clean up, in the same change: `plan:import.weekdayIsTrainingDay` in
`{en,fr,zh-CN}/plan.json`, and the rule as stated in
`docs/DailyProgram.md:32`. **No guard will catch a forgotten orphan key** —
`translationKeys.guard.test.ts` checks code→locale, and
`localeParity.test.ts` checks locale→locale; neither sweeps for dead keys.

### 3.2 The training branch returns no activity

`src/domain/schedule.ts`, `resolveDayPlan`'s training return (currently
`:41`) and `projectSchedule`'s activity line (currently `:138`).

```ts
// resolveDayPlan — training branch
return {
  kind: 'training',
  session: sessionForDay(program, date, completedCount),
  activity: program.weekdayActivities?.[isoWeekday(date)] ?? null,
  activation: program.morningActivation ?? null,
}

// projectSchedule — drop the isTrainingDay guard
const activity = program.weekdayActivities?.[weekday] ?? null
```

**The comment immediately above `:138` becomes false** and must be
rewritten, not left:

> *"Mutually exclusive with isTrainingDay by construction (import
> validation rejects a weekday claimed by both)."*

That is precisely the *"wrong comment is a guard against being checked"*
pattern `.claude/rules/verification.md` names.

### 3.3 `DayPlan`'s training variant

`src/domain/schedule.ts`, the `DayPlan` union (currently `:6`):

```ts
| { kind: 'training'; session: SessionTemplate
    activity: ActivityTemplate | null; activation: ActivityTemplate | null }
```

### 3.4 Measured cost of 3.1 + 3.2 + 3.3

Patched all three on the committed tree:

```
Test Files  2 failed | 77 passed (79)
Tests       2 failed | 1017 passed (1019)
npm run typecheck   →  clean
```

**Exactly the two import tests in §3.1. Nothing else moves.**

### 3.5 The test that is about to become wrong

`src/data/seed/mesocycle2Build.conformance.test.ts:373-383` —
*"weekdayActivities covers exactly the four non-training weekdays"*:

```ts
expect(activityWeekdays).toEqual([2, 4, 6, 7])
for (const weekday of mesocycle2Build.trainingWeekdays) {
  expect(mesocycle2Build.weekdayActivities?.[weekday], …).toBeUndefined()
}
```

**Important sequencing detail: it does *not* fail on the structural change.**
It passed in the measurement above, because the seed still holds only
`[2,4,6,7]`. **It fails on the *content* commit**, when the seed gains 1, 3
and 5. So it must be rewritten in the same commit that adds the content, or
that commit lands red.

**What it should assert instead** — the boundary has moved from "which
weekdays may carry an activity" to "every prescribed day carries what the
coach prescribed":

```ts
it('weekdayActivities covers every day the coach prescribes work on', () => {
  expect(activityWeekdays).toEqual([1, 2, 3, 4, 5, 6, 7])
})

it('every training day carries its own post-strength ride (§12)', () => {
  for (const weekday of mesocycle2Build.trainingWeekdays) {      // [1,3,5]
    const items = mesocycle2Build.weekdayActivities?.[weekday]?.items ?? []
    expect(items.some((i) => /Zone 2/.test(i.detail ?? ''))).toBe(true)
  }
})

it('Morning Activation is one round of six items (§13)', () => {
  expect(mesocycle2Build.morningActivation?.items).toHaveLength(6)
})
```

The docblock above it (`:365-372`) describes the gap as *"a stated gap, not
an oversight"* and must go with it.

**Also correct while there:** `seed/program.ts`'s comment (currently
`:624-631`) cites *"architecture.md, programImport.ts's overlap guard"*.
**`.claude/rules/architecture.md` does not carry that rule** — it mentions
activities only once, about locale-keying. By the verification rule's own
taxonomy that is a **defect**, not drift: a citation naming something that
does not exist. The rule actually lives in `docs/DailyProgram.md:32`,
`types.ts`'s `weekdayActivities` docblock, and the guard itself.

---

## 4. Render blast radius — measured, `file:line`

`resolveDayPlan` has **exactly one non-test consumer.**

| Site | Consumes | Change |
|---|---|---|
| `TodayPage.tsx:199` | `resolveDayPlan` | none |
| `TodayPage.tsx:225` | `plan.kind === 'training'` | **pass `plan.activation` and `plan.activity` into `TrainingDay`** |
| `TodayPage.tsx:245-252` | `plan.activity` (rest branch) | none |
| `TodayPage.tsx:616` `ActivityHero` | existing | reuse |
| `PlanPage.tsx:155-160,169` | `day.activity` via `useLocalizedActivity` | none |
| `PlanPage.tsx:190` `day.session` → `:205` `day.activity` | order | **safe — session already branches first** |
| `PlanDayPage.tsx:102` `day.activity` → `:112` `day.session` | order | **UNSAFE — must be reordered.** See §4.1 |
| `PlanDayPage.tsx:289` `ActivityDetail` | existing | reuse |
| `ActivityItemList.tsx:26` | items | none |
| `seedProgram.ts:125-152` `useLocalizedActivity` | weekday-keyed | none — keys 1/3/5 are free |

### 4.1 The one genuine regression, and the suite will not catch it

**`PlanDayPage.tsx:102` branches `if (day.activity)` *before* `:112`'s
`if (day.session)`.** Both branches rely on a mutual exclusivity that
`schedule.ts:138` guaranteed and this change removes. Once a training day
carries an activity, **the Plan day detail for Monday renders the ride
instead of Session A.**

It did not appear in §3.4's run because the state was previously
unrepresentable, so no test constructs it. **Move the `day.session` branch
above `day.activity`, and add the test named in §6.**

`PlanPage.tsx` is already in the correct order (`:190` before `:205`) —
verified, not assumed.

---

## 5. What Monday needs versus what is nice

### Needs (the coach prescribes it on each training day)

1. §3.1-§3.3 structural change — **3 files, ~15 lines, 2 test rewrites.**
2. §4.1 `PlanDayPage` reorder — **one branch move.**
3. Seed: `weekdayActivities[1|3|5]` each with one ride item (§12: Mon/Fri
   30 min; Wed 30 min, *"reduce to 20 min if the session is Yellow"*), and
   `morningActivation` with §13's six items.
4. Locale keys, all three locales: activation (title + 6 items) plus three
   weekday activities ≈ **~20 keys ≈ 60 strings**.
5. `TodayPage` render: activation above the hero, ride below the session
   preview.
6. §3.5 conformance rewrite.

**On the copy:** §13's items are mechanical and short (*"Cat-cow — 6
controlled reps"*), unlike the coaching cues that made
`Mesocycle2Implementation.md` §11.4 the translation risk. **This batch does
not carry that risk.**

### Nice, and explicitly not now

- Any structured cardio type (§1).
- A `routineId` for activation. §13's six items are not the shipped
  `recovery-stretch-v1` sequence, and the dev already refused to link a
  mismatched routine on the recovery days — **the same reasoning applies
  here and its judgement was right.** Authoring a real routine needs steps
  and art.
- The Yellow 20-minute ride variant (§12's Wednesday note) as *behaviour*.
  It ships as text inside the detail string; branching display on readiness
  is a model, not a display.
- `detail` is still absent from `LOCALIZED_FIELDS`
  (`seedFieldAccess.guard.test.ts:50`), so a raw `.detail` read in a
  feature is still invisible to that guard — measured previously as a free
  one-line fix with zero existing violations. Worth taking, not a blocker.

---

## 6. Test strategy

- **§3.1's two import tests rewritten to assert acceptance**, not deleted.
  Control: restore the guard block → both go red.
- **`resolveDayPlan` on a training day returns the weekday's activity and
  the activation.** Control: revert the training branch → red.
- **`projectSchedule` returns an activity for a training date.** Control:
  restore `isTrainingDay ? null` → red.
- **The §4.1 regression test, which does not exist today and is the one
  that matters:** *"a training day whose weekday carries an activity
  renders the session detail, not the activity detail."* **Write it first,
  watch it fail against the current branch order, then reorder.** This is
  the only guard here whose absence would ship a silently wrong screen.
- **§3.5's rewritten conformance assertions**, landing in the content
  commit.
- **Locale parity** fails on its own if any of the ~20 keys misses a
  locale.
- **Imported-verbatim** still holds: `useLocalizedActivity` short-circuits
  on `origin === 'imported'` (`seedProgram.ts:132`) and is unchanged.

---

## 7. Sequencing against the dev mid-batch

The dev currently holds uncommitted work in `LibraryPage.test.tsx` and a
new `src/domain/setVariant.guard.test.ts`, and the lead reports it is also
rewriting prescription notes and adding locale keys.

**Collision surfaces — do not run this delta concurrently with that batch:**

| File | Dev is touching | This delta touches |
|---|---|---|
| `src/data/seed/program.ts` | prescription `note` fields | `weekdayActivities` 1/3/5, `morningActivation` |
| `src/locales/{en,fr,zh-CN}/seed.json` | new keys | ~20 new keys |
| `src/locales/{en,fr,zh-CN}/common.json` | variant vocabulary | — |

`seed/program.ts` and the three `seed.json` files are **the same files in
both batches**. Per `.claude/rules/team-roles.md`, that is the failure mode
where one agent reads another's half-done work as truth.

**Safe to start immediately, in parallel with the dev** — no overlap:

- `src/domain/schedule.ts`, `src/domain/types.ts`,
  `src/domain/programImport.ts`
- `src/domain/programImport.test.ts`,
  `src/domain/programImportSources.test.ts`
- `src/features/plan/PlanDayPage.tsx` (the §4.1 reorder) and its test
- `src/locales/*/plan.json` (removing the orphaned key)

**Must wait for the dev's batch to land:** the seed content, the `seed.json`
keys, and `mesocycle2Build.conformance.test.ts`.

So: **§3.1-§3.3 + §4.1 form a first commit that can go now**; the content
commit follows the dev's. That split is also correct on release grounds —
the structural commit is behaviour-neutral until content exists, so a tree
carrying only it is internally consistent.

**One ordering constraint that is not obvious:** the conformance rewrite
(§3.5) must travel in the **content** commit, not the structural one. Put
it in the structural commit and it fails there, because the seed has not
changed yet.

---

## 8. Verdict: yes, it fits — with one condition

**The structural work is hours, not days**, and I have run it: 3 files,
~15 lines, **2 test failures, typecheck clean**. The render work is two
blocks reusing components that already exist. The content is short
mechanical copy, not coaching prose.

**The condition is sequencing, not effort.** Both batches write
`seed/program.ts` and all three `seed.json` files. If they run
concurrently, the likely outcome is not a merge conflict but one agent
committing over the other's half-finished locale block — and locale damage
is quiet, because parity only compares the three files against each other.

**Recommended:** dispatch §7's parallel-safe set to the dev now as a first
commit; land the content commit after its current batch. Four days is
comfortable for that ordering, and there is no path where this slips to
Sunday unless the two batches are run at the same time.

**One risk worth stating plainly:** §4.1 is a real regression that ships
silently if the branch order is not fixed. It is one line to move and one
test to write, but nothing currently in the suite would tell you.

---

## 9. What I could not verify

- **Real-device rendering** of a training day carrying activation, session
  and ride together. Derived by reading; I did not run the app. The
  vertical density of that screen is a UX judgement worth a device pass.
- **Whether §12's Wednesday "reduce to 20 min if Yellow" reads correctly as
  static text** next to an eased session. It is honest but not adaptive.
- **The owner's install contents** — unchanged from
  `Mesocycle2Implementation.md` §13.
- **Whether `docs/DailyProgram.md`'s rejected-decisions section should
  record this reversal.** That file states the overlap rule as a design
  decision; amending it is the lead's call, not mine.
