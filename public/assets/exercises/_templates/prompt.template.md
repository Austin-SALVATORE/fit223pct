# Prompt template

Every exercise `prompt.md` is built from two parts:

1. **STYLE BLOCK** — copied verbatim, byte for byte, into every prompt. Never
   edited per exercise. If it needs to change, it changes here first and every
   affected asset is regenerated.
2. **MOVEMENT BLOCK** — the only per-exercise content: camera, equipment,
   frame count, frame-by-frame description, technique checkpoints.

The palette below was sampled directly from the approved
`goblet-squat/reference.png`, which is the visual ground truth for the library.

---

## STYLE BLOCK (verbatim — do not edit per exercise)

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
Pure flat white #FFFFFF, completely empty. No floor, no ground line, no shadow,
no gym environment, no gradient, no vignette, no frame or border.

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
Matte near-black metal #1D2025 with brushed chrome shafts and handles #EFEFEF.
Upholstery and bench pads matte near-black #1D2025. Simple, clean, realistic
proportions with believable weight and correct scale against the body.

COMPOSITION:
All figures stand on one shared invisible ground line, at exactly the same
scale, evenly spaced with clear white gaps between them. No figure overlaps,
touches, or is cropped by another. The entire body is visible in every frame,
including both feet. Generous white margin above and below. Eye-level camera at
an identical angle and distance for every frame.

STRICTLY EXCLUDE:
Text, numbers, labels, captions, arrows, motion lines, panel borders, dividing
lines, grids, watermarks, logos, background objects, mirrors, other people,
extra or missing limbs, distorted hands, broken or hyperextended joints.
```

---

## MOVEMENT BLOCK (per exercise)

```text
MOVEMENT FOR THIS IMAGE:
Exercise: <Display Name>
Camera: <camera value>
Equipment: <equipment description, or "none — bodyweight only">
Number of frames: <N>, evenly spaced left to right.

Frames:
1. <position>
2. <position>
...

TECHNIQUE — must be correct in every frame:
- <cue>
- <cue>
```

---

## Camera vocabulary

Pick exactly one. Never invent a new value without adding it here first.

| Value | Use for |
|---|---|
| `side` | Hinges, squats, presses where the spine and bar path must be read |
| `three-quarter-front` | Vertical presses and stance work needing torso visibility |
| `three-quarter-side` | Unilateral lower body where both legs must stay separable |
| `front` | Lateral movements where the frontal plane carries the information |
| `bench-side` | Anything performed lying on a bench |
| `machine-three-quarter` | Machine and cable work where the stack and path matter |
| `floor-side` | Floor work performed lying or on hands and knees |

## Frame-count policy

| Frames | Movement type | Examples |
|---:|---|---|
| 6 | Full-range compound reps | squat, deadlift, bench press, pull-up, row, overhead press |
| 4 | Short-range isolation | curls, raises, pushdowns, calf raises, flyes, crunches |
| 3 | Alternating or asymmetric holds | dead bug, bird dog |
| 2 | Static holds — entry and hold only | plank, side plank |

## Equipment library

Keep these descriptions identical wherever the equipment appears.

| Equipment | Description to use |
|---|---|
| Dumbbell | Matte black hexagonal-head dumbbell with a brushed chrome knurled handle |
| Barbell | Long brushed chrome bar with matte black bumper plates, evenly loaded both sides |
| Kettlebell | Matte black cast-iron kettlebell with a smooth rounded handle |
| Flat bench | Low matte black padded bench on a simple black steel frame |
| Incline bench | Matte black padded bench set to roughly 30 degrees on a black steel frame |
| Cable machine | Matte black upright column, brushed chrome cable, simple black handle or straight bar attachment |
| Lat pulldown | Matte black seated frame with thigh pad, chrome cable, long straight black bar |
| Leg press | Matte black angled sled with a large flat footplate and black seat |
| Leg extension / curl machine | Matte black seated frame with a padded ankle roller and thigh pad |
| Pull-up bar | Simple straight chrome horizontal bar, supports out of frame |
| Smith / press machine | Matte black frame with chrome guide rails and simple black handles |
| EZ bar | Short brushed chrome bar with a shallow zigzag bend, matte black plates both sides |
| Rope attachment | Simple black two-ended rope attachment with rounded black end caps, on a brushed chrome cable |
| Decline bench | Matte black padded bench declined roughly 15 degrees head-down on a black steel frame, with a padded black ankle roller at the raised foot end |
| Plyo box / step | Simple matte black rectangular box with flat vertical sides, knee height |
| Hack squat machine | Matte black angled sled with a large flat footplate, black shoulder pads, and chrome guide rails |
| T-bar row | Brushed chrome bar anchored to the ground at one end, matte black plates and a simple black close-grip handle at the other |
| Abductor / adductor machine | Matte black seated frame with two padded black knee pads on swinging arms |
| Pec deck / rear delt machine | Matte black seated frame with an upright back pad and two vertical padded black arm levers |
| Resistance band | Long matte near-black elastic resistance band with a smooth matte surface, drawn visibly taut under load |

## Status

Every new `prompt.md` starts at `planned`. It does not advance because an
attractive image came back — see the status model in the Illustration Design
Bible.
