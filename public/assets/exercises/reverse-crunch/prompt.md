# Reverse Crunch — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `reverse-crunch` |
| Category | Core |
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
scale, evenly spaced with clear background gaps between them. No figure overlaps,
touches, or is cropped by another. The entire body is visible in every frame,
including both feet. Generous background margin above and below. Eye-level camera at
an identical angle and distance for every frame.

STRICTLY EXCLUDE:
Text, numbers, labels, captions, arrows, motion lines, panel borders, dividing
lines, grids, watermarks, logos, background objects, mirrors, other people,
extra or missing limbs, distorted hands, any magenta on the figure, clothing or equipment, drop shadows or glow halos around the figure, broken or hyperextended joints.

MOVEMENT FOR THIS IMAGE:
Exercise: Reverse Crunch
Camera: floor-side view in full profile so the pelvis lifting away from the ground
is clearly visible.
Equipment: none — bodyweight only.
Number of frames: 4, evenly spaced left to right.
All four figures lie on the same shared invisible ground line as each other,
at exactly identical scale and spacing.

Frames:
1. Start. Lying face up with the arms straight alongside the body, palms flat
   on the ground. Hips and knees both bent to 90 degrees, knees stacked
   directly above the hips, shins parallel to the ground, ankles relaxed. Head,
   shoulders, upper back and tailbone all in contact with the ground, lower
   back flat.
2. Early lift. The pelvis begins to roll toward the ribcage, the tailbone
   lifting a couple of centimetres clear of the ground while the knees stay
   bent at 90 degrees and travel toward the chest. Head, shoulders and arms
   unmoved.
3. Top position. The hips are clearly lifted off the ground and the pelvis is
   rolled up toward the ribcage, bringing the knees over the lower chest with
   the thighs past vertical. The mid-back and shoulders stay in contact with
   the ground, the arms stay flat and are not pressing the body up, and there
   is no swing or momentum in the legs.
4. Controlled return. The spine setting back down one segment at a time, hips
   descending, knees still bent at 90 degrees and travelling back toward the
   start, tailbone about to touch down last.

TECHNIQUE — must be correct in every frame:
- The defining movement is the pelvis rolling up off the ground — the hips must
  visibly leave the floor at the top.
- The knee angle stays at roughly 90 degrees throughout; the legs neither
  straighten nor kick.
- The shoulders and mid-back stay on the ground in every frame.
- The arms rest flat and do not push the body upward.
- The head stays down with the neck relaxed and long.
```

## Form checkpoints (QA)

- [ ] Hips and tailbone clearly leave the ground at the top frame
- [ ] Knee angle stays near 90 degrees in all four frames
- [ ] Shoulders and mid-back stay grounded throughout
- [ ] Distinct from a crunch — the pelvis moves, not the ribcage
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a reverse crunch at 64 px wide
