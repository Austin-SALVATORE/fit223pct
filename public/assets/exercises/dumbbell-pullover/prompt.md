# Dumbbell Pullover — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `dumbbell-pullover` |
| Category | Back / Pull |
| Camera | `bench-side` |
| Frames | 4 |
| Equipment | Dumbbell (a single dumbbell, held with both hands together), Flat bench |
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
Exercise: Dumbbell Pullover
Camera: bench-side view, the bench seen from the side so the overhead arc and
the fixed elbow bend are both readable.
Equipment: one matte black hexagonal-head dumbbell with a brushed chrome
knurled handle, held vertically with BOTH hands together, palms cupped under
the inside of the top plate, thumbs wrapped — a single shared dumbbell, never
two. Plus one low matte black padded bench on a simple black steel frame,
lying along the frame with the head end toward the left. She lies across the
bench with only her upper back and shoulders on the pad, not lengthwise along
it — hips low, roughly level with the bench top, knees bent and feet flat on
the floor on either side.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start, over the chest. Upper back and shoulders resting on the bench, hips
   low and knees bent, feet flat on the floor. Both arms extended straight up
   over the chest, elbows held in a soft fixed bend of roughly 15 degrees, the
   single dumbbell held vertically in both hands directly above the chest,
   palms cupped under the plate.
2. Early arc. Both arms sweeping back and down together in one continuous arc
   over the head, the elbow bend still exactly the same soft 15 degrees, the
   dumbbell now roughly level with the crown of the head, ribs staying down
   and drawn in — no flare.
3. Bottom position, deepest point. Arms reaching back and down as far as the
   shoulders comfortably allow, the dumbbell lowered behind and below the
   level of the bench, elbow bend still the same soft 15 degrees throughout,
   a clear controlled stretch through the shoulders and the sides of the
   ribcage, ribs held down with no arch lifting them toward the ceiling, hips
   staying low and level, not rising off their resting height.
4. Returning, back toward the top. Arms sweeping back up along the same arc
   toward over the chest, elbow bend still unchanged, ribs still held down,
   the dumbbell rising back toward directly above the chest.

TECHNIQUE — must be correct in every frame:
- The elbow angle stays fixed at a soft 15 degree bend in all four frames —
  it must never open into a straight-arm reach or close into a triceps-style
  bend. This is a shoulder-driven arc, not an elbow movement.
- The dumbbell is ALWAYS a single shared weight held with both hands
  together — never two separate dumbbells, one in each hand.
- Only the upper back and shoulders rest on the bench; the hips stay low
  throughout and never rise or arch up to gain range.
- The ribs stay pulled down and in at the bottom of the arc — no rib flare
  or lower-back arching to chase a deeper stretch.
- The dumbbell travels in one continuous arc from over the chest to behind
  the head and back — not a straight vertical press.
```

## Form checkpoints (QA)

- [ ] A SINGLE dumbbell is held with both hands throughout — never two
      separate dumbbells, one per hand
- [ ] Elbow bend stays visibly identical (a soft ~15 degrees) in all four
      frames — it never opens or closes
- [ ] Only the upper back and shoulders rest on the bench; hips stay low
      and level in every frame, never rising or arching
- [ ] The dumbbell travels in a continuous arc from over the chest to behind
      the head, not a straight vertical press
- [ ] Ribs stay pulled down at the bottom of the arc — no rib flare or
      lower-back arch
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] Readable as a pullover, not a press, at 64 px wide
