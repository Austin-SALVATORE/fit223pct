# Cable Fly — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `cable-fly` |
| Category | Chest / Push |
| Camera | `machine-three-quarter` |
| Frames | 4 |
| Equipment | Cable machine (one column each side) |
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
Exercise: Cable Fly
Camera: machine-three-quarter view, turned so both arms, the fixed elbow angle
and the cable path all stay readable.
Equipment: two matte black upright columns, one to each side of the figure,
each with a brushed chrome cable running from a pulley above shoulder height
down to a simple black handle, one handle in each hand. The cables stay taut
and straight in every frame.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start position. Standing between the two columns in a short split stance,
   one foot forward and both feet flat, torso leaning forward only a few
   degrees, chest lifted, core braced. Arms out wide and slightly above
   shoulder height, elbows held in a soft fixed bend of roughly 15 degrees,
   palms facing forward and down, a clear stretch across the chest.
2. Early sweep. The hands travel down and forward along a wide arc toward the
   midline and are now roughly at shoulder width, the elbow bend still exactly
   the same soft 15 degrees, shoulder blades staying back and down.
3. Mid sweep. Hands in front of the chest and still closing, the upper arms
   roughly 45 degrees in from the start position, the elbow bend still
   unchanged, the torso still and upright with no rocking or leaning into the
   movement.
4. Finish position. Hands meeting in front of the lower chest at roughly
   sternum height, almost touching, the elbow bend still the same soft 15
   degrees, chest squeezed, wrists neutral, stance and torso identical to
   frame 1.

TECHNIQUE — must be correct in every frame:
- The elbow angle stays fixed at a soft 15 degree bend in all four frames — it
  must never open or close. This is an arc, not a press.
- The hands travel along a wide arc that converges at the midline rather than
  pressing straight forward.
- The torso and split stance stay identical across all four frames — the
  movement comes from the shoulders, not from rocking the body.
- Shoulder blades stay set back and down, and the shoulders never shrug up
  toward the ears.
- Both cables stay taut and straight, and both arms move symmetrically.
```

## Form checkpoints (QA)

- [ ] Elbow bend is visibly identical in all four frames — never opens or closes
- [ ] Hands sweep along an arc and converge at the midline, not a press path
- [ ] Torso and stance identical across all four frames — no rocking
- [ ] Cables stay taut, straight, and symmetric on both sides
- [ ] Shoulders stay down and not shrugged in every frame
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] Readable as a cable fly at 64 px wide
