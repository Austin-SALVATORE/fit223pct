# Single-Arm Dumbbell Row — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `single-arm-db-row` |
| Category | Seeded Program |
| Camera | `three-quarter-side` |
| Frames | 6 |
| Equipment | Dumbbell + flat bench |
| Status | `planned` |

> Unmistakably one-sided: one hand and one knee are supported on the bench
> while only the opposite arm rows a single dumbbell. The empty free hand on
> the bench and the single dumbbell make the unilateral intent readable.

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
Exercise: Single-Arm Dumbbell Row
Camera: three-quarter side view so the bench, the supporting arm and the
working arm stay separable and the flat back reads clearly.
Equipment: one matte black hexagonal-head dumbbell with a brushed chrome
knurled handle held in the right hand, and one low matte black padded bench on
a simple black steel frame. The left hand and the left knee rest on the bench
in a three-point stance; the right foot stays flat on the ground beside the
bench with the right leg straight. There is only ONE dumbbell in the image.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Set position. Left knee and left hand on the bench, left elbow straight,
   right foot flat on the floor, right leg straight, torso roughly parallel to
   the floor, spine long and flat, neck in line with the spine. Right arm
   hanging straight down from the shoulder, dumbbell directly under the right
   shoulder, right shoulder blade protracted so the shoulder reaches toward
   the floor.
2. Initiation. Right arm still straight. The right shoulder blade retracts and
   depresses, lifting the dumbbell a few centimetres. Hips stay level and
   square to the floor.
3. Early pull. Right elbow bent to roughly 130 degrees, travelling up and back
   close to the ribs, dumbbell passing the outside of the thigh, torso still
   parallel to the floor.
4. End position, highest point. Dumbbell drawn to the side of the lower ribs,
   right elbow bent to roughly 45 degrees and behind the torso line, right
   shoulder blade fully retracted, wrist straight and neutral, hips still
   level with no rotation of the torso toward the ceiling.
5. Controlled descent, halfway. Right elbow opening back toward 130 degrees,
   dumbbell lowering along the same path, shoulder blade beginning to release.
6. Return to the set position, identical to frame 1. Right arm fully extended,
   shoulder reaching toward the floor under control, back still flat.

TECHNIQUE — must be correct in every frame:
- The torso stays parallel to the floor and never twists — the hips stay
  level.
- The spine stays flat and long; the lower back never rounds or sags.
- The shoulder blade retracts and depresses before the elbow bends.
- The dumbbell travels to the side of the lower ribs, not up to the shoulder.
- The elbow stays close to the ribs rather than flaring out to the side.
- The supporting arm stays straight and the supporting hand is clearly empty.
```

## Form checkpoints (QA)

- [ ] Exactly one dumbbell, always in the working hand — supporting hand empty
- [ ] Torso parallel to the floor with level hips in all six frames — no twist
- [ ] Three-point stance on the bench held identically throughout
- [ ] Dumbbell finishes at the lower ribs with the elbow behind the torso
- [ ] Flat neutral spine at every point, including the bottom stretch
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a single-arm row at 64 px wide
