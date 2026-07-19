# Rear Delt Machine — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `rear-delt-machine` |
| Category | Shoulder Variants |
| Camera | `machine-three-quarter` |
| Frames | 4 |
| Equipment | Pec deck / rear delt machine |
| Status | `planned` |

> Near-duplicate cluster: the rear-delt pattern is now covered four times —
> `rear-delt-fly`, `cable-rear-delt-fly`, `rear-delt-machine`, and `face-pull`.
> This asset's differentiators are the seated chest-on-pad position and the
> machine's arm levers. It must read as the exact reverse of a pec-deck fly:
> arms start closed together in front and open backward. If the open-backward
> direction is ambiguous in the render, reject it.

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
Exercise: Rear Delt Machine
Camera: machine three-quarter view, so the chest-on-pad setup and the
backward sweep of both arm levers stay readable at the same time.
Equipment: matte black seated frame with an upright back pad and two vertical
padded black arm levers. The woman sits facing INTO the machine, chest and
front of the shoulders resting against the upright pad, feet flat on the
ground either side of the seat. The two arm levers start positioned together
directly in front of her shoulders; she grips one vertical padded lever in
each hand with a neutral grip, palms facing each other.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start position. Seated facing the machine, chest against the pad, spine
   tall. Both arms extended straight forward at shoulder height, hands
   gripping the vertical padded levers close together in front of the
   shoulders. Both elbows are set at a soft fixed bend of about 15 degrees —
   this angle does not change at any point in the movement. Shoulders down,
   neck long.
2. Mid sweep. Both arms have swung backward and outward roughly 45 degrees
   in a horizontal plane at shoulder height, moving the levers apart and
   away from the machine. Elbow angles unchanged, chest still against the
   pad, shoulder blades beginning to draw together.
3. End position. Both arms are swept fully out to the sides, level with the
   shoulders and a fraction behind the plane of the torso, the shoulder
   blades fully retracted. The levers are at their widest, well behind their
   starting position. The chest has not left the pad and the torso has not
   arched back.
4. Controlled return. Both arms travel forward again along the same
   horizontal arc, roughly back to the 45-degree position of frame 2, elbow
   bend still fixed, chest still against the pad.

TECHNIQUE — must be correct in every frame:
- The movement direction is the reverse of a pec-deck fly: the arms start
  closed together in front of the chest and OPEN backward and outward — they
  never squeeze forward toward each other from a wide start.
- The chest stays in contact with the pad in every frame; the torso never
  arches or pushes away from the pad to move the levers.
- Both elbow angles are fixed at a soft bend and identical in all four
  frames — this is a fly, not a row or a press.
- The hands and levers travel in a horizontal plane at shoulder height — no
  dipping or rising through the arc.
- Both arms move symmetrically, mirroring each other exactly.
- No shrugging — the shoulders stay down away from the ears throughout.
```

## Form checkpoints (QA)

- [ ] Reads unmistakably as the reverse of a pec-deck fly — arms open backward from a closed front start
- [ ] Chest in contact with the pad in all four frames — no arching away
- [ ] Elbow bend fixed and identical in all four frames — never reads as a row or press
- [ ] Hands and levers stay at shoulder height through the whole horizontal arc
- [ ] Both arms perfectly symmetrical in every frame
- [ ] End frame shows shoulder blades retracted with levers at their widest
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] Readable as a rear delt machine fly at 64 px wide
