# Band Pull-Apart — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `band-pull-apart` |
| Category | Seeded Program |
| Camera | `front` |
| Frames | 4 |
| Equipment | Resistance band |
| Status | `planned` |

> The band stretch IS the movement: held at shoulder height with straight
> arms and pulled apart until it touches the chest. The band must be taut in
> every frame — shortest between the hands at the start, longest in the wide
> finish.

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
Exercise: Band Pull-Apart
Camera: front view, facing the viewer, so the widening arms, the level
shoulders and the band stretching across the chest all read in the frontal
plane.
Equipment: one long matte near-black elastic resistance band with a smooth
matte surface, drawn visibly taut under load. One end is gripped in each hand.
The band is TAUT in every single frame — a straight line between the hands,
never drooping, never slack.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start. Standing tall facing the viewer, feet hip-width apart, torso
   vertical. Both arms extended straight forward at shoulder height, hands
   slightly wider than shoulder-width, palms down, gripping the band. The
   segment of band between the hands is short, horizontal and already pulled
   TAUT — perfectly straight with zero droop.
2. Mid pull-apart. Both straight arms sweeping horizontally outward, hands
   now well outside the shoulders, elbows keeping the same fixed soft bend.
   The band between the hands is visibly LONGER and stretched, still a taut
   straight horizontal line at shoulder height. Shoulder blades beginning to
   squeeze together, shoulders staying down away from the ears.
3. Full spread. Arms open into a wide T at shoulder height, the band at its
   LONGEST and maximally stretched, taut and straight, touching the upper
   chest across the sternum. Shoulder blades fully squeezed together, chest
   open, wrists neutral, shoulders level and pressed down, torso unmoved.
4. Return to the start, identical to frame 1. Arms back to straight forward
   under control, the band shorter again but still visibly taut with no slack.

TECHNIQUE — must be correct in every frame:
- The band is TAUT in all four frames — a straight line between the hands with
  zero droop, even in the narrow start position.
- The band's length between the hands visibly grows from frame 1 to frame 3
  and shortens again in frame 4.
- Elbows keep one fixed, nearly straight angle — the arms never bend to pull.
- Both arms stay at shoulder height, moving only in the frontal plane.
- Shoulders stay down and level — no shrugging toward the ears.
- The torso stays tall and still; only the arms move.
```

## Form checkpoints (QA)

- [ ] Band taut and straight between the hands in all four frames — no droop
- [ ] Band visibly shortest in frame 1 and longest at the chest-touch spread
- [ ] Frame 3 shows the band touching the upper chest with a full squeeze
- [ ] Arms stay straight with one fixed elbow angle in every frame
- [ ] Hands stay at shoulder height — no rising or dropping across the strip
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a band pull-apart at 64 px wide
