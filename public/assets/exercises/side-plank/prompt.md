# Side Plank — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `side-plank` |
| Category | Core |
| Camera | `floor-side` |
| Frames | 2 |
| Equipment | none — bodyweight only |
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
Exercise: Side Plank
Camera: floor-side view, looking straight at the front of the body so the
frontal-plane line and the stacked hips are readable.
Equipment: none — bodyweight only.
Number of frames: 2, evenly spaced left to right.
Both figures lie on the same shared invisible ground line as each other, at
exactly identical scale and spacing.

Frames:
1. Entry position. Lying on one side, bottom forearm flat on the ground with
   the elbow directly under the shoulder and the forearm pointing forward.
   Knees bent to roughly 90 degrees with the shins behind the body, feet
   stacked. Hip still resting on the ground, top hand placed on the top hip,
   shoulders and hips square, head in line with the spine.
2. Full hold. Hips driven up and the body supported only on the bottom forearm
   and the outside edge of the bottom foot, with the top foot stacked directly
   on it. A straight line runs from the ankle through the knee, hip, shoulder
   and ear; the hip is neither dropped toward the ground nor hitched above the
   line. Shoulders and hips remain stacked vertically with no forward or
   backward rotation of the torso, the bottom shoulder is pressed away from the
   ear, and the top arm reaches straight up toward the ceiling.

TECHNIQUE — must be correct in every frame:
- The supporting elbow stays directly under the supporting shoulder.
- The bottom shoulder stays actively pressed away from the ear — never collapsed
  into the joint.
- In the hold, ankle, knee, hip, shoulder and ear form one straight line seen
  from the front.
- Hips and shoulders stay stacked; the torso does not rotate toward or away from
  the viewer.
- Feet are stacked, with the load on the outside edge of the bottom foot.
```

## Form checkpoints (QA)

- [ ] Frame 1 clearly reads as a knees-bent, hip-down entry
- [ ] Frame 2 shows a straight ankle–knee–hip–shoulder–ear line
- [ ] Hips and shoulders stacked, no torso rotation
- [ ] Supporting shoulder not collapsed toward the ear
- [ ] Same face, hair, wardrobe, and body proportions in both frames
- [ ] Both figures identical scale on one shared ground line
- [ ] Readable as a side plank at 64 px wide
