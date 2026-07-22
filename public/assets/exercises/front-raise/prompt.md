# Front Raise — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `front-raise` |
| Category | Shoulders |
| Camera | `side` |
| Frames | 4 |
| Equipment | Dumbbell (pair) |
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
Exercise: Front Raise
Camera: side view, so the forward sagittal-plane arc of the arms is fully readable against the line of the spine.
Equipment: a pair of matte black hexagonal-head dumbbells with brushed chrome knurled handles, one in each hand.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start position. Standing tall, feet hip-width and flat, dumbbells resting
   against the front of the thighs with the palms facing back toward the
   body. Elbows are set at a soft fixed bend of about 10 to 15 degrees and
   stay at that angle throughout. Shoulders down, ribs down, pelvis neutral.
2. Roughly 45 degrees of shoulder flexion. The arms have swept forward in the
   sagittal plane, dumbbells at about hip-to-navel height, elbow angle
   unchanged, torso vertical with no backward lean.
3. Top position, roughly 90 degrees of shoulder flexion. The upper arms are
   parallel to the ground and the dumbbells sit directly in front of the
   shoulders at shoulder height. Ribs stay pulled down and the lower back
   keeps its natural curve — no leaning back to counterweight the load.
4. Controlled lowering, roughly 30 degrees of flexion. The arms descend along
   the same forward arc under control, elbow bend still fixed, torso still
   vertical and motionless.

TECHNIQUE — must be correct in every frame:
- The elbow angle is fixed at a soft bend and is identical in all four frames
  — the elbows never extend or flex to move the weight.
- The arms travel forward in the sagittal plane, directly in front of the
  shoulders, never out to the sides.
- Arms stop at shoulder height; the dumbbells do not rise above the shoulders.
- Ribs stay down and the torso stays vertical — no leaning back and no hip
  swing to generate momentum.
- Shoulders stay down away from the ears; there is no shrug at the top.
```

## Form checkpoints (QA)

- [ ] Elbow bend identical and fixed in all four frames
- [ ] Arms travel forward in the sagittal plane, never out to the sides
- [ ] Top frame stops at shoulder height with upper arms parallel to the ground
- [ ] Palms face down and back toward the body throughout
- [ ] No backward trunk lean or hip swing in any frame
- [ ] Cannot be mistaken for a lateral raise or a press
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] Readable as a front raise at 64 px wide
