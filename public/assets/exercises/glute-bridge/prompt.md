# Glute Bridge — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `glute-bridge` |
| Category | Hip Hinge / Glutes |
| Camera | `floor-side` |
| Frames | 4 |
| Equipment | none — bodyweight only |
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
Exercise: Glute Bridge
Camera: floor-side view, so the spine, the hip height and the shin angle are
all clearly readable while she lies on the ground.
Equipment: none — bodyweight only.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start position. Lying on her back on the ground, knees bent, feet flat and
   roughly hip-width apart with the heels drawn close enough to be reachable by
   the fingertips. Arms resting on the ground alongside the body, palms down.
   Head and shoulders on the ground, lower back in a neutral resting position,
   hips down, chin lightly tucked.
2. Early lift. Hips a few inches off the ground, the pelvis tilting slightly
   posteriorly, the drive coming through the heels, shoulders and head still
   flat on the ground, ribs down.
3. Mid-range. Hips roughly halfway up, torso lifting off the ground segment by
   segment from the lower back upward, upper back and shoulders still in
   contact with the floor, spine long and neutral, knees tracking in line with
   the feet.
4. Top position. Hips fully extended, forming a straight diagonal line from the
   knees through the hips to the shoulders. Shoulders, upper arms and head
   still on the ground, shins close to vertical, feet flat with the heels down,
   glutes contracted, ribs pulled down and lumbar spine neutral — the height
   comes from hip extension, not from arching the lower back.

TECHNIQUE — must be correct in every frame:
- She is lying on the ground for the whole movement; the head, shoulders and
  upper arms stay in contact with the floor in every frame.
- The whole body stays in one shared side-view plane so both feet stay visible.
- Feet stay flat with the drive through the heels; the heels never lift.
- Knees track in line with the feet and never fall inward.
- The lumbar spine is neutral and the ribs stay down at the top — no
  hyperextension of the lower back to gain height.
- The neck stays relaxed with the chin lightly tucked; the head does not press
  into the floor.
```

## Form checkpoints (QA)

- [ ] Head, shoulders and upper arms stay on the floor in all four frames
- [ ] Straight knee-hip-shoulder line at the top frame
- [ ] Shins near vertical at the top, feet flat with heels down
- [ ] Lumbar spine neutral at the top — no lower-back hyperextension
- [ ] Knees track in line with the feet, no inward collapse
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a glute bridge at 64 px wide
