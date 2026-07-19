# Shrug — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `shrug` |
| Category | Back Variants |
| Camera | `front` |
| Frames | 4 |
| Equipment | Barbell |
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
Exercise: Shrug
Camera: front view, because the frontal plane carries all of the information
in this movement — the shoulders rising straight up toward the ears.
Equipment: long brushed chrome bar with matte black bumper plates, evenly
loaded both sides, held at arm's length across the front of the thighs,
overhand grip with the hands just outside the thighs.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start position. Standing tall, feet hip-width apart and flat, the bar
   hanging at arm's length across the front of the thighs, both arms straight,
   shoulders relaxed at their neutral height, chin level, torso upright.
2. Halfway up. The shoulders have elevated halfway toward the ears, travelling
   straight up. Both elbows completely straight, the bar rising vertically in
   light contact with the thighs, torso and head motionless.
3. Top position. The shoulders fully elevated straight up toward the ears, the
   upper traps visibly shortened, neck appearing shorter. Both elbows still
   completely straight, chin level, torso upright and still.
4. Controlled lowering, halfway back down. Shoulders descending along the same
   vertical line, elbows still completely straight, bar still in light contact
   with the thighs.

TECHNIQUE — must be correct in every frame:
- The elbows never bend — both arms stay completely straight in all four
  frames; the shoulders alone lift the bar.
- The shoulders travel straight up and straight down — no rolling forward or
  backward.
- The torso stays upright and motionless — no lean-back and no knee dip to
  bump the bar up.
- The chin stays level and the neck neutral — no jutting the head forward.
- The bar stays in light contact with the thighs on a vertical path.
```

## Form checkpoints (QA)

- [ ] Both elbows completely straight in all four frames — any bend fails
      the image
- [ ] Frame 3 shows clear elevation — shoulders up toward the ears, neck
      visibly shortened
- [ ] Shoulder path is straight vertical — no forward or backward roll
- [ ] Torso and knees identical in all four frames — only the shoulders move
- [ ] Distinct from the dumbbell shrug — one bar held across the front of the
      thighs, not a dumbbell at each side
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] Readable as a shrug at 64 px wide
