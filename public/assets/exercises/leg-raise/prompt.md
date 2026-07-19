# Leg Raise — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `leg-raise` |
| Category | Core |
| Camera | `floor-side` |
| Frames | 4 |
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
Exercise: Leg Raise
Camera: floor-side view in full profile so the hip angle and the flat, unmoving
torso can both be read.
Equipment: none — bodyweight only.
Number of frames: 4, evenly spaced left to right.
All four figures lie on the same shared invisible ground line as each other,
at exactly identical scale and spacing.

Frames:
1. Start. Lying face up, arms straight alongside the body with the palms flat
   on the ground. Both legs straight and pressed together, knees extended but
   not locked, heels hovering a few centimetres above the ground, toes lightly
   pointed. Lower back flat against the ground, head resting down.
2. Roughly 45 degrees of hip flexion. Both legs still perfectly straight and
   together, rising as one unit. The pelvis has not tilted, the lower back is
   still flat against the ground, and the head, shoulders and arms have not
   moved.
3. Top position. Legs vertical at roughly 90 degrees of hip flexion, knees
   still straight, feet directly above the hips. The pelvis and tailbone remain
   in contact with the ground — the hips do not roll up off the floor — and the
   whole torso stays flat.
4. Controlled descent. Legs lowered back to roughly 30 degrees above the
   ground, knees still straight and legs still together, lower back still
   pressed flat with no arch appearing under the waist.

TECHNIQUE — must be correct in every frame:
- The movement happens at the hip joint only — the torso stays flat on the
  ground in every frame.
- The knees stay straight and the legs stay pressed together throughout.
- The lower back never arches away from the ground on the descent.
- The pelvis stays down at the top — the hips do not curl up off the floor.
- The head, shoulders and arms stay relaxed and motionless.
```

## Form checkpoints (QA)

- [ ] Torso and pelvis stay flat on the ground in all four frames
- [ ] Knees straight and legs together throughout
- [ ] No lumbar arch in the lowest frame
- [ ] Distinct from a reverse crunch — hips never leave the ground
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a lying leg raise at 64 px wide
