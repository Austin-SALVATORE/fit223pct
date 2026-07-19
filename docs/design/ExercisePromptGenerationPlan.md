# Exercise Prompt Generation Plan

Tracking document for the AI-generated exercise illustration prompts under
`public/assets/exercises/`. Governing standards: the Illustration Design Bible
and `docs/ExerciseAssets.md`. Downstream conversion and app integration:
[ExerciseAssetPipeline.md](ExerciseAssetPipeline.md).

## Current state (2026-07-19)

100 exercises have a `prompt.md`. Approved references: `goblet-squat` (ground
truth), `romanian-deadlift` (bar-path revision noted), `plank`,
`overhead-press`, `bulgarian-split-squat`. Flagged for regeneration:
`bench-press` (style drift), `lat-pulldown` (cropping, bar height),
`cable-row` (regenerated prompt; old image deleted).

**Generation route: OpenAI API with `gpt-image-2` + `size auto`**
(`scripts/generate-exercise-references.mjs --model gpt-image-2 --size auto`),
style-anchored on the goblet-squat reference. `gpt-image-1` was tested first
in two architectures (single-call strips, per-frame + stitch) and failed 8/8
on frame count, scene coherence, and facing direction — do not use it.
`gpt-image-2` passed the cable-row pilot on the first attempt. The ChatGPT UI
remains the fallback for corrections that need conversational iteration
(`chatgpt-image-latest` via API additionally requires org verification).

### UI session workflow

1. New ChatGPT chat. Attach `goblet-squat/reference.png` with: *"Match the
   exact art style, character, and rendering of the attached reference image.
   Then follow this specification:"*
2. Paste one prompt (the fenced block from the exercise's `prompt.md`), ask
   for widescreen/landscape. Correct conversationally against the file's QA
   checklist; download passes to `<id>/reference.png`.
3. ~6 exercises per chat, then start a fresh chat (drift accumulates).

### Session queue (~6 per session, grouped for visual coherence)

| # | Exercises |
|---|---|
| 1 | bench-press†, lat-pulldown†, cable-row, seated-cable-row, one-arm-cable-row, barbell-row |
| 2 | dumbbell-row, t-bar-row, machine-row, chest-supported-row, inverted-row, shrug |
| 3 | pull-up, assisted-pull-up, straight-arm-pulldown, face-pull, upright-row, rear-delt-machine |
| 4 | deadlift, sumo-deadlift, good-morning, single-leg-romanian-deadlift, kettlebell-swing, cable-pull-through |
| 5 | hip-thrust, glute-bridge, bodyweight-squat, barbell-back-squat, front-squat, split-squat |
| 6 | smith-machine-squat, hack-squat, walking-lunge, reverse-lunge, step-up, standing-calf-raise |
| 7 | seated-calf-raise, leg-press, leg-extension, seated-leg-curl, lying-leg-curl, abductor-machine |
| 8 | adductor-machine, chest-press-machine, push-up, incline-push-up, diamond-push-up, dip |
| 9 | bench-dip, dumbbell-bench-press, incline-bench-press, incline-dumbbell-press, close-grip-bench-press, skull-crusher |
| 10 | dumbbell-fly, decline-bench-press, decline-dumbbell-press, cable-fly, pec-deck, machine-shoulder-press |
| 11 | arnold-press, dumbbell-shoulder-press, seated-dumbbell-shoulder-press, lateral-raise, front-raise, rear-delt-fly |
| 12 | cable-lateral-raise, biceps-curl, dumbbell-biceps-curl, hammer-curl, cable-curl, concentration-curl |
| 13 | preacher-curl, incline-dumbbell-curl, triceps-pushdown, rope-triceps-pushdown, single-arm-triceps-pushdown, overhead-triceps-extension |
| 14 | side-plank, crunch, reverse-crunch, leg-raise, hanging-leg-raise, russian-twist |
| 15 | cable-woodchop, dead-bug, bird-dog |

† = regeneration of a failed pilot image.

**Deferred until consolidation decisions** (do not generate): machine-chest-fly,
cable-rear-delt-fly, leaning-lateral-raise, ez-bar-curl, dumbbell-shrug,
neutral-grip-lat-pulldown, wide-grip-lat-pulldown, close-grip-lat-pulldown.

| Batch | Scope | Count | Status |
|---|---|---:|---|
| 1 | Core catalogue (Squat/Lower Body, Hip Hinge, Chest, Back, Shoulders, Arms, Core) | 67 | prompts written, verified |
| 2 | Gym-phase variants (phase 2) | 33 | prompts written, verified |

Every prompt embeds the locked style block from
`public/assets/exercises/_templates/prompt.template.md` byte-for-byte.
Consistency is enforced mechanically — if the style block changes, it changes
in the template first and all prompts are regenerated.

## Generation workflow

1. Paste a `prompt.md`'s fenced prompt into the image generator.
2. Save the result as `<exercise-id>/reference.png`.
3. Review against the file's "Form checkpoints (QA)" list.
4. Advance status in line with the bible's status model
   (`planned → generated → reviewed → approved`).

Generate the pilot set first; do not scale until it passes review:
goblet-squat (done), bench-press, romanian-deadlift, lat-pulldown,
overhead-press, bulgarian-split-squat, plank, cable-row.

## Pending decisions

- **Raster vs SVG**: the reference style (semi-realistic PNG) conflicts with
  `docs/ExerciseAssets.md` (SVG-only shipping assets). Needs a documented
  product decision before anything ships in-app.
- **Id mismatch**: Batch 2 `single-leg-romanian-deadlift` vs seeded domain id
  `single-leg-rdl` — reconcile before phase 2 wiring (folder must equal
  domain id).
- **Near-duplicate consolidation** (decide before generation spend):
  - 4 lat pulldowns (base/wide/close/neutral) — recommend one shared thumbnail
  - `pec-deck` / `machine-chest-fly` — recommend merging
  - `shrug` / `dumbbell-shrug` — recommend one shared thumbnail
  - `cable-rear-delt-fly` — recommend aliasing onto `rear-delt-fly`
  - `leaning-lateral-raise`, `ez-bar-curl` — weakest differentiators; generate
    last, cut if unreadable at 64 px
- **Uncovered seeded exercises** (~13: band work, tempo/deficit/single-arm
  variants, e.g. `band-row`, `tempo-bodyweight-squat`, `single-leg-rdl`) have
  no prompts in either batch.
