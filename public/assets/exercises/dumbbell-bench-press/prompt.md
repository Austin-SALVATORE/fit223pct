# Dumbbell Bench Press — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `dumbbell-bench-press` |
| Category | Chest / Push |
| Camera | `bench-side` |
| Frames | 6 |
| Equipment | Dumbbell (one per hand), Flat bench |
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
Exercise: Dumbbell Bench Press
Camera: bench-side view, the bench seen from the side so the elbow angle, the
dumbbell path and the arch of the upper back are all readable.
Equipment: two matte black hexagonal-head dumbbells with brushed chrome
knurled handles, one in each hand, plus one low matte black padded bench on a
simple black steel frame. The bench lies along the frame with the head end
toward the left. The dumbbells are held with the handles in line with each
other and the palms facing forward toward the feet.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Lockout start. Lying face up on the flat bench, head, upper back and glutes
   on the pad, slight natural arch in the lower back, feet flat on the floor.
   Arms vertical, elbows extended but not locked hard, the two dumbbells held
   over the upper chest roughly shoulder width apart and not touching.
2. Early descent, elbows bent to roughly 25 degrees. The dumbbells travel down
   and slightly out, upper arms beginning to tuck toward roughly 45 degrees
   from the torso, wrists stacked over the elbows.
3. Half descent, elbows at roughly 90 degrees, forearms vertical, dumbbells
   level with the front of the shoulders, shoulder blades pinned back and down
   into the bench.
4. Bottom position. Dumbbells at chest level just outside the ribcage, handles
   roughly level with the lower chest, elbows tucked to roughly 45 degrees and
   sitting directly under the wrists, forearms vertical from this side view.
   The elbows do not drop far below the line of the bench. Chest lifted, upper
   back tight, glutes on the bench, feet flat.
5. Ascent, back to roughly a half press. Elbows extending, dumbbells pressing
   up and slightly inward, staying separate and never clashing.
6. Lockout again, identical to frame 1, elbows extended, dumbbells over the
   upper chest and still roughly shoulder width apart.

TECHNIQUE — must be correct in every frame:
- The elbow clearly bends and extends across the frames — this is a press, not
  a wide arc with a fixed elbow angle.
- Elbows stay at roughly 45 degrees to the torso, never flared to 90.
- Wrists stay neutral and stacked over the elbows, forearms vertical at the
  bottom.
- Shoulder blades stay retracted into the bench, glutes stay down and the feet
  stay flat.
- The two dumbbells stay level with each other and never touch.
```

## Form checkpoints (QA)

- [ ] Elbow angle clearly changes across the frames — reads as a press, not a fly
- [ ] Dumbbells stop at chest level just outside the ribcage at the bottom
- [ ] Forearms vertical with wrists stacked over elbows in the bottom frame
- [ ] Dumbbells stay separate at lockout, roughly shoulder width apart
- [ ] Glutes and upper back stay on the bench, feet flat on the floor
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as a dumbbell bench press at 64 px wide
