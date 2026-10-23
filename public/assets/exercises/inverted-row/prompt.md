# Inverted Row — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `inverted-row` |
| Category | Back Variants |
| Camera | `three-quarter-front` |
| Frames | 2 |
| Equipment | Parallel bars (two independent freestanding units, Domyos TS 100), set at hip height and a shoulder width apart |
| Status | `planned` |

## Provenance (23 Oct 2026)

Redrawn on 23 Oct 2026 for the athlete's actual station, a Decathlon Domyos TS 100: two independent, freestanding, height-adjustable bars (athlete/coach ruling `docs/programs/parallel-bars-station-ruling-2026-10-23.md`; art brief `docs/art/parallel-bar-station-redraw-brief-2026-10-23.md`; neutral grip and "hands at approximately shoulder width" per `docs/programs/inverted-row-grip-coach-ruling-2026-10-23.md`). Generated with `gpt-image-2.5-sunburst` through the Images edits endpoint, called directly with no orchestrator (`scripts/generate-images.mjs`, `--ref`). Two reference images were attached, in this order: the style anchor `goblet-squat/reference.png`, then the station photo, a 246 x 310 px crop of the owner's screenshot (`domyos-ts100-thumb.png`, sha256 3902d3043d2cda31...). Size 1536x1024, quality `max` (the highest tier documented for this model). Candidate 2 of 6, from the second row round (one invocation, six concurrent requests, 72.1 to 78.4 s per image, wall 79 s). The first row round (four candidates in the 12-request wave of the same day) was rejected: hands about 1.9 times shoulder width with the arms in a wide V, against the coach's "hands at approximately shoulder width". The round-2 prompt asks for a shoulder-width grip with each hand above its own shoulder, parallel arms, elbows travelling back close to her sides, and no ring at the base of the uprights. Accepted by the lead on 23 Oct 2026 after a full-size review. The Images API response names no snapshot, so the model is recorded as requested. The fenced prompt below has sha256 11127bf15703... (sent after the script's fixed style-and-reference preface). Two-frame strip by the owner's ruling of 21 Oct ("Two-frame strips"). It replaces the 21 Oct art, which did not match the athlete's station (see the ruling). In the landed art the grip reads about 1.3 times her shoulder span in frame 1 with the arms about 13 degrees apart (hand-read landmarks, image plane, plus or minus 20 percent), and in frame 2 the elbows flare mildly, about a hand-width outside the ribs; the coach set no elbow rule. The feet (two long low blocks per unit, end to end along the unit, each centred under its upright, with a thin collar only at the top of each lower upright) are a reading of the small photo crop, confirmed by the lead's 4x upscale. The full-size original photo had not arrived at landing: re-check the feet against it when it does.

## Prompt

```text
Create one wide instructional fitness illustration: a single horizontal strip
showing the SAME person performing one repetition, read left to right.

RENDERING STYLE (identical in every image):
Semi-realistic digital vector illustration. Smooth cel shading with soft
gradient blends. No visible outlines, no sketch linework, no cross-hatching, no
painterly brush texture, no halftone. Clean, premium, modern fitness-app
artwork. Even neutral studio lighting from the front-left. Soft form shading
only — no cast shadow on the ground, no dark occlusion pooling.

BACKGROUND:
Single flat solid chroma-key magenta #FF00FF, completely uniform and empty.
No floor, no ground line, no shadow cast onto the background, no gym
environment, no gradient, no vignette, no frame or border. The magenta is
ONLY the background: no magenta may appear anywhere in the artwork itself —
not in skin, hair, clothing, or equipment. No drop shadow, no glow, and no
halo of any kind may surround the figure or equipment — artwork edges end
crisply at the artwork, with pure background touching them directly.

CHARACTER (must be the same woman in every image and every frame):
One adult woman, athletic and lean, visible but not exaggerated muscle
definition, mid-to-late twenties. Warm medium-tan skin: highlight #FAC497,
midtone #EBA878, shadow #CE8254. Dark near-black brown hair, #2B201D with
#3F2F28 highlights, pulled into a high ponytail that hangs behind the shoulder
and follows the movement naturally. Softly defined realistic face, subtle
natural makeup, calm and confident neutral expression, mouth closed, eyes open
and looking in the direction the movement faces.

WARDROBE (identical in every image):
Steel denim-blue racerback sports bra, #2C4F6C, midriff exposed.
Deep navy-charcoal high-waisted full-length leggings, #31384A, highlights
#353C4E, shadows #1D222F.
Clean white low-profile sneakers with white soles, #FEFEFE, shading #E9E9EA.
No visible socks, no jewelry, no watch, no logos, no text or graphics on any
clothing.

EQUIPMENT RENDERING:
Matte dark charcoal metal #1D2025 with brushed chrome shafts and handles
#EFEFEF. Weight plates are mid-value charcoal gray #4A5058, never pure black.
Upholstery and bench pads matte near-black #1D2025. Every dark surface
carries a subtle cool rim light along its upper and outer edges so equipment
stays legible against dark app backgrounds. Simple, clean, realistic
proportions with believable weight and correct scale against the body.

COMPOSITION:
All figures stand on one shared invisible ground line, at exactly the same
scale. Each pose occupies its own exclusive vertical band running the full
height of the image: a wide column of solid background magenta separates it
from every neighboring pose on both sides, and no part of any pose —
including hands, feet, or equipment — may share a horizontal (left-right)
position with any part of another pose, even when the two sit at different
heights. A straight vertical line drawn anywhere in a gap must be able to
pass from the top of the image to the bottom without touching either
neighboring pose. No figure overlaps, touches, or is cropped by another. The
entire body is visible in every frame, including both feet. Generous
background margin above and below. Eye-level camera at an identical angle and
distance for every frame.

STRICTLY EXCLUDE:
Text, numbers, labels, captions, arrows, motion lines, panel borders, dividing
lines, grids, watermarks, logos, background objects, mirrors, other people,
extra or missing limbs, distorted hands, any magenta on the figure, clothing or equipment, drop shadows or glow halos around the figure, broken or hyperextended joints.

MOVEMENT FOR THIS IMAGE:
Exercise: Inverted Row
Camera: three-quarter-front, taken from the feet end of her body and slightly elevated: the camera stands beyond her feet, a little to one side and a little above, and looks very slightly down along her body, so that both units, one hand on each grip bar, and her straight body lying between the two units are all visible. It is not a pure side view and not an end-on view: the two grip bars never overlap into one.
Equipment: one pair of parallel bars only, drawn once for each figure. The pair is TWO SEPARATE, IDENTICAL, FREESTANDING UNITS that stand side by side, parallel to each other and about her shoulder width apart, with nothing joining them: no crossbar, no connecting frame, no arch and no rail between the two units. Each unit is matte dark charcoal steel tube. Its upper section is an inverted U: a straight horizontal grip bar whose rounded corners bend down into two legs. Those legs slide into two slightly wider lower uprights, one at each end of the unit. Each lower upright has a thin brushed-chrome collar where the leg enters it, a vertical row of small height-adjustment holes, and a small brushed-chrome locking knob. Each lower upright stands in the middle of its own low, flat, rectangular black steel foot. The feet lie lengthwise under the unit, parallel to the grip bar, and extend past the upright on both sides, so that each unit stands on two long, low feet set end to end. Copy the construction, the proportions, the uprights and the feet from the attached equipment image, but not its spacing: here the two units stand about her shoulder width apart, wide enough for her body to fit between them. Both units are set to exactly the same height: their grip bars are level with each other and at her hip height when she stands. No logo, label, sticker or text on the equipment. No connected rectangular frame, no arch-shaped station, no single bar, no pull-up bar above, no wall mount, no rack, no bench, no rings, no dumbbells, no other equipment.
SETUP IN BOTH FRAMES: She lies on her back on the ground line between the two units, under the grip bars, with her body running lengthwise along the units: one unit on each side of her torso. She lies with her head toward the left of the image and her feet toward the camera at the lower right, in both frames. The two units stand close together. The two grip bars are exactly as far apart as her shoulders are wide, so each hand grips its bar directly above the shoulder on the same side, and her torso only just fits between the feet of the two units, with a small clear gap on each side of her. This is a narrow, shoulder-width grip, not a wide grip. Her two arms are parallel to each other in both frames: each runs straight up from her shoulder to the bar directly above it, never spread outward and never in a V. She grips each bar with a neutral grip: the fingers and thumb wrap fully around the bar and the palms face each other, so the backs of the hands face outward. Her heels rest on the ground and her legs are straight, extending out past the near ends of the units, so her whole body is one rigid straight line from the heels to the shoulders, tilted at a shallow angle with the shoulders higher than the heels. Her head is neutral and in line with the spine, chin slightly tucked, mouth closed, her eyes looking along her body toward her feet. The uprights meet the feet cleanly: there is no ring, flange or collar at the bottom of any upright. The only collar is the thin one at the top of each lower upright, where the leg slides in.
Number of frames: 2, evenly spaced left to right.
FRAMING FOR THIS STRIP: draw EXACTLY 2 figures: one figure in the left half of the image and one figure in the right half, at exactly the same scale, each with its own complete pair of parallel bars (both units). Draw each figure together with its two units small enough that a clear empty magenta margin of at least 8 percent of the image width surrounds it on every side. Nothing, no hand, foot, hair, unit or foot of a unit, may touch or be cut off by the left, right, top or bottom edge of the image. A wide empty magenta gutter separates the two groups.

Frames:
1. Start position, arms straight. She hangs beneath the grip bars with both arms fully extended and parallel to each other, each hand gripping its bar directly above its own shoulder; her shoulders reach up toward the bars, her body is one rigid straight line from the heels to the shoulders, hips level, only the heels on the ground.
2. Top position. Her torso is pulled upward between the bars: her chest comes up between the two grip bars to bar height, the elbows bend and travel back close to her sides, brushing her ribs, and both arms stay parallel to each other, never flared out. The shoulder blades are squeezed together and the body is still one rigid straight line from the heels to the shoulders: hips neither sagging nor piked, only the heels on the ground. Head neutral and in line with the spine, never thrown back, mouth closed. The two frames must look clearly different: in frame 2 her chest is up at bar height and her body is much more steeply inclined than in frame 1.

TECHNIQUE — must be correct in every frame:
- The body forms one rigid straight line from the heels to the shoulders in both frames: the hips never sag toward the ground and never pike upward.
- Only the heels touch the ground and the legs stay straight.
- She is between the two units with one hand on each grip bar, never both hands on the same bar, and the bars never move.
- Neutral grip: the palms face each other and the fingers and thumb wrap around the bar. The hands are only a shoulder width apart, each directly above its own shoulder: a narrow grip, never a wide grip.
- Her arms stay parallel to each other in both frames, never a V and never flared; in the top position the elbows travel back close to her sides.
- In the top position the chest comes up between the bars with the shoulder blades squeezed together.
- The head stays neutral, in line with the spine, chin slightly tucked, never thrown back; the mouth stays closed.
- The uprights have no ring at the bottom; the only collar is the thin one at the top of each lower upright.
- Both frames show the same two units at the same size, the same height setting, the same spacing and the same color, from the same camera angle; the two units are never joined.
```

## Form checkpoints (QA)

- [ ] Two frames: arms straight, then torso pulled upward between the bars
- [ ] One hand on the grip bar of each unit (neutral grip, palms facing each other, fingers wrapped around the bar, never both hands on one bar); her body lies between the two units; the bars never move
- [ ] Frame 1: hands about shoulder width, each roughly above its own shoulder, arms near parallel (the landed art reads about 1.3 times her shoulder span, arms about 13 degrees apart; a clear V fails)
- [ ] Body one rigid straight line from heels to shoulders in both frames; hips neither sag nor pike; only the heels on the ground
- [ ] Top: chest up at bar height between the bars, elbows travel back and the shoulder blades squeeze together; a mild elbow flare (about a hand-width outside the ribs) is accepted, the coach set no elbow rule
- [ ] Head neutral and in line with the spine, never thrown back; mouth closed
- [ ] Station: two separate, identical freestanding units (inverted-U grip bar on two adjustable uprights, each upright on a low flat foot), set to the same height, close together (about a shoulder width apart); nothing joins them. No ring at the base of the uprights (only the thin collar at the top joint). No connected frame, arch, single bar, pull-up bar, wall mount, rack, bench, rings, dumbbells, logo or text
- [ ] Both frames show the same units at the same size, height, spacing and color
- [ ] Same face, hair, wardrobe, and body proportions in both frames; both figures the same scale
- [ ] Nothing touches or is cut off by an image edge
- [ ] Readable as an inverted row at 64 px wide
