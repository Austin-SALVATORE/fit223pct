# Incline Dumbbell Curl — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `incline-dumbbell-curl` |
| Category | Arms Variants |
| Camera | `bench-side` |
| Frames | 4 |
| Equipment | Incline bench + Dumbbell (pair) |
| Status | `planned` |

> Near neighbor of `dumbbell-biceps-curl` and `hammer-curl`. The reclined
> bench and the arms hanging BEHIND the torso line are the differentiators —
> the stretched hanging start in frame 1 must be unmistakable.

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
Exercise: Incline Dumbbell Curl
Camera: bench side view, the incline bench fully in profile so the reclined
torso and the arms hanging behind the torso line stay readable in every
frame.
Equipment: a matte black padded bench set to roughly 30 degrees on a black
steel frame, plus one matte black hexagonal-head dumbbell with a brushed
chrome knurled handle in each hand, held with an underhand (supinated) grip.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start, full stretch. Seated back on the incline bench, head, shoulders
   and back in contact with the pad, hips on the seat, feet flat on the
   floor. Both arms hang straight down and slightly BEHIND the torso line,
   elbows extended but not locked, dumbbells below and behind the
   shoulders, palms supinated and facing forward.
2. Early flexion, elbows bent to roughly 45 degrees. Only the forearms have
   curled up — the upper arms have not moved and still hang vertical,
   behind the torso line, elbows pointing at the floor. Palms still
   supinated. Head and back still on the pad.
3. Top position, elbows bent to roughly 110 degrees, the dumbbells near the
   front of the shoulders, palms still supinated and now facing up. The
   upper arms are still vertical and behind the torso line — the elbows
   have not swung forward or lifted.
4. Controlled lowering, back through roughly 45 degrees of elbow flexion,
   the dumbbells travelling down the same arc under tension, palms still
   supinated, upper arms unchanged, head and back still against the pad.

TECHNIQUE — must be correct in every frame:
- The upper arms stay vertical and behind the torso line in every frame;
  only the forearms move.
- The elbows never swing forward or drift up toward the shoulders.
- Head, shoulders and back stay in contact with the bench pad throughout.
- Palms stay supinated for the whole rep; wrists neutral and in line with
  the forearms.
- Both arms move together and are at exactly the same angle in every frame.
- Feet stay flat on the floor, hips stay on the seat pad.
```

## Form checkpoints (QA)

- [ ] Frame 1 shows the stretched hanging start — dumbbells clearly behind
      the torso line
- [ ] Upper arms vertical and behind the torso in all four frames — no
      forward swing of the elbows
- [ ] Palms clearly supinated in every frame — not a neutral hammer grip
- [ ] Head, shoulders and back stay in contact with the incline pad
- [ ] Bench visibly inclined at roughly 30 degrees — not flat, not upright
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as an incline curl at 64 px wide
