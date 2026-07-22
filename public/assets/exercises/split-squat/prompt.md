# Split Squat — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `split-squat` |
| Category | Lower Body Variants |
| Camera | `three-quarter-side` |
| Frames | 6 |
| Equipment | none — bodyweight only |
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
Exercise: Split Squat
Camera: three-quarter side view so the front and rear legs stay clearly
separable and neither leg hides the other.
Equipment: none — bodyweight only. Hands on the hips in every frame. There is
no bench, box, platform or any other object anywhere in the strip — both feet
are on the floor at all times.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Static split stance. Front foot flat on the floor, rear foot about two
   foot-lengths behind on the same floor, ball of the rear foot planted and
   the rear heel raised, both legs nearly straight, hips square and level,
   torso tall, hands on hips.
2. Early descent. Front knee bent about 30 degrees, rear knee dropping
   straight down below the hip, torso still tall, feet planted in the same
   spots.
3. Mid descent. Front knee bent about 60 degrees and tracking over the front
   foot, rear knee approaching the floor, torso upright.
4. Bottom position, deepest point. Both knees bent about 90 degrees, rear
   knee just short of the floor directly below the hip, front thigh parallel
   to the ground, front heel flat, torso upright with a neutral spine, hips
   square.
5. Ascent. Front knee at about 50 degrees, weight driving through the front
   heel, hips rising straight up.
6. Back to the top, identical to frame 1, both legs extended, feet still in
   the same split stance on the floor.

TECHNIQUE — must be correct in every frame:
- Both feet stay planted on the floor in the same spots for the whole strip —
  this is a static split squat, not a lunge step, and the rear foot is NEVER
  elevated on a bench or box. No bench anywhere in the strip.
- Weight stays on the front leg; the rear leg only balances.
- The front heel stays flat on the ground through the whole rep.
- Front knee tracks in line with the front foot, never collapsing inward.
- Hips stay square and level; the descent is straight down, not forward.
```

## Form checkpoints (QA)

- [ ] Rear foot on the ground in all six frames (ball of the foot planted) — no bench, box or platform anywhere in the strip (this is what distinguishes it from the Bulgarian split squat)
- [ ] Feet stay planted in the same spots in all six frames — static stance, not a lunge step
- [ ] Bottom frame shows both knees near 90 degrees with the rear knee just off the floor
- [ ] Front knee tracks over the front foot — no valgus collapse
- [ ] Hips square and level, torso upright — the descent reads straight down
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a split squat at 64 px wide
