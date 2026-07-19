# EZ-Bar Curl — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `ez-bar-curl` |
| Category | Arms Variants |
| Camera | `three-quarter-front` |
| Frames | 4 |
| Equipment | EZ bar |
| Status | `planned` |

> NEAR-DUPLICATE of `biceps-curl` (straight barbell): same stance, camera,
> frame count and cues. The shallow zigzag bend of the bar and the slightly
> inward-turned grip are the ONLY distinguishing features — if the bend does
> not read clearly, the asset fails QA.

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
Pure flat white #FFFFFF, completely empty. No floor, no ground line, no shadow,
no gym environment, no gradient, no vignette, no frame or border.

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
Matte near-black metal #1D2025 with brushed chrome shafts and handles #EFEFEF.
Upholstery and bench pads matte near-black #1D2025. Simple, clean, realistic
proportions with believable weight and correct scale against the body.

COMPOSITION:
All figures stand on one shared invisible ground line, at exactly the same
scale, evenly spaced with clear white gaps between them. No figure overlaps,
touches, or is cropped by another. The entire body is visible in every frame,
including both feet. Generous white margin above and below. Eye-level camera at
an identical angle and distance for every frame.

STRICTLY EXCLUDE:
Text, numbers, labels, captions, arrows, motion lines, panel borders, dividing
lines, grids, watermarks, logos, background objects, mirrors, other people,
extra or missing limbs, distorted hands, broken or hyperextended joints.

MOVEMENT FOR THIS IMAGE:
Exercise: EZ-Bar Curl
Camera: three-quarter-front view, the body turned about 30 degrees away from
square so both upper arms, the angled grip and the zigzag bend of the bar
stay readable in every frame.
Equipment: one short brushed chrome bar with a shallow zigzag bend, matte
black plates both sides, held in both hands on the angled sections of the
bar with an underhand grip — palms supinated but turned slightly inward
toward each other by the bend, wrists straight.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start. Standing tall, feet hip-width apart and flat, knees soft. Arms
   hang fully extended, elbows straight but not locked, the bar resting
   lightly against the front of the thighs, its zigzag bend clearly
   visible. Upper arms vertical and in contact with the ribs, shoulders
   down and back, palms up and turned slightly inward on the angled grip.
2. Early flexion, elbows bent to roughly 45 degrees. The bar has risen to
   just above mid-thigh. The upper arms have not moved at all — they stay
   vertical and pinned to the ribs; only the forearms have rotated up.
   Palms still up and slightly inward. Torso upright, no backward lean.
3. Top position, elbows bent to roughly 110 degrees, the bar at
   lower-chest height, its bend still clearly visible. Wrists straight
   along the angled sections, elbows still directly under the shoulders
   and touching the ribs — they have not swung forward. Chest up.
4. Controlled lowering, back through roughly 90 degrees of elbow flexion.
   The bar travels down the same arc it came up, forearms under tension,
   palms still up and slightly inward, upper arms still vertical against
   the ribs, torso still upright.

TECHNIQUE — must be correct in every frame:
- The upper arms stay vertical and pinned to the ribs in every frame; only
  the forearms move.
- The elbow is the only joint that changes angle — no shoulder flexion, no
  swinging the elbows forward at the top.
- The torso stays vertical throughout — no leaning back, no hip drive.
- The grip sits on the angled sections of the bar: palms supinated but
  turned slightly inward — never a fully neutral hammer grip and never the
  flat palms-up grip of a straight bar. Wrists stay straight.
- The zigzag bend of the bar stays clearly visible in every frame.
- Both arms move together and are at exactly the same angle in every frame.
```

## Form checkpoints (QA)

- [ ] The bar shows a clear shallow zigzag bend — visibly not a straight
      barbell
- [ ] Underhand grip on the angled sections — palms up, turned slightly
      inward, wrists straight
- [ ] Upper arms vertical and touching the ribs in all four frames
- [ ] Torso vertical in all four frames — no backward lean or hip swing
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as an EZ-bar curl — and distinguishable from the straight-bar
      curl — at 64 px wide
