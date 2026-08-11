# Cat-Cow — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `cat-cow` |
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
Exercise: Cat-Cow
Camera: floor-side view, turned very slightly toward the viewer so the full
curve of the spine, the head and the tailbone all stay readable.
Equipment: none — bodyweight only.
Number of frames: 2, evenly spaced left to right.
Both figures are on the same shared invisible ground line as each other, at
exactly identical scale and spacing.

Frames:
1. Cat — spine rounded up. On hands and knees, hands flat on the ground
   directly under the shoulders, knees directly under the hips. The spine is
   actively rounded UPWARD toward the ceiling, tallest in the middle of the
   back. The tailbone tucks under and down, the head drops and the chin
   tucks toward the chest, gaze directed back toward the knees. Shoulder
   blades spread wide and press away from each other.
2. Cow — spine arched down. The same hands-and-knees base, hands still
   directly under the shoulders, knees still directly under the hips. The
   spine now arches the opposite way, dipping DOWNWARD toward the floor
   between the shoulder blades. The tailbone and chest both lift and open
   toward the ceiling, the head lifts with the chin leading forward and
   slightly up, gaze directed forward and up. Shoulder blades draw together.

TECHNIQUE — must be correct in every frame:
- Hands stay flat on the ground directly under the shoulders and knees stay
  directly under the hips in both frames — the base of support does not
  shift.
- Frame 1 shows a clear, rounded UPWARD spine with the tailbone tucked and
  the head dropped and tucked toward the chest.
- Frame 2 shows a clear, arched DOWNWARD spine with the tailbone and chest
  both lifted and the head raised, chin leading.
- The two frames must read as opposite ends of one continuous spinal
  movement, not a subtle variation of the same shape.
- Elbows stay soft, not locked, in both frames.
```

## Form checkpoints (QA)

- [ ] Hands stay directly under the shoulders and knees directly under the
      hips in both frames
- [ ] Frame 1 (cat) shows a clear upward-rounded spine, tucked tailbone, and
      a dropped, tucked head
- [ ] Frame 2 (cow) shows a clear downward-arched spine, lifted tailbone and
      chest, and a raised head
- [ ] The two frames read as opposite ends of one continuous movement, not a
      subtle variation
- [ ] No wall, bench, band, dumbbell, or block anywhere in either frame
- [ ] Same face, hair, wardrobe, and body proportions in both frames
- [ ] Both figures identical scale on one shared ground line
- [ ] Readable as cat-cow at 64 px wide
