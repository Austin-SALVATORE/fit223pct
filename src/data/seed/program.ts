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
 * Adjustable-dumbbell weight increment used throughout — the coach spec
 * (docs/programs/phase-1-home-v3-coach-spec.md) prescribes starting/target
 * loads but doesn't name a between-session step size; 2 kg/hand matches the
 * spacing the spec's own rungs already use and is a conservative default
 * for this equipment tier (docs/PyramidProgression.md: "conservative
 * weightStepKg values are the safety margin RIR used to provide").
 */
const DUMBBELL_STEP_KG = 2
/** 15 kg/hand is the hard equipment ceiling for this phase (docs/programs/phase-1-home-v3-coach-spec.md). */
const DUMBBELL_MAX_KG = 15

/**
 * Mesocycle 2 Build revision (11 Aug 2026) ceilings. The owner's verified
 * matched-pair ceiling — `equipment.test.ts:44-46`'s bilateral list ends
 * at 15.2. Distinct from phase-1-home's `DUMBBELL_MAX_KG` (15), which
 * describes that phase's declared tier and is left alone. Read live by
 * SetScreen's weight Stepper (`max` prop) with no gate — the transcribed
 * revision puts eight rungs at 15.2 kg, above the old 15 kg cap, which
 * would silently clamp the Stepper's typed/± input below the prescribed
 * load; that's the reason for this constant, not the (currently
 * unreachable) auto-progression path. Read by suggestLadderProgression
 * only once an equipment profile is confirmed, which nothing currently
 * writes (workout.ts:286).
 */
const BILATERAL_MAX_KG = 15.2
/** Single-implement ceiling — `equipment.test.ts:50-53`'s list ends at 20.2. Used only by the four M2 prescriptions the coach marks "use one dumbbell" (dumbbell-pullover, single-arm-db-row, goblet-squat in Session B, overhead-triceps-extension). */
const SINGLE_IMPLEMENT_MAX_KG = 20.2

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
 * **Revised 11 Aug 2026** (Mesocycle 2 Build Prescription Revision,
 * coach spec, plus the "Six Validation Rulings" document answering the
 * validator's residuals) — Sessions A-C's `items` below are the
 * revision's Week 1 opening prescriptions, transcribed directly per the
 * spec's own "Opening-weight handoff": Fit223 seeds the exact Week 1
 * Pyramid levels; it does not infer them from workout history at
 * runtime. Every subsequent week is computed by the engine
 * (suggestLadderProgression), the same as phase-1-home — this program
 * does not encode weeks 2-5 as separate records. `weekdayActivities`
 * (below the sessions) and the constants immediately above this comment
 * were revised in the same pass — see their own comments.
 *
 * `BILATERAL_MAX_KG` (15.2) / `SINGLE_IMPLEMENT_MAX_KG` (20.2) replace
 * `DUMBBELL_MAX_KG` (15) for every weighted M2 ladder as of the 11 Aug
 * revision — the transcribed prescription puts eight rungs at 15.2 kg,
 * above the old cap, which would silently clamp `SetScreen`'s weight
 * Stepper below the prescribed load (see the constants' own doc).
 * `DUMBBELL_STEP_KG` stays reused unchanged: it is inert while the
 * equipment gate is closed (nothing in `src/**` writes
 * `settings.equipment`), and changing it is a list-based-progression
 * decision out of scope here (see the follow-up list in
 * ~/.claude/plans/m2-revision-transcription.md §6).
 *
 * Role (main/accessory) follows the revision's "Prescription roles"
 * exactly: six named primaries are ladder()'s default 'main' —
 * incline-dumbbell-press (A1), dumbbell-bench-press (A2),
 * single-arm-db-row (A5), bulgarian-split-squat (B1), dumbbell-rdl (B2),
 * dumbbell-shoulder-press (C1). Every other movement across Sessions
 * A-C is `role: 'accessory'`.
 *
 * Bodyweight movements with a coach-named per-level variation
 * (hamstring-walkout, dead-bug, bird-dog, side-plank) are seeded as
 * null-weight ladders carrying `variantKey` per rung. Incline-push-up
 * (A7) is also a null-weight ladder but carries no `variantKey` — the
 * spec prescribes "normal controlled tempo" for both of its sets, and a
 * `'normal'` label on a two-rung ladder with no second state would
 * invent a progression nobody prescribed. A ladder whose every rung is
 * null-weight returns `load-not-the-lever` once complete (never a false
 * `at-equipment-max`) — the interim the coach names for movements at a
 * variation ceiling is the shipped behaviour for all five, not something
 * this revision adds. Side plank needed a real fix to make this true —
 * repo's first seconds-mode ladder; `suggestLadderProgression`'s
 * completion gate used to read `LoggedSet.reps` unconditionally, so a
 * timed hold (logged into `seconds`, never `reps`) could never be seen
 * as complete — fixed in progression.ts to read through the existing
 * `effortOf` helper. That fix is unchanged by this revision; side plank
 * only moved from Session C to Session B (§8's calendar move).
 *
 * A1 (incline-dumbbell-press) and B2 (dumbbell-rdl) each repeat their
 * top rung's weight (15.2 kg) across their last two sets — coach-
 * confirmed intentional (11 Aug "Six Validation Rulings" §1, covering
 * both under the same reasoning): 15.2 kg/DB is the verified
 * matched-pair hardware ceiling, so the coach holds load steady while
 * the final set progresses on reps instead. The final set of each stays
 * NORMAL TEMPO — do not automatically convert it to a tempo variant; the
 * caveat is addressed to this codebase, not the athlete, so it lives
 * here rather than in an athlete-facing `note` (lead ruling D1). Neither
 * rung carries a `variantKey`; the conformance suite's D6 guard asserts
 * this stays true even if a future at-ceiling pyramid gains one.
 *
 * Session durations (50-60 min / 50-60 min / 45-55 min) and Session A's
 * ~30° bench angle have no field on Program or SessionTemplate — noted
 * here rather than invented into the schema, per the owner's ruling.
 * Rest values given as a range in the spec ("45-60 sec", "after both
 * sides") are recorded in each prescription's own `note`, since
 * `restSeconds` is a single number.
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
  // (coach ruling 7 Aug; MissedDayDeferral.md rulings 3/4/7).
  rotation: ['mesocycle2-chest-back', 'mesocycle2-legs-core', 'mesocycle2-shoulders-arms'],
  sessions: [
    // Session A - Chest and Back Emphasis. Target 50-60 min; bench angle
    // ~30° for incline pressing (spec §6, no schema field for either).
    {
      id: 'mesocycle2-chest-back',
      name: 'Chest & Back',
      focus: 'Chest and Back Emphasis',
      // Mesocycle 2 Pre-Strength Warm-up Prescription, 11 Aug 2026 — Session A.
      warmupId: 'mesocycle2-chest-back-warmup-v1',
      items: [
        // Repeated 15.2 kg top rung (sets 3 and 4) is coach-confirmed
        // intentional, not a transcription error — see the docblock above
        // for the full rationale (shared with B2/dumbbell-rdl below). No
        // variantKey on any rung; set 4 stays NORMAL TEMPO.
        ladder(
          'incline-dumbbell-press',
          [
            { weightKg: 11.2, reps: 12 },
            { weightKg: 13.2, reps: 10 },
            { weightKg: 15.2, reps: 8 },
            { weightKg: 15.2, reps: 6 },
          ],
          BILATERAL_MAX_KG,
          DUMBBELL_STEP_KG,
        ),
        ladder(
          'dumbbell-bench-press',
          [
            { weightKg: 11.2, reps: 12 },
            { weightKg: 13.2, reps: 10 },
            { weightKg: 15.2, reps: 8 },
          ],
          BILATERAL_MAX_KG,
          DUMBBELL_STEP_KG,
        ),
        ladder(
          'dumbbell-fly',
          [
            { weightKg: 5.2, reps: 15 },
            { weightKg: 5.7, reps: 12 },
          ],
          BILATERAL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 75, role: 'accessory' },
        ),
        // Use one dumbbell — spec's single-implement instruction.
        ladder(
          'dumbbell-pullover',
          [
            { weightKg: 9.2, reps: 15 },
            { weightKg: 11.2, reps: 12 },
            { weightKg: 13.2, reps: 10 },
          ],
          SINGLE_IMPLEMENT_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 75, role: 'accessory' },
        ),
        // Use one dumbbell — spec's single-implement instruction.
        ladder(
          'single-arm-db-row',
          [
            { weightKg: 11.2, reps: 12 },
            { weightKg: 13.2, reps: 10 },
            { weightKg: 15.2, reps: 8 },
            { weightKg: 17.2, reps: 6 },
          ],
          SINGLE_IMPLEMENT_MAX_KG,
          DUMBBELL_STEP_KG,
          { perSide: true, restSeconds: 90, note: 'Rest after both sides' },
        ),
        ladder(
          'chest-supported-row',
          [
            { weightKg: 9.2, reps: 15 },
            { weightKg: 10.7, reps: 12 },
            { weightKg: 11.2, reps: 10 },
          ],
          BILATERAL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 90, role: 'accessory' },
        ),
        // Bodyweight — the spec prescribes "normal controlled tempo" for
        // both sets, so no variantKey (a 'normal' label on a two-rung
        // ladder with no second state would invent a progression nobody
        // prescribed — see the docblock above).
        ladder(
          'incline-push-up',
          [
            { weightKg: null, reps: 15 },
            { weightKg: null, reps: 12 },
          ],
          null,
          null,
          { restSeconds: 75, role: 'accessory' },
        ),
      ],
    },
    // Session B - Legs and Core Emphasis. Target 50-60 min (spec §7).
    {
      id: 'mesocycle2-legs-core',
      name: 'Legs & Core',
      focus: 'Legs and Core Emphasis',
      // Mesocycle 2 Pre-Strength Warm-up Prescription, 11 Aug 2026 — Session B.
      warmupId: 'mesocycle2-legs-core-warmup-v1',
      items: [
        // Two dumbbells (docs/EquipmentProfile.md, resolved 11 Aug 2026 —
        // the revision writes "7.2 kg per dumbbell" with the same
        // bilateral phrasing as every matched-pair movement and no "use
        // one dumbbell" instruction).
        ladder(
          'bulgarian-split-squat',
          [
            { weightKg: 7.2, reps: 12 },
            { weightKg: 9.2, reps: 10 },
            { weightKg: 11.2, reps: 8 },
          ],
          BILATERAL_MAX_KG,
          DUMBBELL_STEP_KG,
          { perSide: true, restSeconds: 120, note: 'Rest after both sides' },
        ),
        // Repeated 15.2 kg top rung (sets 3 and 4) is coach-confirmed
        // intentional — same reasoning as A1/incline-dumbbell-press above
        // (see the docblock). No variantKey on any rung; set 4 stays
        // NORMAL TEMPO.
        ladder(
          'dumbbell-rdl',
          [
            { weightKg: 11.2, reps: 12 },
            { weightKg: 13.2, reps: 10 },
            { weightKg: 15.2, reps: 8 },
            { weightKg: 15.2, reps: 6 },
          ],
          BILATERAL_MAX_KG,
          DUMBBELL_STEP_KG,
        ),
        // Use one dumbbell — spec's single-implement instruction. The
        // retired mixed normal/slow/slow-pause Pyramid and its
        // "Progress tempo first, then weight" note are both gone —
        // superseded by the revision, which no longer prescribes tempo
        // variants for this movement.
        ladder(
          'goblet-squat',
          [
            { weightKg: 13.2, reps: 15 },
            { weightKg: 15.2, reps: 12 },
            { weightKg: 17.2, reps: 10 },
          ],
          SINGLE_IMPLEMENT_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 90, role: 'accessory' },
        ),
        ladder(
          'hamstring-walkout',
          [
            { weightKg: null, reps: 12, variantKey: 'normal' },
            { weightKg: null, reps: 10, variantKey: 'slow' },
          ],
          null,
          null,
          { restSeconds: 75, role: 'accessory' },
        ),
        ladder(
          'standing-calf-raise',
          [
            { weightKg: 11.2, reps: 20 },
            { weightKg: 13.2, reps: 15 },
            { weightKg: 15.2, reps: 12 },
          ],
          BILATERAL_MAX_KG,
          DUMBBELL_STEP_KG,
          {
            restSeconds: 60,
            role: 'accessory',
            note: 'Full range of motion — controlled stretch at the bottom',
          },
        ),
        ladder(
          'dead-bug',
          [
            { weightKg: null, reps: 10, variantKey: 'normal' },
            { weightKg: null, reps: 8, variantKey: 'longer-reach' },
            { weightKg: null, reps: 6, variantKey: 'reach-pause' },
          ],
          null,
          null,
          { perSide: true, restSeconds: 60, role: 'accessory', note: 'Rest 45-60 sec' },
        ),
        // New in the 11 Aug revision. Coach-accepted 'with-pause' mapping
        // for the second rung, coaching cue in the note rather than a new
        // enum token (SetVariant widening is a coach decision, not this
        // codebase's — types.ts:62-63).
        ladder(
          'bird-dog',
          [
            { weightKg: null, reps: 10, variantKey: 'normal' },
            { weightKg: null, reps: 8, variantKey: 'with-pause' },
          ],
          null,
          null,
          {
            perSide: true,
            restSeconds: 60,
            role: 'accessory',
            note: 'Hold the fully extended position for 2 seconds before returning.',
          },
        ),
        // Moved here from Session C (§8's calendar move) — mode/setPlan
        // unchanged, including the seconds-mode progression.ts fix noted
        // in the docblock above.
        ladder(
          'side-plank',
          [
            { weightKg: null, reps: 40, variantKey: 'normal' },
            { weightKg: null, reps: 30, variantKey: 'harder-leverage' },
          ],
          null,
          null,
          { mode: 'seconds', perSide: true, restSeconds: 60, role: 'accessory', note: 'Rest 45-60 sec' },
        ),
      ],
    },
    // Session C - Shoulders and Arms Emphasis. Target 45-55 min (spec §8).
    {
      id: 'mesocycle2-shoulders-arms',
      name: 'Shoulders & Arms',
      focus: 'Shoulders and Arms Emphasis',
      // Mesocycle 2 Pre-Strength Warm-up Prescription, 11 Aug 2026 — Session C.
      warmupId: 'mesocycle2-shoulders-arms-warmup-v1',
      items: [
        ladder(
          'dumbbell-shoulder-press',
          [
            { weightKg: 7.2, reps: 12 },
            { weightKg: 9.2, reps: 10 },
            { weightKg: 11.2, reps: 8 },
          ],
          BILATERAL_MAX_KG,
          DUMBBELL_STEP_KG,
        ),
        ladder(
          'dumbbell-lateral-raise',
          [
            { weightKg: 3.7, reps: 15 },
            { weightKg: 5.2, reps: 12 },
            { weightKg: 5.7, reps: 10 },
          ],
          BILATERAL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 60, role: 'accessory', note: 'Technique takes priority over load' },
        ),
        ladder(
          'rear-delt-fly',
          [
            { weightKg: 3.7, reps: 15 },
            { weightKg: 5.2, reps: 12 },
            { weightKg: 5.7, reps: 10 },
          ],
          BILATERAL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 60, role: 'accessory' },
        ),
        ladder(
          'dumbbell-curl',
          [
            { weightKg: 7.2, reps: 12 },
            { weightKg: 8.2, reps: 10 },
            { weightKg: 9.2, reps: 8 },
          ],
          BILATERAL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 75, role: 'accessory' },
        ),
        // New in the 11 Aug revision (Library promotion, see exercises.ts).
        ladder(
          'hammer-curl',
          [
            { weightKg: 7.2, reps: 12 },
            { weightKg: 8.2, reps: 10 },
            { weightKg: 9.2, reps: 8 },
          ],
          BILATERAL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 75, role: 'accessory' },
        ),
        // Use one dumbbell — spec's single-implement instruction.
        ladder(
          'overhead-triceps-extension',
          [
            { weightKg: 9.2, reps: 12 },
            { weightKg: 11.2, reps: 10 },
            { weightKg: 13.2, reps: 8 },
          ],
          SINGLE_IMPLEMENT_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 75, role: 'accessory' },
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
    unchanged from 6 Aug) plus a new second item, the session-specific
    cooldown/stretch sequence the coach's "Six Validation Rulings"
    document supplies (superseding the plan's original "label only, no
    detail" placeholder — the coach explicitly rejected leaving this
    generic). Plain text, no `routineId`: none of the six named stretches
    has a routine step id yet (same reasoning phase-1-home's own
    recovery-day stretching already documents below). Label names the
    session (matching the coach's own "Session A/B/C — … Stretching"
    headers) rather than a shared generic label, precedent-style with
    phase-1-home's post-ride stretch item — one item, detail lists the
    full sequence. Coach ruling: "Do not turn post-workout stretching into
    another workout" — one round each, no progression, no logging.

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
          label: 'Chest & Back Stretching',
          detail:
            'Wall chest stretch, lat stretch, cross-body shoulder stretch — 30 sec/side, one round, about 3-4 min total',
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
          label: 'Legs & Core Stretching',
          detail:
            'Standing or supported quad stretch, hamstring stretch, hip flexor stretch, figure-four glute stretch — 30 sec/side, one round, about 4-5 min total',
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
          label: 'Shoulders & Arms Stretching',
          detail:
            'Cross-body shoulder stretch, overhead triceps stretch, biceps/chest wall stretch — 30 sec/side, one round, about 3-4 min total',
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
