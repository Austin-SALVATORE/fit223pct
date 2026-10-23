# Art brief — parallel-bar redraw on the owner's Domyos TS 100 (23 Oct 2026)

**Authority.**
- `docs/programs/parallel-bars-station-ruling-2026-10-23.md`, including its photo follow-up. All three parallel-bar drawings must match the athlete's actual **Decathlon Domyos TS 100**: two independent, freestanding, height-adjustable bars. The athlete's original photo is the reference. The follow-up says: "Match the two independent freestanding bars, adjustable uprights and base geometry. Prioritize accurate exercise mechanics and consistent equipment structure across the three drawings. Exact branding and cosmetic details are unnecessary."
- `docs/programs/inverted-row-grip-coach-ruling-2026-10-23.md`. The inverted row uses a neutral grip: body between the two bars, one hand gripping each bar, hands about shoulder width, torso pulled upward, trunk stable. Both bars sit at the same height.
- Owner, 21 Oct: price is no constraint; wall-clock time and correctness are. Generate best-of-N concurrently, never in a serial generate-inspect-regenerate loop.
- Coach: do not change any cue or prescription to suit the artwork.

**What exists when this is done.**
- Three replaced two-frame strips in `public/assets/exercises/{parallel-bar-dip,inverted-row,supported-knee-raise}/`. Each has a prompt.md with the byte-identical locked STYLE BLOCK, a reference.png, AVIFs, metadata.json and manifest dimensions.
- One contact sheet of every candidate, in the scratchpad.
- Nothing is committed.

## The station, from the owner's photo

Reference file, passed with `--ref`: `/Users/austinzhang/.claude/agent-memory/asset-generator/references/domyos-ts100-thumb.png`.

The lead's description of what the photo shows: 

Two separate, identical units stand side by side and parallel, with nothing joining them. Each unit is matte black steel tube. Its upper section is an **inverted U**: the straight horizontal top is the grip bar, and its rounded corners bend down into two legs. Those legs slide into two slightly wider **lower uprights**, one at each end of the unit. Each lower upright has a vertical row of small adjustment holes and a small silver **pop-pin knob** that locks the height. Each lower upright stands on a **low, flat, rectangular floor foot**. Copy the feet and proportions from the photo; do not invent a frame, crossbar, arch or rail between the two units. In every drawing the grip bars sit at the same height, about the woman's hip height when standing, and the two units are about her shoulder width apart.

The current reference file is a **246 × 310 px thumbnail**, cropped from the owner's screenshot of the coach conversation (pasted 23 Oct 11:16). It shows the uprights, the U-shaped grips and the knobs clearly. At this size the feet are hard to read: whether each foot runs across the unit or along it. The full-size original has been requested from the owner. If it arrives, it replaces this file at a path the lead gives you, and the feet in the drawings must then match it.

Rules common to all three strips:
- Draw two separate, identical freestanding units. Nothing connects them: no crossbar, no frame, no arch.
- Every frame of every strip shows the same units at the same height setting, the same spacing and the same colour. The coach requires one consistent structure.
- Draw no logo, text or branding.
- State these negatives in every prompt: no connected rectangular frame, no arch-shaped station, no single bar, no pull-up bar above, no wall mount, no rack, no bench, no rings, no dumbbells.

## Camera: both units read as two separate pieces in every frame

- **Dip and knee raise** share one camera: three-quarter front, slightly elevated. The gap between the two units and both bases must be visible.
- **Inverted row**: three-quarter from her feet end, slightly elevated. Both units, one hand on each bar, and her straight body lying between the units must all be visible. **Do not use a pure side view.** It stacks the two bars into one and makes the grip ambiguous, which is the question this redraw closes.

## The three strips: two frames each, exactly two figures per image

Put this in every prompt: exactly two figures, one in the left half and one in the right half, each with its own complete station (both units). Draw them small enough that a clear empty magenta margin of at least 8% surrounds each one, and let nothing touch any image edge.

For the supported positions (dip top, knee raise both frames), state:
- her weight is on her straight, locked arms;
- her shoulders are clearly above the bars;
- the soles of her shoes are higher than the units' bases, with open magenta visible beneath them;
- she is not standing.

1. **`parallel-bar-dip`**
   - Frame 1, top: straight-arm support, shoulders down away from the ears, slight forward lean, knees softly bent with feet clear of the floor.
   - Frame 2, bottom: elbows bent to about 90 degrees, upper arms roughly parallel to the bars, shoulders lowered to about bar height, elbows pointing back, torso leaning forward. Never deeper than that (coach: "stay in a comfortable shoulder range; don't sink too deep").
2. **`inverted-row`**
   - Setup for both frames: she lies beneath the bars, between the two units, one hand on each bar, palms facing each other (neutral grip), hands about shoulder width, heels on the floor, body one rigid straight line from heels to shoulders. Head neutral and in line with the spine, mouth closed.
   - Frame 1: arms straight.
   - Frame 2: torso pulled upward between the bars, elbows back, shoulder blades squeezed, body still straight.
3. **`supported-knee-raise`**
   - Frame 1: straight-arm support, legs straight and hanging, feet clearly off the floor.
   - Frame 2: both knees raised together to about hip height, thighs near horizontal, pelvis tilted back slightly, arms still straight, no swing.

Before writing each prompt, read that movement's cues in `src/locales/en/seed.json`, and make the form checkpoints in prompt.md match what the art shows.

## Run

```sh
node scripts/generate-images.mjs --only parallel-bar-dip --only inverted-row --only supported-knee-raise \
  --candidates 4 --ref /Users/austinzhang/.claude/agent-memory/asset-generator/references/domyos-ts100-thumb.png --out <scratchpad dir>
```

This is one run, with all 12 requests concurrent and the sunburst / max / 1536×1024 defaults. If the API rejects the reference, stop and report the error body. Never fall back to drawing without the photo; that would be guessing the station, which the ruling forbids.

## Review: reject a candidate on any of these hard gates

- The units are joined by anything, or are drawn as a rectangular frame, an arch or a single bar.
- The base, uprights or bar differ in structure from the photo, or the station differs between frames or between strips.
- Row: both hands on one bar, body not between the units, an overhand grip, or the head thrown back.
- Dip or knee raise: feet on the floor, a standing pose, or a dip deeper than about 90°.
- A figure is cut off, the woman is different, a figure is extra or missing, or there is any text or logo.

Look at every candidate at full size and at 64 px. Build one contact sheet with labelled tiles and the rejects marked.

## Landing

1. Run the staleness check first.
2. Land the best passing candidate per id as its reference.png.
3. Run `convert-assets.mjs --only <id>` for each id. Never run it on the whole tree, and never with `--help`.
4. Run `update-manifest-dims.mjs`.
5. Check the fringe and near-white thresholds from memory.
6. Append to `generation-run.log`.
7. Confirm `npx vitest run` and `npm run typecheck` are green.

If a movement has no passing candidate, land nothing for it and report it. One more concurrent round of 4 is allowed for that id, and no more without asking.

**Do not touch** src/**, scripts/**, any other asset, or the dev's files (src/locales, src/data/seed). Do not commit.

**Report:**
- the contact-sheet path;
- per id, the chosen candidate and one line on why it passes;
- each reject with a one-line reason;
- the run's wall-clock time;
- the converter numbers;
- the suite counts.
