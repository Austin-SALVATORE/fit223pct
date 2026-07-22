# Single-Arm Triceps Pushdown — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `single-arm-triceps-pushdown` |
| Category | Arms Variants |
| Camera | `machine-three-quarter` |
| Frames | 4 |
| Equipment | Cable machine (single black handle) |
| Status | `planned` |

> Third member of the pushdown cluster, with `triceps-pushdown` (straight
> bar) and `rope-triceps-pushdown`. One hand on a single handle and the free
> hand resting on the hip are the differentiators.

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
scale, evenly spaced with clear background gaps between them. No figure overlaps,
touches, or is cropped by another. The entire body is visible in every frame,
including both feet. Generous background margin above and below. Eye-level camera at
an identical angle and distance for every frame.

STRICTLY EXCLUDE:
Text, numbers, labels, captions, arrows, motion lines, panel borders, dividing
lines, grids, watermarks, logos, background objects, mirrors, other people,
extra or missing limbs, distorted hands, any magenta on the figure, clothing or equipment, drop shadows or glow halos around the figure, broken or hyperextended joints.

MOVEMENT FOR THIS IMAGE:
Exercise: Single-Arm Triceps Pushdown
Camera: machine three-quarter view, the working arm on the near side so the
single handle, the cable line and the elbow angle stay readable, and the
free hand on the hip stays visible in every frame.
Equipment: a matte black upright column with a brushed chrome cable running
from a high pulley at the top of the column down to one simple black
handle, held in the near hand with a neutral grip, palm facing the body's
midline. The other hand rests on the hip. The figure stands one short step
back from the column so the cable stays taut.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start. Standing tall facing the column, feet hip-width apart and flat,
   knees soft, a very slight forward lean from the hips. The working elbow
   is bent to roughly 90 degrees, the handle at chest height, palm facing
   the midline in a neutral grip, upper arm vertical and pinned against
   the ribs. The free hand rests on the hip.
2. Early extension, the working elbow opened to roughly 120 degrees, the
   handle driven down to just below the ribs, palm still facing the
   midline. The upper arm has not moved; shoulders stay level and square
   to the column. Free hand still on the hip.
3. Lockout. The working arm fully extended but not hyperextended, the
   handle beside the front of the thigh, wrist straight and in line with
   the forearm, palm still facing the midline. Upper arm still vertical
   and pinned, shoulders level and square — no twist toward the working
   side. Free hand still on the hip.
4. Controlled return, the working elbow bent back to roughly 110 degrees,
   the handle rising on the same path under tension, neutral grip
   unchanged, cable taut, stance and hip hand unchanged.

TECHNIQUE — must be correct in every frame:
- The working upper arm stays vertical and pinned to the ribs in every
  frame; only the forearm moves.
- Shoulders and hips stay level and square to the column — no rotation or
  side lean toward the working arm.
- The free hand stays on the hip in every frame.
- Neutral grip, palm facing the body's midline, wrist straight for the
  whole rep.
- The cable runs from the high pulley in a straight taut line in every
  frame.
```

## Form checkpoints (QA)

- [ ] Only one hand on the handle — the other hand clearly on the hip in all
      four frames
- [ ] A single black handle — visibly not a bar and not a rope
- [ ] Shoulders level and square in all four frames — no twist or side lean
- [ ] Working upper arm vertical and pinned; elbow fully extended but not
      hyperextended at lockout
- [ ] Neutral grip, palm facing the midline, wrist straight
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a single-arm pushdown at 64 px wide
