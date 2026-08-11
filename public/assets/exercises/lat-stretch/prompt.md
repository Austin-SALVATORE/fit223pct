# Lat Stretch — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `lat-stretch` |
| Category | Recovery Stretch |
| Camera | `bench-side` |
| Frames | 2 |
| Equipment | Flat bench — both forearms rest flat on its top surface while the chest drops through |
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
Exercise: Lat Stretch (using the bench)
Camera: bench-side view, the bench seen from the side so its flat top, her
kneeling position beside it and the drop of her chest below its level are
all readable.
Equipment: one low matte black padded bench on a simple black steel frame,
lying along the frame at roughly waist height to a kneeling person. She
kneels on the ground close beside one long edge of the bench, facing it,
both forearms and hands extended flat along its top surface, reaching away
from her body along the bench's length.
Number of frames: 2, evenly spaced left to right.
Both figures kneel on the same shared invisible ground line as each other,
at exactly identical scale and spacing, each beside their own copy of the
bench.

Frames:
1. Entry position. Kneeling upright on the ground close beside the bench,
   hips stacked above the knees, not yet sunk back. Both arms extended
   forward, forearms and hands resting flat on the bench's top surface,
   shoulder-width apart. Torso still fairly upright, chest not yet dropped,
   head in line with the spine.
2. Full hold. Hips sunk back and down, settling toward the heels. Both arms
   still extended forward along the bench, forearms and hands still resting
   flat on its surface. The chest has dropped down and through the gap
   between the upper arms, sinking below the level of the bench's top
   surface, shoulders releasing down and away from the ears. Head relaxed,
   gaze down, neck long and unstrained.

TECHNIQUE — must be correct in every frame:
- Both forearms and hands stay flat on the bench's top surface in both
  frames — this is the surface the stretch works against.
- The hips sit higher, over the knees, in frame 1, and are sunk back toward
  the heels in frame 2 — the same relationship child's pose uses, but with
  the arms supported on the bench instead of the floor.
- The chest visibly drops below the level of the bench's top surface in
  frame 2, through the gap between the arms.
- Shoulders stay released down, away from the ears, in both frames.
- The neck stays relaxed and long; the head does not strain or crane.
- Knees stay on the ground, close beside the bench, in both frames.
```

## Form checkpoints (QA)

- [ ] Both forearms and hands stay flat on the bench's top surface in both
      frames
- [ ] Frame 1 shows hips over the knees, chest not yet dropped
- [ ] Frame 2 shows hips sunk back toward the heels and the chest visibly
      dropped below the bench's top surface, between the arms
- [ ] Shoulders stay released down, away from the ears, in both frames
- [ ] Knees stay on the ground, close beside the bench, in both frames
- [ ] No wall, band, dumbbell, or block anywhere in either frame — only the
      flat bench
- [ ] Same face, hair, wardrobe, and body proportions in both frames
- [ ] Both figures identical scale on one shared ground line, each with
      their own copy of the bench
- [ ] Readable as a bench-assisted lat stretch at 64 px wide
