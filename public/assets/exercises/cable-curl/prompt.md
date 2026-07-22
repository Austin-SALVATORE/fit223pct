# Cable Curl — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `cable-curl` |
| Category | Arms |
| Camera | `machine-three-quarter` |
| Frames | 4 |
| Equipment | Cable machine |
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
Exercise: Cable Curl
Camera: machine three-quarter view, the cable column set behind and slightly to
the side of the figure so the low pulley, the straight cable line and the
elbow angle all stay readable in every frame.
Equipment: a matte black upright column with a brushed chrome cable running from a
low pulley at the base of the column to a simple black straight bar
attachment, held in both hands with a shoulder-width underhand grip,
palms up. The figure stands one short step in front of the column so the
cable runs at a slight forward angle and stays taut in every frame.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start. Standing tall one step in front of the low pulley, feet hip-width
   apart and flat, knees soft. Arms fully extended down, the straight bar
   in front of the thighs, cable taut and angled slightly back to the
   pulley. Upper arms vertical and against the ribs, palms up.
2. Early flexion, elbows bent to roughly 45 degrees, the bar just above
   mid-thigh, cable still taut and tracking straight to the low pulley.
   Upper arms still vertical and pinned to the ribs; only the forearms
   have moved. Torso upright, weight even over both feet.
3. Top position, elbows bent to roughly 110 degrees, the bar at lower-chest
   height, cable pulling back and down along a straight line to the
   pulley. Elbows still under the shoulders and against the ribs, wrists
   straight, no forward lean and no backward lean to counterbalance.
4. Controlled lowering, elbows back through roughly 90 degrees, resisting the
   cable on the way down. The cable never goes slack, the upper arms stay
   vertical against the ribs, the torso stays upright.

TECHNIQUE — must be correct in every frame:
- The cable is a straight taut line from the low pulley to the bar in every
  frame — never slack, never curved or draped.
- The upper arms stay vertical and pinned to the ribs; only the forearms
  move.
- The stance does not change between frames — the feet stay planted and the
  body does not drift toward or away from the column.
- The torso stays vertical — no leaning back against the load at the top.
- Palms stay supinated and the wrists stay straight and in line with the
  forearms.
```

## Form checkpoints (QA)

- [ ] Low pulley at the base of the column, not a high pulley — cable runs
      upward to the hands
- [ ] Cable is taut and dead straight in all four frames
- [ ] Upper arms vertical and touching the ribs in all four frames
- [ ] Feet planted in the identical position in all four frames
- [ ] Torso vertical — no backward lean to counterbalance the stack
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a standing cable curl at 64 px wide
