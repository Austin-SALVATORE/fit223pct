# Hip Thrust — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `hip-thrust` |
| Category | Hip Hinge / Glutes |
| Camera | `bench-side` |
| Frames | 6 |
| Equipment | Barbell + flat bench |
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
Exercise: Hip Thrust
Camera: bench-side view, so the bench height, the hip travel arc and the
shin angle are all clearly readable.
Equipment: one low matte black padded bench on a simple black steel frame,
standing horizontally behind her; and one long brushed chrome bar with matte
black bumper plates, evenly loaded both sides, resting across the front of the
hips with a folded matte black pad between the bar and the hip bones. Both
hands rest lightly on the bar just outside the hips.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Setup. She is seated on the ground with her upper back against the edge of
   the bench pad, the bench edge sitting just under the shoulder blades. Feet
   flat on the ground, roughly shoulder-width apart, heels placed so that at
   lockout the shins will be vertical. Bar across the hips, hips resting low
   near the floor, chin tucked, gaze forward and slightly down.
2. Early drive. Hips have lifted a few inches off the ground, weight shifted
   into the heels, shoulder blades pivoting on the bench edge, ribs still down,
   spine neutral.
3. Mid-range, roughly halfway up. Torso rising as one rigid unit with the hips,
   knees bending further as the hips travel forward and up, lower back still
   neutral with no arching.
4. Top position, full lockout. Hips fully extended so that the torso is roughly
   parallel to the ground and in a straight line from the knees through the
   hips to the shoulders. Shins vertical, feet flat, glutes visibly contracted,
   ribs pulled down, chin tucked with the gaze forward over the bar, lumbar
   spine neutral — the range comes from the hips, not from arching the back.
5. Controlled descent, back through roughly halfway. Hips lowering under
   control, torso following, knees straightening slightly, heels still planted.
6. Bottom again, identical to frame 1, hips low near the floor, ready for the
   next rep.

TECHNIQUE — must be correct in every frame:
- The bench edge stays just below the shoulder blades and the shoulder blades
  pivot on it; the bench must not move.
- The whole body stays in one shared side-view plane so the bench, both feet
  and the bar are all visible in every frame.
- At lockout the shins are vertical and the torso is parallel to the ground.
- Feet stay flat with the drive through the heels; the heels never lift.
- The lumbar spine is neutral and the ribs stay down — full range comes from
  hip extension, not from arching the lower back at the top.
- The chin stays tucked with the gaze travelling forward, not thrown back.
- The bar stays level across the hips and the pad stays in place.
```

## Form checkpoints (QA)

- [ ] Bench edge sits just below the shoulder blades in all six frames
- [ ] Shins vertical at the top frame, feet flat and heels down
- [ ] Torso parallel to the ground at lockout, straight knee-hip-shoulder line
- [ ] Lumbar spine neutral at the top — no lower-back arch, ribs down
- [ ] Chin tucked and gaze forward throughout, not craned back
- [ ] Bar level across the hips with the pad in place in every frame
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale, sharing one bench height and ground line
- [ ] Readable as a hip thrust at 64 px wide
