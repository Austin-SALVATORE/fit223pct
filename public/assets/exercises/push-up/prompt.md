# Push-up — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `push-up` |
| Category | Chest / Push |
| Camera | `floor-side` |
| Frames | 6 |
| Equipment | None — bodyweight only |
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
Exercise: Push-up
Camera: floor-side view, the body seen from the side so the straight line from
head to heels and the elbow angle are both readable.
Equipment: none — bodyweight only.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Top position. Prone on hands and toes, hands flat on the floor just outside
   shoulder width and stacked under the upper chest, elbows fully extended but
   not locked hard, head in line with the spine, ribs down, glutes braced, body
   one straight line from the crown of the head through the hips to the heels,
   feet about hip width apart.
2. Early descent, elbows bent to roughly 20 degrees. Upper arms have begun to
   travel back and down at roughly 45 degrees to the torso, not flared out to
   90. The hips have not dropped and the straight body line is unchanged.
3. Half descent, elbows at roughly 90 degrees, upper arms still at roughly 45
   degrees to the ribs, chest lowering toward a point slightly ahead of the
   hands, wrists stacked under the elbows.
4. Bottom position, deepest point. Chest roughly a fist above the floor, elbows
   behind the wrists and still tucked to roughly 45 degrees, shoulder blades
   drawn together, hips level with the shoulders and heels, no sag in the lower
   back and no pike at the hips, gaze angled slightly forward.
5. Ascent, back to roughly a half push-up. Elbows extending, chest and hips
   rising together as one rigid unit, hips never leading.
6. Top position again, identical to frame 1, elbows extended, body still one
   straight line.

TECHNIQUE — must be correct in every frame:
- The body holds one straight line from head to heels — no sagging lower back
  and no piked hips in any frame.
- Elbows stay at roughly 45 degrees to the torso, never flared to 90.
- Hands stay flat and directly under or just outside the upper chest, wrists
  neutral, fingers spread.
- Head stays neutral and in line with the spine, chin not craned forward.
- Chest and hips rise and fall at the same rate.
```

## Form checkpoints (QA)

- [ ] Body forms one straight head-to-heel line in all six frames
- [ ] Elbows tucked to roughly 45 degrees, never flared to 90
- [ ] Bottom frame lowers the chest close to the floor without hip sag
- [ ] Hands stacked under the upper chest, wrists neutral
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a push-up at 64 px wide
