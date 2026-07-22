# Pec Deck — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `pec-deck` |
| Category | Chest Variants |
| Camera | `machine-three-quarter` |
| Frames | 4 |
| Equipment | Pec deck / rear delt machine |
| Status | `planned` |

> Near-duplicate warning: this asset and `machine-chest-fly` use the same
> machine. The only visual differentiator is the arm position — pec deck rests
> the forearms and elbows on the vertical pads with a fixed 90 degree elbow;
> the machine chest fly grips handles with nearly straight arms. Strong
> consolidation candidate.

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
Exercise: Pec Deck
Camera: machine-three-quarter view, turned so the seat, both arm levers and
the arc toward the midline all stay readable.
Equipment: one matte black seated frame with an upright back pad and two
vertical padded black arm levers, arranged as a pec deck. The forearms and
elbows rest flat against the vertical pads, elbows bent to roughly 90 degrees
and lifted level with the shoulders — the hands do not grip anything.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Open start. Seated upright with the whole back flat against the pad from
   hips to shoulders, head resting back, feet flat on the floor roughly hip
   width apart. Both forearms rest flat against the vertical pads out to the
   sides, elbows bent to roughly 90 degrees and lifted level with the
   shoulders, hands relaxed and open, a gentle stretch across the chest.
2. Mid squeeze. Both arm levers sweep forward through roughly half the arc,
   the elbow bend still exactly 90 degrees, elbows still level with the
   shoulders, the whole back still flat on the pad.
3. Peak squeeze. The two pads meet in front of the mid chest at the midline,
   elbows still bent to 90 degrees and level with the shoulders, chest visibly
   contracted, shoulders down away from the ears.
4. Return to the open start, identical to frame 1, the levers travelling back
   under control to the same gentle chest stretch and no further.

TECHNIQUE — must be correct in every frame:
- The elbow angle stays fixed at roughly 90 degrees in all four frames — the
  forearms press the pads, and the hands stay relaxed and never grip handles.
- The elbows stay lifted level with the shoulders through the whole arc, never
  dropping down toward the ribs.
- The pads travel in a horizontal arc and meet at the midline in front of the
  mid chest.
- The whole back stays flat on the pad and the shoulders stay down, never
  shrugging toward the ears.
- The open position goes no wider than the gentle stretch of frame 1 — no
  forced over-stretch of the shoulders.
```

## Form checkpoints (QA)

- [ ] Forearms and elbows rest on the vertical pads, hands relaxed — no
      gripped handles (the differentiator from `machine-chest-fly`)
- [ ] Elbow bend fixed at roughly 90 degrees in all four frames
- [ ] Elbows level with the shoulders through the whole arc
- [ ] Pads meet at the midline in front of the mid chest at peak
- [ ] Back flat on the pad, feet flat, shoulders not shrugged
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] Readable as a pec deck at 64 px wide
