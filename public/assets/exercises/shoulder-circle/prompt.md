# Shoulder Circle — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `shoulder-circle` |
| Category | Warm-up / Activation |
| Camera | `side` |
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
Exercise: Shoulder Circle
Camera: side view, so the full circular path each straight arm sweeps
through — down, forward, up overhead, and back — is unmistakable and reads
like a clock face.
Equipment: none — bodyweight only.
Number of frames: 4, evenly spaced left to right.
All four figures stand on the same shared invisible ground line as each
other, at exactly identical scale and spacing.

Frames:
1. Bottom of the circle. Standing tall, feet hip-width apart, knees soft,
   ribs down. Both arms straight and relaxed, hanging down at her sides,
   fingertips pointing toward the ground — the six o'clock point of the
   circle.
2. Forward and rising. Both straight arms have swept forward and up, now
   roughly horizontal, reaching straight out in front of the shoulders —
   the three o'clock point of the circle. Elbows stay straight throughout;
   the movement comes entirely from the shoulder joint.
3. Top of the circle. Both straight arms continue the same sweep to directly
   overhead, fully extended above the crown of the head — the twelve
   o'clock point of the circle. Torso stays tall and upright, ribs still
   down, no arching of the lower back to help the arms reach higher.
4. Back and descending. Both straight arms continue the same circular sweep
   backward and down, now roughly horizontal behind the body — the nine
   o'clock point of the circle, completing the loop back toward frame 1's
   starting point. Shoulders stay down, away from the ears, throughout.

TECHNIQUE — must be correct in every frame:
- Both arms stay fully straight, elbows extended but not locked, in every
  frame — this is a shoulder movement, not an elbow movement.
- The four frames trace one single continuous circle, always moving the same
  direction: down, forward, up overhead, then back and down again.
- Both arms move together, mirrored, at the same point in the circle in
  every frame.
- The torso stays tall and still throughout — no arching of the lower back
  to gain overhead height and no leaning to help the arms swing.
- Shoulders stay down, away from the ears, in every frame, including
  frame 3's overhead position.
```

## Form checkpoints (QA)

- [ ] Both arms stay fully straight, not locked, in every frame
- [ ] The four frames trace one continuous circle in a single consistent
      direction, roughly at the 6, 3, 12, and 9 o'clock points
- [ ] Both arms move together, mirrored, at the same point in the circle in
      every frame
- [ ] Torso stays tall and still throughout — no lower-back arch, no leaning
- [ ] Shoulders stay down, away from the ears, in every frame including the
      overhead frame
- [ ] No wall, bench, band, dumbbell, or block anywhere in any frame
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a shoulder circle at 64 px wide
