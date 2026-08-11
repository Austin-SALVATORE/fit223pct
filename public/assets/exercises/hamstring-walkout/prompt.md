# Hamstring Walkout — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `hamstring-walkout` |
| Category | Hip Hinge / Glutes |
| Camera | `floor-side` |
| Frames | 4 |
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
Exercise: Hamstring Walkout
Camera: floor-side view, turned very slightly toward the viewer so both feet
and the full length of the raised torso stay readable.
Equipment: none — bodyweight only.
Number of frames: 4, evenly spaced left to right.
All four figures lie on the same shared invisible ground line as each other,
at exactly identical scale and spacing.

Frames:
1. Bridge set. Lying on her back, knees bent, both feet flat on the ground
   close to the glutes — heels reachable by the fingertips, roughly hip-width
   apart. Hips already driven fully up into a firm glute bridge: a straight
   diagonal line from the knees through the hips to the shoulders. Shoulders,
   upper arms and head stay flat on the ground. Arms resting on the ground
   alongside the body, palms down. Ribs pulled down, glutes contracted,
   lumbar spine neutral.
2. First heel step. Hips still held at the exact same bridge height as frame
   1 — the hips do not sink or dip. Both feet have taken one short step
   farther from the glutes, heels now a little past directly under the
   knees, shins angled instead of vertical. Shoulders, upper arms and head
   still flat on the ground, torso still one straight line from knees to
   shoulders.
3. Full extension. Hips still held at that same bridge height, unmoved. Both
   feet have walked out as far as the hips can stay level and lifted — legs
   now much straighter, heels well ahead of the knees, shins at a shallow
   angle to the ground. This is the far end of the walkout, the hardest
   point of the set: the straight line from knees through hips to shoulders
   is longer and lower now that the legs are extended, but the hips
   themselves have not dropped in height. Shoulders and head still flat on
   the ground.
4. Walking back in. Feet partway back toward the glutes again, retracing the
   same path as frames 2 and 1 in reverse, hips still held at the identical
   bridge height throughout, shins re-steepening toward vertical. Shoulders
   and head still flat on the ground.

TECHNIQUE — must be correct in every frame:
- The hips stay at the exact same lifted bridge height in all four frames —
  they never sink, dip, or lower as the feet walk out and back. This is the
  one thing the whole exercise tests.
- The head, shoulders and upper arms stay in contact with the floor in every
  frame.
- The whole body stays in one shared side-view plane so both feet stay
  visible throughout the walkout.
- Ribs stay pulled down and the lumbar spine stays neutral — no
  hyperextension of the lower back to hold the height.
- Feet stay flat on the ground throughout; only the distance between the
  heels and the glutes changes.
```

## Form checkpoints (QA)

- [ ] Hips are at the SAME lifted bridge height in all four frames — no
      sinking or dipping as the feet walk out and back
- [ ] Head, shoulders and upper arms stay flat on the ground in every frame
- [ ] Frame 3 shows the feet at their farthest point from the glutes, legs
      visibly straighter, hips still level with frames 1 and 4
- [ ] Feet stay flat on the ground throughout — only heel-to-glute distance
      changes
- [ ] No wall, bench, band, dumbbell, or block anywhere in any frame
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a hamstring walkout at 64 px wide
