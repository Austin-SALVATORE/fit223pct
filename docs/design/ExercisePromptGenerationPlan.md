# Exercise Prompt Generation Plan

Tracking document for the AI-generated exercise illustration prompts under
`public/assets/exercises/`. Governing standards: the Illustration Design Bible
and `docs/ExerciseAssets.md`.

## Current state (2026-07-19)

100 exercises have a `prompt.md`. All are `planned` except `goblet-squat`
(`approved` — its `reference.png` is the visual ground truth the shared style
block and palette were derived from).

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
