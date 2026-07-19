# Goblet Squat — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `goblet-squat` |
| Category | Squat / Lower Body |
| Camera | `side` (very slight three-quarter) |
| Frames | 6 |
| Equipment | Dumbbell |
| Status | `approved` — this is the library's visual ground truth |

> This prompt was reverse-engineered from the existing approved
> `reference.png`. It is the exemplar every other prompt in the library is
> matched against. Do not restyle it — regenerate against it.

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
Exercise: Goblet Squat
Camera: side view, turned very slightly toward the viewer so both the torso and
the working leg stay readable.
Equipment: one matte black hexagonal-head dumbbell with a brushed chrome
knurled handle, held vertically against the chest, both hands cupped under the
top head, elbows tucked down and close to the ribs.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Standing tall, feet shoulder-width apart and flat, knees straight but not
   locked, dumbbell held vertically at the chest, chest up, gaze forward.
2. Early descent, roughly a quarter squat. Hips have travelled back, knees
   bent slightly, torso leaning forward only a few degrees.
3. Half squat, thighs at roughly 45 degrees. Knees tracking forward over the
   toes, hips clearly back, back flat, elbows still tucked inside the knees.
4. Bottom position, deepest point. Hips below knee level, thighs below
   parallel, heels still flat on the ground, chest up, spine neutral, elbows
   inside the thighs, dumbbell still vertical at the chest.
5. Ascent, back to roughly a half squat. Hips and chest rising together at the
   same rate, knees still tracking over the toes.
6. Standing tall again, identical to frame 1, hips and knees fully extended.

TECHNIQUE — must be correct in every frame:
- Heels stay flat on the ground through the whole rep, including the bottom.
- Knees track in line with the toes, never collapsing inward.
- Spine stays neutral — no rounding of the lower back at the bottom.
- Chest stays lifted and the dumbbell stays vertical and close to the sternum.
- Hips and shoulders rise at the same rate on the way up.
```

## Form checkpoints (QA)

- [ ] Bottom frame reaches hips below knees with heels down
- [ ] Knees track over toes in all six frames — no valgus collapse
- [ ] Lumbar spine neutral at depth, not rounded
- [ ] Dumbbell stays vertical and in contact with the chest throughout
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a squat at 64 px wide
