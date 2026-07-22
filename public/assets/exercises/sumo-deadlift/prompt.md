# Sumo Deadlift — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `sumo-deadlift` |
| Category | Hip Hinge / Glutes |
| Camera | `three-quarter-front` |
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
Exercise: Sumo Deadlift
Camera: three-quarter-front view, so the wide stance, the turned-out feet and
the knees tracking over the toes stay readable while the torso angle is still
visible.
Equipment: one long brushed chrome bar with matte black bumper plates, evenly
loaded both sides, resting on the ground at the start; hands gripping inside
the knees at roughly shoulder width, arms straight and vertical.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Setup. Stance wide, feet well outside shoulder width with the toes turned
   out around 35 degrees, shins close to vertical and nearly touching the bar,
   bar over the mid-foot, hips lower and closer to the bar than in a
   conventional pull, torso more upright, arms straight and hanging inside the
   knees, chest set, lumbar spine neutral.
2. Break from the floor. Bar just off the ground at low-shin height, knees
   pushing outward in line with the turned-out toes, hips and chest rising
   together, torso angle unchanged, bar riding straight up.
3. Bar at knee height. Knees still driven out over the toes, hips travelling
   forward and up, torso still more upright than a conventional deadlift, bar
   in contact with the legs, lower back flat.
4. Mid-thigh. Hips driving forward into the bar, knees continuing to extend
   while still tracking outward, bar sliding up the thighs in contact,
   shoulders coming back.
5. Lockout. Hips and knees fully extended, stance unchanged, bar resting on the
   upper thighs, torso vertical, ribs down, glutes contracted, shoulders back
   and down, no backwards lean.
6. Start of the controlled descent. Hips pushed back and knees beginning to
   bend outward again, bar at upper-thigh height and still touching the legs,
   back flat, weight balanced over the mid-foot.

TECHNIQUE — must be correct in every frame:
- Knees track outward in line with the turned-out toes and never collapse
  inward.
- The stance and foot angle are identical in all six frames.
- The lumbar spine stays neutral throughout — no rounding off the floor.
- The torso stays more upright than a conventional deadlift, but this is still
  a hinge: the hips move backwards and forwards, not straight up and down.
- The bar travels vertically over the mid-foot and stays in contact with the
  shins and thighs.
- Arms stay straight and act only as hooks; the elbows never bend.
```

## Form checkpoints (QA)

- [ ] Stance width and toe-out angle identical in all six frames
- [ ] Knees track over the toes in every frame — no valgus collapse
- [ ] Hands gripping inside the knees, arms straight and vertical
- [ ] Lumbar spine neutral at the floor setup, not rounded
- [ ] Bar path vertical and in contact with the legs above the knee
- [ ] Lockout vertical with no backwards lean
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a wide-stance pull at 64 px wide
