import type { LadderPrescription, Program, RepRangePrescription, SetTarget } from '@/domain/types'

const defaults = {
  mode: 'reps' as const,
  perSide: false,
  role: 'main' as const,
}

function reps(
  exerciseId: string,
  sets: number,
  min: number,
  max: number,
  weights: { start: number | null; max: number | null; step: number | null },
  overrides: Partial<RepRangePrescription> = {},
): RepRangePrescription {
  return {
    ...defaults,
    exerciseId,
    sets,
    range: { min, max },
    restSeconds: 120,
    startWeightKg: weights.start,
    maxWeightKg: weights.max,
    weightStepKg: weights.step,
    ...overrides,
  }
}

function ladder(
  exerciseId: string,
  setPlan: SetTarget[],
  maxWeightKg: number | null,
  weightStepKg: number | null,
  overrides: Partial<LadderPrescription> = {},
): LadderPrescription {
  return {
    ...defaults,
    exerciseId,
    sets: setPlan.length,
    setPlan,
    maxWeightKg,
    weightStepKg,
    restSeconds: 120,
    ...overrides,
  }
}

const band = { start: null, max: null, step: null }
const bodyweight = band

/**
 * Adjustable-dumbbell weight increment used throughout. **The value is an
 * arithmetic step, and it happens to coincide with the new hardware's
 * uniform 2 kg spacing on all three verified ladders** (bilateral,
 * single-implement, barbell — `equipment.test.ts`'s `NEW_PROFILE`
 * assertions). Coincidence is not justification: `equipment.ts:3-10`'s
 * standing rule forbids treating a numeric gap as a step size, and the
 * list-based replacement remains owed. Also still consumed by
 * phase-1-home (13 sites below) — changing the number would silently
 * re-tune a retired program, so it stays 2 regardless of what the
 * equipment layer eventually replaces it with.
 */
const DUMBBELL_STEP_KG = 2
/** 15 kg/hand is the hard equipment ceiling for this phase (docs/programs/phase-1-home-v3-coach-spec.md). */
const DUMBBELL_MAX_KG = 15

/**
 * Mesocycle 2 Build ceilings, current hardware (12 Aug 2026 equipment
 * upgrade — `docs/EquipmentProfile.md`'s "Current hardware" section,
 * `equipment.test.ts`'s `NEW_PROFILE`). Two 2 kg adjustable handles
 * sharing one plate pool (8×1 kg, 4×2 kg, 4×5 kg): bilateral tops out at
 * 20 kg/hand, single-implement at 38 kg. Distinct from phase-1-home's
 * `DUMBBELL_MAX_KG` (15), which describes that phase's retired tier and
 * is left alone. Read live by `SetScreen`'s weight Stepper (`max` prop)
 * with no gate — a prescribed rung above the cap would silently clamp
 * the Stepper's typed/± input below the prescribed load; that is the
 * reason for these constants, not the (currently unreachable)
 * auto-progression path (`hasVerifiedLoadList` gates it closed — nothing
 * in `src/**` writes `settings.equipment`, D5).
 */
const BILATERAL_MAX_KG = 20
/** Single-implement ceiling, current hardware — `equipment.test.ts`'s `NEW_PROFILE.singleImplement` ends at 38. Used by every M2 prescription the coach marks "use one dumbbell". */
const SINGLE_IMPLEMENT_MAX_KG = 38
/**
 * Barbell ceiling, current hardware — the 7.75 kg bar draws the same
 * plate pool the dumbbells do, symmetric-loaded (`equipment.ts`'s
 * `barbell` list, D1). 19 rungs, 7.75 (bare bar) to 43.75 (whole pool),
 * uniform 2 kg step. **Barbell weight is the total load including the
 * bar** — a different convention from the per-dumbbell weights
 * everywhere else in this file (`.claude/rules/program-content.md`,
 * Amendment A.2). The buildability guard routes every barbell exercise
 * id to this ladder, not the dumbbell ones, so a per-side transcription
 * slip fails the suite instead of shipping quietly.
 */
const BARBELL_MAX_KG = 43.75

/**
 * Phase 1 — Home, 20 Jul to 9 Aug 2026 (docs/Training.md,
 * docs/programs/phase-1-home-v3-coach-spec.md — the coach's own program,
 * transcribed directly, not a laddered conversion of the earlier A/B
 * seed). Weekday-pinned: Mon Chest & Back, Wed Legs & Core — every
 * weekday always offers the same session identity. Dumbbell-only
 * equipment tier, 15 kg/hand ceiling; every compound is a three-set
 * ascending ladder, every isolation accessory a two-set rep-range.
 *
 * Final-weekend amendment (owner ruling, 7 Aug ~17:45, lead go-ahead
 * "Option A"): Friday no longer pins Shoulders & Arms — see the dated
 * comment beside `weekdaySessions` below for why, and for why this does
 * not reopen the 6 Aug "amendment A1" ruling (no Mesocycle 2 workout
 * before Monday 10 Aug): A1 protects M2 specifically, and Saturday's new
 * pin is phase-1-home's own Legs & Core, never an M2 session.
 */
export const seedProgram: Program = {
  id: 'phase-1-home',
  name: 'Phase 1 — Home',
  origin: 'seed',
  phase: 1,
  startDate: '2026-07-20',
  endDate: '2026-08-09',
  /*
    Final-weekend amendment (owner ruling, 7 Aug ~17:45; lead ruling
    "Option A", same day): the program's last two training days move from
    Mon/Wed/Fri to Mon/Wed/Sat.
      - Friday (5) drops its pin and its trainingWeekdays membership —
        it becomes recovery-only. Its existing weekdayActivities[5]
        content (40-min Zone 2 ride, recovery-day stretching) is
        untouched; only the session pin is removed. `sessionForDay`
        (src/domain/schedule.ts:220-236) throws if a training weekday has
        no pinned session, so the trainingWeekdays edit below and this
        one are one atomic change, never split across commits — proved by
        running resolveDayPlan against a pin-removed-only variant, which
        throws for 2026-08-07.
      - Saturday (6) newly pins Legs & Core — the same session already
        pinned on Wednesday. Verified against sessionForDay that the
        weekday-pinned resolution path has no per-session uniqueness
        assumption: it looks up weekdaySessions by weekday key alone, so
        one session id pinned to two weekdays is safe. Saturday's
        existing weekdayActivities[6] ride content is untouched; the pin
        is what turns it into a real training day with a start button,
        not a cosmetic label.
      - This makes Saturday resolve as `kind: 'training'` in
        resolveDayPlan/projectSchedule — before the successor-preview
        lookahead (`~/.claude/plans/final-rest-day-lookahead.md`) that
        the 6 Aug "amendment A1" ruling put in place. That ruling's own
        invariant — no Mesocycle 2 workout can be started or stored
        before Monday 10 Aug — is untouched, because Saturday's start
        button starts phase-1-home's own legs-core session, never an M2
        one; A1 and this change govern different programs. The one
        actual loss is Saturday's Mesocycle-2 preview card (Sunday keeps
        it) — a stated, accepted consequence, not a silent one
        (src/features/today/TodayPage.phaseBoundary.test.tsx re-anchors
        both days to match).
  */
  trainingWeekdays: [1, 3, 6],
  schedulingMode: 'weekday-pinned',
  weekdaySessions: { 1: 'chest-back', 3: 'legs-core', 6: 'legs-core' },
  // Inert in weekday-pinned mode (sessionForDay never consults it) — kept
  // populated and internally consistent (every id resolves) rather than
  // an empty/placeholder array, since `rotation` is still a required field.
  rotation: ['chest-back', 'legs-core', 'shoulders-arms'],
  sessions: [
    {
      id: 'chest-back',
      name: 'Chest & Back',
      focus: 'Push & pull foundation',
      items: [
        ladder(
          'incline-dumbbell-press',
          [
            { weightKg: 12, reps: 12 },
            { weightKg: 14, reps: 10 },
            { weightKg: 15, reps: 8 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { note: 'Tempo 3-1-1' },
        ),
        ladder(
          'dumbbell-bench-press',
          [
            { weightKg: 10, reps: 12 },
            { weightKg: 12, reps: 10 },
            { weightKg: 15, reps: 8 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { note: 'Tempo 3-1-1' },
        ),
        ladder(
          'single-arm-db-row',
          [
            { weightKg: 12, reps: 12 },
            { weightKg: 14, reps: 10 },
            { weightKg: 15, reps: 8 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { perSide: true, restSeconds: 90, note: 'Tempo 2-1-2' },
        ),
        reps('rear-delt-fly', 2, 12, 15, { start: 5, max: DUMBBELL_MAX_KG, step: DUMBBELL_STEP_KG }, {
          restSeconds: 60,
          role: 'accessory',
          note: 'Controlled tempo',
        }),
        reps('dead-bug', 2, 10, 10, bodyweight, {
          perSide: true,
          restSeconds: 45,
          role: 'accessory',
          note: 'Controlled tempo',
        }),
      ],
    },
    {
      id: 'legs-core',
      name: 'Legs & Core',
      focus: 'Squat, hinge & core',
      items: [
        ladder(
          'goblet-squat',
          [
            { weightKg: 10, reps: 12 },
            { weightKg: 12, reps: 10 },
            { weightKg: 15, reps: 8 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { note: 'Tempo 3-1-1' },
        ),
        ladder(
          'bulgarian-split-squat',
          [
            { weightKg: 8, reps: 12 },
            { weightKg: 10, reps: 10 },
            { weightKg: 12, reps: 8 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { perSide: true, restSeconds: 90, note: 'Controlled tempo' },
        ),
        ladder(
          'dumbbell-rdl',
          [
            { weightKg: 12, reps: 12 },
            { weightKg: 14, reps: 10 },
            { weightKg: 15, reps: 8 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { note: 'Tempo 3-1-2' },
        ),
        reps('single-leg-hip-thrust', 2, 12, 12, { start: 10, max: DUMBBELL_MAX_KG, step: DUMBBELL_STEP_KG }, {
          perSide: true,
          restSeconds: 60,
          role: 'accessory',
          note: 'Controlled tempo — keep the hips level, the free leg stays extended',
        }),
        reps('side-plank', 2, 30, 45, bodyweight, {
          mode: 'seconds',
          perSide: true,
          restSeconds: 45,
          role: 'accessory',
          note: 'Static hold',
        }),
      ],
    },
    {
      id: 'shoulders-arms',
      name: 'Shoulders & Arms',
      focus: 'Shoulders & arm strength',
      /*
        Recalibrated by the coach 31 Jul after the first completed session
        (docs/programs/phase-1-home-v3-shoulders-arms-revision.md) —
        finished comfortably with recovery to spare, so the prior loads were
        judged conservative. Every prescription in this session is now a
        ladder: the coach's stated rationale is a unified pyramid
        philosophy for loaded movements in Phase 1, where a rep-range
        exception on one session would reintroduce mixed progression models
        it is deliberately retiring here. This is a training-content
        ruling, recorded verbatim, not adapted.

        `overhead-triceps-extension` (item 5) is a three-rung ladder, unlike
        the other three accessories' two — the coach's own spec, not a
        difference invented here. Every ladder in this session eases on a
        low-readiness day (owner ruling moved the rung floor from two to
        one — docs/Training.md's readiness-easing note); this was
        previously the one exception, since a two-rung ladder used to sit
        exactly at the old floor.
      */
      items: [
        ladder(
          'dumbbell-shoulder-press',
          [
            { weightKg: 8, reps: 10 },
            { weightKg: 10, reps: 8 },
            { weightKg: 12, reps: 6 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
        ),
        ladder(
          'dumbbell-lateral-raise',
          [
            { weightKg: 6, reps: 15 },
            { weightKg: 8, reps: 12 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 60, role: 'accessory' },
        ),
        ladder(
          'rear-delt-fly',
          [
            { weightKg: 6, reps: 15 },
            { weightKg: 8, reps: 12 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 60, role: 'accessory' },
        ),
        ladder(
          'dumbbell-curl',
          [
            { weightKg: 8, reps: 15 },
            { weightKg: 10, reps: 12 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 60, role: 'accessory' },
        ),
        ladder(
          'overhead-triceps-extension',
          [
            { weightKg: 6, reps: 15 },
            { weightKg: 8, reps: 12 },
            { weightKg: 10, reps: 10 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 60, role: 'accessory' },
        ),
      ],
    },
  ],
  /*
    Rides and post-ride/recovery-day stretching, corrected 6 Aug — owner
    ruling (board, 20:41): the coach's cycling/stretching model applies to
    phase-1-home's last four days (7-9 Aug), but only where the owner
    actually asked for it. An earlier pass on this same day applied a
    day-type mapping (train Mon/Wed/Fri, recover Tue/Thu, optional Sat)
    across every remaining weekday, including 1-4 — which are this
    program's *past* days. That mapping was a stated assumption, never a
    coach or owner ruling, and it was withdrawn before Mon-Thu's dates
    arrived. It's gone from here; nothing in this file should ship a
    guess a program's own copy already disclosed as one.

    What's here instead is every number as the owner and coach actually
    gave it, each attributable:
      - Fri 7 Aug: 40 min Zone 2, recovery-shaped — the owner's own figure
        for tomorrow (board, 20:41), not the coach's 35 (spec L519) for a
        Build-program recovery day. Do not "correct" it to match.
      - Sat 8 Aug: legs-core strength, 20 min Zone 2 after lifting — coach
        spec L518's training-day shape, owner-selected duration/day
        (board, 20:52).
      - Sun 9 Aug: weekly checkpoint, 35 min Zone 2, recovery-shaped —
        coach spec L519, owner-selected (board, 20:52).
    Days 1-4 carry no ride: they are this program's past, and it ends
    Sunday 9 Aug — there are no further Mondays or Tuesdays left to ride
    on. Day 5 (Fri) and day 7 (Sun)'s items are edited/appended in place;
    day 6 (Sat)'s existing "choose one" items are untouched, only its ride
    item is replaced — useLocalizedActivity keys items by array index
    (i18n/seedProgram.ts), so every change here is either an in-place edit
    at an existing index or an append, never an insert at the front.

    Post-ride stretch is plain text, not a routineId — four of the
    coach's nine named §14 positions have no existing step id, and a step
    id is both a locale key and an art id (not this batch's scope).
    Saturday's is session-specific (legs-core: hip-flexor/hamstring/
    figure-four/calf, §14's per-session table) since its ride is
    training-shaped; Friday's and Sunday's are the recovery-day list
    (§14, same six positions already used for days 2/4) since both rides
    are recovery-shaped.

    English fallback text only, in en/fr/zh-CN alike (seed.json) — the
    coach spec's "Localization release ruling": ship with the approved
    English coaching text under every required locale key rather than
    hold for translation, reviewed fr/zh-CN to follow in Week 1.
  */
  weekdayActivities: {
    2: {
      kind: 'recovery',
      title: 'Recovery day',
      items: [
        { label: 'Walk', detail: '6,000–10,000 steps' },
        // Both stretch items open the same guided routine; the seed
        // literals here are the English fallback, the shipped copy is
        // locale-keyed (seed.json).
        { label: 'Guided Stretch', detail: '8–10 min', routineId: 'recovery-stretch-v1' },
        { label: 'Hydration', detail: 'Meet your daily goal' },
        { label: 'Protein', detail: 'Meet your daily target' },
        { label: 'Sleep', detail: 'At least 7.5 hours' },
      ],
    },
    4: {
      kind: 'recovery',
      title: 'Optional recovery',
      items: [
        { label: 'Mobility work' },
        { label: 'Stretching', routineId: 'recovery-stretch-v1' },
        { label: 'Foam rolling' },
        { label: 'Easy walking' },
      ],
    },
    5: {
      kind: 'recovery',
      title: 'Recovery day',
      items: [
        {
          label: 'Zone 2 ride',
          detail: '40 min (5 min easy warm-up, 5 min easy cool-down)',
          recordable: 'ride',
        },
        {
          label: 'Recovery-day stretching',
          detail:
            '10-15 min — hip flexor, hamstring, glute or figure-four, doorway chest, lat (using the bench), gentle thoracic rotation',
        },
      ],
    },
    6: {
      kind: 'optional',
      title: 'Optional activity',
      items: [
        { label: 'Choose one', detail: 'Walking, cycling, swimming, tennis, or mobility work' },
        { label: 'Complete rest is a fine choice too' },
        {
          label: 'Zone 2 ride',
          detail:
            '20 min, after lifting — 0-2 min easy transition before, up to 3 min easy spin after (about 25 min total)',
          recordable: 'ride',
        },
        {
          label: 'Post-ride stretch',
          detail:
            'Half-kneeling hip-flexor stretch, hamstring stretch, figure-four glute stretch, standing calf stretch — about 30-45 sec per position',
        },
      ],
    },
    7: {
      kind: 'checkpoint',
      title: 'Weekly checkpoint',
      items: [
        { label: 'Weigh in', detail: 'Same conditions each week — morning, before eating' },
        { label: 'Measure your waist', detail: 'Same spot, same conditions as last week' },
        { label: 'Prepare the coming week', detail: 'Confirm training times and any sport plans' },
        {
          label: 'Zone 2 ride',
          detail: '35 min (5 min easy warm-up, 5 min easy cool-down)',
          recordable: 'ride',
        },
        {
          label: 'Recovery-day stretching',
          detail:
            '10-15 min — hip flexor, hamstring, glute or figure-four, doorway chest, lat (using the bench), gentle thoracic rotation',
        },
      ],
    },
  },
}

/**
 * Mesocycle 2 — Build, 10 Aug to 13 Sep 2026
 * (Mesocycle-2-Home-Progressive-Coach-Spec-v2.7.md §3, §6-§8, §10).
 * Weeks 1-5 only — Week 6 (Deload) is a separate, later program per §3's
 * "Calendar and delivery ruling" and is deferred
 * (docs/design/Mesocycle2Implementation.md §11.2), not seeded here.
 *
 * **Restructured 13 Aug 2026** — Full Body Restructure (coach's
 * AUTHORITATIVE PROGRAM AMENDMENT, plus the Session C calf-raise ruling
 * and the six-question follow-up bundle, all archived
 * `~/.claude/agent-memory/program-spec-validator/spec-archive/*-2026-08-13.md`;
 * transcription plan `~/.claude/plans/m2-fullbody-restructure.md`). The
 * athlete reported excessive session fatigue after the old Session B
 * ("Legs & Core") accumulated RDL + Bulgarian split squat + hip thrust +
 * goblet squat + calf raise + a four-exercise Core block in one sitting.
 * The coach's fix distributes weekly volume rather than concentrating a
 * body region into one session: the old Chest & Back / Legs & Core /
 * Shoulders & Arms split is superseded prospectively by three full-body
 * sessions (Squat / Hinge / Hip-Extension+Shoulder emphasis), each
 * targeting ~6 primary movements with weekly, not per-session, coverage
 * of every body region. **Ids were renamed along with the content**
 * (`mesocycle2-chest-back` → `mesocycle2-fullbody-squat`, etc.,
 * likewise the three warm-up ids) — the old ids described a body-part
 * split that no longer exists, and would otherwise permanently
 * mis-describe the sessions they name. History is unaffected: the two
 * workouts already completed under the old structure (10/12 Aug) keep
 * their own logged sets, snapshotted at completion time
 * (`workout.ts`'s `createWorkout` docblock) — only their *session name*
 * display degrades to the generic `sessionFallback` label, since the old
 * ids no longer resolve. Removed movements (`bulgarian-split-squat`,
 * `dumbbell-rowboat`, `dumbbell-fly`; `dumbbell-curl` already out) keep
 * their Library entries and progression history — nothing is deleted
 * from `src/data/seed/exercises.ts`.
 *
 * Previous revision history (11/12 Aug 2026 equipment upgrade and
 * prescription revisions) is summarized rather than repeated — see git
 * history for the superseded docblock. New hardware — two 2 kg
 * adjustable handles sharing one plate pool (8×1 kg, 4×2 kg, 4×5 kg)
 * plus a 7.75 kg barbell drawing the same pool
 * (`docs/EquipmentProfile.md`, `.claude/rules/program-content.md`) —
 * still governs every ceiling below. `BILATERAL_MAX_KG` (20) /
 * `SINGLE_IMPLEMENT_MAX_KG` (38) / `BARBELL_MAX_KG` (43.75) /
 * `DUMBBELL_STEP_KG` (2) are unchanged by this restructure.
 *
 * **Barbell weights are total load including the bar, never per side**
 * — a different convention from every dumbbell prescription in this
 * file, which stays per-dumbbell (Amendment A.2,
 * `.claude/rules/program-content.md`). The buildability guard pins this
 * structurally: a barbell exercise id routes to `achievableLoads(...).barbell`
 * (a total-weight list), so a per-side transcription slip fails the
 * suite rather than shipping quietly.
 *
 * **Role (main/accessory) is unchanged by the 13 Aug restructure itself**
 * — moving and re-timing prescriptions does not reclassify them
 * (six-question bundle, Q5) — **but the same-evening Session C Shoulder
 * Press Amendment revises one membership**: `overhead-press` replaces
 * `dumbbell-shoulder-press` in the `main` slot it occupied ("a
 * REPLACEMENT, not an additional exercise" — role travels with the slot
 * on a replacement, shipped precedent `0dccd7d`'s `romanian-deadlift` for
 * `dumbbell-rdl`), even though the coach's own "primary … for Session C"
 * language about it is the identical block-qualified register that keeps
 * `barbell-hip-thrust` and `barbell-curl` accessory — the primacy-
 * language test was built for movements added to accessory slots, not
 * implement swaps in an existing main slot. The seven primaries remain
 * `ladder()`'s default `'main'`: incline-dumbbell-press,
 * dumbbell-bench-press, single-arm-db-row, bent-over-row,
 * bulgarian-split-squat (no longer seeded — the guard iterates present
 * items, so its continued Set membership is inert, not stale),
 * romanian-deadlift, overhead-press. `dumbbell-shoulder-press` keeps its
 * Library entry and history, and remains prescribed in phase-1-home — it
 * is a removal from this one session, not a retirement. Every other
 * movement across Sessions A-C is `role: 'accessory'`, including
 * `barbell-hip-thrust`, `goblet-squat` and `barbell-curl` — each of
 * these three, plus the coach's new "primary knee-dominant / squat-
 * pattern movement for Session A" language about goblet-squat, is
 * block-qualified "primary" prose that has never promoted a movement in
 * this program (same non-promotion as `dumbbell-rowboat` before it left
 * the program). **Role and progression policy are independent
 * dimensions** — the coach's own framing (Q5): LOAD-FIRST progression
 * does not imply `role: 'main'`, and technique-gated progression
 * (`dumbbell-lateral-raise`, `rear-delt-fly`) does not imply
 * `role: 'accessory'` either; the two must never be inferred from one
 * another — the LOAD-FIRST tag on `overhead-press` contributes nothing to
 * its role either, despite sitting right next to the role line. A
 * per-prescription progression-policy field is a named prerequisite for a
 * later feature (`~/.claude/plans/load-setup-ux.md` §0.1b) and is
 * deliberately not built here.
 *
 * **The `bent-over-row` rehearsal set is dropped** (six-question bundle,
 * Q3) — it was prescribed when bent-over-row opened its old session as
 * the first barbell movement; in the new Session A it is the third
 * exercise, reached only after squat rehearsal and two working
 * movements, so the athlete is already systemically warm and the
 * mandatory 13.75×6 no longer earns its place. **New rule**: a
 * ramp/rehearsal set is primarily attached to the *first* major
 * technical movement of a session, not automatically to every later
 * compound — which is exactly what every session's own warm-up ramp
 * already does (`warmups.conformance.test.ts`'s "every ramp targets the
 * session's first item"), so the rule now lives structurally in the
 * warm-up catalogue rather than as a second mechanism. The `rehearsal`
 * field, its import schema, its `SessionPreview` renderer and its locale
 * keys all stay — the coach's ruling is about *this* prescription, not
 * the concept, and removing the field would break the import round-trip
 * for any already-exported program that carries one. As of this
 * restructure, **no seeded prescription carries a `rehearsal`** — absent
 * is the norm, same as before 12 Aug.
 *
 * **`standing-calf-raise` moves to the single-implement ladder** (Session
 * C calf-raise ruling, 13 Aug: "Use one dumbbell") — `maxWeightKg` moves
 * from `BILATERAL_MAX_KG` to `SINGLE_IMPLEMENT_MAX_KG`, raising its
 * Stepper ceiling 20→38 kg; no other production code keys off the
 * classification (`SetScreen.tsx`'s `max` prop is the sole consumer).
 * It is Session C's optional seventh accessory — skipping it never
 * invalidates Day Completion (no `ExercisePrescription` field is
 * required, and no completion gate reads item count), and it is never
 * substituted with another lower-body movement when skipped.
 *
 * **Three rest values differ from the shipped 11/12 Aug seed**, per the
 * coach's explicit 19-row rest table in the six-question bundle (Q2):
 * `dumbbell-pullover` 75→90, `incline-push-up` 75→60,
 * `bicycle-crunch` 45→60. Every other rest value carries forward
 * unchanged. (Flagged to the coach as an FYI, not a blocker: the
 * ruling's own framing was "carry forward the existing values", but
 * these three are not the existing values — the plan follows the
 * explicit table, the more specific and later instruction.)
 *
 * **`incline-push-up` becomes a rep-range prescription** (3 × 10-15,
 * bodyweight) — the spec's own text ("3 working sets / 10-15 reps /
 * Bodyweight") is a rep-range verbatim, not a ladder. Uses the existing
 * `reps()` helper; no schema change (`RepRangePrescription` already
 * exists in `types.ts`).
 *
 * **The new Core-adjacent movements are distributed across the week
 * instead of concentrated in one session**: `plank` (Session A, timed
 * hold, `mode: 'seconds'`), `russian-twist` (Session B, single-implement,
 * total reps — one rotation to either side is one rep, never per-side)
 * and `bicycle-crunch` (Session C, reps rise across sets by coach
 * design, not a gap) — each retains the `load-not-the-lever` treatment
 * (`weightKg: null`) the old Core block already used.
 *
 * Session durations and bench angle have no field on `Program` or
 * `SessionTemplate` — noted here rather than invented into the schema,
 * per the owner's ruling. Rest values given as a range in the spec
 * ("45-60 sec", "after both sides") are recorded in each prescription's
 * own `note`, since `restSeconds` is a single number.
 */
export const mesocycle2Build: Program = {
  id: 'mesocycle-2-build',
  name: 'Mesocycle 2 — Build',
  origin: 'seed',
  phase: 2,
  startDate: '2026-08-10',
  endDate: '2026-09-06',
  trainingWeekdays: [1, 3, 5],
  schedulingMode: 'rotation',
  // Sequential: identity follows completed count, not the calendar
  // (coach ruling 7 Aug, reaffirmed 13 Aug six-question bundle Q4 —
  // Mon/Wed/Fri is the intended rhythm, A→B→C the ordered sequence; a
  // missed weekday never skips a session).
  rotation: ['mesocycle2-fullbody-squat', 'mesocycle2-fullbody-hinge', 'mesocycle2-fullbody-hipext-shoulder'],
  sessions: [
    // Session A - Full Body / Squat Emphasis (13 Aug restructure).
    {
      id: 'mesocycle2-fullbody-squat',
      name: 'Full Body A',
      focus: 'Squat Emphasis',
      // Six-question bundle Q1, 13 Aug 2026 — concrete ramp loads, not
      // deferred to Load Setup.
      warmupId: 'mesocycle2-fullbody-squat-warmup-v1',
      items: [
        // Primary knee-dominant / squat-pattern movement for Session A
        // (coach's own language) — block-qualified "primary" prose that
        // does not promote role, same treatment as barbell-hip-thrust and
        // barbell-curl (docblock above).
        ladder(
          'goblet-squat',
          [
            { weightKg: 14, reps: 12 },
            { weightKg: 16, reps: 10 },
            { weightKg: 18, reps: 8 },
          ],
          SINGLE_IMPLEMENT_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 90, role: 'accessory' },
        ),
        ladder(
          'incline-dumbbell-press',
          [
            { weightKg: 10, reps: 12 },
            { weightKg: 12, reps: 10 },
            { weightKg: 14, reps: 8 },
          ],
          BILATERAL_MAX_KG,
          DUMBBELL_STEP_KG,
        ),
        // Third exercise of the session, not the first barbell movement —
        // no rehearsal set (six-question bundle Q3, docblock above).
        ladder(
          'bent-over-row',
          [
            { weightKg: 17.75, reps: 12 },
            { weightKg: 21.75, reps: 10 },
            { weightKg: 25.75, reps: 8 },
          ],
          BARBELL_MAX_KG,
          DUMBBELL_STEP_KG,
        ),
        ladder(
          'dumbbell-lateral-raise',
          [
            { weightKg: 4, reps: 15 },
            { weightKg: 6, reps: 12 },
            { weightKg: 6, reps: 10 },
          ],
          BILATERAL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 60, role: 'accessory', note: 'Technique takes priority over load' },
        ),
        // Use one dumbbell, both hands — spec's single-implement
        // instruction.
        ladder(
          'overhead-triceps-extension',
          [
            { weightKg: 10, reps: 12 },
            { weightKg: 12, reps: 10 },
            { weightKg: 14, reps: 8 },
          ],
          SINGLE_IMPLEMENT_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 75, role: 'accessory', note: 'One dumbbell, both hands' },
        ),
        // Moved here from the old Core block (Session B → Session A) —
        // not per side, a front plank is one hold.
        ladder(
          'plank',
          [
            { weightKg: null, reps: 40 },
            { weightKg: null, reps: 50 },
            { weightKg: null, reps: 60 },
          ],
          null,
          null,
          { mode: 'seconds', restSeconds: 60, role: 'accessory', note: 'Rest 45-60 sec' },
        ),
      ],
    },
    // Session B - Full Body / Hinge Emphasis (13 Aug restructure).
    {
      id: 'mesocycle2-fullbody-hinge',
      name: 'Full Body B',
      focus: 'Hinge Emphasis',
      // Six-question bundle Q1, 13 Aug 2026 — "No change" from the 12 Aug
      // Session B Warm-up Amendment.
      warmupId: 'mesocycle2-fullbody-hinge-warmup-v1',
      items: [
        // Primary posterior-chain / hip-hinge movement of the week
        // (coach's own language) — opens the session unramped beyond the
        // two RDL ramps in its own warm-up.
        ladder(
          'romanian-deadlift',
          [
            { weightKg: 23.75, reps: 12 },
            { weightKg: 27.75, reps: 10 },
            { weightKg: 31.75, reps: 8 },
            { weightKg: 35.75, reps: 6 },
          ],
          BARBELL_MAX_KG,
          DUMBBELL_STEP_KG,
        ),
        ladder(
          'dumbbell-bench-press',
          [
            { weightKg: 10, reps: 12 },
            { weightKg: 12, reps: 10 },
            { weightKg: 14, reps: 8 },
          ],
          BILATERAL_MAX_KG,
          DUMBBELL_STEP_KG,
        ),
        // Use one dumbbell — spec's single-implement instruction.
        ladder(
          'single-arm-db-row',
          [
            { weightKg: 10, reps: 12 },
            { weightKg: 12, reps: 10 },
            { weightKg: 14, reps: 8 },
          ],
          SINGLE_IMPLEMENT_MAX_KG,
          DUMBBELL_STEP_KG,
          { perSide: true, restSeconds: 90, note: 'Rest after both sides' },
        ),
        ladder(
          'rear-delt-fly',
          [
            { weightKg: 4, reps: 15 },
            { weightKg: 6, reps: 12 },
            { weightKg: 6, reps: 10 },
          ],
          BILATERAL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 60, role: 'accessory' },
        ),
        ladder(
          'barbell-curl',
          [
            { weightKg: 15.75, reps: 12 },
            { weightKg: 17.75, reps: 10 },
            { weightKg: 19.75, reps: 8 },
          ],
          BARBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 75, role: 'accessory' },
        ),
        // One dumbbell, both hands, total reps — not per side (one
        // rotation to either side is one rep).
        ladder(
          'russian-twist',
          [
            { weightKg: 6, reps: 16 },
            { weightKg: 8, reps: 14 },
            { weightKg: 10, reps: 12 },
          ],
          SINGLE_IMPLEMENT_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 60, role: 'accessory', note: 'Total reps, not per side' },
        ),
      ],
    },
    // Session C - Full Body / Hip Extension + Shoulder Emphasis (13 Aug
    // restructure).
    {
      id: 'mesocycle2-fullbody-hipext-shoulder',
      name: 'Full Body C',
      focus: 'Hip Extension & Shoulder Emphasis',
      // Six-question bundle Q1, 13 Aug 2026 — concrete ramp loads, not
      // deferred to Load Setup.
      warmupId: 'mesocycle2-fullbody-hipext-shoulder-warmup-v1',
      items: [
        // Primary loaded hip-extension / glute movement, and the only
        // primary lower-body compound required in Session C (coach's own
        // language) — block-qualified "primary" prose that does not
        // promote role (docblock above).
        ladder(
          'barbell-hip-thrust',
          [
            { weightKg: 27.75, reps: 12 },
            { weightKg: 31.75, reps: 10 },
            { weightKg: 35.75, reps: 8 },
          ],
          BARBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 90, role: 'accessory' },
        ),
        // Session C Shoulder Press Amendment, 13 Aug 2026 evening —
        // replaces dumbbell-shoulder-press ("a REPLACEMENT, not an
        // additional exercise"; dumbbell-shoulder-press keeps its Library
        // entry and history, and stays prescribed in phase-1-home).
        // `role` omitted → ladder()'s default 'main': role travels with
        // the slot on a replacement (shipped precedent 0dccd7d, romanian-
        // deadlift for dumbbell-rdl), not from the coach's block-qualified
        // "primary … for Session C" language, which alone would read
        // accessory (same register as barbell-hip-thrust/barbell-curl).
        // The LOAD-FIRST tag contributes nothing to this either — Q5 rules
        // out inferring role from progression policy in either direction.
        ladder(
          'overhead-press',
          [
            { weightKg: 11.75, reps: 12 },
            { weightKg: 13.75, reps: 10 },
            { weightKg: 15.75, reps: 8 },
          ],
          BARBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 120, note: 'Strict press — no leg drive' },
        ),
        // Use one dumbbell, both hands — spec's single-implement
        // instruction. Reps/rest changed from the 12 Aug seed (was
        // 15/12/10, rest 75) — six-question bundle §3.2/§3.4.
        ladder(
          'dumbbell-pullover',
          [
            { weightKg: 10, reps: 12 },
            { weightKg: 12, reps: 10 },
            { weightKg: 14, reps: 8 },
          ],
          SINGLE_IMPLEMENT_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 90, role: 'accessory' },
        ),
        // Rep-range, not a ladder — the spec's own text ("3 working sets /
        // 10-15 reps / Bodyweight") is a rep-range verbatim. Rest changed
        // from the 12 Aug seed (was 75) — six-question bundle §3.4.
        reps('incline-push-up', 3, 10, 15, bodyweight, { restSeconds: 60, role: 'accessory' }),
        ladder(
          'hammer-curl',
          [
            { weightKg: 8, reps: 12 },
            { weightKg: 10, reps: 10 },
            { weightKg: 12, reps: 8 },
          ],
          BILATERAL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 75, role: 'accessory' },
        ),
        // Sixth accessory (Session C Shoulder Press Amendment, 13 Aug
        // evening — "Session C remains" 6. Standing Calf Raise / 7.
        // Bicycle Crunch, inverting the Calf-Raise Ruling from earlier the
        // same day; latest text wins, flagged to the coach as an FYI, not
        // a blocker). "Use one dumbbell" moves this to the single-
        // implement ladder (was BILATERAL_MAX_KG) — the buildability
        // guard is blind to the move at 12/14/16 kg, since those loads
        // sit on both lists; see mesocycle2Build.conformance.test.ts's
        // 22 kg negative control. Skipping never invalidates Session C
        // completion and is never replaced with another lower-body
        // movement — carried as this item's own note plus its three
        // locale keys, and nothing more (no completion gate reads item
        // count).
        ladder(
          'standing-calf-raise',
          [
            { weightKg: 12, reps: 20 },
            { weightKg: 14, reps: 15 },
            { weightKg: 16, reps: 12 },
          ],
          SINGLE_IMPLEMENT_MAX_KG,
          DUMBBELL_STEP_KG,
          {
            restSeconds: 60,
            role: 'accessory',
            note: 'Skipping never invalidates Session C — do not substitute another lower-body movement',
          },
        ),
        // Reps rise across sets by coach design, not a gap.
        // load-not-the-lever once complete. Rest changed from the 12 Aug
        // seed (was 45) — six-question bundle §3.4.
        ladder(
          'bicycle-crunch',
          [
            { weightKg: null, reps: 16 },
            { weightKg: null, reps: 20 },
            { weightKg: null, reps: 24 },
          ],
          null,
          null,
          { restSeconds: 60, role: 'accessory' },
        ),
      ],
    },
  ],
  /*
    Item 11 (display only) — spec §3, §12, §13, §14. Rewritten 11 Aug 2026
    for the Build Prescription Revision, superseding the 6 Aug v2.11
    content below this comment. `weekdayActivities` may claim a training
    weekday (docs/design/ActivityPrescriptionPhaseA.md §1) — a
    training-weekday entry renders as that day's post-strength cardio,
    display only, not a replacement for the session.

    **Weekdays 1/3/5 (training)** — the 20 min post-lift ride (§12,
    unchanged from 6 Aug) plus a second item, the session-specific
    cooldown/stretch sequence. **Rewritten 13 Aug 2026** for the Full Body
    Restructure — the coach's six-question bundle (Q6) replaces the old
    body-part-named stretch blocks wholesale ("Do NOT simply rename …
    while retaining them blindly"), so all three blocks below are new
    content, not renamed old ones. Plain text, no `routineId`: each new
    block contains at least one stretch with no routine step id yet
    (`lat stretch`, `cross-body shoulder stretch`, `overhead triceps
    stretch`) and `ActivityItem` carries one `routineId` per whole item,
    so no block maps cleanly onto a routine — the recovery-day catalogue
    (`routines.ts`'s `recovery-stretch-v1`) does carry step ids for some
    of the *other* named stretches (`wall-chest-stretch`,
    `standing-hamstring-stretch`, `standing-quadriceps-stretch`,
    `half-kneeling-hip-flexor-stretch`, `figure-four-glute-stretch`), but
    that is the eight-step recovery-day routine, a different item, never
    linked here. Label names the session (matching the coach's own
    "Full Body A/B/C — … Stretch" headers) rather than a shared generic
    label, precedent-style with phase-1-home's post-ride stretch item —
    one item, detail lists the full sequence. Coach ruling: "Do not turn
    post-workout stretching into another workout" — one round each, no
    progression, no logging.

    **Weekdays 2/4/6 (recovery)** — the coach's cardio structure is now
    exactly "3 × post-strength Zone 2 (20 min) + 1 × dedicated Zone 2
    (40-50 min)"; ordinary recovery days carry **no cycling**. The old
    35-min recovery-day ride (weekdays 2/4) and the old Saturday optional
    45-min ride (weekday 6, `kind: 'optional'`) are both retired — the
    coach was explicit that the Saturday ride must not survive "in any
    form, hidden or optional." All three weekdays now carry the coach's
    §9 walking/mobility/stretching/rest list verbatim (Option A, lead
    ruling 11 Aug: Saturday gets the same content as Tue/Thu rather than
    losing its Plan row entirely — `schedule.ts`'s `dates` set only
    includes a non-training weekday when `weekdayActivities` claims it,
    so deleting the key would drop Saturday from the Plan). `kind`
    becomes `'recovery'` on all three (was `'optional'` on 6).

    **Weekday 7 (Sunday)** — gains the coach's new dedicated 40-50 min
    Zone 2 ride (§10: "the week's primary dedicated aerobic-development
    session"), leading at item 0 ahead of the existing three checkpoint
    items (Option A, lead ruling: the ride is the headline session, so it
    should not bury under the weigh-in). Title renamed to name both. Kind
    stays `'checkpoint'`. Seeding this on the one weekly Sunday slot
    applies it to all four weeks in this program identically — flagged to
    the coach as a follow-up, not a blocker (validator finding, lead-
    accepted).
  */
  weekdayActivities: {
    1: {
      kind: 'recovery',
      title: 'Zone 2 ride',
      items: [
        {
          label: 'Zone 2 ride',
          detail:
            '20 min, after lifting — 0-2 min easy transition before, up to 3 min easy spin after (about 25 min total)',
          recordable: 'ride',
        },
        {
          label: 'Full Body A Stretching',
          detail:
            'Standing or assisted quad stretch, wall chest stretch, lat stretch — 30 sec/side, one round, about 3-4 min total',
        },
      ],
    },
    2: {
      kind: 'recovery',
      title: 'Recovery day',
      items: [
        { label: 'Normal walking' },
        { label: 'Light mobility' },
        // Points at the existing illustrated routine (routines.ts) — the
        // generic §9 prescription this item transcribes is exactly what
        // that routine now serves, unlike the session-specific stretch
        // lists elsewhere in this file (see those items' own comments).
        { label: 'Optional gentle stretching', routineId: 'recovery-stretch-v1' },
        { label: 'Complete rest is a fine choice too' },
      ],
    },
    3: {
      kind: 'recovery',
      title: 'Zone 2 ride',
      items: [
        {
          label: 'Zone 2 ride',
          detail:
            '20 min, after lifting — 0-2 min easy transition before, up to 3 min easy spin after (about 25 min total)',
          recordable: 'ride',
        },
        {
          label: 'Full Body B Stretching',
          detail:
            'Hamstring stretch, hip flexor stretch, cross-body shoulder stretch — 30 sec/side, one round, about 3-4 min total',
        },
      ],
    },
    4: {
      kind: 'recovery',
      title: 'Recovery day',
      items: [
        { label: 'Normal walking' },
        { label: 'Light mobility' },
        { label: 'Optional gentle stretching', routineId: 'recovery-stretch-v1' },
        { label: 'Complete rest is a fine choice too' },
      ],
    },
    5: {
      kind: 'recovery',
      title: 'Zone 2 ride',
      items: [
        {
          label: 'Zone 2 ride',
          detail:
            '20 min, after lifting — 0-2 min easy transition before, up to 3 min easy spin after (about 25 min total)',
          recordable: 'ride',
        },
        {
          label: 'Full Body C Stretching',
          detail:
            'Figure-four glute stretch, cross-body shoulder stretch, overhead triceps stretch — 30 sec/side, one round, about 3-4 min total',
        },
      ],
    },
    6: {
      kind: 'recovery',
      title: 'Recovery day',
      items: [
        { label: 'Normal walking' },
        { label: 'Light mobility' },
        { label: 'Optional gentle stretching', routineId: 'recovery-stretch-v1' },
        { label: 'Complete rest is a fine choice too' },
      ],
    },
    7: {
      kind: 'checkpoint',
      title: 'Dedicated ride & weekly checkpoint',
      items: [
        {
          label: 'Dedicated Zone 2 ride',
          detail:
            '40-50 min Zone 2 with an easy warm-up and cool-down — shorten to 30-40 min or skip it if fatigue is clearly elevated',
          recordable: 'ride',
        },
        { label: 'Weigh in', detail: 'Same conditions each week — morning, before eating' },
        { label: 'Measure your waist', detail: 'Same spot, same conditions as last week' },
        { label: 'Prepare the coming week', detail: 'Confirm training times and any sport plans' },
      ],
    },
  },
  // Owner ruling (11 Aug): morning activation moves from the six-item
  // mobility round to Apple Fitness+, with the owner choosing the
  // program themselves each day. `kind` stays 'mobility' and the
  // single-item shape is otherwise unchanged — `ActivationRecordControl`
  // (src/features/activity/ActivationRecordControl.tsx) is a bare
  // completion timestamp that never keys off item count.
  morningActivation: {
    kind: 'mobility',
    title: 'Morning Activation',
    items: [{ label: 'Apple Fitness+', detail: 'Choose your own program in the Apple Fitness+ app' }],
  },
}
