# Cable Woodchop — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `cable-woodchop` |
| Category | Core |
| Camera | `machine-three-quarter` |
| Frames | 4 |
| Equipment | Cable machine |
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
Exercise: Cable Woodchop
Camera: machine-three-quarter view so the cable path from the high pulley down
across the body stays readable in every frame.
Equipment: a matte black upright column with a brushed chrome cable running
from a pulley set above head height and a simple black handle, gripped with both
hands, one over the other. The figure stands side-on to the column, about an
arm's length away.
Number of frames: 4, evenly spaced left to right.
All four figures stand on the same shared invisible ground line as each
other, at exactly identical scale and spacing, with one single cable column
drawn at the left end of the strip.

Frames:
1. Start, high position. Feet slightly wider than shoulder width, knees softly
   bent, weight even. Both hands on the handle up and out beyond the shoulder
   nearest the column, arms nearly straight, the ribcage rotated toward the
   machine, hips still roughly square, spine long, gaze on the handle.
2. Early chop. The ribcage and then the hips begin rotating away from the
   column, the handle travelling diagonally down in front of the chest with the
   arms staying long. The rear heel is starting to pivot off the ground and the
   knees are bending a little further.
3. Finish, low position. The handle has been driven diagonally down to just
   outside the hip furthest from the column, arms nearly straight, chest and
   pelvis now rotated together to face away from the machine, rear heel fully
   pivoted with the knee turning in line with the toes, knees bent, spine still
   long and neutral rather than crunched forward.
4. Controlled return. Rotating back toward the column with the handle passing
   back up in front of the chest at mid-height, the resistance being resisted
   rather than released, arms still long, torso still tall.

TECHNIQUE — must be correct in every frame:
- The arms stay long throughout — the movement is driven by rotation of the
  trunk and hips, not by pulling with the elbows.
- The chest and pelvis rotate together; the lower back is never twisted against
  a fixed pelvis.
- The rear heel pivots so the hip and knee can rotate in line with the toes.
- The spine stays long and neutral — the figure rotates and hinges slightly, she
  does not collapse into a side bend.
- The cable stays a straight, continuous line from the pulley to the hands in
  every frame.
```

## Form checkpoints (QA)

- [ ] Cable runs as one straight line from the high pulley to the hands in all
      four frames
- [ ] Arms stay long and nearly straight throughout
- [ ] Rear heel pivots by the finish frame; knee tracks over the toes
- [ ] Chest and pelvis rotate together, no lumbar twisting
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a high-to-low cable chop at 64 px wide
