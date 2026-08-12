import type { Exercise } from '@/domain/types'

/**
 * Exercise library for Austin's home setup: barbell 0–30 kg, dumbbells
 * (1×20 kg or 2×10 kg), adjustable bench, resistance bands.
 *
 * Display content (name, cues, teachingConcept) lives in each locale's
 * seed.json under src/locales, keyed by id — these records are the
 * structural, locale-free shape only. See src/i18n/seedExercise.ts.
 */
export const seedExercises: Exercise[] = [
  {
    id: 'goblet-squat',
    muscles: ['quads', 'glutes', 'core'],
    equipment: ['dumbbell'],
    substitutionIds: ['split-squat', 'tempo-bodyweight-squat'],
    isUnilateral: false,
  },
  {
    id: 'split-squat',
    muscles: ['quads', 'glutes'],
    equipment: ['dumbbell', 'bodyweight'],
    substitutionIds: ['goblet-squat', 'bulgarian-split-squat'],
    isUnilateral: true,
  },
  {
    id: 'tempo-bodyweight-squat',
    muscles: ['quads', 'glutes'],
    equipment: ['bodyweight'],
    substitutionIds: ['goblet-squat'],
    isUnilateral: false,
  },
  {
    id: 'bench-press',
    muscles: ['chest', 'triceps', 'shoulders'],
    equipment: ['barbell', 'bench'],
    substitutionIds: ['deficit-push-up', 'db-floor-press', 'dumbbell-bench-press', 'incline-dumbbell-press'],
    isUnilateral: false,
  },
  {
    id: 'deficit-push-up',
    muscles: ['chest', 'triceps', 'shoulders', 'core'],
    equipment: ['bodyweight'],
    substitutionIds: ['bench-press'],
    isUnilateral: false,
  },
  {
    id: 'db-floor-press',
    muscles: ['chest', 'triceps'],
    equipment: ['dumbbell'],
    substitutionIds: ['bench-press', 'deficit-push-up', 'dumbbell-bench-press'],
    isUnilateral: false,
  },
  {
    id: 'dumbbell-bench-press',
    muscles: ['chest', 'triceps', 'shoulders'],
    equipment: ['dumbbell', 'bench'],
    substitutionIds: ['bench-press', 'db-floor-press', 'incline-dumbbell-press'],
    isUnilateral: false,
  },
  {
    id: 'incline-dumbbell-press',
    muscles: ['chest', 'triceps', 'shoulders'],
    equipment: ['dumbbell', 'bench'],
    substitutionIds: ['dumbbell-bench-press', 'bench-press'],
    isUnilateral: false,
  },
  {
    id: 'single-arm-db-row',
    muscles: ['back', 'biceps'],
    equipment: ['dumbbell', 'bench'],
    // 'chest-supported-row' added per spec v2.7 §17's reverse row
    // ("Single-arm Dumbbell Row | Chest-supported Dumbbell Row | Torso
    // support is needed"), now resolvable now that it exists.
    substitutionIds: ['bent-over-row', 'band-row', 'chest-supported-row'],
    isUnilateral: true,
  },
  {
    id: 'bent-over-row',
    muscles: ['back', 'biceps'],
    equipment: ['barbell'],
    substitutionIds: ['single-arm-db-row', 'band-row'],
    isUnilateral: false,
  },
  {
    id: 'band-row',
    muscles: ['back', 'biceps'],
    equipment: ['band'],
    substitutionIds: ['single-arm-db-row'],
    isUnilateral: false,
  },
  {
    id: 'romanian-deadlift',
    muscles: ['hamstrings', 'glutes', 'back'],
    equipment: ['barbell'],
    substitutionIds: ['single-leg-rdl', 'dumbbell-rdl'],
    isUnilateral: false,
  },
  {
    id: 'single-leg-rdl',
    muscles: ['hamstrings', 'glutes', 'core'],
    equipment: ['dumbbell'],
    substitutionIds: ['romanian-deadlift', 'dumbbell-rdl'],
    isUnilateral: true,
  },
  {
    id: 'dumbbell-rdl',
    muscles: ['hamstrings', 'glutes', 'back'],
    equipment: ['dumbbell'],
    substitutionIds: ['romanian-deadlift', 'single-leg-rdl'],
    isUnilateral: false,
  },
  {
    id: 'bulgarian-split-squat',
    muscles: ['quads', 'glutes'],
    equipment: ['dumbbell', 'bench'],
    substitutionIds: ['split-squat', 'goblet-squat'],
    isUnilateral: true,
  },
  {
    id: 'overhead-press',
    muscles: ['shoulders', 'triceps', 'core'],
    equipment: ['barbell'],
    substitutionIds: ['single-arm-db-press', 'dumbbell-shoulder-press'],
    isUnilateral: false,
  },
  {
    id: 'single-arm-db-press',
    muscles: ['shoulders', 'triceps', 'core'],
    equipment: ['dumbbell'],
    substitutionIds: ['overhead-press', 'dumbbell-shoulder-press'],
    isUnilateral: true,
  },
  {
    id: 'dumbbell-shoulder-press',
    muscles: ['shoulders', 'triceps', 'core'],
    equipment: ['dumbbell'],
    substitutionIds: ['overhead-press', 'single-arm-db-press'],
    isUnilateral: false,
  },
  {
    id: 'hip-thrust',
    muscles: ['glutes', 'hamstrings'],
    equipment: ['dumbbell', 'bench'],
    substitutionIds: ['single-leg-hip-thrust'],
    isUnilateral: false,
  },
  {
    id: 'single-leg-hip-thrust',
    muscles: ['glutes', 'hamstrings'],
    equipment: ['bench', 'bodyweight'],
    substitutionIds: ['hip-thrust'],
    isUnilateral: true,
  },
  {
    id: 'band-pull-apart',
    muscles: ['shoulders', 'back'],
    equipment: ['band'],
    substitutionIds: ['rear-delt-fly'],
    isUnilateral: false,
  },
  {
    id: 'rear-delt-fly',
    muscles: ['shoulders', 'back'],
    equipment: ['dumbbell'],
    substitutionIds: ['band-pull-apart'],
    isUnilateral: false,
  },
  {
    id: 'band-lateral-raise',
    muscles: ['shoulders'],
    equipment: ['band'],
    substitutionIds: [],
    isUnilateral: false,
  },
  {
    id: 'band-curl',
    muscles: ['biceps'],
    equipment: ['band'],
    substitutionIds: [],
    isUnilateral: false,
  },
  {
    id: 'dead-bug',
    muscles: ['core'],
    equipment: ['bodyweight'],
    substitutionIds: ['side-plank'],
    isUnilateral: true,
  },
  {
    id: 'side-plank',
    muscles: ['core'],
    equipment: ['bodyweight'],
    substitutionIds: ['dead-bug'],
    isUnilateral: true,
  },
  // Mesocycle 2 additions — Mesocycle-2-Home-Progressive-Coach-Spec-v2.7.md
  // §18. Ids are the art-directory names, not the spec's prose headings,
  // per docs/design/Mesocycle2Implementation.md §8 — the coach's
  // "Standing Dumbbell Calf Raise" resolves to `standing-calf-raise`, and
  // this `push-up` is a distinct id from the existing `deficit-push-up`
  // (a harder variant), never a rename of it. substitutionIds below are
  // §17's Approved Substitutions table exactly, resolved only where the
  // named substitute is itself a Library id — nothing invented beyond
  // that, matching overhead-triceps-extension's existing precedent.
  {
    id: 'push-up',
    muscles: ['chest', 'triceps', 'shoulders', 'core'],
    equipment: ['bodyweight'],
    substitutionIds: [],
    isUnilateral: false,
  },
  {
    id: 'dumbbell-fly',
    muscles: ['chest', 'shoulders'],
    equipment: ['dumbbell', 'bench'],
    // §17: "Dumbbell Fly | Dumbbell squeeze press or push-up" — squeeze
    // press has no Library id, so only the resolvable half is kept.
    substitutionIds: ['push-up'],
    isUnilateral: false,
  },
  {
    id: 'dumbbell-pullover',
    muscles: ['back', 'chest'],
    equipment: ['dumbbell', 'bench'],
    // §17: "Dumbbell Pullover | Single-arm Dumbbell Row with the elbow
    // close to the torso" — a coaching modifier on the same Library id,
    // not a separate exercise.
    substitutionIds: ['single-arm-db-row'],
    isUnilateral: false,
  },
  {
    id: 'chest-supported-row',
    muscles: ['back', 'biceps'],
    equipment: ['dumbbell', 'bench'],
    substitutionIds: ['single-arm-db-row'],
    isUnilateral: false,
  },
  {
    id: 'hamstring-walkout',
    muscles: ['hamstrings', 'glutes', 'core'],
    equipment: ['bodyweight'],
    // §17's substitute, Sliding Leg Curl, has no Library id.
    substitutionIds: [],
    isUnilateral: false,
  },
  {
    id: 'standing-calf-raise',
    muscles: ['calves'],
    equipment: ['dumbbell'],
    // No §17 row names a substitute for this exercise.
    substitutionIds: [],
    isUnilateral: false,
  },
  // Gym-equipment additions, from the retired Fitness Park plan (see
  // docs/design/Mesocycle2Implementation.md §9) — a rack for real barbell
  // squats, a hip thrust station, and cable machines for vertical pulling.
  // Kept in the Library as legitimate machine/barbell exercises and
  // substitution targets even though the gym phase that introduced them
  // did not ship; each keeps its home-equipment counterpart as a
  // substitution for a busy machine.
  {
    id: 'barbell-squat',
    muscles: ['quads', 'glutes', 'core'],
    equipment: ['barbell', 'machine'],
    substitutionIds: ['goblet-squat'],
    isUnilateral: false,
  },
  {
    id: 'cable-row',
    muscles: ['back', 'biceps'],
    equipment: ['machine'],
    substitutionIds: ['single-arm-db-row'],
    isUnilateral: false,
  },
  {
    id: 'lat-pulldown',
    muscles: ['back', 'biceps'],
    equipment: ['machine'],
    substitutionIds: ['band-row'],
    isUnilateral: false,
  },
  {
    id: 'barbell-hip-thrust',
    muscles: ['glutes', 'hamstrings'],
    equipment: ['barbell', 'bench'],
    substitutionIds: ['hip-thrust'],
    isUnilateral: false,
  },
  {
    id: 'dumbbell-lateral-raise',
    muscles: ['shoulders'],
    equipment: ['dumbbell'],
    substitutionIds: ['band-lateral-raise'],
    isUnilateral: false,
  },
  {
    id: 'dumbbell-curl',
    muscles: ['biceps'],
    equipment: ['dumbbell'],
    substitutionIds: ['band-curl'],
    isUnilateral: false,
  },
  {
    id: 'overhead-triceps-extension',
    muscles: ['triceps'],
    equipment: ['dumbbell'],
    // Not named by the coach; not invented here either — left empty
    // rather than guessed, per program-content.md.
    substitutionIds: [],
    // One dumbbell, held with both hands overhead — not one-arm-at-a-time,
    // which is what this flag distinguishes (see single-arm-db-row).
    isUnilateral: false,
  },
  // Mesocycle 2 Build Prescription Revision, 11 Aug 2026 — three Library
  // promotions (art already committed, F5 of the revision transcription
  // plan). substitutionIds: [] on all three per the same rule as above:
  // not named by the coach, not invented here.
  {
    id: 'bird-dog',
    muscles: ['core'],
    equipment: ['bodyweight'],
    // Matches dead-bug's own precedent (`['core']` + isUnilateral: true
    // even though it also loads hip flexors) — the file's convention is
    // the coach's classification, not an anatomy audit.
    substitutionIds: [],
    isUnilateral: true,
  },
  {
    id: 'hammer-curl',
    muscles: ['biceps'],
    equipment: ['dumbbell'],
    // MuscleGroup has no brachioradialis token; dumbbell-curl is
    // ['biceps'] for the same reason.
    substitutionIds: [],
    isUnilateral: false,
  },
  {
    id: 'incline-push-up',
    muscles: ['chest', 'triceps', 'shoulders', 'core'],
    equipment: ['bench', 'bodyweight'],
    // Mirrors push-up plus bench, following single-leg-hip-thrust's own
    // ['bench', 'bodyweight'] precedent for the same reason.
    substitutionIds: [],
    isUnilateral: false,
  },
  // Mesocycle 2 Pre-Strength Warm-up Prescription, 11 Aug 2026 — three
  // Library promotions (art already committed, per program-content.md
  // "art-only exercises must be promoted first"). Follows 320cf88's
  // (bird-dog/hammer-curl/incline-push-up) precedent exactly: names only,
  // no cues or teachingConcept (none given by the coach), substitutionIds
  // left empty (none named).
  {
    id: 'scapular-push-up',
    // Scapular protraction/retraction in a plank position — same
    // classification as band-pull-apart/rear-delt-fly, the file's other
    // scapular-movement entries.
    muscles: ['shoulders', 'back'],
    equipment: ['bodyweight'],
    substitutionIds: [],
    isUnilateral: false,
  },
  {
    id: 'wall-slide',
    // Same scapular-movement classification as scapular-push-up above —
    // the coach's own spec purpose line for both reads "prepare scapular
    // movement". The wall is a guide surface, not equipment the schema
    // has a token for (Equipment has no 'wall' — see the asset prompt's
    // own "not balance support" note).
    muscles: ['shoulders', 'back'],
    equipment: ['bodyweight'],
    substitutionIds: [],
    isUnilateral: false,
  },
  {
    id: 'bodyweight-squat',
    // Mirrors tempo-bodyweight-squat's classification exactly — same
    // movement, no tempo modifier.
    muscles: ['quads', 'glutes'],
    equipment: ['bodyweight'],
    substitutionIds: [],
    isUnilateral: false,
  },
  // Equipment upgrade + Mesocycle 2 migration, 12 Aug 2026 — seven Library
  // promotions. `MuscleGroup` has no obliques/hip-flexor/deep-trunk-
  // stabilizer/brachialis tokens, so the coach's richer classification
  // (Mesocycle-2-Core-Block-Redesign §8, Mesocycle-2-Session-C-
  // Authoritative-Amendment §4) maps to the closest enum members and
  // carries its full form in the locale cues, where prose belongs — not
  // by widening a closed union for a content migration.
  {
    id: 'dumbbell-rowboat',
    muscles: ['core'],
    equipment: ['dumbbell'],
    // Dead Bug as regression (Mesocycle-2-Core-Block-Redesign): no
    // reverse link added, per the coach's own instruction not to.
    substitutionIds: ['dead-bug'],
    isUnilateral: false,
  },
  {
    id: 'russian-twist',
    muscles: ['core'],
    equipment: ['dumbbell'],
    // Bird Dog as rotational-control regression (Mesocycle-2-Core-Block-
    // Redesign) — a programming regression, not a claim of biomechanical
    // equivalence.
    substitutionIds: ['bird-dog'],
    isUnilateral: false,
  },
  {
    id: 'bicycle-crunch',
    muscles: ['core'],
    equipment: ['bodyweight'],
    substitutionIds: ['dead-bug'],
    isUnilateral: false,
  },
  {
    id: 'plank',
    // side-plank is deliberately not listed here or as this entry's
    // substitute — the coach names it a distinct anti-lateral-flexion
    // movement, not a regression of this one.
    muscles: ['core', 'shoulders', 'glutes'],
    equipment: ['bodyweight'],
    substitutionIds: ['dead-bug'],
    isUnilateral: false,
  },
  {
    id: 'mountain-climber',
    // Library-only — the coach reserves it for a future conditioning
    // block; not part of the active Session B prescription.
    muscles: ['core', 'shoulders', 'quads'],
    equipment: ['bodyweight'],
    substitutionIds: ['plank'],
    isUnilateral: false,
  },
  {
    id: 'barbell-curl',
    // MuscleGroup has no brachialis/forearm token — hammer-curl and
    // dumbbell-curl already document that same gap.
    muscles: ['biceps'],
    equipment: ['barbell'],
    // dumbbell-curl is the movement this replaces (history stays
    // unmerged — a substitution link, not a progression merge);
    // band-curl was already dumbbell-curl's own alternative.
    substitutionIds: ['dumbbell-curl', 'band-curl'],
    isUnilateral: false,
  },
  {
    id: 'bodyweight-hip-hinge',
    muscles: ['hamstrings', 'glutes', 'back'],
    equipment: ['bodyweight'],
    substitutionIds: ['romanian-deadlift'],
    isUnilateral: false,
  },
]
