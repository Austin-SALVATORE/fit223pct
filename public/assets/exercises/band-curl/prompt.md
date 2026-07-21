# Band Curl — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `band-curl` |
| Category | Seeded Program |
| Camera | `three-quarter-front` |
| Frames | 4 |
| Equipment | Resistance band |
| Status | `planned` |

> Standing on the middle of the band, curling both ends with a supinated grip
> while the upper arms stay pinned to the ribs. The band runs taut from under
> the feet to the hands in every frame and is most stretched at the top of the
> curl.

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
Exercise: Band Curl
Camera: three-quarter front view so the supinated palms, the pinned upper
arms and the taut band path are all readable.
Equipment: one long matte near-black elastic resistance band with a smooth
matte surface, drawn visibly taut under load. She stands on the middle of the
band with both feet, and grips one end in each hand with a supinated
(palms-up) grip. The two halves of the band run from under her feet up to her
hands and are TAUT in every single frame — straight lines with no slack, even
with the arms lowered.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start. Standing tall, feet hip-width apart pinning the middle of the band,
   torso vertical, ribs down. Both arms hanging, elbows extended but not
   locked, upper arms against the ribs, palms facing forward in supination,
   wrists straight. Both band halves already pulled straight and lightly TAUT
   from the feet to the hands — no drooping loops.
2. Mid curl. Elbows bent to roughly 90 degrees, forearms horizontal, palms
   up, wrists straight and in line with the forearms. Upper arms unmoved —
   still vertical and pinned against the ribs. Both band halves visibly
   STRETCHED longer and taut from the feet up to the hands.
3. Top of the curl. Elbows fully flexed, hands in front of the shoulders,
   palms facing the shoulders, wrists still straight — not curled inward.
   Upper arms STILL vertical against the ribs, elbows at the sides and not
   drifted forward. Both band halves at their LONGEST and maximally
   stretched, perfectly taut. Torso vertical, no lean-back.
4. Return to the start, identical to frame 1. Arms lowered under control,
   elbows extended again, band halves shorter but still visibly taut.

TECHNIQUE — must be correct in every frame:
- Both halves of the band are TAUT in all four frames — straight lines from
  under the feet to the hands, with zero slack even at the bottom.
- The band halves visibly lengthen from frame 1 to frame 3 and shorten in
  frame 4.
- The upper arms stay vertical and pinned to the ribs — the elbows never
  drift forward or flare out.
- The grip stays supinated (palms up through the curl) in every frame.
- Wrists stay straight and neutral — never curled toward the forearms.
- The torso stays vertical and still — no lean-back or shoulder swing.
```

## Form checkpoints (QA)

- [ ] Both band halves taut from feet to hands in all four frames — no slack
- [ ] Band visibly most stretched at the top-of-curl frame
- [ ] Upper arms vertical and pinned to the ribs in every frame
- [ ] Supinated palms-up grip readable through the whole strip
- [ ] Wrists straight and neutral — no wrist curl at the top
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a biceps curl at 64 px wide
