# Seated Cable Row — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `seated-cable-row` |
| Category | Back / Pull |
| Camera | `machine-three-quarter` |
| Frames | 6 |
| Equipment | Cable machine — low pulley, seated with footplate |
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
Exercise: Seated Cable Row
Camera: machine three-quarter view, the cable column set in front of and
slightly to the side of the woman so the horizontal cable line, the handle and
the front of the torso all stay readable.
Equipment: matte black upright column with the pulley at floor height, brushed
chrome cable, simple black handle held in both hands. The woman sits on a low
matte black bench in line with the cable, both feet planted flat on the black
footplate at the base of the column, knees bent to roughly 20 degrees and held
there. She is seated for the whole rep — the bench and the footplate are what
distinguish this from the standing cable row.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Start position. Seated upright, both arms fully extended forward at
   lower-chest height holding the handle, shoulder blades protracted so both
   shoulders reach forward, torso vertical, lumbar spine neutral, knees softly
   bent with both feet on the plate.
2. Initiation. Arms still straight. The shoulder blades retract and depress —
   the shoulders pull back and down — before any elbow bend. Torso stays
   vertical.
3. Early pull. Elbows bent to roughly 130 degrees, travelling straight back
   close to the ribs, forearms parallel to the floor, chest lifting.
4. End position, deepest point. Handle drawn to the lower ribs just above the
   navel, elbows bent to roughly 45 degrees and tucked behind the torso line,
   shoulder blades fully retracted and depressed, chest tall, torso still
   vertical, wrists straight, knee angle unchanged.
5. Controlled return, halfway. Elbows opening back toward 130 degrees, handle
   travelling forward at the same height, shoulder blades beginning to protract.
6. Return to full stretch, identical to frame 1. Arms fully extended forward,
   shoulders reaching forward under control, torso still vertical, lumbar spine
   neutral.

TECHNIQUE — must be correct in every frame:
- The torso stays vertical — the trunk never rows backwards to move the load.
- Shoulder blades retract and depress before the elbows bend.
- The handle travels horizontally to the lower ribs, not up to the collarbone.
- Elbows stay close to the ribs, not flared out to the sides.
- The lumbar spine stays neutral in the stretch — no rounding forward to reach.
- Both feet stay flat on the footplate and the knee angle never changes.
```

## Form checkpoints (QA)

- [ ] Seated on the bench with both feet on the footplate in all six frames
- [ ] Torso vertical from frame 1 to frame 6 — no trunk swing
- [ ] Handle finishes at the lower ribs with the elbows behind the torso
- [ ] Frame 2 shows scapular retraction with the arms still straight
- [ ] Lumbar spine neutral in the stretched frames — not rounded
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as a seated horizontal pull at 64 px wide
