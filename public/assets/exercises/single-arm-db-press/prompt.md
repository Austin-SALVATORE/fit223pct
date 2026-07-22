# Single-Arm Dumbbell Press — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `single-arm-db-press` |
| Category | Seeded Program |
| Camera | `three-quarter-front` |
| Frames | 6 |
| Equipment | One dumbbell |
| Status | `planned` |

> Strict standing one-arm overhead press. The differentiator is the single
> dumbbell with the free hand resting on the hip, and a torso that stays
> perfectly vertical — the unilateral load must not pull her into a side lean.

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
Exercise: Single-Arm Dumbbell Press
Camera: three-quarter front view so the vertical torso, the level shoulders
and the overhead path of the single dumbbell are all readable.
Equipment: one matte black hexagonal-head dumbbell with a brushed chrome
knurled handle, held in the right hand only. The left hand rests on the left
hip in every frame. There is only ONE dumbbell in the image.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Rack position. Standing tall, feet hip-width apart, knees soft, torso
   vertical, ribs down, glutes braced. Dumbbell held at the front of the right
   shoulder, right elbow below and slightly in front of the wrist, forearm
   vertical, wrist neutral. Left hand on the left hip, shoulders level.
2. Early press. Dumbbell driven straight up past the face to forehead height,
   right elbow tracking under the wrist, head shifted back just enough to
   clear the path, torso still perfectly vertical.
3. Mid press. Dumbbell just above the crown of the head, arm at roughly half
   extension, head returning to neutral under the load, shoulders still level
   with no lean toward the free side.
4. Lockout. Right arm fully extended overhead, biceps close to the ear,
   dumbbell stacked directly over the shoulder and hip, elbow straight but not
   hyperextended, torso vertical, hips square, shoulders level, left hand
   still on the hip.
5. Controlled descent, halfway. Dumbbell lowering along the same path, elbow
   re-bending under the wrist, torso unmoved.
6. Rack position again, identical to frame 1, dumbbell back at the front of
   the right shoulder.

TECHNIQUE — must be correct in every frame:
- The torso stays perfectly vertical — no side lean, no hip shift toward or
  away from the working arm, no back arch.
- Shoulders stay level in every frame despite the one-sided load.
- The wrist stays neutral and stacked over the elbow through the whole path.
- At lockout the dumbbell, shoulder and hip form one vertical line.
- The left hand stays relaxed on the left hip the entire rep.
- Knees stay soft but do not dip — no push-press leg drive.
```

## Form checkpoints (QA)

- [ ] Exactly one dumbbell, always in the same hand; free hand on the hip
- [ ] Torso vertical with zero side lean in all six frames
- [ ] Shoulders level in every frame despite the unilateral load
- [ ] Lockout frame stacks dumbbell over shoulder over hip in one line
- [ ] No knee dip — a strict press, not a push press
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a one-arm overhead press at 64 px wide
