# Cable Lateral Raise — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `cable-lateral-raise` |
| Category | Shoulder Variants |
| Camera | `front` |
| Frames | 4 |
| Equipment | Cable machine — low pulley, single black handle |
| Status | `planned` |

> Cable variant of `lateral-raise`. Same camera, same fixed-elbow arc — the
> differentiators are the single working arm and the taut cable crossing the
> front of the body from the low pulley. If those two cues are not obvious in
> the render, the asset is redundant with `lateral-raise`.

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
Exercise: Cable Lateral Raise
Camera: front view, because the frontal plane carries all of the information
in this movement, and to match the existing lateral raise asset.
Equipment: matte black upright column, brushed chrome cable, simple black
handle, with the pulley set at the very bottom of the column. The column
stands close beside the woman's left side. The cable runs from the low pulley
diagonally upward across the front of her body to the handle in her right
hand. Her left hand rests lightly on her left hip.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start position. Standing tall, feet hip-width and flat, the right hand
   holding the handle low in front of the left hip, palm facing in, the taut
   cable crossing the front of the body down to the low pulley. The right
   elbow is already set at a soft fixed bend of about 15 degrees — this angle
   does not change at any point in the movement. Shoulders down, ribs down.
2. Roughly 45 degrees of shoulder abduction. The right upper arm has swept out
   to the side in the frontal plane, hand a little below elbow height, elbow
   angle unchanged. The cable is still one straight taut line crossing the
   front of the body to the low pulley. Traps relaxed, torso upright and
   still.
3. Top position, roughly 90 degrees of abduction. The right upper arm is level
   with the shoulder, the elbow at or a fraction above the height of the hand,
   wrist neutral and level. The cable forms one long taut diagonal from the
   handle across the body down to the low pulley. Shoulders stay down away
   from the ears.
4. Controlled lowering, roughly 30 degrees of abduction. The arm descends
   under control along the same frontal-plane arc, elbow bend still fixed at
   the same soft angle, cable still taut, torso still upright and motionless.

TECHNIQUE — must be correct in every frame:
- The elbow angle is fixed at a soft bend and is identical in all four frames
  — this is a raise, not a press, so the elbow never extends or flexes to
  move the weight.
- The cable is taut in every frame and always crosses in front of the body
  from the low pulley to the working hand.
- The working arm travels out to the side in the frontal plane and stops at
  shoulder height — the hand never rises above the shoulder.
- No shrugging — the shoulders stay pressed down away from the ears even at
  the top.
- The torso stays upright and still; no leaning toward or away from the
  column to help lift the weight.
```

## Form checkpoints (QA)

- [ ] Elbow bend identical and fixed in all four frames — never reads as a press
- [ ] Cable taut and crossing in front of the body in every frame
- [ ] Top frame stops at shoulder height, elbow level with or just above the hand
- [ ] Only one working arm — the other hand stays on the hip in every frame
- [ ] Torso upright and still, no lean toward or away from the column, no shrug
- [ ] Clearly distinct from the dumbbell lateral raise: single arm plus visible cable path
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] Readable as a cable lateral raise at 64 px wide
