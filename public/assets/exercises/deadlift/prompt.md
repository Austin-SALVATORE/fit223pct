# Deadlift — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `deadlift` |
| Category | Hip Hinge / Glutes |
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
Exercise: Deadlift
Camera: side view, so the back angle, the hip and knee sequencing and the
vertical bar path are all clearly readable.
Equipment: one long brushed chrome bar with matte black bumper plates, evenly
loaded both sides, resting on the ground at the start; double-overhand grip
just outside the shins, arms straight and vertical.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Setup from the floor. Feet hip-width apart and flat, bar directly over the
   middle of the foot and touching the shins, shins angled slightly forward to
   reach it, hips higher than the knees and lower than the shoulders, arms
   straight and vertical, shoulder blades stacked just in front of the bar,
   chest set, lumbar spine neutral, gaze a short distance ahead on the floor.
2. Break from the floor. The bar has just left the ground and is at low-shin
   height. Knees extend and the hips rise, but the back angle is unchanged from
   frame 1 — chest and hips rise at the same rate, bar riding straight up the
   shin.
3. Bar at knee height. Shins have become vertical, the bar is in contact with
   the front of the knee, torso still inclined forward, lumbar spine neutral,
   lats holding the bar against the legs.
4. Above the knee, mid-thigh. Hips now drive forward toward the bar, torso
   rising, bar sliding up the front of the thighs in continuous contact,
   shoulders coming back over the bar.
5. Lockout. Hips and knees fully extended, bar resting against the upper
   thighs, torso vertical, ribs down, glutes contracted, shoulders back and
   down, no leaning back and no shrugging.
6. Start of the controlled descent. Hips pushed back first with the knees still
   nearly straight, bar back down at upper-thigh height and still touching the
   legs, back flat, weight balanced over the mid-foot.

TECHNIQUE — must be correct in every frame:
- The bar travels in a straight vertical line over the mid-foot and stays in
  contact with the shins and thighs.
- The lumbar spine is neutral in every frame — never rounded, never
  hyperextended at lockout.
- Arms stay straight and act only as hooks; the elbows never bend.
- Hips and shoulders rise at the same rate off the floor; the hips must not
  shoot up ahead of the chest.
- Hips are higher than the knees and lower than the shoulders at the setup —
  this is not a squat start.
- Lockout is a standing plank: hips through, ribs down, no backwards lean.
```

## Form checkpoints (QA)

- [ ] Setup frame has hips above knees and below shoulders, bar over mid-foot
- [ ] Bar path is a straight vertical line across all six frames
- [ ] Hips and shoulders rise together between frames 1 and 2 — no hips-shoot-up
- [ ] Lumbar spine neutral in every frame, including the floor setup
- [ ] Lockout is vertical with no backwards lean or hyperextension
- [ ] Arms straight in every frame, elbows never bent
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a deadlift at 64 px wide
