# Biceps Curl — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `biceps-curl` |
| Category | Arms |
| Camera | `three-quarter-front` |
| Frames | 4 |
| Equipment | Barbell |
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
Exercise: Barbell Biceps Curl
Camera: three-quarter-front view, the body turned about 30 degrees away from
square so both upper arms, both elbows and the palms-up grip stay readable.
Equipment: one long brushed chrome bar with matte black bumper plates, evenly
loaded both sides, held in both hands with a shoulder-width underhand
(supinated) grip, palms facing up and forward, wrists straight.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start. Standing tall, feet hip-width apart and flat, knees soft. Arms
   hang fully extended, elbows straight but not locked, the bar resting
   lightly against the front of the thighs. Upper arms vertical and in
   contact with the ribs, shoulders pulled down and back, palms up.
2. Early flexion, elbows bent to roughly 45 degrees. The bar has risen to
   just above mid-thigh. The upper arms have not moved at all — they stay
   vertical and pinned to the ribs; only the forearms have rotated up.
   Torso completely upright, no backward lean, no hip swing.
3. Top position, elbows bent to roughly 110 degrees, the bar at lower-chest
   height. Forearms angled steeply up, wrists still straight and in line
   with the forearms, elbows still directly under the shoulders and
   touching the ribs — they have not swung forward. Chest up, ribs down.
4. Controlled lowering, back through roughly 90 degrees of elbow flexion.
   The bar travels down the same arc it came up, forearms under tension,
   upper arms still vertical against the ribs, torso still upright.

TECHNIQUE — must be correct in every frame:
- The upper arms stay vertical and pinned to the ribs in every frame; only
  the forearms move.
- The elbow is the only joint that changes angle — no shoulder flexion, no
  swinging the elbows forward at the top.
- The torso stays vertical throughout — no leaning back, no hip drive, no
  arching of the lower back.
- Palms stay supinated and facing up for the whole rep; wrists stay neutral
  and in line with the forearms, never curled back or flexed under.
- Both arms move together and are at exactly the same angle in every frame.
```

## Form checkpoints (QA)

- [ ] Bar is a loaded barbell, gripped underhand at shoulder width — visibly
      not dumbbells
- [ ] Upper arms vertical and touching the ribs in all four frames
- [ ] Palms clearly supinated (facing up) — unmistakably not a neutral grip
- [ ] Torso vertical in all four frames — no backward lean or hip swing
- [ ] Wrists straight, not flexed or hyperextended, at the top
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a barbell curl at 64 px wide
