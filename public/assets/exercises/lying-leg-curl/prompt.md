# Lying Leg Curl — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `lying-leg-curl` |
| Category | Squat / Lower Body |
| Camera | `machine-three-quarter` |
| Frames | 4 |
| Equipment | Leg extension / curl machine |
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
Exercise: Lying Leg Curl
Camera: machine three-quarter view, from the side and slightly above, so the
knee angle, the hips and the ankle roller are all clearly readable.
Equipment: one matte black frame with a padded ankle roller and a long flat
pad, oriented the same way in every frame. The figure lies face down along the
pad with the hips resting on it, the knee joints just past the edge of the pad
and aligned with the machine pivot, the backs of the ankles under the padded
roller just above the heels, and both hands gripping the front handles. The
machine rests on the same shared ground line in every frame and is drawn at
exactly the same scale and angle each time.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start position. Legs almost straight, knees just short of lockout, shins
   resting down along the line of the pad, roller against the back of the lower
   calves, hips flat on the pad, head and neck neutral.
2. Early curl. Knees bent to roughly 45 degrees, heels lifting toward the
   glutes, hips still flat on the pad, torso motionless.
3. Peak contraction. Knees bent to roughly 100 degrees, heels close to the
   glutes, hamstrings contracted, hips still pressed into the pad with no
   arching of the lower back.
4. Lowering under control, back to roughly 40 degrees of knee bend, shins
   descending on the same arc, hips still flat and the torso still motionless.

TECHNIQUE — must be correct in every frame:
- The hips stay pressed flat into the pad — they never lift as the heels come
  up.
- The lower back never arches to help the curl.
- The knee joints stay just past the edge of the pad, aligned with the machine
  pivot.
- Both legs move together at the same angle in every frame.
- The legs straighten fully on the return but are never snapped into
  hyperextension.
```

## Form checkpoints (QA)

- [ ] Hips stay flat on the pad in all four frames — no hip lift at peak
- [ ] Peak frame reaches roughly 100 degrees of knee flexion
- [ ] Knees just past the pad edge, aligned with the machine pivot
- [ ] Roller stays just above the heels, not on the heel itself
- [ ] Machine drawn identically — same angle, same scale — in every frame
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures on one shared ground line at identical scale
- [ ] Readable as a lying leg curl at 64 px wide
