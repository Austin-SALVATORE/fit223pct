# Incline Dumbbell Press — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `incline-dumbbell-press` |
| Category | Chest / Push |
| Camera | `bench-side` |
| Frames | 6 |
| Equipment | Dumbbell (one per hand), Incline bench |
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
Exercise: Incline Dumbbell Press
Camera: bench-side view, the bench seen from the side so the incline angle, the
elbow angle and the dumbbell path are all readable.
Equipment: two matte black hexagonal-head dumbbells with brushed chrome
knurled handles, one in each hand, plus one matte black padded bench set to
roughly 30 degrees on a black steel frame. The backrest rises toward the left
of each frame at a clearly visible 30 degree angle, the seat pad is horizontal,
and the feet reach the floor.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Lockout start. Seated back against the 30 degree incline, head, upper back
   and glutes on the pad, slight natural arch in the lower back, feet flat on
   the floor. Arms extended perpendicular to the torso, dumbbells held over the
   upper chest and collarbones, roughly shoulder width apart, palms facing
   forward.
2. Early descent, elbows bent to roughly 25 degrees. The dumbbells travel down
   and slightly out, upper arms tucking toward roughly 45 degrees from the
   torso.
3. Half descent, elbows at roughly 90 degrees, forearms vertical, dumbbells
   level with the front of the shoulders, shoulder blades pinned back and down
   into the incline pad.
4. Bottom position. Dumbbells at upper-chest level just outside the ribcage,
   elbows tucked to roughly 45 degrees and directly under the wrists, forearms
   vertical, the elbows not driven far behind the plane of the torso. Chest
   lifted, glutes on the seat, feet flat.
5. Ascent, back to roughly a half press. Elbows extending, dumbbells pressing
   up and slightly inward along the line of the torso, staying separate.
6. Lockout again, identical to frame 1, elbows extended over the upper chest.

TECHNIQUE — must be correct in every frame:
- The bench angle stays at roughly 30 degrees and reads clearly as an incline
  in every frame.
- The elbow clearly bends and extends across the frames — this is a press, not
  a fixed-elbow arc.
- Elbows stay at roughly 45 degrees to the torso, never flared to 90.
- Head, upper back and glutes stay in contact with the pad and the feet stay
  flat on the floor.
- The dumbbells press along the line of the torso, finishing over the upper
  chest rather than over the face or the belly.
```

## Form checkpoints (QA)

- [ ] Bench reads as roughly 30 degrees in all six frames
- [ ] Elbow angle clearly changes across the frames — reads as a press, not a fly
- [ ] Dumbbells stop at upper-chest level just outside the ribcage
- [ ] Elbows tucked to roughly 45 degrees, forearms vertical at the bottom
- [ ] Glutes and upper back stay on the pad, feet flat on the floor
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as an incline dumbbell press at 64 px wide
