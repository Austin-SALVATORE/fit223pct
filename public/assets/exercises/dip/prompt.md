# Dip — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `dip` |
| Category | Chest / Push |
| Camera | `side` |
| Frames | 6 |
| Equipment | Parallel bars — rendered as Pull-up bar (straight chrome bar, supports out of frame) |
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
Exercise: Dip
Camera: side view, turned very slightly toward the viewer so the forward torso
lean, the elbow angle and the shoulder position all stay readable.
Equipment: two simple straight chrome horizontal bars set parallel at slightly
wider than shoulder width, supports out of frame. The near bar is drawn so that
it does not hide the body.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Top position. Supported on straight arms between the parallel bars, hands
   gripping the bars beside the hips with the wrists stacked directly over the
   bars, elbows extended but not locked hard, shoulders pressed down away from
   the ears, chest leaning forward roughly 20 degrees from vertical, legs
   together with the knees bent back behind the body and the ankles crossed,
   feet clear of the ground.
2. Early descent, elbows bent to roughly 25 degrees. The body lowers straight
   down, the forward torso lean unchanged, upper arms travelling back and
   staying close to the ribs rather than flaring out to the sides.
3. Half descent, elbows at roughly 60 degrees, forearms close to vertical,
   shoulders still packed down, the hips staying under the shoulders rather
   than swinging forward.
4. Bottom position, deepest point. Elbows bent to roughly 90 degrees with the
   upper arms roughly parallel to the ground and the shoulders level with or
   just above the elbows — no deeper. Shoulders still pressed down and never
   rolled forward past the line of the hands, forward torso lean still roughly
   20 degrees, chest open, legs still bent behind the body.
5. Ascent, back to roughly a half dip. Elbows extending, the body rising in a
   straight vertical line with the torso lean and the leg position unchanged,
   no swinging.
6. Top position again, identical to frame 1, elbows extended, shoulders down.

TECHNIQUE — must be correct in every frame:
- Shoulders stay pressed down away from the ears and never roll forward past
  the line of the hands, especially at the bottom.
- The bottom stops with the upper arms roughly parallel to the ground — the
  shoulders never drop below the elbows.
- The forward torso lean stays at roughly 20 degrees and does not change
  between frames.
- Upper arms stay close to the ribs and the elbows travel back, not flared out
  wide.
- Wrists stay neutral and stacked over the bars, and the legs stay in the same
  bent, crossed-ankle position with no swinging.
```

## Form checkpoints (QA)

- [ ] Bottom frame stops at upper arms parallel — shoulders never below elbows
- [ ] Shoulders stay pressed down and never roll forward past the hands
- [ ] Forward torso lean of roughly 20 degrees is identical in all six frames
- [ ] Elbows travel back close to the ribs, not flared out wide
- [ ] Leg position identical in every frame — no swinging
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as a dip at 64 px wide
