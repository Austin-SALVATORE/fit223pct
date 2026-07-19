# Walking Lunge — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `walking-lunge` |
| Category | Squat / Lower Body |
| Camera | `three-quarter-side` |
| Frames | 6 |
| Equipment | Dumbbell |
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
Exercise: Walking Lunge
Camera: three-quarter side view so the front and rear legs stay clearly
separable and neither leg hides the other.
Equipment: two matte black hexagonal-head dumbbells with brushed chrome
knurled handles, one in each hand, hanging at arm's length beside the hips with
a neutral grip, arms straight and still throughout.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Standing tall, feet together and flat, hips and knees fully extended,
   shoulders back, dumbbells hanging at the sides, gaze forward.
2. The right leg has stepped forward about one and a half foot-lengths and the
   right foot has just landed flat; the right knee is bent about 30 degrees,
   the left heel has lifted, the torso stays vertical.
3. Bottom of the right-leg lunge. Right thigh parallel to the ground, right
   knee stacked directly over the right ankle with the heel flat, left knee low
   and just short of the ground, left heel raised, torso upright, spine
   neutral.
4. Rising out of the right-leg lunge by driving through the right heel; right
   knee bent about 40 degrees, the left foot swinging forward off the ground as
   the body travels forward.
5. Bottom of the next lunge, now on the left leg and further along the
   direction of travel. Left thigh parallel to the ground, left knee over the
   left ankle with the heel flat, right knee low and just short of the ground.
6. Standing tall again at the end of the travel, feet together, hips and knees
   fully extended, dumbbells still hanging at the sides.

TECHNIQUE — must be correct in every frame:
- The figure travels forward across the strip — each lunge lands further along
  the shared ground line than the last.
- The front shin stays close to vertical; the front knee never drifts past the
  toes.
- The front heel stays flat and receives the weight; the rear heel is lifted.
- The torso stays vertical with a neutral spine — no forward lean or twisting.
- The lunge alternates legs: right leg forward, then left leg forward.
```

## Form checkpoints (QA)

- [ ] Figure clearly progresses forward frame to frame — reads as walking
- [ ] Alternating legs: right leg lunge then left leg lunge
- [ ] Front shin vertical, front heel flat at both bottom positions
- [ ] Rear knee low and just short of the ground, rear heel lifted
- [ ] Both legs remain clearly separable in the three-quarter view
- [ ] Dumbbells hang straight down at the sides in every frame
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a walking lunge at 64 px wide
