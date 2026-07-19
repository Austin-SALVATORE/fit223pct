# Machine Chest Fly — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `machine-chest-fly` |
| Category | Chest Variants |
| Camera | `machine-three-quarter` |
| Frames | 4 |
| Equipment | Pec deck / rear delt machine |
| Status | `planned` |

> Near-duplicate warning: this asset and `pec-deck` use the same machine. The
> only visual differentiator is the arm position — the machine chest fly grips
> handles with nearly straight arms and a soft fixed 15 degree elbow; the pec
> deck rests the forearms and elbows on the vertical pads at 90 degrees.
> Strong consolidation candidate.

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
Exercise: Machine Chest Fly
Camera: machine-three-quarter view, turned so the seat, both arm levers and
the arc toward the midline all stay readable.
Equipment: one matte black seated frame with an upright back pad and two
vertical padded black arm levers, arranged as a seated chest fly with a simple
black handle at the front edge of each lever. The hands grip the handles at
shoulder height with the arms nearly straight, elbows held in a soft fixed
bend of roughly 15 degrees — the forearms do not rest on the pads.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Open start. Seated upright with the whole back flat against the pad from
   hips to shoulders, head resting back, feet flat on the floor roughly hip
   width apart. Arms out wide at shoulder height gripping the handles, elbows
   in a soft fixed bend of roughly 15 degrees, wrists neutral and in line with
   the forearms, a gentle stretch across the chest.
2. Mid arc. Both hands sweep forward through roughly half the arc at shoulder
   height, the elbow bend still exactly the same soft 15 degrees, the whole
   back still flat on the pad.
3. Peak. The hands meet in front of the mid chest at the midline, close
   together but not clashing, the elbow bend still the same soft 15 degrees,
   chest visibly contracted, shoulders down away from the ears.
4. Return to the open start, identical to frame 1, the arms travelling back
   under control to the same gentle chest stretch and no further.

TECHNIQUE — must be correct in every frame:
- The elbow angle stays fixed at a soft 15 degree bend in all four frames — it
  must never open or close. This is an arc, not a press.
- The hands grip the handles with nearly straight arms — the forearms and
  elbows never rest against the pads.
- The hands travel in a wide horizontal arc at shoulder height and meet at the
  midline in front of the mid chest.
- The whole back stays flat on the pad and the shoulders stay down, never
  shrugging toward the ears.
- The open position goes no wider than the gentle stretch of frame 1 — no
  forced over-stretch of the shoulders.
```

## Form checkpoints (QA)

- [ ] Hands grip the handles with nearly straight arms — forearms never rest
      on the pads (the differentiator from `pec-deck`)
- [ ] Elbow bend is a soft fixed 15 degrees in all four frames — never opens
      or closes
- [ ] Hands travel in a wide arc at shoulder height and meet at the midline
- [ ] Back flat on the pad, feet flat, shoulders not shrugged
- [ ] Wrists neutral and in line with the forearms in all four frames
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] Readable as a fly and not a press at 64 px wide
