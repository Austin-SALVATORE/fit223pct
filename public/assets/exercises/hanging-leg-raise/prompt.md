# Hanging Leg Raise — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `hanging-leg-raise` |
| Category | Core |
| Camera | `side` |
| Frames | 4 |
| Equipment | Pull-up bar |
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
Exercise: Hanging Leg Raise
Camera: side view in full profile so the hanging body line and the hip angle are
both readable.
Equipment: a simple straight chrome horizontal bar with its supports out of
frame, gripped overhand at just wider than shoulder width.
Number of frames: 4, evenly spaced left to right.
All four figures hang from one continuous shared horizontal bar at exactly
identical scale and spacing, their feet clear of the shared invisible ground
line, so the whole strip reads as a single aligned sequence.

Frames:
1. Dead hang. Overhand grip just wider than shoulder width, arms straight,
   shoulders actively pulled down away from the ears rather than shrugged.
   Legs straight and pressed together, hanging vertically under the bar, toes
   lightly pointed, body completely still.
2. Roughly 45 degrees of hip flexion. Straight legs raised together as one
   unit, pelvis just beginning to tilt back toward the ribs, torso still
   vertical, arms still straight, no swing at the shoulders.
3. Top position. The legs raised until the thighs pass horizontal, knees still
   straight, with the pelvis clearly rolled up toward the ribcage so the lower
   back rounds slightly rather than arching. Shoulders remain depressed, arms
   straight, and the torso has not swung backward to counterbalance.
4. Controlled descent. Legs lowered back to roughly 30 degrees in front of the
   body, knees still straight and legs still together, body hanging without any
   pendulum swing, ready to stop before the ribcage flares.

TECHNIQUE — must be correct in every frame:
- The shoulders stay actively pulled down away from the ears in every frame.
- The arms stay straight; there is no pulling with the elbows.
- The knees stay straight and the legs stay pressed together throughout.
- At the top the pelvis rolls toward the ribs — the movement is not only hip
  flexion.
- The body never swings; each frame shows a still, controlled position.
```

## Form checkpoints (QA)

- [ ] Shoulders depressed, not shrugged, in all four frames
- [ ] Arms straight throughout
- [ ] Top frame shows thighs past horizontal with a posterior pelvic tilt
- [ ] No body swing or counterbalancing torso lean
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale, hanging from one aligned bar
- [ ] Readable as a hanging leg raise at 64 px wide
