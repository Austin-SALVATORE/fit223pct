# Dumbbell Squeeze Press (Hex Press) — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `dumbbell-squeeze-press` |
| Category | Chest / Push |
| Camera | `bench-side` |
| Frames | 4 |
| Equipment | Dumbbell (two, pressed together throughout), Flat bench |
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
Exercise: Dumbbell Squeeze Press (Hex Press)
Camera: bench-side view, the bench seen from the side so the elbow angle and
the vertical press path are readable, while both dumbbell heads stay visible
and not fully hidden one behind the other.
Equipment: two matte black hexagonal-head dumbbells with brushed chrome
knurled handles, held directly above the center of the chest with a neutral
grip, palms facing each other. The two dumbbells' flat hexagonal end faces
are pressed together, one hand positioned slightly higher than the other so,
from this side view, both hex heads stay visible with a single clear seam
line where the two flat faces meet — never a single overlapping silhouette
that reads as one dumbbell. Plus one low matte black padded bench on a
simple black steel frame, lying along the frame with the head end toward the
left.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Lockout start. Lying face up on the flat bench, head, upper back and
   glutes on the pad, slight natural arch in the lower back, feet flat on
   the floor. Arms vertical, elbows extended but not locked hard, the two
   dumbbells held together directly above the center of the chest, their
   flat hex faces pressed flush together with visible inward squeezing
   pressure between them, the seam between the two heads clearly visible
   from this side angle.
2. Slow controlled descent, roughly a third of the way down, elbows
   beginning to bend, dumbbells still pressed together and still centered
   above the chest, still squeezed with continuous inward pressure — this
   is the start of the slow 2-3 second eccentric.
3. Bottom position. Dumbbells lowered to the center of the chest, still
   pressed flush together the entire way down, elbows bent to roughly
   45 degrees and tucked close to the torso rather than flared out,
   forearms roughly vertical from this side view. Chest lifted and
   contracted, upper back tight, glutes on the bench, feet flat. The two
   dumbbell heads remain in continuous contact with zero visible gap
   between them.
4. Ascent, back to roughly a half press, elbows extending, the two
   dumbbells rising together straight back toward lockout, still pressed
   flush together with continuous inward squeeze the entire way up.

TECHNIQUE — must be correct in every frame:
- The two dumbbell heads stay in continuous, unbroken contact — flush
  together with no gap — in every single frame from lockout to the
  bottom and back. This is the single most important visual detail: the
  dumbbells must never separate, even slightly.
- Neutral grip throughout, palms facing each other, not facing the feet.
- Elbows stay tucked at roughly 45 degrees to the torso, never flared to
  90, and both dumbbells stay centered above the chest rather than
  spreading to shoulder width.
- Wrists stay neutral and stacked over the elbows, forearms roughly
  vertical at the bottom.
- Shoulder blades stay retracted into the bench, glutes stay down and the
  feet stay flat.
- The elbow angle clearly changes across the frames — this is a press
  with a full range of motion, not a static isometric hold.
```

## Form checkpoints (QA)

- [ ] The two dumbbell heads are visibly touching, flush together with no
      gap, in every one of the four frames
- [ ] Neutral grip (palms facing each other), not a forward-facing bench
      press grip
- [ ] Elbow angle clearly changes across the frames — reads as a press,
      not a static hold
- [ ] Dumbbells stay centered above the chest, not spread to shoulder
      width, at any point in the rep
- [ ] Elbows tucked to roughly 45 degrees, not flared to 90
- [ ] Glutes and upper back stay on the bench, feet flat on the floor
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] Readable as a dumbbell squeeze press (two dumbbells pressed
      together), not an ordinary dumbbell bench press, at 64 px wide
