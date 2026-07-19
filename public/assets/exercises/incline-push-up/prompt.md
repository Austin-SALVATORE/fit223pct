# Incline Push-up — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `incline-push-up` |
| Category | Chest Variants |
| Camera | `side` |
| Frames | 6 |
| Equipment | Plyo box / step |
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
Exercise: Incline Push-up
Camera: side view, the body seen from the side so the straight line from head
to heels and the incline of the body against the box are both readable.
Equipment: one simple matte black rectangular box with flat vertical sides,
knee height, standing on the ground toward the left of each figure. The hands
are on the flat top of the box; there is no other equipment.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Top position. Hands flat on the top of the knee-high box just outside
   shoulder width, arms extended and stacked under the shoulders, body one
   straight line from head through hips to heels, angled so the head and
   chest sit clearly higher than the feet, on the balls of the feet, feet
   about hip width apart on the floor.
2. Early descent, elbows bent to roughly 20 degrees. Upper arms have begun to
   travel back at roughly 45 degrees to the torso, not flared out to 90. The
   straight body line is unchanged.
3. Half descent, elbows at roughly 90 degrees, upper arms at roughly 45
   degrees to the ribs, chest lowering toward the near top edge of the box,
   wrists stacked under the elbows.
4. Bottom position. Chest just above the top edge of the box, elbows behind
   the wrists and still tucked to roughly 45 degrees, hips holding the
   straight line from shoulders to heels — no sag in the lower back and no
   pike at the hips.
5. Ascent, back to roughly a half push-up. Elbows extending, chest and hips
   rising together as one rigid unit, hips never leading.
6. Top position again, identical to frame 1, elbows extended, body still one
   straight inclined line.

TECHNIQUE — must be correct in every frame:
- The hands are elevated on the box and the feet are on the floor, so the
  chest is always higher than the feet — never the reverse. This is an
  incline push-up, not a decline push-up with the feet elevated.
- The body holds one straight line from head to heels — no sagging lower back
  and no piked hips in any frame.
- Elbows stay at roughly 45 degrees to the torso, never flared to 90.
- Hands stay flat on the box top, wrists neutral, stacked under the shoulders
  at the top and under the elbows at the bottom.
- Chest and hips rise and fall at the same rate.
- The box is identical in size and position in every frame.
```

## Form checkpoints (QA)

- [ ] Hands on the box top, feet on the floor — chest higher than the feet in
      every frame, never a decline
- [ ] Body forms one straight head-to-heel line in all six frames
- [ ] Elbows tucked to roughly 45 degrees, never flared to 90
- [ ] Bottom frame brings the chest just above the box edge without hip sag
- [ ] Box identical size and position in all six frames
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as an incline push-up at 64 px wide
