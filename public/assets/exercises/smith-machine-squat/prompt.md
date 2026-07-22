# Smith Machine Squat — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `smith-machine-squat` |
| Category | Lower Body Variants |
| Camera | `machine-three-quarter` |
| Frames | 6 |
| Equipment | Smith / press machine |
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
Exercise: Smith Machine Squat
Camera: machine three-quarter view so the vertical chrome guide rails, the bar
path and the squat depth are all clearly readable.
Equipment: one matte black frame with chrome guide rails and simple black
handles. The straight bar rides the vertical guide rails and rests across the
upper trapezius, both hands gripping the bar just outside the shoulders. The
frame rests on the same shared ground line in every frame, drawn at an
identical scale, angle and position; only the figure and the bar move between
frames.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Standing tall under the bar, bar resting across the upper trapezius, feet
   shoulder-width apart and planted half a foot-length in front of the bar
   line, knees straight but not locked, chest up, gaze forward.
2. Early descent, roughly a quarter squat. Hips travelling back and down, the
   bar sliding a short way straight down the rails, torso close to upright.
3. Half squat, thighs at roughly 45 degrees. Knees tracking forward over the
   toes, heels flat, torso more upright than in a free-weight squat.
4. Bottom position, deepest point. Thighs parallel to the ground, heels flat,
   knees in line with the toes, spine neutral, bar still exactly on the
   vertical rail line.
5. Ascent, back to roughly a half squat. Hips and chest rising together at
   the same rate, bar travelling straight back up the rails.
6. Standing tall again, identical to frame 1, hips and knees fully extended.

TECHNIQUE — must be correct in every frame:
- The bar travels in one perfectly vertical line along the guide rails — no
  forward or backward drift.
- Feet are planted slightly in front of the bar line, letting the torso stay
  more upright than in a free-weight squat.
- Heels stay flat on the ground through the whole rep.
- Knees track in line with the toes, never collapsing inward.
- Spine stays neutral — no rounding of the lower back at the bottom.
```

## Form checkpoints (QA)

- [ ] Bar stays on one vertical line in all six frames — no drift off the rails
- [ ] Bottom frame reaches thighs parallel with heels flat
- [ ] Feet visibly planted slightly in front of the bar line
- [ ] Knees track over the toes — no valgus collapse
- [ ] Machine frame identical scale and position in all six frames
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a squat at 64 px wide
