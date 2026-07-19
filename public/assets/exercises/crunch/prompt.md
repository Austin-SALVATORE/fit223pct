# Crunch — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `crunch` |
| Category | Core |
| Camera | `floor-side` |
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
Exercise: Crunch
Camera: floor-side view in full profile so the curl of the upper spine and the
unmoving lower back can both be read.
Equipment: none — bodyweight only.
Number of frames: 4, evenly spaced left to right.
All four figures lie on the same shared invisible ground line as each other,
at exactly identical scale and spacing.

Frames:
1. Start. Lying face up, knees bent to roughly 90 degrees with both feet flat
   on the ground hip-width apart. Shoulder blades resting on the ground,
   lower back in light contact with it, fingertips resting lightly behind the
   ears with the elbows open to the sides, chin about a fist's width from the
   chest.
2. Early flexion. Head and the top of the shoulder blades just leaving the
   ground as the upper spine begins to round and the ribcage draws toward the
   pelvis. The pelvis, lower back and feet have not moved at all.
3. Top position. Shoulder blades fully clear of the ground with roughly 30
   degrees of upper-spine flexion, the ribcage visibly closer to the pelvis.
   The lower back and tailbone remain pressed into the ground, the hips and
   knees have not changed angle, the elbows stay open and the chin gap is
   unchanged.
4. Controlled return. The spine unrolling from the top down, shoulder blades
   descending back toward the ground but not yet resting on it, feet still
   flat, neck still long.

TECHNIQUE — must be correct in every frame:
- The movement is upper-spine flexion only — the lower back and tailbone stay
  in contact with the ground in every frame.
- The hips and knees never change angle; this is not a sit-up.
- The hands rest lightly behind the ears and never pull on the head or neck.
- The chin-to-chest distance stays constant throughout.
- Both feet stay flat on the ground in all four frames.
```

## Form checkpoints (QA)

- [ ] Lower back and tailbone stay down in all four frames
- [ ] Curl is clearly in the upper spine, not a hip-driven sit-up
- [ ] Hip and knee angles identical in all four frames
- [ ] Hands never pull on the head; chin gap constant
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a crunch at 64 px wide
