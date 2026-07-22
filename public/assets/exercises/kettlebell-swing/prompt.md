# Kettlebell Swing — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `kettlebell-swing` |
| Category | Hip Hinge / Glutes |
| Camera | `side` |
| Frames | 6 |
| Equipment | Kettlebell |
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
Exercise: Kettlebell Swing
Camera: side view, so the hip hinge, the flat back and the arc of the bell are
all clearly readable.
Equipment: one matte black cast-iron kettlebell with a smooth rounded handle,
held in both hands with straight arms.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Standing tall at the top of a swing, feet shoulder-width apart and flat,
   knees straight but not locked, hips fully extended, glutes contracted, ribs
   down, spine neutral, arms straight and the kettlebell floating at roughly
   chest height, level with the sternum, gaze forward.
2. Start of the backswing. Hips travel backwards, knees soften to a slight
   fixed bend, torso inclining forward, arms still straight, the kettlebell
   dropping and travelling back toward the body with the upper arms brushing
   the ribs.
3. Bottom of the backswing, the hike position. Torso at roughly 45 degrees,
   hips at their furthest back point, shins near vertical, kettlebell passing
   high between and behind the thighs with the forearms pressed against the
   inner thighs, lumbar spine flat, head in line with the spine, shoulders
   packed down.
4. Explosive hip drive. Hips snapping forward, knees extending, torso rising
   fast toward vertical, kettlebell just leaving the thighs and starting
   forward, arms still completely straight and hanging relaxed from the
   shoulders.
5. Top of the swing. Hips and knees fully locked out, body in a vertical
   standing plank, glutes and abs braced, ribs down, and the kettlebell out in
   front at roughly chest height, carried there by momentum from the hips with
   the arms straight and loose — this is not a front raise, the shoulders are
   not lifting the bell.
6. Start of the next backswing. Bell falling back toward the body, hips already
   travelling backwards to receive it, arms straight, upper arms reconnecting
   with the ribs, back flat.

TECHNIQUE — must be correct in every frame:
- The movement is driven entirely by the hips; the arms are ropes that hang
  straight from the shoulders and never lift the bell.
- This is a hip hinge, not a squat — the hips travel backwards and the shins
  stay close to vertical; the bell never drops below the knees toward the
  floor.
- In the backswing the kettlebell passes high between the thighs, above knee
  height, with the forearms in contact with the inner thighs.
- The lumbar spine stays neutral and flat at every point, especially at the
  bottom of the backswing.
- The top is a standing plank: hips through, glutes and abs braced, ribs down,
  no leaning back.
- The bell rises no higher than chest height, and the shoulders stay packed
  down and back.
```

## Form checkpoints (QA)

- [ ] Arms straight in all six frames — no elbow bend, no front-raise shoulder action
- [ ] Backswing frame shows the bell high between the thighs, above knee height
- [ ] Hips travel backwards with near-vertical shins — reads as a hinge, not a squat
- [ ] Lumbar spine flat at the bottom of the backswing
- [ ] Top frame is vertical with hips locked out, ribs down, no backwards lean
- [ ] Bell rises no higher than chest height
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a kettlebell swing at 64 px wide
