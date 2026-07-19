# Plank — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `plank` |
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
Exercise: Plank
Camera: floor-side view, the body seen in full profile so the line from the
shoulder through the hip to the ankle is unmistakable.
Equipment: none — bodyweight only.
Number of frames: 2, evenly spaced left to right.
Both figures lie on the same shared invisible ground line as each other, at
exactly identical scale and spacing.

Frames:
1. Entry position. Forearms flat on the ground, elbows directly under the
   shoulders and bent to 90 degrees, forearms parallel and pointing forward,
   hands relaxed. Knees still resting on the ground, hips low and behind the
   knees, back already flat, neck long, gaze at the ground a little in front of
   the hands.
2. Full hold. Knees lifted, the whole body supported only on the forearms and
   the balls of both feet. One straight line runs from the ear through the
   shoulder, hip, knee and ankle; hips neither sagging below that line nor
   piked above it. Shoulders stacked vertically over the elbows, ribcage pulled
   down, pelvis very slightly tucked, glutes and quadriceps engaged, heels
   pressed back over the toes, feet hip-width apart.

TECHNIQUE — must be correct in every frame:
- The elbow stays directly under the shoulder in both frames.
- In the hold, ear, shoulder, hip, knee and ankle form one straight line — no
  sag in the lower back and no pike at the hips.
- The neck stays in line with the spine; the chin is not lifted or tucked into
  the chest.
- The ribcage stays pulled down toward the pelvis, not flared.
- Both feet stay on the balls of the feet, ankles at roughly 90 degrees.
```

## Form checkpoints (QA)

- [ ] Frame 1 clearly reads as a kneeling entry, not a shortened plank
- [ ] Frame 2 shows a straight ear–shoulder–hip–knee–ankle line
- [ ] No lumbar sag and no hip pike in the hold
- [ ] Elbows under shoulders in both frames
- [ ] Same face, hair, wardrobe, and body proportions in both frames
- [ ] Both figures identical scale on one shared ground line
- [ ] Readable as a plank at 64 px wide
