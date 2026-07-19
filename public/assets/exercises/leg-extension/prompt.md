# Leg Extension — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `leg-extension` |
| Category | Squat / Lower Body |
| Camera | `machine-three-quarter` |
| Frames | 4 |
| Equipment | Leg extension / curl machine |
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
Exercise: Leg Extension
Camera: machine three-quarter view, from the side and slightly in front, so the
knee angle and the ankle roller are both clearly readable.
Equipment: one matte black seated frame with a padded ankle roller and a thigh
pad, oriented the same way in every frame. The figure sits upright in the
machine with the back against the pad, the knee joint aligned with the
machine's pivot, the thigh pad across the lower thighs, the shins behind the
padded roller which rests just above the tops of the shoes, and both hands
holding the seat handles at the hips. The machine rests on the same shared
ground line in every frame and is drawn at exactly the same scale and angle
each time.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start position. Knees bent to roughly 90 degrees, shins hanging vertically,
   roller against the front of the lower shins, torso upright against the back
   pad, hands on the handles.
2. Early extension. Knees opened to roughly 130 degrees, shins swept forward
   and up, thighs still pressed into the seat, torso unchanged.
3. Top position. Knees fully but not forcefully extended, shins level with the
   thighs and roughly parallel to the ground, ankles neutral, quadriceps
   contracted, hips still flat in the seat and the torso still upright.
4. Lowering under control, back to roughly 110 degrees of knee bend, shins
   descending on the same arc, torso still upright and still against the pad.

TECHNIQUE — must be correct in every frame:
- The hips stay seated and the torso stays against the back pad — no leaning
  back to swing the weight up.
- The knee joint stays aligned with the machine pivot; the thighs never lift
  off the seat.
- Both legs move together at the same angle in every frame.
- The knees extend fully but are never snapped or hyperextended at the top.
- The machine, the camera angle, and the figure scale are identical in all four
  frames.
```

## Form checkpoints (QA)

- [ ] Knee joint aligned with the machine pivot in all four frames
- [ ] Top frame shows shins parallel to the ground, knees straight not snapped
- [ ] Torso stays upright against the back pad — no swinging
- [ ] Roller stays just above the shoes, never on the ankle joint
- [ ] Machine drawn identically — same angle, same scale — in every frame
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures on one shared ground line at identical scale
- [ ] Readable as a leg extension at 64 px wide
