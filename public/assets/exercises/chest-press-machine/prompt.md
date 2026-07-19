# Chest Press Machine — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `chest-press-machine` |
| Category | Chest / Push |
| Camera | `machine-three-quarter` |
| Frames | 6 |
| Equipment | Smith / press machine |
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
Exercise: Chest Press Machine
Camera: machine-three-quarter view, turned so the seat, the handle path and the
elbow angle all stay readable.
Equipment: one matte black frame with chrome guide rails and simple black
handles, arranged as a seated chest press with a near-vertical black padded
backrest and a black seat. The handles sit at chest height on either side of
the torso and travel forward along the chrome guide rails.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Start position. Seated upright, the whole back flat against the pad from
   hips to shoulders, head resting back, feet flat on the floor roughly hip
   width apart. Hands on the handles at mid-chest height, elbows bent to
   roughly 90 degrees and held at roughly 45 degrees out from the torso, wrists
   neutral and in line with the forearms, shoulder blades set back and down.
2. Early press, elbows opened to roughly 110 degrees. The handles move forward
   in a straight horizontal line at chest height, chest still lifted, back
   still flat on the pad.
3. Mid press, elbows at roughly 140 degrees, forearms in line with the handle
   path, shoulders not rolling forward off the pad.
4. Full extension. Elbows extended but not locked hard, arms straight ahead at
   chest height, shoulder blades still back against the pad, torso upright and
   unchanged, feet still flat.
5. Return, back to roughly the mid position. Elbows bending and travelling back
   at roughly 45 degrees from the torso under control, the handles returning
   along the same horizontal line.
6. Start position again, identical to frame 1, elbows at roughly 90 degrees
   with the hands level with the mid chest and the elbows just behind the line
   of the torso, not driven far past it.

TECHNIQUE — must be correct in every frame:
- The whole back from hips to shoulders stays in contact with the pad, and the
  shoulders never roll forward off it at full extension.
- Elbows stay at roughly 45 degrees from the torso, never flared straight out
  to 90.
- The handles travel in a straight horizontal line at chest height.
- Wrists stay neutral and in line with the forearms, never bent back.
- The elbows extend fully but are never locked or hyperextended, and both arms
  move symmetrically.
```

## Form checkpoints (QA)

- [ ] Back stays flat on the pad including at full extension
- [ ] Handles travel horizontally at chest height, not up toward the face
- [ ] Elbows at roughly 45 degrees from the torso, never flared to 90
- [ ] Wrists neutral and in line with the forearms in all six frames
- [ ] Both arms symmetric, elbows extended but not hyperextended
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as a seated chest press at 64 px wide
