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
 * Phase 1 — Home, 20 Jul to 9 Aug 2026 (docs/Training.md,
 * docs/programs/phase-1-home-v3-coach-spec.md — the coach's own program,
 * transcribed directly, not a laddered conversion of the earlier A/B
 * seed). Weekday-pinned: Mon Chest & Back, Wed Legs & Core, Fri Shoulders
 * & Arms — every weekday always offers the same session identity. Dumbbell-
 * only equipment tier, 15 kg/hand ceiling; every compound is a three-set
 * ascending ladder, every isolation accessory a two-set rep-range.
 */
export const seedProgram: Program = {
  id: 'phase-1-home',
  name: 'Phase 1 — Home',
  origin: 'seed',
  phase: 1,
  startDate: '2026-07-20',
  endDate: '2026-08-09',
  trainingWeekdays: [1, 3, 5],
  schedulingMode: 'weekday-pinned',
  weekdaySessions: { 1: 'chest-back', 3: 'legs-core', 5: 'shoulders-arms' },
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
    6: {
      kind: 'optional',
      title: 'Optional activity',
      items: [
        { label: 'Choose one', detail: 'Walking, cycling, swimming, tennis, or mobility work' },
        { label: 'Complete rest is a fine choice too' },
      ],
    },
    7: {
      kind: 'checkpoint',
      title: 'Weekly checkpoint',
      items: [
        { label: 'Weigh in', detail: 'Same conditions each week — morning, before eating' },
        { label: 'Measure your waist', detail: 'Same spot, same conditions as last week' },
        { label: 'Prepare the coming week', detail: 'Confirm training times and any sport plans' },
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
 * These are the coach's own Week 1 opening prescriptions, transcribed
 * directly per §10 "Opening-weight handoff": "Fit223 must seed the exact
 * Week 1 Pyramid levels from Sections 6-8; it must not infer them from
 * workout history at runtime." Every subsequent week is computed by the
 * engine (suggestLadderProgression), the same as phase-1-home — this
 * program does not encode weeks 2-5 as separate records.
 *
 * DUMBBELL_MAX_KG/DUMBBELL_STEP_KG reused unchanged from Phase 1, on the
 * owner's explicit instruction: §4 "Available-load steps" forbids
 * assuming a 2 kg/15 kg grid until the athlete's real dumbbell settings
 * are confirmed, which makes these two constants wrong in a now-
 * documented way — but building the real settings list or changing the
 * progression arithmetic is architect work, dated after Monday, not
 * this commit's. Seeding the prescribed loads as written is what §4
 * explicitly still permits.
 *
 * Role (main/accessory) follows §4 "Prescription roles" exactly: the
 * five named primaries are ladder()'s default 'main'; every other
 * movement across Sessions A-C, including Overhead Triceps Extension,
 * is `role: 'accessory'`.
 *
 * Bodyweight movements with a coach-named per-level variation
 * (hamstring walkout, dead bug, push-up, single-leg hip thrust, side
 * plank — five, not six) are seeded as null-weight ladders carrying
 * `variantKey` per rung — item 3/4's infrastructure exists specifically
 * for this pattern, not yet used by any prescription until now. A ladder
 * whose every rung is null-weight returns `load-not-the-lever` once
 * complete (never a false `at-equipment-max`), and does not report a
 * load increase — the interim the coach names for movements at a
 * variation ceiling (§10 "Load-ceiling progression") is therefore
 * already the shipped behaviour for all five, not something this commit
 * adds. Side plank is the exception that needed a real fix to make this
 * true: it is the repo's first seconds-mode ladder, and
 * `suggestLadderProgression`'s completion gate read `LoggedSet.reps`
 * unconditionally, so a timed hold (logged into `seconds`, never `reps`)
 * could never be seen as complete at all — fixed in progression.ts to
 * read through the existing `effortOf` helper.
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
  endDate: '2026-09-13',
  trainingWeekdays: [1, 3, 5],
  schedulingMode: 'weekday-pinned',
  weekdaySessions: { 1: 'mesocycle2-chest-back', 3: 'mesocycle2-legs-core', 5: 'mesocycle2-shoulders-arms' },
  // Inert in weekday-pinned mode, kept internally consistent — see
  // seedProgram's identical convention above.
  rotation: ['mesocycle2-chest-back', 'mesocycle2-legs-core', 'mesocycle2-shoulders-arms'],
  sessions: [
    // Session A - Chest and Back Emphasis. Target 50-60 min; bench angle
    // ~30° for incline pressing (spec §6, no schema field for either).
    {
      id: 'mesocycle2-chest-back',
      name: 'Chest & Back',
      focus: 'Chest and Back Emphasis',
      items: [
        ladder(
          'incline-dumbbell-press',
          [
            { weightKg: 10, reps: 12 },
            { weightKg: 12, reps: 10 },
            { weightKg: 14, reps: 8 },
            { weightKg: 15, reps: 6 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
        ),
        ladder(
          'single-arm-db-row',
          [
            { weightKg: 10, reps: 12 },
            { weightKg: 12, reps: 10 },
            { weightKg: 14, reps: 8 },
            { weightKg: 15, reps: 6 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { perSide: true, restSeconds: 90, note: 'Rest after both sides' },
        ),
        ladder(
          'dumbbell-fly',
          [
            { weightKg: 4, reps: 15 },
            { weightKg: 6, reps: 12 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 75, role: 'accessory' },
        ),
        ladder(
          'chest-supported-row',
          [
            { weightKg: 10, reps: 15 },
            { weightKg: 12, reps: 12 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 90, role: 'accessory' },
        ),
        ladder(
          'goblet-squat',
          [
            { weightKg: 8, reps: 20, variantKey: 'normal' },
            { weightKg: 10, reps: 15, variantKey: 'slow' },
            { weightKg: 12, reps: 12, variantKey: 'slow-pause' },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 90, role: 'accessory', note: 'Progress tempo first, then weight' },
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
      ],
    },
    // Session B - Legs and Core Emphasis. Target 50-60 min (spec §7).
    {
      id: 'mesocycle2-legs-core',
      name: 'Legs & Core',
      focus: 'Legs and Core Emphasis',
      items: [
        ladder(
          'bulgarian-split-squat',
          [
            { weightKg: 8, reps: 12 },
            { weightKg: 10, reps: 10 },
            { weightKg: 12, reps: 8 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { perSide: true, restSeconds: 120, note: 'Rest after both sides' },
        ),
        ladder(
          'dumbbell-rdl',
          [
            { weightKg: 10, reps: 12 },
            { weightKg: 12, reps: 10 },
            { weightKg: 14, reps: 8 },
            { weightKg: 15, reps: 6 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
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
        // Spec §10's "load-ceiling progression" (switching to a harder
        // variation once every level is loaded and clean) is not yet
        // implemented in the engine — dated before Week 3's first session,
        // 24 Aug, and out of scope for this batch. The note below is
        // athlete-facing coaching copy only; it must not describe our own
        // implementation status (docs/design/Mesocycle2Implementation.md
        // review, 6 Aug — an earlier version of this note read "deferred —
        // not yet implemented" and rendered mid-workout to the athlete).
        ladder(
          'standing-calf-raise',
          [
            { weightKg: 8, reps: 20 },
            { weightKg: 10, reps: 15 },
            { weightKg: 12, reps: 12 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          {
            restSeconds: 60,
            role: 'accessory',
            note: 'Hold this pyramid once every level is loaded and clean — a harder variation is next in your progression',
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
        ladder(
          'dumbbell-pullover',
          [
            { weightKg: 8, reps: 15 },
            { weightKg: 10, reps: 12 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 75, role: 'accessory' },
        ),
        ladder(
          'push-up',
          [
            { weightKg: null, reps: 15, variantKey: 'normal' },
            { weightKg: null, reps: 12, variantKey: 'with-pause' },
          ],
          null,
          null,
          {
            restSeconds: 90,
            role: 'accessory',
            note: 'After both levels, progress to the separate harder-leverage variation',
          },
        ),
      ],
    },
    // Session C - Shoulders and Arms Emphasis. Target 45-55 min (spec §8).
    {
      id: 'mesocycle2-shoulders-arms',
      name: 'Shoulders & Arms',
      focus: 'Shoulders and Arms Emphasis',
      items: [
        ladder(
          'dumbbell-shoulder-press',
          [
            { weightKg: 6, reps: 12 },
            { weightKg: 8, reps: 10 },
            { weightKg: 10, reps: 8 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
        ),
        // Deliberately a different Pyramid from Session A's dumbbell-lateral-raise
        // — spec §10: "Monday and Friday lateral raises deliberately begin with
        // different Pyramids." Never deduplicate these two.
        ladder(
          'dumbbell-lateral-raise',
          [
            { weightKg: 4, reps: 15 },
            { weightKg: 6, reps: 12 },
            { weightKg: 8, reps: 10 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 60, role: 'accessory' },
        ),
        ladder(
          'rear-delt-fly',
          [
            { weightKg: 4, reps: 15 },
            { weightKg: 6, reps: 12 },
            { weightKg: 8, reps: 10 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 60, role: 'accessory' },
        ),
        ladder(
          'dumbbell-curl',
          [
            { weightKg: 8, reps: 12 },
            { weightKg: 10, reps: 10 },
            { weightKg: 12, reps: 8 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 75, role: 'accessory' },
        ),
        ladder(
          'overhead-triceps-extension',
          [
            { weightKg: 10, reps: 12 },
            { weightKg: 12, reps: 10 },
            { weightKg: 14, reps: 8 },
          ],
          DUMBBELL_MAX_KG,
          DUMBBELL_STEP_KG,
          { restSeconds: 75, role: 'accessory' },
        ),
        ladder(
          'single-leg-hip-thrust',
          [
            { weightKg: null, reps: 15, variantKey: 'normal' },
            { weightKg: null, reps: 12, variantKey: 'with-pause' },
          ],
          null,
          null,
          { perSide: true, restSeconds: 75, role: 'accessory' },
        ),
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
  ],
  /*
    Item 11 (display only) — spec §3, §12, §13, §14. Now covers every
    weekday, including the training days: `weekdayActivities` may claim a
    training weekday as of docs/design/ActivityPrescriptionPhaseA.md §1
    (structural half already shipped, b460822) — a training-weekday entry
    renders as that day's post-strength cardio, display only, not a
    replacement for the session.

    **Corrected 6 Aug against coach spec v2.11 §12, row 1** — the ride
    figure originally seeded here (30 min, Wednesday reducible to 20 on a
    Yellow day) was v2.7's; v2.11 collapsed that row to one prescription
    for all three training days: 20 min Zone 2, a 0-2 min easy transition
    before it and up to 3 min easy spin after, ~25 min total. §15 now
    keeps the ride at the prescribed 20 minutes regardless of readiness —
    there is nothing left to reduce, so Wednesday's Yellow-day clause is
    deleted rather than kept as dead text. v2.11 also adds a fourth
    element, a session-specific post-ride stretch (§14) — deliberately
    not seeded here; the lead is scoping it separately since four of its
    nine stretch positions have no step id yet, and a step id is both a
    locale key and an art id.

    Recovery-day stretching (§14, the *non-training-day* stretch — a
    different one from the post-ride stretch above) is deliberately plain
    text with no `routineId`: the existing `recovery-stretch-v1` routine
    (phase-1-home's own) does not match §14's six named stretches — it's
    missing a lat stretch and thoracic rotation, and includes four the
    coach doesn't name here (wall-calf-stretch, standing-quadriceps-
    stretch, seated-butterfly-stretch, childs-pose — a fifth,
    wall-chest-stretch, depends on whether it counts as the coach's
    "doorway chest stretch") — so linking it would silently play the
    wrong sequence. Authoring a new, accurate routine needs its own steps
    and art (program-content.md), which is content work beyond this batch.
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
      ],
    },
    2: {
      kind: 'recovery',
      title: 'Recovery day',
      items: [
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
      ],
    },
    4: {
      kind: 'recovery',
      title: 'Recovery day',
      items: [
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
      ],
    },
    6: {
      kind: 'optional',
      title: 'Optional recovery ride',
      items: [
        {
          label: 'Zone 2 ride',
          detail: '45 min (5 min easy warm-up, 5 min easy cool-down) — only when recovery is Green',
          recordable: 'ride',
        },
        { label: 'Complete rest is a fine choice too' },
      ],
    },
    7: {
      kind: 'checkpoint',
      title: 'Weekly checkpoint',
      items: [
        { label: 'Weigh in', detail: 'Same conditions each week — morning, before eating' },
        { label: 'Measure your waist', detail: 'Same spot, same conditions as last week' },
        { label: 'Prepare the coming week', detail: 'Confirm training times and any sport plans' },
      ],
    },
  },
  // Spec §13 — the same six-item round every training day, ~8-12 min,
  // preparation rather than a workout: no timing target, no score, no
  // progression. One program-level field, not per-weekday
  // (docs/design/ActivityPrescriptionPhaseA.md §2).
  morningActivation: {
    kind: 'mobility',
    title: 'Morning Activation',
    items: [
      { label: 'Cat-cow', detail: '6 controlled reps' },
      { label: 'Thoracic rotation', detail: '6 reps per side' },
      { label: 'Wall slide or shoulder circle', detail: '8 controlled reps' },
      { label: '90/90 hip switch', detail: '6 reps per side' },
      { label: 'Bodyweight glute bridge', detail: '10 reps' },
      { label: 'Bodyweight squat', detail: '8 reps' },
    ],
  },
}
