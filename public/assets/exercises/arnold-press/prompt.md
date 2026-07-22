# Arnold Press — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `arnold-press` |
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
Exercise: Arnold Press
Camera: three-quarter-front view, so the torso stays visible and the rotation of the palms is clearly readable in every frame.
Equipment: a pair of matte black hexagonal-head dumbbells with brushed chrome knurled handles, one in each hand.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Start position, standing. Dumbbells held in front of the chest at
   collarbone height with the palms facing the body, forearms close to
   vertical and elbows tucked down in front of the ribs, the two dumbbells
   almost touching. Feet hip-width and flat, glutes and abdominals braced,
   ribs down.
2. The elbows begin to sweep out to the sides and the forearms start to
   rotate: the palms have turned from facing the body to facing each other,
   dumbbells at chin height and now shoulder-width apart rather than
   touching.
3. Rotation complete at the shoulders. Dumbbells at ear height, upper arms
   out in the scapular plane, palms now facing forward with the wrists
   stacked over the elbows — the position a normal dumbbell shoulder press
   would start from.
4. Lockout, the highest point. Elbows fully extended but not hyperextended,
   palms fully forward, dumbbells finishing close together over the ears,
   biceps near the ears, ribs down with no backward lean of the trunk.
5. Descent. Dumbbells lowered back to chin height with the elbows tracking
   down and out, the forearms already rotating back so the palms have turned
   from forward to facing each other again.
6. Return to the start position, identical to frame 1. Rotation fully
   reversed, palms facing the body again, elbows tucked down in front of the
   ribs, dumbbells almost touching at collarbone height.

TECHNIQUE — must be correct in every frame:
- The rotation is the defining feature and must be visible: palms face the
  body at the bottom, face each other at the midpoint, and face forward at
  lockout, then reverse on the way down.
- The rotation happens smoothly through the press, not as a separate twist at
  the bottom or the top.
- Wrists stay stacked over the elbows once the palms have turned forward — no
  bending back under the load.
- Ribs stay pulled down. No backward lean and no lumbar hyperextension as the
  weights pass overhead.
- Both arms move and rotate symmetrically; the two dumbbells are at the same
  height and the same palm angle in every frame.
```

## Form checkpoints (QA)

- [ ] Palms face the body in frames 1 and 6 — clearly, not ambiguously
- [ ] Palms face each other in frames 2 and 5
- [ ] Palms face forward in frames 3 and 4
- [ ] Rotation reads as progressive across the strip, not abrupt
- [ ] Elbows tucked in front of the ribs at the bottom, swept out by mid-press
- [ ] No backward trunk lean or lumbar hyperextension in any frame
- [ ] Distinguishable from a plain dumbbell shoulder press at a glance
- [ ] Readable as an Arnold press at 64 px wide
