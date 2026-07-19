# Overhead Press — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `overhead-press` |
| Category | Shoulders |
| Camera | `side` |
| Frames | 6 |
| Equipment | Barbell |
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
Exercise: Overhead Press
Camera: side view, so the vertical bar path and the line of the spine can both be read.
Equipment: one long brushed chrome bar with matte black bumper plates, evenly loaded both sides, gripped just outside shoulder width with a full thumb-wrapped grip.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Start position. Bar racked on the front deltoids and collarbones at
   shoulder height, elbows just in front of and slightly below the bar,
   forearms close to vertical, wrists stacked straight over the elbows.
   Feet hip-width and flat, glutes and abdominals braced, ribs pulled down,
   bar stacked over the mid-foot.
2. Early drive. Bar has left the shelf and travelled straight up to chin
   height. The head has pulled back a few centimetres to let the bar pass
   in a straight line; the torso stays vertical with no backward lean of
   the trunk and no knee bend.
3. Mid press. Bar at forehead height, the head moving back to neutral under
   the bar as it clears the face. Elbows still under the bar, forearms
   vertical, ribs down, lumbar spine neutral.
4. Bar just above the crown of the head. Shoulders beginning to shrug and
   upwardly rotate, elbows nearly extended, bar tracking back toward the
   line of the ears.
5. Lockout, the highest point. Elbows fully extended but not hyperextended,
   the bar sitting over the mid-foot and behind the line of the ears with
   the head through the window. Shoulders shrugged up into the bar, ribs
   down and not flared, hips and knees straight.
6. Return to the rack position, identical to frame 1. Bar back on the front
   deltoids, elbows again under the bar, head neutral.

TECHNIQUE — must be correct in every frame:
- The bar travels in a straight vertical line over the mid-foot — the head
  moves around the bar, the bar does not arc around the head.
- Ribs stay pulled down. No leaning back and no lumbar hyperextension at any
  point of the press.
- Forearms stay vertical under the bar from the side, wrists stacked over
  the elbows and not bent back.
- Feet stay flat and the knees stay straight — this is a strict press, not
  a push press, so there is no dip and no heel rise.
- At lockout the shoulders shrug up into the bar and the elbows are fully
  extended without snapping into hyperextension.
```

## Form checkpoints (QA)

- [ ] Bar path is vertical over the mid-foot in all six frames
- [ ] Head clears backward in frame 2 and returns to neutral by frame 4
- [ ] At lockout the bar is behind the ears, not in front of the face
- [ ] No backward trunk lean or lumbar hyperextension in any frame
- [ ] Plates evenly loaded and identical on both sides of the bar
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as an overhead press at 64 px wide
