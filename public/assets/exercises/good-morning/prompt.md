# Good Morning — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `good-morning` |
| Category | Lower Body Variants |
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
Exercise: Good Morning
Camera: side view, so the hip hinge, the fixed knee angle and the neutral
spine are all clearly readable.
Equipment: one long brushed chrome bar with matte black bumper plates, evenly
loaded both sides, resting across the upper trapezius and rear shoulders,
both hands gripping the bar just outside the shoulders, elbows pointing down.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Standing tall, feet hip-width apart and flat, knees straight but not
   locked, bar resting on the upper back, chest up, lumbar spine neutral,
   gaze forward.
2. Start of the hinge. Knees soften to a fixed slight bend and hold there for
   the rest of the rep — this is a hinge, not a squat. Hips travel straight
   backwards, torso inclines about 20 degrees, bar staying firmly seated on
   the upper back.
3. Mid-range, torso at roughly 45 degrees. Hips clearly behind the heels,
   shins near vertical, knee angle unchanged from frame 2, back flat, bar
   still on the upper back.
4. Bottom position. Torso just above parallel with the ground, hips at their
   furthest point back, hamstrings visibly lengthened, lumbar spine still
   neutral with no rounding, head in line with the spine, bar still resting
   on the upper back over the midfoot.
5. Ascent, back through roughly 45 degrees. Hips drive forward, torso rising
   as one rigid unit, knee angle still unchanged.
6. Standing tall again, identical to frame 1. Hips fully extended, glutes
   contracted, no leaning back past vertical.

TECHNIQUE — must be correct in every frame:
- This is a hip hinge, not a squat — the knee angle is set in frame 2 and
  does not change; the hips travel backwards, never down.
- The lumbar spine stays neutral at every point, including the bottom — this
  is the safety-critical cue for this movement.
- The bar stays seated on the upper trapezius; it never rolls onto the neck
  or drifts off the back.
- Shins stay near vertical; the depth is set by hamstring length.
- The neck stays in line with the spine — no craning up to look forward.
```

## Form checkpoints (QA)

- [ ] Knee angle visibly identical in frames 2 through 5 — reads as a hinge, not a squat
- [ ] Hips travel backwards in the descent frames — never dropping into a squat
- [ ] Lumbar spine flat and neutral at the bottom frame — no rounding
- [ ] Bar stays on the upper trapezius in every frame — never on the neck
- [ ] Bottom frame torso just above parallel with shins near vertical
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a hip hinge at 64 px wide
