# Leg Press — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `leg-press` |
| Category | Squat / Lower Body |
| Camera | `machine-three-quarter` |
| Frames | 6 |
| Equipment | Leg press |
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
Exercise: Leg Press
Camera: machine three-quarter view, from the side and slightly in front of the
sled, so the angle of the footplate, the hip and the knee are all readable.
Equipment: one matte black angled sled with a large flat footplate and a black
seat, oriented the same way in every frame. The figure is seated in the machine
with the back and hips pressed flat into the seat pad, both feet flat on the
footplate about shoulder-width apart with the toes very slightly turned out,
hands resting on the side handles. The machine rests on the same shared ground
line in every frame and is drawn at exactly the same scale and angle each time.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Start position, legs nearly extended. Knees straight but not locked out,
   hips and lower back flat against the seat pad, feet flat on the footplate.
2. Early descent. Knees bent about 45 degrees as the footplate travels toward
   the body, hips still flat on the pad, ankles neutral.
3. Mid descent. Knees bent about 70 degrees, thighs approaching the torso,
   heels still flat on the footplate.
4. Bottom position, deepest point. Knees bent to roughly 90 degrees or slightly
   deeper, thighs close to the ribcage without touching, lower back and pelvis
   still flat against the pad, heels flat, shins angled with the knees tracking
   in line with the toes.
5. Press upward. Knees bent about 60 degrees, force driven through the whole
   foot, hips still flat on the pad.
6. Back to the start position, identical to frame 1, knees straight but not
   locked.

TECHNIQUE — must be correct in every frame:
- The lower back and pelvis stay flat against the seat pad in every frame — the
  hips never round or lift off at the bottom.
- Heels stay flat on the footplate; the feet never roll onto the toes.
- Knees track in line with the toes, never collapsing inward.
- The knees are never snapped into full lockout at the top.
- The machine, the camera angle, and the figure scale are identical in all six
  frames.
```

## Form checkpoints (QA)

- [ ] Lower back stays flat on the pad at the deepest frame — no hip rounding
- [ ] Knees reach roughly 90 degrees or slightly deeper at the bottom
- [ ] Knees never fully locked out at the top
- [ ] Feet flat on the footplate, knees tracking over toes in all six frames
- [ ] Machine drawn identically — same angle, same scale — in every frame
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures on one shared ground line at identical scale
- [ ] Readable as a leg press at 64 px wide
