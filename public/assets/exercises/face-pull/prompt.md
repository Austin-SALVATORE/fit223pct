# Face Pull — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `face-pull` |
| Category | Back / Pull |
| Camera | `machine-three-quarter` |
| Frames | 4 |
| Equipment | Cable machine — rope attachment at upper-chest height |
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
Exercise: Face Pull
Camera: machine three-quarter view so the cable line, both elbows and the
external rotation of the forearms all stay readable.
Equipment: matte black upright column with the pulley set at upper-chest height,
brushed chrome cable, and a simple black rope attachment held with one end in
each hand, thumbs on top and palms facing each other. The woman stands facing
the column in a short split stance, both feet flat, knees softly bent.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start position. Standing tall in a short split stance, both arms extended
   forward and very slightly upward toward the pulley at upper-chest height,
   elbows straight but not locked, both shoulders reaching forward as the
   shoulder blades protract, ribs down, spine neutral.
2. Initiation and early pull. The shoulder blades retract and depress first, then
   both elbows begin to bend and rise so the upper arms travel out toward
   shoulder height. The rope ends move back toward the face with the elbows level
   with or slightly above the wrists.
3. End position. Rope ends drawn to either side of the face at eye-to-nose
   height, upper arms abducted to roughly 90 degrees and in line with the
   shoulders, elbows level with the hands, and the forearms externally rotated so
   both hands finish above the elbows with the knuckles pointing up and back.
   Shoulder blades fully retracted and depressed, chest tall, torso upright with
   no backward lean.
4. Controlled return to the start, identical to frame 1. The forearms rotate back
   down, the elbows straighten, the shoulders reach forward again under control,
   split stance unchanged.

TECHNIQUE — must be correct in every frame:
- The rope stays at upper-chest to face height — it is never pulled down to the
  waist.
- The end position must show visible external rotation: the hands finish above
  the elbows.
- The upper arms stay at roughly shoulder height, never tucked down at the sides.
- The torso stays upright with the ribs down — no leaning back to move the load.
- Shoulder blades retract and depress before the elbows bend.
- The neck stays long and relaxed; the shoulders never shrug up toward the ears.
```

## Form checkpoints (QA)

- [ ] Rope path stays at upper-chest / face height in all four frames
- [ ] Frame 3 shows clear external rotation — hands above elbows, knuckles up and back
- [ ] Upper arms at roughly shoulder height, not tucked to the sides
- [ ] Torso upright, no backward lean, no shrug
- [ ] Never reads as a triceps pushdown or an upright row
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] Readable as a face pull at 64 px wide
