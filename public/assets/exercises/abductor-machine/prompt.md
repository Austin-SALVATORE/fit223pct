# Abductor Machine — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `abductor-machine` |
| Category | Lower Body Variants |
| Camera | `machine-three-quarter` |
| Frames | 4 |
| Equipment | Abductor / adductor machine |
| Status | `planned` |

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

MOVEMENT FOR THIS IMAGE:
Exercise: Abductor Machine
Camera: machine three-quarter view so the seated frame, both knee pads and
the outward travel of the legs are all clearly readable.
Equipment: one matte black seated frame with two padded black knee pads on
swinging arms. The figure sits upright on the seat with each knee pad resting
against the OUTSIDE of the corresponding knee, feet on the foot rests, hands
gripping the handles beside the seat. The machine rests on the same shared
ground line in every frame, drawn at an identical scale, angle and position;
only the legs and the pad arms move between frames.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start. Seated tall, knees together, thighs parallel, both pads touching
   the outside of the knees, feet on the foot rests, torso upright.
2. Legs pressing outward about halfway, the pad arms swinging apart, torso
   unchanged.
3. Peak. Knees pressed as far apart as the hips allow, pads at their widest,
   torso still upright with no leaning back.
4. Controlled return, knees almost back together, pads still in contact with
   the outside of the knees.

TECHNIQUE — must be correct in every frame:
- The pads sit on the OUTSIDE of the knees and the legs press OUT — the
  exact opposite of the adductor machine.
- Movement comes only from the hips; the torso stays upright and still.
- Feet stay on the foot rests; only the thighs swing.
- The pads never lose contact with the outside of the knees.
- The return is controlled — the knees never snap back together.
```

## Form checkpoints (QA)

- [ ] Pads rest on the OUTSIDE of the knees in all four frames
- [ ] Sequence reads knees together, pressed wide apart, returning — the legs move OUT
- [ ] Unmistakably distinct from the adductor machine — pads outside the knees and legs pressing out, never squeezing in
- [ ] Torso upright and still in all four frames — no leaning back at the peak
- [ ] Machine identical scale and position in all four frames
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as seated hip abduction at 64 px wide
