# Leaning Lateral Raise — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `leaning-lateral-raise` |
| Category | Shoulder Variants |
| Camera | `front` |
| Frames | 4 |
| Equipment | Dumbbell (single) + cable machine column as support |
| Status | `planned` |

> Near-duplicate of `lateral-raise`. The whole-body lean away from the support
> column is the only differentiator — if the lean does not read clearly at
> thumbnail size, this asset collapses into the standing lateral raise and
> should be cut rather than approved.

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
Exercise: Leaning Lateral Raise
Camera: front view, because the frontal plane carries all of the information
in this movement, and the body lean itself is a frontal-plane shape.
Equipment: matte black upright column used only as a hand support — no cable
or handle is attached. One matte black hexagonal-head dumbbell with a brushed
chrome knurled handle in the working hand. The column stands at the woman's
left; her left hand grips it at shoulder height with a straight arm.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start position. Both feet together, planted close to the base of the
   column, left hand gripping the column at shoulder height with a straight
   supporting arm. The whole body leans away from the column to the right in
   one rigid straight line from ankles to head, roughly 15 degrees from
   vertical — this lean angle does not change at any point in the movement.
   The dumbbell hangs in the right hand beside the right thigh, palm facing
   in, the right elbow set at a soft fixed bend of about 15 degrees that
   never changes. Shoulders down, ribs down.
2. Roughly 45 degrees of shoulder abduction. The right upper arm has swept
   out to the side in the frontal plane, hand a little below elbow height,
   elbow angle unchanged. The body is still one rigid leaning line at the
   same angle, the supporting arm still straight.
3. Top position, roughly 90 degrees of abduction relative to the torso. The
   right upper arm is level with the shoulder line, elbow at or a fraction
   above the height of the hand, wrist neutral and level. Because of the
   lean, the dumbbell finishes slightly higher in space than a standing
   raise would — the lean, not extra arm travel, creates this. Shoulders
   stay down away from the ears.
4. Controlled lowering, roughly 30 degrees of abduction. The arm descends
   under control along the same frontal-plane arc, elbow bend still fixed,
   body lean and supporting arm completely unchanged.

TECHNIQUE — must be correct in every frame:
- The whole-body lean is identical in all four frames — a rigid straight line
  from ankles to head at roughly 15 degrees, with no bend at the hips or
  waist.
- The supporting arm stays straight; the body hangs from the column grip
  rather than pushing away from it.
- The elbow angle of the working arm is fixed at a soft bend and identical in
  all four frames — this is a raise, not a press.
- The working arm travels out to the side in the frontal plane and stops
  level with the shoulder line — the hand never rises above the shoulder.
- No shrugging and no twisting of the torso toward or away from the column.
```

## Form checkpoints (QA)

- [ ] Body reads as one rigid straight leaning line at the same angle in all four frames
- [ ] Supporting arm straight and gripping the column at shoulder height throughout
- [ ] Elbow bend of the working arm identical and fixed in all four frames
- [ ] Top frame stops level with the shoulder line — no hand above shoulder
- [ ] No hip bend, no shrug, no torso twist in any frame
- [ ] The lean is obvious at thumbnail size — clearly distinct from the standing lateral raise
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] Readable as a leaning lateral raise at 64 px wide
