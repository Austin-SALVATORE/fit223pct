# Dumbbell Shoulder Press — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `dumbbell-shoulder-press` |
| Category | Shoulders |
| Camera | `three-quarter-front` |
| Frames | 6 |
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
Single flat solid chroma-key magenta #FF00FF, completely uniform and empty.
No floor, no ground line, no shadow cast onto the background, no gym
environment, no gradient, no vignette, no frame or border. The magenta is
ONLY the background: no magenta may appear anywhere in the artwork itself —
not in skin, hair, clothing, or equipment. No drop shadow, no glow, and no
halo of any kind may surround the figure or equipment — artwork edges end
crisply at the artwork, with pure background touching them directly.

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
Matte dark charcoal metal #1D2025 with brushed chrome shafts and handles
#EFEFEF. Weight plates are mid-value charcoal gray #4A5058, never pure black.
Upholstery and bench pads matte near-black #1D2025. Every dark surface
carries a subtle cool rim light along its upper and outer edges so equipment
stays legible against dark app backgrounds. Simple, clean, realistic
proportions with believable weight and correct scale against the body.

COMPOSITION:
All figures stand on one shared invisible ground line, at exactly the same
scale, evenly spaced with clear background gaps between them. No figure overlaps,
touches, or is cropped by another. The entire body is visible in every frame,
including both feet. Generous background margin above and below. Eye-level camera at
an identical angle and distance for every frame.

STRICTLY EXCLUDE:
Text, numbers, labels, captions, arrows, motion lines, panel borders, dividing
lines, grids, watermarks, logos, background objects, mirrors, other people,
extra or missing limbs, distorted hands, any magenta on the figure, clothing or equipment, drop shadows or glow halos around the figure, broken or hyperextended joints.

MOVEMENT FOR THIS IMAGE:
Exercise: Dumbbell Shoulder Press
Camera: three-quarter-front view, so the torso stays visible and both arms stay separable through the press.
Equipment: a pair of matte black hexagonal-head dumbbells with brushed chrome knurled handles, one in each hand.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Start position, standing. Dumbbells at shoulder height just outside the
   collarbones, palms facing forward, elbows bent to roughly 90 degrees
   and stacked directly under the wrists, upper arms about 30 degrees in
   front of the frontal plane rather than flared straight out to the sides.
   Feet hip-width and flat, glutes and abdominals braced, ribs down.
2. Early press, roughly a quarter of the range. Dumbbells at ear height, the
   forearms still vertical under the weights, elbows travelling up and very
   slightly inward as the arc narrows.
3. Mid press. Dumbbells just above the top of the head, elbows at roughly 120
   degrees, shoulders beginning to shrug and upwardly rotate, torso still
   vertical with no backward lean.
4. Lockout, the highest point. Elbows fully extended but not hyperextended,
   the dumbbells finishing close together over the ears with the handles
   roughly in line with each other, biceps close to the ears, wrists stacked
   straight over the elbows and shoulders, ribs down and not flared.
5. Controlled descent, back to roughly the height of frame 2. Elbows tracking
   back down and out along the same arc, forearms vertical, weights under
   control rather than dropping.
6. Return to the start position, identical to frame 1. Dumbbells back at
   shoulder height, elbows under the wrists.

TECHNIQUE — must be correct in every frame:
- Wrists stay stacked over the elbows in every frame — no bending back under
  the load.
- Ribs stay pulled down. No backward lean and no lumbar hyperextension as the
  weights pass overhead.
- Upper arms stay slightly in front of the torso rather than flared flat into
  the frontal plane.
- Both arms move symmetrically — the two dumbbells are at the same height in
  every frame.
- Feet stay flat and the knees stay straight; there is no dip or leg drive.
```

## Form checkpoints (QA)

- [ ] Both dumbbells at identical height in every frame
- [ ] Forearms vertical and wrists stacked over elbows throughout
- [ ] Lockout has elbows fully extended without hyperextension
- [ ] No backward trunk lean or lumbar hyperextension in any frame
- [ ] Reads as standing — no bench anywhere in the strip
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as an overhead dumbbell press at 64 px wide
