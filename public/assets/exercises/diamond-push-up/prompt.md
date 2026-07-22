# Diamond Push-up — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `diamond-push-up` |
| Category | Chest Variants |
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
Single flat solid chroma-key magenta #FF00FF, completely uniform and empty.
No floor, no ground line, no shadow cast onto the background, no gym
environment, no gradient, no vignette, no frame or border. The magenta is
ONLY the background: no magenta may appear anywhere in the artwork itself —
not in skin, hair, clothing, or equipment. No drop shadow, no glow, and no
halo of any kind may surround the figure or equipment — artwork edges end
crisply at the artwork, with pure background touching them directly.

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
Matte dark charcoal metal #1D2025 with brushed chrome shafts and handles
#EFEFEF. Weight plates are mid-value charcoal gray #4A5058, never pure black.
Upholstery and bench pads matte near-black #1D2025. Every dark surface
carries a subtle cool rim light along its upper and outer edges so equipment
stays legible against dark app backgrounds. Simple, clean, realistic
proportions with believable weight and correct scale against the body.

COMPOSITION:
All figures stand on one shared invisible ground line, at exactly the same
scale, evenly spaced with clear background gaps between them. No figure overlaps,
touches, or is cropped by another. The entire body is visible in every frame,
including both feet. Generous background margin above and below. Eye-level camera at
an identical angle and distance for every frame.

STRICTLY EXCLUDE:
Text, numbers, labels, captions, arrows, motion lines, panel borders, dividing
lines, grids, watermarks, logos, background objects, mirrors, other people,
extra or missing limbs, distorted hands, any magenta on the figure, clothing or equipment, drop shadows or glow halos around the figure, broken or hyperextended joints.

MOVEMENT FOR THIS IMAGE:
Exercise: Diamond Push-up
Camera: floor-side view, the body seen from the side so the straight line from
head to heels, the joined hands under the sternum and the elbows tracking
straight back are all readable.
Equipment: none — bodyweight only.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Top position. Prone on hands and toes. Both hands placed together directly
   under the sternum, thumbs and index fingers touching to form a small
   diamond shape, so the two hands read as one narrow base under the centre of
   the chest — clearly narrower than shoulder width. Elbows fully extended but
   not locked hard, head in line with the spine, ribs down, glutes braced,
   body one straight line from the crown of the head through the hips to the
   heels, feet about hip width apart.
2. Early descent, elbows bent to roughly 20 degrees and pointing straight back
   toward the feet, staying close against the ribs — not out to the sides.
   The straight body line is unchanged and the hands stay joined in the
   diamond under the sternum.
3. Half descent, elbows at roughly 90 degrees and brushing the ribs, forearms
   angled inward over the single narrow hand base, chest lowering toward the
   joined hands, wrists under the centre of the chest.
4. Bottom position, deepest point. Chest just above the joined hands, roughly
   a fist above the floor, elbows pointing straight back past the ribs, hips
   level with the shoulders and heels — no sag in the lower back and no pike
   at the hips. Hands still together in the diamond under the sternum.
5. Ascent, back to roughly a half push-up. Elbows extending straight back
   along the ribs, chest and hips rising together as one rigid unit.
6. Top position again, identical to frame 1, elbows extended, hands still
   joined in the diamond under the sternum.

TECHNIQUE — must be correct in every frame:
- Both hands stay pressed together in the diamond directly under the sternum
  in every frame — this single narrow hand base is the entire difference from
  a standard push-up and must stay clearly visible.
- Elbows track straight back close along the ribs, never flaring out to the
  sides.
- The body holds one straight line from head to heels — no sagging lower back
  and no piked hips in any frame.
- Head stays neutral and in line with the spine, chin not craned forward.
- Chest and hips rise and fall at the same rate.
```

## Form checkpoints (QA)

- [ ] Both hands touching in a diamond directly under the sternum in all six
      frames — visibly narrower than shoulder width (the differentiator from
      the standard `push-up` asset)
- [ ] Elbows track straight back along the ribs, never flared out
- [ ] Body forms one straight head-to-heel line in all six frames
- [ ] Bottom frame lowers the chest to just above the joined hands without
      hip sag
- [ ] Wrists stay under the centre of the chest in all six frames
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as a diamond push-up, not a standard push-up, at 64 px wide
