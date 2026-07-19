# Lateral Raise — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `lateral-raise` |
| Category | Shoulders |
| Camera | `front` |
| Frames | 4 |
| Equipment | Dumbbell (pair) |
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
Exercise: Lateral Raise
Camera: front view, because the frontal plane carries all of the information in this movement.
Equipment: a pair of matte black hexagonal-head dumbbells with brushed chrome knurled handles, one in each hand.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start position. Standing tall, feet hip-width and flat, dumbbells hanging
   just outside the thighs with the palms facing in toward the body. Elbows
   are already set at a soft fixed bend of about 15 degrees — this angle
   does not change at any point in the movement. Shoulders down, ribs down.
2. Roughly 45 degrees of shoulder abduction. The upper arms have swept out to
   the sides in the frontal plane, hands a little below elbow height, the
   elbow angle unchanged. Traps stay relaxed with no shrug, torso upright
   and still.
3. Top position, roughly 90 degrees of abduction. The upper arms are level
   with the shoulders, forming a wide flat T across the frontal plane. The
   elbows are at or a fraction above the height of the hands, wrists neutral
   and level so the thumb and little finger sit at the same height — no
   pouring the weights over. Shoulders stay down away from the ears.
4. Controlled lowering, roughly 30 degrees of abduction. Arms descending under
   control along the same frontal-plane arc, elbow bend still fixed at the
   same soft angle, torso still upright and motionless.

TECHNIQUE — must be correct in every frame:
- The elbow angle is fixed at a soft bend and is identical in all four frames
  — this is a raise, not a press, so the elbows never extend or flex to move
  the weight.
- The arms travel out to the sides in the frontal plane, not forward in front
  of the body.
- Arms stop at shoulder height. The hands never rise above the shoulders.
- No shrugging — the shoulders stay pressed down away from the ears even at
  the top.
- The torso stays upright and still; there is no swinging, leaning back, or
  hip drive to throw the weights up.
```

## Form checkpoints (QA)

- [ ] Elbow bend identical and fixed in all four frames
- [ ] Arms travel in the frontal plane, straight out to the sides
- [ ] Top frame stops at shoulder height, elbows level with or just above the hands
- [ ] Wrists level — no pouring the dumbbells forward or down
- [ ] No trap shrug and no torso swing in any frame
- [ ] Both arms perfectly symmetrical in every frame
- [ ] Cannot be mistaken for a front raise or a press
- [ ] Readable as a lateral raise at 64 px wide
