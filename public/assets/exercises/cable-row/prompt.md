# Cable Row — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `cable-row` |
| Category | Back / Pull |
| Camera | `machine-three-quarter` |
| Frames | 6 |
| Equipment | Cable machine — mid pulley, standing two-handed |
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
Exercise: Cable Row
Camera: machine three-quarter view, the cable column in front of the woman and
slightly to the side so the cable line, both arms and the square stance all
stay readable.
Equipment: matte black upright column with the pulley set at mid-torso height,
brushed chrome cable, simple black handle held in both hands. There is no bench
and no footplate — the woman stands unsupported in a square stance, feet
hip-width apart and level with each other, both feet flat, knees softly bent,
hips hinged slightly so the torso inclines forward roughly 15 degrees. The
standing square stance and the two-handed handle are what distinguish this from
the seated cable row and from the one-arm cable row.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Start position. Standing in the square stance, knees softly bent, hips
   hinged slightly so the torso inclines forward roughly 15 degrees. Both arms
   fully extended forward at mid-torso height holding the handle, shoulder
   blades protracted so both shoulders reach forward, spine neutral.
2. Initiation. Both arms still straight. The shoulder blades retract and
   depress — the shoulders pull back and down — before either elbow bends.
   Stance and torso angle unchanged.
3. Early pull. Both elbows bent to roughly 130 degrees, travelling straight
   back close to the ribs, forearms in line with the cable, torso angle still
   fixed at the same slight hinge.
4. End position, deepest point. Handle drawn to the sternum, both elbows bent
   to roughly 45 degrees and tucked behind the torso line, shoulder blades
   fully retracted and depressed, chest tall, torso angle unchanged, wrists
   straight.
5. Controlled return, halfway. Elbows opening back toward 130 degrees, handle
   travelling forward at the same height, shoulder blades beginning to
   protract.
6. Return to full stretch, identical to frame 1. Both arms fully extended
   forward, shoulders reaching forward under control, square stance and torso
   angle unchanged.

TECHNIQUE — must be correct in every frame:
- Both feet stay in the same square hip-width stance and never move.
- The slight forward hinge stays fixed — the trunk never rocks back to move
  the load.
- The shoulder blades retract and depress before the elbows bend.
- The handle travels horizontally to the sternum, not up to the collarbone or
  down to the navel.
- Both elbows stay close to the ribs, not flared out to the sides.
- The spine stays neutral and the wrists stay straight.
```

## Form checkpoints (QA)

- [ ] Standing square stance with both hands on the handle, no bench and no
      footplate, in all six frames
- [ ] Torso hinge angle identical in all six frames — no trunk swing
- [ ] Handle finishes at the sternum with both elbows behind the torso
- [ ] Frame 2 shows scapular retraction with both arms still straight
- [ ] Distinguishable at a glance from the seated cable row (no bench, no
      footplate) and from the one-arm cable row (two hands, square stance)
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as a standing cable pull at 64 px wide
