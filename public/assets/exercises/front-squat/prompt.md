# Front Squat — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `front-squat` |
| Category | Squat / Lower Body |
| Camera | `side` |
| Frames | 6 |
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
Exercise: Front Squat
Camera: side view, turned very slightly toward the viewer so the bar, the elbow
position and the working leg stay readable.
Equipment: one long brushed chrome bar with matte black bumper plates, evenly
loaded both sides, resting across the front of the shoulders on the anterior
deltoids, held in a front rack with the elbows pointed high and forward and the
fingertips of both hands under the bar just outside the shoulders.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Standing tall, feet shoulder-width apart and flat, toes turned out roughly
   15 degrees, hips and knees fully extended, bar racked on the front deltoids,
   elbows high, chest tall, gaze forward.
2. Early descent, roughly a quarter squat. Knees break first and travel
   forward, hips drop straight down, torso stays close to vertical, elbows
   still high.
3. Half squat, thighs at roughly 45 degrees. Knees bent about 70 degrees and
   travelling forward past the toes, torso far more upright than in a back
   squat, bar over the midfoot.
4. Bottom position, deepest point. Hips below knee level, thighs below
   parallel, heels flat, torso close to vertical with a neutral spine, elbows
   still pointing high and forward so the bar stays racked.
5. Ascent, back to roughly a half squat. Hips and chest rising together,
   elbows driving up to keep the bar seated, knees tracking over the toes.
6. Standing tall again, identical to frame 1, hips and knees fully extended.

TECHNIQUE — must be correct in every frame:
- Elbows stay high and forward in every frame — they never drop.
- The torso stays far more upright than a back squat; the bar stays over the
  midfoot.
- Heels stay flat on the ground, including at the bottom.
- Knees track in line with the toes and are allowed to travel forward.
- Spine stays neutral — no rounding of the upper back at the bottom.
```

## Form checkpoints (QA)

- [ ] Elbows high and forward in all six frames — no dropped rack
- [ ] Torso visibly more upright than a back squat
- [ ] Bottom frame reaches hips below knees with heels down
- [ ] Bar stays in contact with the front deltoids throughout
- [ ] Knees track over toes — no valgus collapse
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a front squat at 64 px wide
