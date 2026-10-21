# Art brief — parallel-bar batch (21 Oct 2026)

**Authority.** Owner ruling `docs/programs/parallel-bars-product-ruling-2026-10-21.md` §2–§4 (what each picture must and must not be); backlog entry `docs/ExerciseAssets.md` "Art backlog — parallel-bar movements". Owner approved starting this batch in chat, 21 Oct 15:48. The program is already deployed without these pictures; nothing here is urgent enough to lower the bar.

**What exists when this is done.** Three new exercise strips under `public/assets/exercises/<id>/` (prompt.md with the byte-identical locked STYLE BLOCK from `_templates/prompt.template.md`, reference.png, converted AVIF runtime files, metadata.json, manifest entries with dimensions), audited independently, then one commit that also clears the ids from both `KNOWN_MISSING` lists.

## The apparatus, common to all three

A **freestanding floor-standing parallel-bar dip station**: two straight horizontal bars, parallel to each other, shoulder-width apart, at roughly waist-to-chest height, on a simple matte black steel frame with four feet. No wall mount, no machine, no rack, no pull-up bar above, no weight stack. (The owner's Domyos model name and rated load are promised but not yet received; the picture needs only the shape above.) Draw the station once in your head and keep it identical across the three prompts: same bar height, same frame, same colour.

**Equipment negatives, stated explicitly in each prompt** (the memory says this is what reliably works): no single straight bar (the straight-bar `dip` asset exists and must not be echoed); no Smith machine, rails or racked bar (the old `inverted-row` art is a machine bar and is what this batch replaces); no bench, no rings, no dumbbells.

## The three strips

Read each movement's cues first in `src/locales/en/seed.json` under `exercise.<id>.cues` (Phase 2, coach text) and make the form checkpoints match what the art shows. Camera and frame counts below are recommendations within the frame policy; depart only for a reason you state.

1. **`parallel-bar-dip`** — in `KNOWN_MISSING` today.
   Camera: three-quarter front, so both parallel bars read as two bars and the elbow depth stays visible. Frames: 4 (vertical pressing precedent). Start: supported on straight arms on both bars, shoulders depressed, body vertical, knees slightly bent and feet off the floor, slight forward lean of the torso. Descent: elbows bend and track back, torso leans slightly forward, shoulders stay down, controlled range (the coach's "comfortable shoulder range": upper arm roughly parallel to the bar at the bottom, not deeper). Bottom. Press back to the start. Never a straight single bar, never hands behind the body on a bench.

2. **`inverted-row`** — replaces the provisional machine-bar art; **not** in `KNOWN_MISSING`.
   Camera: side, as the existing prompt (the body line and bar height must stay readable). Frames: 4. The woman lies supine beneath the station gripping **one of the two parallel bars** overhand (the second bar reads behind it, slightly offset in depth so the side camera does not hide it), heels on the floor, body one rigid line from heels to shoulders, pulling the chest to the bar. Keep the existing prompt's technique section where it is still true; replace every machine/rail/racked-bar sentence with the station. Before overwriting `reference.png`, copy the current one to the scratchpad and say where; it is pipeline-generated (July batch), not owner-placed, but treat it as recoverable.

3. **`supported-knee-raise`** — in `KNOWN_MISSING` today.
   Camera: side or three-quarter, whichever keeps both the straight-arm support and the knee angle legible at 64 px; say which you chose and why. Frames: 3 (single-plane movement). Start: straight-arm support on both bars, shoulders depressed, body hanging vertical, legs straight and together. Top: both knees drawn up together toward the chest, pelvis tucked slightly, torso stable, arms still straight. Return: controlled lowering, legs not swinging. Both knees move together, never alternating (the alternating-limb collapse is a known model failure and must not be invited by the prose).

## Pipeline, as the memory already says

Generate via `scripts/generate-via-sol.mjs` with the goblet anchor. Convert with the scoped `--only` form, never a whole-tree run, and never `--help` on the scripts (grep the source). Run `update-manifest-dims.mjs` after conversion. Staleness check before converting. Fringe and near-white checks against the thresholds in memory. Append to `generation-run.log`. Look at each `reference.png` yourself before claiming a pose is right: an equipment or pose defect is a reject, not a ship.

**Attempts.** Up to three generations per id. A pose that fails three times ships nothing: report it as a gap. A wrong picture is worse than none (ruling §2, §3).

**Do not touch:** `src/**` except that both `KNOWN_MISSING` lists are the dev's to edit in the landing commit; report which ids to remove. Do not commit; report files produced, measured numbers, and attempts per id. The auditor and the dev follow.

**Shared tree.** Nobody else is writing under `public/assets/**` or the manifest. The dev is idle; if that changes you will be told.
