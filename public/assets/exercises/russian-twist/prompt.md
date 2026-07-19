# Russian Twist — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `russian-twist` |
| Category | Core |
| Camera | `three-quarter-front` |
| Frames | 4 |
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
Exercise: Russian Twist
Camera: three-quarter-front view, so the rotation of the ribcage away from the
square pelvis is clearly visible.
Equipment: none — bodyweight only, hands clasped together in front of the sternum.
Number of frames: 4, evenly spaced left to right.
All four figures are seated on the same shared invisible ground line as each
other, at exactly identical scale and spacing.

Frames:
1. Start. Seated on the ground, knees bent to roughly 90 degrees, heels
   resting lightly on the ground and hip-width apart. Torso leaning back to
   roughly 45 degrees from the ground with the spine long and flat — chest open,
   no rounding of the lower back. Hands clasped together in front of the
   sternum, elbows softly bent, shoulders square to the front.
2. Rotation to the right. The ribcage and shoulders turn to the right while the
   clasped hands travel across to the outside of the right hip. The pelvis and
   both knees stay square to the front, the torso keeps its 45-degree lean and
   its long flat spine, and the head turns with the chest.
3. Back through centre. Torso square to the front again, hands returned in
   front of the sternum, lean angle and spine position unchanged from frame 1.
4. Rotation to the left, an exact mirror of frame 2. Ribcage and shoulders
   turned left, clasped hands outside the left hip, pelvis and knees still
   square to the front, lean angle unchanged.

TECHNIQUE — must be correct in every frame:
- The rotation comes from the thoracic spine — the pelvis and knees stay square
  to the front in every frame.
- The torso lean angle stays constant at roughly 45 degrees; the figure does not
  sit up or fall back as she turns.
- The spine stays long and flat; the lower back never rounds into a slump.
- The arms stay in a fixed relationship to the chest — the hands are carried by
  the torso, not swung independently.
- The head and gaze follow the chest.
```

## Form checkpoints (QA)

- [ ] Pelvis and knees square to the front in all four frames
- [ ] Torso lean angle identical in all four frames
- [ ] Rotation clearly visible in the ribcage and shoulders
- [ ] Frames 2 and 4 are true mirrors of each other
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a seated rotation at 64 px wide
