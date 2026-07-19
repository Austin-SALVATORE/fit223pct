# Dumbbell Biceps Curl — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `dumbbell-biceps-curl` |
| Category | Arms |
| Camera | `three-quarter-front` |
| Frames | 4 |
| Equipment | Dumbbell |
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
Exercise: Dumbbell Biceps Curl
Camera: three-quarter-front view, the body turned about 30 degrees away from
square so both arms stay separable and the palms-up grip is unmistakable.
Equipment: two matte black hexagonal-head dumbbells with brushed chrome knurled
handles, one in each hand, held with a supinated grip so the palms face
up and the dumbbell heads sit across the front of the hand.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start. Standing tall, feet hip-width apart and flat, knees soft. Both
   arms hang fully extended at the sides, elbows straight but not locked,
   dumbbells beside the outer thighs, palms already turned forward.
   Upper arms vertical and in contact with the ribs, shoulders down.
2. Early flexion, both elbows bent to roughly 45 degrees. The dumbbells have
   risen to just above mid-thigh, held slightly wider than the hips so the
   arms stay separable. Upper arms still vertical and pinned to the ribs;
   only the forearms have moved. Torso upright, no lean.
3. Top position, both elbows bent to roughly 110 degrees, dumbbells at
   shoulder height just outside the chest. Palms fully supinated and
   facing the shoulders, wrists straight, elbows still under the shoulders
   and against the ribs — not swung forward or flared out.
4. Controlled lowering, both elbows back through roughly 90 degrees. The
   dumbbells descend on the same arc, palms still up, upper arms still
   vertical against the ribs, torso still upright and still.

TECHNIQUE — must be correct in every frame:
- Both arms curl simultaneously and are at exactly the same angle in every
  frame — this is not an alternating curl.
- The upper arms stay vertical and pinned to the ribs; only the forearms
  move.
- Palms stay supinated and facing up for the whole rep — the dumbbell heads
  stay horizontal, never rotating to a vertical thumbs-up position.
- The torso stays vertical — no leaning back, no hip drive, no shrugging.
- Wrists stay straight and in line with the forearms.
```

## Form checkpoints (QA)

- [ ] Two separate dumbbells, one per hand — visibly not a barbell
- [ ] Both arms at the identical angle in every frame (simultaneous, not
      alternating)
- [ ] Dumbbell heads horizontal and palms up — unmistakably not a hammer grip
- [ ] Upper arms vertical and touching the ribs in all four frames
- [ ] Torso vertical in all four frames — no backward lean or hip swing
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a two-dumbbell supinated curl at 64 px wide
