# Bird Dog — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `bird-dog` |
| Category | Core |
| Camera | `floor-side` |
| Frames | 3 |
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
Exercise: Bird Dog
Camera: floor-side view, turned very slightly toward the viewer so that both the
near and the far arm and leg stay separable.
Equipment: none — bodyweight only.
Number of frames: 3, evenly spaced left to right.
All three figures are on the same shared invisible ground line as each other,
at exactly identical scale and spacing.

Frames:
1. Neutral start. On hands and knees, hands flat on the ground directly under
   the shoulders with the elbows straight but not locked, knees directly under
   the hips and bent to 90 degrees, toes down. The back is flat from the
   tailbone to the base of the neck, the head is in line with the spine and the
   gaze is at the ground between the hands. Shoulders and hips both level.
2. First diagonal — right arm and left leg. The RIGHT arm reaches straight
   forward to shoulder height, thumb up, while the LEFT leg extends straight
   back from the hip to hip height with the knee fully open and the toes
   pointing down toward the ground. The LEFT hand and the RIGHT knee remain
   planted and loaded. The pelvis stays square and level — the extending hip
   does not open toward the ceiling — and the back stays flat with no arch or
   rounding.
3. Opposite diagonal — left arm and right leg, the exact mirror of frame 2. The
   LEFT arm reaches forward to shoulder height and the RIGHT leg extends back
   to hip height, with the RIGHT hand and the LEFT knee planted. Pelvis still
   square and level, back still flat, neck still in line with the spine.

TECHNIQUE — must be correct in every frame:
- The extended limbs are always the opposite arm and opposite leg — the
  contralateral pairing must be unambiguous in frames 2 and 3.
- The supporting hand stays directly under its shoulder and the supporting knee
  directly under its hip.
- The pelvis stays square and level; the extending hip does not rotate open.
- The reaching arm rises no higher than shoulder height and the extending leg no
  higher than hip height — the lower back does not arch.
- The neck stays in line with the spine; the head is not lifted to look forward.
```

## Form checkpoints (QA)

- [ ] Frames 2 and 3 clearly show opposite arm and opposite leg extended
- [ ] Frames 2 and 3 are exact mirrors of each other
- [ ] Pelvis square and level, no hip rotation, in both extended frames
- [ ] Back flat and neck neutral in all three frames
- [ ] Same face, hair, wardrobe, and body proportions in all three frames
- [ ] All three figures identical scale on one shared ground line
- [ ] Readable as a bird dog at 64 px wide
