# Machine Row — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `machine-row` |
| Category | Back / Pull |
| Camera | `machine-three-quarter` |
| Frames | 6 |
| Equipment | Press machine frame configured as a seated row station |
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
Exercise: Machine Row
Camera: machine three-quarter view so the seat, the vertical chest pad, the
handles and the horizontal pulling path all stay readable.
Equipment: matte black frame with chrome guide rails and simple black handles,
configured as a seated row station — a black seat, a vertical matte near-black
chest pad in front of the torso, and two simple black handles set at lower-chest
height either side of the pad. The woman sits upright and tall on the seat with
her sternum against the vertical chest pad and both feet flat on the floor.
Sitting upright against a vertical pad is what distinguishes this from the prone
chest-supported row on an incline bench.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Start position. Seated tall, sternum against the chest pad, both arms fully
   extended forward at lower-chest height gripping the handles, both shoulders
   reaching forward as the shoulder blades protract, torso vertical, feet flat.
2. Initiation. Arms still straight. Both shoulder blades retract and depress,
   pulling the shoulders back and down, before any elbow bend. The sternum stays
   on the pad.
3. Early pull. Elbows bent to roughly 130 degrees, travelling straight back close
   to the ribs, forearms parallel to the floor, chest tall.
4. End position, deepest point. Handles drawn back to the lower ribs, elbows bent
   to roughly 45 degrees and clearly behind the torso line, both shoulder blades
   fully retracted and depressed, wrists straight, torso still vertical, sternum
   still in contact with the pad.
5. Controlled return, halfway. Elbows opening back toward 130 degrees, handles
   travelling forward at the same height, shoulder blades beginning to protract.
6. Return to full stretch, identical to frame 1. Arms fully extended forward,
   shoulders reaching forward under control, torso still vertical.

TECHNIQUE — must be correct in every frame:
- The sternum stays against the chest pad — the torso never pushes away from it.
- The torso stays vertical; the seat and the pad remove any trunk swing.
- Shoulder blades retract and depress before the elbows bend.
- The handles travel horizontally to the lower ribs, not upward to the shoulders.
- Both arms move symmetrically and finish level.
- Both feet stay flat on the floor and the hips stay square in the seat.
```

## Form checkpoints (QA)

- [ ] Seated upright with the sternum on a vertical chest pad in all six frames
- [ ] Torso vertical throughout — no lean and no swing
- [ ] Both arms symmetric, handles level at the end position
- [ ] Elbows finish behind the torso line with the blades retracted
- [ ] Distinguishable at a glance from the chest-supported incline row asset
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as a seated machine row at 64 px wide
