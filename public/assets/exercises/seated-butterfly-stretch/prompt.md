# Seated Butterfly Stretch — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `seated-butterfly-stretch` |
| Category | Recovery Stretch |
| Camera | `front` |
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
scale, evenly spaced with clear background gaps between them. No figure overlaps,
touches, or is cropped by another. The entire body is visible in every frame,
including both feet. Generous background margin above and below. Eye-level camera at
an identical angle and distance for every frame.

STRICTLY EXCLUDE:
Text, numbers, labels, captions, arrows, motion lines, panel borders, dividing
lines, grids, watermarks, logos, background objects, mirrors, other people,
extra or missing limbs, distorted hands, any magenta on the figure, clothing or equipment, drop shadows or glow halos around the figure, broken or hyperextended joints.

MOVEMENT FOR THIS IMAGE:
Exercise: Seated Butterfly Stretch. Not per side — both legs are stretched
together and identically in every play.
Camera: front view, so the symmetric, knees-open shape of the position reads
clearly.
Equipment: none — bodyweight only.
Number of frames: 2, evenly spaced left to right.
Both figures sit on the same shared invisible ground line as each other, at
exactly identical scale and spacing.

Frames:
1. Entry position — she has just sat down; the stretch has NOT begun yet.
   This must read as clearly, visibly different from frame 2, not a
   shallower version of it. Spine tall. Soles of the feet just brought
   together in front of the body. Knees still HIGH — bent up and in,
   noticeably higher than in frame 2, not yet dropped open. Hands are NOT
   on the feet — resting on the ground beside her hips or lightly on her
   shins, not gripping or holding the feet or ankles at all. Shoulders
   level. The whole pose reads as the moment of settling in, before
   anything is being stretched.
2. Full hold — the stretch itself, and it must look obviously different
   from frame 1. Still seated tall with the same long spine — sitting
   tall, not folding forward. Soles still pressed together. Knees now
   settled open and visibly LOWER than frame 1 — relaxed open under their
   own weight, not pressed down by the hands or elbows. Hands now holding
   the feet, resting on top of or around them. Shoulders relaxed and drawn
   down, away from the ears.

TECHNIQUE — must be correct in every frame:
- Frame 1 and frame 2 must read as a clearly different pair at a glance:
  frame 1's knees sit noticeably HIGHER, with hands NOT on the feet;
  frame 2's knees are settled open and LOWER, with hands holding the
  feet. A subtle or near-identical difference between the two frames is
  wrong.
- The spine stays tall and long in both frames — no rounding of the lower
  back, no forward fold.
- The knees are never pushed down by the hands or elbows — in the hold they
  have settled open under their own relaxed weight only.
- The soles of the feet stay pressed together in both frames.
- Shoulders stay relaxed and down, away from the ears, in both frames.
```

## Form checkpoints (QA)

- [ ] Frame 1 shows knees clearly HIGHER than frame 2, hands NOT on the
      feet — reads as just-seated, not yet stretching
- [ ] Frame 2 shows knees settled open and lower, hands holding the feet —
      reads as the stretch itself. The pair tells a story at a glance,
      not near-duplicates.
- [ ] Spine stays tall and long in both frames — no forward fold, no
      rounding
- [ ] Soles of the feet stay together in both frames
- [ ] No wall, bench, band, dumbbell, or block anywhere in either frame
- [ ] Same face, hair, wardrobe, and body proportions in both frames
- [ ] Both figures identical scale on one shared ground line
- [ ] Readable as a seated butterfly stretch at 64 px wide
