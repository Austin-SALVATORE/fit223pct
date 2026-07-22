# Bench Dip — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `bench-dip` |
| Category | Arms Variants |
| Camera | `side` |
| Frames | 4 |
| Equipment | Flat bench |
| Status | `planned` |

> Must be unmistakably different from the existing `dip` (parallel bars):
> here the body is in FRONT of a bench with the hands behind on its edge —
> never suspended between two bars.

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
Exercise: Bench Dip
Camera: side view, the bench fully in profile behind the figure so the hands
on the bench edge, the backward-pointing elbows and the vertical hip path
all stay readable in every frame.
Equipment: a low matte black padded bench on a simple black steel frame,
positioned BEHIND the figure. Both hands grip the front edge of the bench
pad behind the hips, shoulder-width apart, fingers pointing forward over
the edge, palms down on the pad.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start, top position. The body is in front of the bench, facing away
   from it. Hands behind on the bench edge, palms down, fingers forward,
   arms extended with the elbows straight but not locked. Hips lifted
   level with the bench top, just in front of its edge. Legs extended
   straight forward, heels on the floor, toes pointing up. Torso upright.
2. Early descent. The elbows bend straight backward to roughly 45 degrees,
   hands unchanged on the edge, the hips travelling straight down and
   staying close to the bench edge. Shoulders down, heels planted, legs
   still straight.
3. Bottom position. Elbows bent to roughly 90 degrees and pointing
   straight back — not flared out to the sides — upper arms roughly
   parallel to the floor. Hips clearly below the bench top, torso upright
   and close to the bench, shoulders down away from the ears, palms still
   flat on the pad, heels still on the floor.
4. Press back up, elbows extending through roughly 45 degrees as the hips
   rise on the same vertical path toward the top position, hands and
   heels unchanged.

TECHNIQUE — must be correct in every frame:
- The body stays in front of the bench in every frame, hands behind on its
  edge — the figure is never between bars or supports.
- The elbows bend and point straight backward, never flaring out.
- The hips travel straight down and up, staying close to the bench edge —
  they never drift forward away from it.
- Legs stay extended with heels on the floor and toes up in every frame.
- Shoulders stay down and back — no shrugging toward the ears and no
  rolling forward at the bottom.
- Elbows extend fully but never lock or hyperextend at the top.
```

## Form checkpoints (QA)

- [ ] Unmistakably a bench dip — figure in front of a bench with hands behind
      on its edge, not between parallel bars
- [ ] Palms down on the bench pad, fingers pointing forward over the edge
- [ ] Elbows point straight back in every frame — no flare
- [ ] Bottom frame: hips clearly below bench-top height, elbows near 90
      degrees
- [ ] Legs extended forward with heels on the floor in all four frames
- [ ] Shoulders down, not shrugged, at the bottom
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a bench dip at 64 px wide
