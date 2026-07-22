# Reverse Lunge — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `reverse-lunge` |
| Category | Squat / Lower Body |
| Camera | `three-quarter-side` |
| Frames | 6 |
| Equipment | Dumbbell |
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
Exercise: Reverse Lunge
Camera: three-quarter side view so the front and rear legs stay clearly
separable and neither leg hides the other.
Equipment: two matte black hexagonal-head dumbbells with brushed chrome
knurled handles, one in each hand, hanging at arm's length beside the hips with
a neutral grip, arms straight and still throughout.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Standing tall, feet hip-width apart and flat, hips and knees fully extended,
   dumbbells hanging at the sides, chest up, gaze forward.
2. The right foot has stepped backward about two foot-lengths and the ball of
   the right foot has just touched down with the heel raised; the left knee is
   bent about 25 degrees, the left foot has not moved.
3. Mid descent. Right knee dropping toward the ground, left knee bent about 60
   degrees and stacked over the left ankle, torso upright, hips square.
4. Bottom position. Left thigh parallel to the ground, left shin vertical with
   the left heel flat, right knee low and just short of the ground directly
   under or slightly behind the right hip, right heel raised, torso upright
   with a neutral spine.
5. Ascent. Driving through the left heel, left knee bent about 35 degrees, the
   right foot lifting off the ground to step back toward the start.
6. Standing tall again, identical to frame 1 and on the same spot on the ground
   line, feet hip-width, hips and knees fully extended.

TECHNIQUE — must be correct in every frame:
- The front foot never moves — only the rear leg steps back and returns, so the
  figure stays on the same spot on the ground line.
- The front shin stays vertical and the front heel stays flat.
- Front knee tracks in line with the front foot, never collapsing inward.
- Hips stay square and level; the torso stays upright with a neutral spine.
- The rear knee lowers under control and does not slam into the ground.
```

## Form checkpoints (QA)

- [ ] Front foot stays in the same place in all six frames — no forward travel
- [ ] Rear leg is the one that steps backward
- [ ] Bottom frame shows front thigh parallel, front shin vertical, heel flat
- [ ] Rear knee low and just short of the ground with the rear heel lifted
- [ ] Hips square and level, torso upright
- [ ] Both legs remain clearly separable in the three-quarter view
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a reverse lunge at 64 px wide
