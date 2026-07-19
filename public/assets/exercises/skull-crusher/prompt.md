# Skull Crusher — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `skull-crusher` |
| Category | Arms |
| Camera | `bench-side` |
| Frames | 4 |
| Equipment | Flat bench + Barbell |
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
Exercise: Skull Crusher
Camera: bench-side view, the flat bench seen from the side and level with the
camera so the vertical upper arms and the bar path down to the forehead
are both readable.
Equipment: a low matte black padded bench on a simple black steel frame, and one long
brushed chrome bar with matte black bumper plates, evenly loaded both
sides, held with a shoulder-width overhand grip, palms facing the feet.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start. Lying face up along the flat bench, head, upper back and hips all
   supported, both feet flat on the floor either side of the bench. Arms
   pressed straight up, elbows extended but not locked, upper arms
   vertical and perpendicular to the torso, the bar directly over the
   upper chest.
2. Early flexion, elbows bent to roughly 45 degrees. The bar has travelled
   back over the face toward the forehead. The upper arms are still
   vertical, elbows still pointing straight at the ceiling and tucked in
   line with the shoulders, not flaring outward.
3. Bottom position, elbows bent to roughly 100 degrees, the bar just above
   the hairline. Upper arms still vertical and stationary, forearms angled
   back past the head, shoulder blades still flat on the bench, lower back
   in light natural contact with the bench, feet still flat.
4. Extending back up, elbows opened to roughly 45 degrees, the bar returning
   along the same arc toward the point above the upper chest. Upper arms
   still vertical, wrists still straight.

TECHNIQUE — must be correct in every frame:
- The figure is lying supine on the bench in every frame — the whole rep
  happens on the back.
- The upper arms stay vertical and stationary; only the forearms move.
- The elbows stay in line with the shoulders and point at the ceiling — they
  never flare out to the sides.
- The wrists stay straight and stacked over the forearms — never bent back
  under the bar.
- Head, shoulders and hips stay in contact with the bench and both feet stay
  flat on the floor.
```

## Form checkpoints (QA)

- [ ] Figure is lying on a flat bench — unmistakably not standing
- [ ] Upper arms vertical and stationary in all four frames
- [ ] Bar finishes above the hairline, not on the chest and not behind the bench
- [ ] Elbows point at the ceiling — no flaring outward
- [ ] Both feet flat on the floor in every frame
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a lying triceps extension at 64 px wide
