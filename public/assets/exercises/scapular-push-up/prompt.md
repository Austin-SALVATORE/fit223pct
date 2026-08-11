# Scapular Push-up — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `scapular-push-up` |
| Category | Warm-up / Activation |
| Camera | `floor-side` |
| Frames | 2 |
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
scale. Each pose occupies its own exclusive vertical band running the full
height of the image: a wide column of solid background magenta separates it
from every neighboring pose on both sides, and no part of any pose —
including hands, feet, or equipment — may share a horizontal (left-right)
position with any part of another pose, even when the two sit at different
heights. A straight vertical line drawn anywhere in a gap must be able to
pass from the top of the image to the bottom without touching either
neighboring pose. No figure overlaps, touches, or is cropped by another. The
entire body is visible in every frame, including both feet. Generous
background margin above and below. Eye-level camera at an identical angle and
distance for every frame.

STRICTLY EXCLUDE:
Text, numbers, labels, captions, arrows, motion lines, panel borders, dividing
lines, grids, watermarks, logos, background objects, mirrors, other people,
extra or missing limbs, distorted hands, any magenta on the figure, clothing or equipment, drop shadows or glow halos around the figure, broken or hyperextended joints.

MOVEMENT FOR THIS IMAGE:
Exercise: Scapular Push-up
Camera: floor-side view, the body seen from the side so the fixed straight
elbow and the small rise and fall of the upper back are both readable.
Equipment: none — bodyweight only.
Number of frames: 2, evenly spaced left to right.
Both figures hold the same shared invisible ground line as each other, at
exactly identical scale and spacing.

This pair MUST show a large, unmistakable difference at the shoulders — as
clearly different as a shallow push-up's top position is from its
quarter-rep position, NOT a barely-perceptible shift. Hands and feet stay
planted in the exact same spots on the ground in both frames, so the only
way the movement can show at all is a visible bow in the torso LINE itself,
concentrated right at the shoulder blades: the line between the fixed hands
and fixed feet dips down slightly in frame 1 and rises slightly in frame 2,
like a very shallow wave centered at the upper back. Draw that bow clearly
enough to read as two different heights, not so subtly that the two frames
look identical.

Frames:
1. Lowered position — shoulder blades pinched together. High plank on hands
   and toes, hands flat on the floor directly under the shoulders, feet in
   the same spot they hold in frame 2. Elbows FULLY STRAIGHT and locked,
   identical angle to frame 2 — the elbows never bend in this exercise. The
   shoulder blades squeeze together behind the chest, and the whole upper
   back sinks CLEARLY closer to the floor, sagging the torso line downward
   right between the shoulder blades — a visible, readable dip, not a
   token one. The lower back and hips stay in one straight line with the
   legs; the sag is isolated to the shoulder region, not the lumbar spine.
2. Raised position — shoulder blades spread apart. Same hands, same feet,
   same fully straight and locked elbows as frame 1. The shoulder blades
   spread wide apart and drive the whole upper back CLEARLY up and away
   from the floor, as if pushing the floor away through the hands — the
   torso line now crests upward right between the shoulder blades,
   visibly higher than frame 1's sag. The lower back and hips stay in one
   straight line with the legs, unchanged from frame 1.

TECHNIQUE — must be correct in every frame:
- Frame 1 and frame 2 must read as two clearly different heights at the
  shoulders — a visible bow in the torso line, not a near-identical pair.
- The elbows stay completely straight and locked, at the identical angle,
  in both frames — this is a scapular movement only, never an elbow bend;
  any bending elbow is wrong.
- The lower back and hips stay in one straight, unchanging line with the
  legs in both frames — no sagging lower back and no piked hips; the
  visible movement is isolated to the upper back and shoulder blades.
- Hands and feet stay planted in the exact same spots on the ground in
  both frames — only the shoulder region's height changes.
- Head stays neutral and in line with the spine in both frames.
```

## Form checkpoints (QA)

- [ ] Frame 1 and frame 2 read as two clearly different shoulder heights at
      a glance — a visible bow in the torso line, not a near-duplicate pair
      (regenerated 11 Aug: attempt 1 rendered both frames as almost
      identical high planks — this is the defect being corrected)
- [ ] Elbows are FULLY STRAIGHT and unchanged in both frames — any visible
      elbow bend is wrong; this is a scapular-only movement
- [ ] The lower back and hips hold one straight, unchanging line with the
      legs in both frames — no sagging or piking; the visible movement is
      isolated to the shoulder region
- [ ] Frame 1 clearly reads as shoulder blades pinched together with the
      upper back sunk clearly toward the floor
- [ ] Frame 2 clearly reads as shoulder blades spread apart with the upper
      back pushed clearly up and away from the floor
- [ ] Hands stay flat, directly under the shoulders, in the same place in
      both frames
- [ ] No wall, bench, band, dumbbell, or block anywhere in either frame
- [ ] Same face, hair, wardrobe, and body proportions in both frames
- [ ] Readable as a scapular push-up (not a bent-elbow push-up) at 64 px wide
