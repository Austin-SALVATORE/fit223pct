# Art brief — model bake-off and two-frame round (21 Oct 2026)

**Authority.** Owner, 21 Oct afternoon: "Two-frame strips" (chosen after round 1 failed), then: "this generation took 30m, I don't want this happened again, if we need to change the model behind change it, I don't care the price, I need it to be generated fast and in quality." That message is the owner's explicit authorization to change the generation model and route. Price is not a constraint; wall-clock time and correctness are.

**What exists when this is done.** In the scratchpad only: every candidate image, a labelled contact sheet, a timing table per route, a ranking per movement with reasons, and a recommended standard route. Nothing lands in `public/assets/**` from this run; landing is a separate step after the lead and the owner have looked.

## Why round 1 failed (do not repeat)

Source: `~/.claude/agent-memory/asset-generator/parallel-bar-batch.md` (read it first) and the nine rejected attempts in the session scratchpad (`att{1,2,3}-{dip,row,knee}.png`).

1. **Composition.** Three or four figures per image, each with a complete station, do not fit across 1536 px; the first figure was cut at the left edge in all nine.
2. **Standing archetype.** "Hands on bars at hip height" renders as a woman standing between the bars; "feet off the floor" lost every time (knee raise frames 1 and 3, dip frame 1).
3. **Dip depth.** The bottom frame barely bent the elbows.
4. **Row equipment.** The model invented a high cantilevered bar; frames near-identical; head thrown back.
5. **Time.** `scripts/generate-via-sol.mjs` is strictly sequential with throttle sleeps, and every call goes through `gpt-5.6-sol` at `effort: high` with the renderer left on the tool's default: 1.3–3.7 min per image, then a human-speed inspect-rewrite loop, three rounds, one hung request. 30 minutes.

## Routes to compare, all in parallel

Models live on this account today (lead queried `GET /v1/models`, 21 Oct 16:25): image `gpt-image-2`, `gpt-image-2-2026-04-21`, `gpt-image-2.5-sunburst(-2026-09-08)`, `gpt-image-2.5-flare(-2026-09-08)`, `chatgpt-image-latest`; orchestrators up to `gpt-6.1-sol`, `gpt-6-sol`, `gpt-6-astra`. Re-query if a call says a model is unknown. Read the current API reference for the Images edits endpoint and the Responses `image_generation` tool before writing the calls; these 2.5 models are newer than the pipeline, so do not assume parameters, and read error bodies rather than guessing.

| Route | Call | Renderer |
|---|---|---|
| R0 baseline | Responses, `gpt-5.6-sol`, effort high, `image_generation` tool, renderer unset | tool default (today's pipeline) |
| R1 | Responses, `gpt-6.1-sol`, `image_generation` tool with `model` set | `gpt-image-2.5-sunburst` |
| R2 | Images edits endpoint, direct, no orchestrator | `gpt-image-2.5-sunburst` |
| R3 | Images edits endpoint, direct | `gpt-image-2.5-flare` |
| R4 | Images edits endpoint, direct | `gpt-image-2` |

Every route gets the goblet-squat anchor as its reference image, size 1536×1024 (or the route's nearest landscape size), highest quality setting, and **two candidates per movement per route** (use `n` where the endpoint supports it). One extra variant, knee raise only: **R2k** = R2 plus the correct middle figure of `att3-knee.png` (crop it) as a second reference image labelled in the prompt as "the correct supported position and station".

**Speed rules.** Write your own runner in the scratchpad; do not edit anything under `scripts/` in this run. Fire all requests concurrently with a cap of about 10 in flight, exponential backoff on 429, a 5-minute timeout per request, and drop a route after two configuration errors instead of debugging it. Log start, end, seconds and outcome per request to a CSV. Wall-clock budget for the whole run: 15 minutes.

## Movements and prompts (two frames each)

Keep the locked STYLE BLOCK byte-identical (`_templates/prompt.template.md`); change only the frame count and the movement section. In every prompt: **exactly two figures, one in the left half and one in the right half, each with its own complete station drawn small enough that a clear empty magenta margin of at least 8% surrounds it; nothing touches any image edge.**

**The station** (all three parallel-bar movements): a freestanding floor-standing parallel-bar dip station, two straight horizontal bars parallel to each other about shoulder-width apart, on a matte black steel frame with four feet. No wall mount, no rack, no pull-up bar above, no single bar, no rails, no bench, no rings.

**Supported positions** (dip top, knee raise both frames): state the support in terms the standing archetype cannot satisfy: her weight is on her straight locked arms; her shoulders are clearly above the bars; **the soles of her shoes are higher than the station's feet, with open magenta visible beneath them; she is not standing.**

1. **`parallel-bar-dip`** (camera three-quarter front). Frame 1, top: straight-arm support, shoulders down away from the ears, slight forward lean, knees softly bent with feet clear of the floor. Frame 2, bottom: **elbows bent to about 90 degrees, upper arms roughly parallel to the bars, shoulders lowered to about bar height, elbows pointing back, torso leaning forward**, never deeper than that (coach: "stay in a comfortable shoulder range; don't sink too deep").
2. **`inverted-row`** (camera side). She lies beneath the low station **between the two bars, one hand on each bar, palms facing each other**, heels on the floor, body one rigid straight line from heels to shoulders. Frame 1: arms straight. Frame 2: chest pulled up toward the bars, elbows back, shoulder blades squeezed, body still straight. **Head neutral, in line with the spine, never thrown back; mouth closed.** The bars are low (about her hip height when standing). This grip is the team's depiction choice, not the coach's; it will be put to the owner.
3. **`supported-knee-raise`** (camera three-quarter front or side, your choice; say why). Frame 1: straight-arm support, legs straight and hanging, feet clearly off the floor. Frame 2: both knees raised together to about hip height, thighs near horizontal, pelvis tilted back slightly, arms still straight, no swing.
4. **`bicycle-crunch`** and **`mountain-climber`**: the movement sections exactly as `docs/art/alternating-limb-retry-brief-2026-10-21.md` (one side only, two frames). Run these on R1–R3 only. Another generator instance is running their one-shot attempt on the old route right now; you produce candidates only, in the scratchpad.

## Review and report

Look at every candidate yourself at full size and at 64 px. Reject by the same hard gates as always: wrong pose, wrong equipment, a cut-off figure, a different woman, extra or missing figures. Build one contact sheet (downscaled grid, each tile labelled movement / route / candidate, rejected tiles marked) as a single PNG in the scratchpad.

Report: the timing table (median and max seconds per route, and the run's total wall time), errors per route, per movement the best candidate's path with one line on why it passes, the rejects' reasons in one line each, and your recommended standard route with its numbers. Say plainly if no route produced a passing candidate for a movement.

**Do not touch** `public/assets/**`, the manifest, `scripts/**`, `generation-run.log`, or `src/**` in this run. Do not commit. The other generator instance owns `public/assets/**` until it reports.
