# Parallel Bar Dip — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `parallel-bar-dip` |
| Category | Chest Variants |
| Camera | `three-quarter-front` |
| Frames | 2 |
| Equipment | Parallel bars (two independent freestanding units, Domyos TS 100) |
| Status | `planned` |

## Provenance (23 Oct 2026)

Redrawn on 23 Oct 2026 for the athlete's actual station, a Decathlon Domyos TS 100: two independent, freestanding, height-adjustable bars (athlete/coach ruling `docs/programs/parallel-bars-station-ruling-2026-10-23.md`; art brief `docs/art/parallel-bar-station-redraw-brief-2026-10-23.md`). Generated with `gpt-image-2.5-sunburst` through the Images edits endpoint, called directly with no orchestrator (`scripts/generate-images.mjs`, `--ref`). Two reference images were attached, in this order: the style anchor `goblet-squat/reference.png`, then the station photo, a 246 x 310 px crop of the owner's screenshot (`domyos-ts100-thumb.png`, sha256 3902d3043d2cda31...). Size 1536x1024, quality `max` (the highest tier documented for this model). Candidate 1 of 4, from one concurrent wave of 12 requests (dip, inverted row and supported knee raise, four candidates each, across two invocations started together; 71.6 to 77.8 s per image, wall about 77 s). Accepted by the lead on 23 Oct 2026 after a full-size review. The Images API response names no snapshot, so the model is recorded as requested. The fenced prompt below has sha256 6fcf92270390... (sent after the script's fixed style-and-reference preface). Two-frame strip by the owner's ruling of 21 Oct ("Two-frame strips"). It replaces the 21 Oct art, which did not match the athlete's station (see the ruling). The feet (two long low blocks per unit, end to end along the unit, each centred under its upright, with a thin collar only at the top of each lower upright) are a reading of the small photo crop, confirmed by the lead's 4x upscale. The full-size original photo had not arrived at landing: re-check the feet against it when it does.

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
Exercise: Parallel Bar Dip
Camera: three-quarter-front, slightly elevated: the camera stands in front of her and a little to one side, a little above her hip height, and looks very slightly down, so that the gap between the two units and the feet of both units stay visible and the two units read as two separate pieces.
Equipment: one pair of parallel bars only, drawn once for each figure. The pair is TWO SEPARATE, IDENTICAL, FREESTANDING UNITS that stand side by side, parallel to each other and about her shoulder width apart, with nothing joining them: no crossbar, no connecting frame, no arch and no rail between the two units. Each unit is matte dark charcoal steel tube. Its upper section is an inverted U: a straight horizontal grip bar whose rounded corners bend down into two legs. Those legs slide into two slightly wider lower uprights, one at each end of the unit. Each lower upright has a thin brushed-chrome collar where the leg enters it, a vertical row of small height-adjustment holes, and a small brushed-chrome locking knob. Each lower upright stands in the middle of its own low, flat, rectangular black steel foot. The feet lie lengthwise under the unit, parallel to the grip bar, and extend past the upright on both sides, so that each unit stands on two long, low feet set end to end. Copy the construction, the proportions, the uprights and the feet from the attached equipment image, but not its spacing: here the two units stand about her shoulder width apart, wide enough for her body to fit between them. Both units are set to exactly the same height: their grip bars are level with each other and at her hip height when she stands. No logo, label, sticker or text on the equipment. No connected rectangular frame, no arch-shaped station, no single bar, no pull-up bar above, no wall mount, no rack, no bench, no rings, no dumbbells, no other equipment.
She is between the two units, one unit on each side of her body, and each unit's grip bar runs front to back in the direction she faces: in the three-quarter view each unit shows one upright nearer the camera and one farther.
Number of frames: 2, evenly spaced left to right.
FRAMING FOR THIS STRIP: draw EXACTLY 2 figures: one figure in the left half of the image and one figure in the right half, at exactly the same scale, each with its own complete pair of parallel bars (both units). Draw each figure together with its two units small enough that a clear empty magenta margin of at least 8 percent of the image width surrounds it on every side. Nothing, no hand, foot, hair, unit or foot of a unit, may touch or be cut off by the left, right, top or bottom edge of the image. A wide empty magenta gutter separates the two groups.

Frames:
1. Top position, straight-arm support. Her whole body weight is carried on her straight, locked arms, with one hand on the top of the grip bar of each unit; her shoulders are clearly above the bars, pressed down away from the ears, and her torso leans slightly forward. Her knees are softly bent and her feet are off the ground: the soles of her shoes are higher than the tops of the units' steel feet, with open magenta visible beneath them. She is not standing.
2. Bottom position. Still held up by her hands on the grip bars, with her feet still off the ground and the soles of her shoes still higher than the tops of the units' steel feet, with open magenta visible beneath them. The elbows are bent to about 90 degrees, the upper arms roughly parallel to the bars, the elbows pointing back, the shoulders lowered to about bar height, the torso leaning forward. This is the deepest point: she never sinks deeper than this comfortable shoulder range.

TECHNIQUE — must be correct in every frame:
- Her weight is on her hands and arms, never on her feet: in both frames her feet are off the ground.
- In the top position the arms are straight and locked, the shoulders are down away from the ears and clearly above the grip bars.
- In the bottom position the elbows are bent to about 90 degrees, the upper arms are roughly parallel to the grip bars and the shoulders are at about bar height, no deeper.
- The elbows point back along the body and do not flare out to the sides; the torso leans forward in both frames.
- The head stays neutral with the eyes looking ahead, and the wrists stay straight on top of the grip bars.
- One hand rests on the grip bar of each unit: one hand per bar, never both on the same bar.
- Both frames show the same two units at the same size, the same height setting, the same spacing and the same color, from the same camera angle; the two units are never joined.
```

## Form checkpoints (QA)

- [ ] Two frames: top (straight-arm support) then bottom (elbows bent to about 90 degrees)
- [ ] Her weight is on her hands and arms in both frames: feet off the ground, open space beneath the shoes, she is not standing
- [ ] Top: arms straight and locked, shoulders above the bars and down away from the ears, slight forward lean
- [ ] Bottom: elbows about 90 degrees pointing back, upper arms roughly parallel to the bars, torso leaning forward, no deeper
- [ ] One hand on the grip bar of each unit; her body is between the two units
- [ ] Station: two separate, identical freestanding units (inverted-U grip bar on two adjustable uprights, each upright on a low flat foot), set to the same height, a little wider apart than her shoulders; nothing joins them. No connected frame, arch, single bar, pull-up bar, wall mount, rack, bench, rings, dumbbells, logo or text
- [ ] Both frames show the same units at the same size, height, spacing and color
- [ ] Same face, hair, wardrobe, and body proportions in both frames; both figures the same scale
- [ ] Nothing touches or is cut off by an image edge
- [ ] Readable as a parallel-bar dip at 64 px wide
