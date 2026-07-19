# Seated Leg Curl — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `seated-leg-curl` |
| Category | Squat / Lower Body |
| Camera | `machine-three-quarter` |
| Frames | 4 |
| Equipment | Leg extension / curl machine |
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
Exercise: Seated Leg Curl
Camera: machine three-quarter view, from the side and slightly in front, so the
knee angle and the ankle roller are both clearly readable.
Equipment: one matte black seated frame with a padded ankle roller and a thigh
pad, oriented the same way in every frame. The figure sits upright with the
back against the pad, hips flexed to roughly 90 degrees, the thigh pad locked
down across the lower thighs, the calves resting on top of the padded roller
just above the heels, and both hands holding the seat handles at the hips. The
machine rests on the same shared ground line in every frame and is drawn at
exactly the same scale and angle each time.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start position. Knees nearly straight with the shins extended forward,
   roller under the lower calves, thigh pad firm across the thighs, torso
   upright against the back pad.
2. Early curl. Knees bent to roughly 45 degrees, heels drawn back and down
   under the seat, thighs still pinned under the pad, hips unchanged.
3. Peak contraction. Knees bent to roughly 90 degrees or slightly more, heels
   pulled back as far as the machine allows, hamstrings contracted, pelvis
   still flat in the seat and the lower back still against the pad.
4. Returning under control, back to roughly 40 degrees of knee bend, shins
   sweeping forward on the same arc, torso still upright and still against the
   pad.

TECHNIQUE — must be correct in every frame:
- The pelvis stays flat in the seat — the hips never lift or rock to help the
  curl.
- The thighs stay pinned under the thigh pad in every frame.
- The knee joint stays aligned with the machine pivot.
- Both legs move together at the same angle in every frame.
- The knees straighten fully on the return but are never snapped into
  hyperextension.
```

## Form checkpoints (QA)

- [ ] Thigh pad stays in contact with the thighs in all four frames
- [ ] Peak frame reaches roughly 90 degrees of knee flexion
- [ ] Pelvis stays seated, lower back against the pad — no hip lift
- [ ] Roller stays on the lower calves, not on the heels
- [ ] Machine drawn identically — same angle, same scale — in every frame
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures on one shared ground line at identical scale
- [ ] Readable as a seated leg curl at 64 px wide
