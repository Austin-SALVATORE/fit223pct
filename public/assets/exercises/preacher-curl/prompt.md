# Preacher Curl — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `preacher-curl` |
| Category | Arms |
| Camera | `side` |
| Frames | 4 |
| Equipment | Incline bench (used as the preacher pad) + Barbell |
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
Exercise: Preacher Curl
Camera: side view so the angle of the pad, the fixed position of the upper arms
against it, and the full elbow range are all readable.
Equipment: a matte black padded bench set to roughly 30 degrees on a black steel
frame, used as a preacher pad: the figure is seated behind it with the
chest against the top edge and the backs of both upper arms lying flat
along the angled pad, armpits resting at the top of the pad. In the hands,
one long brushed chrome bar with matte black bumper plates, evenly loaded
both sides, held with a shoulder-width underhand grip, palms up.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start. Seated upright behind the pad, feet flat on the floor, chest
   against the top edge of the pad, both upper arms lying flat along the
   angled surface. Elbows almost fully extended, the bar low and forward,
   shoulders down — not shrugged up toward the ears.
2. Early flexion, elbows bent to roughly 45 degrees. The backs of the upper
   arms stay in full contact with the pad along their whole length; only
   the forearms rise. Torso still, chest still against the pad, palms up.
3. Top position, elbows bent to roughly 100 degrees, the bar at about chin
   height. Upper arms still flat on the pad, elbows still in the same spot
   on the pad as in frame 1, wrists straight, shoulders still down and the
   torso not rocking backward.
4. Controlled lowering, elbows back through roughly 60 degrees on the way to
   full extension, resisting the descent. The upper arms have still not
   lifted off the pad and the seat position is unchanged.

TECHNIQUE — must be correct in every frame:
- The backs of both upper arms stay in full contact with the angled pad in
  every frame — the elbows never lift or slide.
- The chest stays against the top edge of the pad; the torso never rocks
  backward to help the bar up.
- The shoulders stay down and relaxed — no shrugging at the top.
- The wrists stay straight and in line with the forearms.
- Both feet stay flat on the floor and the seated position is identical in
  all four frames.
```

## Form checkpoints (QA)

- [ ] Upper arms flat on the angled pad in all four frames — no elbow lift
- [ ] The angled pad is clearly visible and the figure is behind it, not lying
      on it
- [ ] Chest stays against the top of the pad — no torso rock
- [ ] Elbows do not slide up or down the pad between frames
- [ ] Wrists straight, not flexed back, at the top
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a preacher curl — pad silhouette visible at 64 px wide
