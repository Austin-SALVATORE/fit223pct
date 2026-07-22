# Romanian Deadlift — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `romanian-deadlift` |
| Category | Hip Hinge / Glutes |
| Camera | `side` |
| Frames | 6 |
| Equipment | Barbell |
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
Exercise: Romanian Deadlift
Camera: side view, so the hip hinge, the flat back and the vertical bar path
close to the legs are all clearly readable.
Equipment: one long brushed chrome bar with matte black bumper plates, evenly
loaded both sides, held in front of the thighs with a double-overhand grip
just outside hip width, arms straight and hanging vertically.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Standing tall, feet hip-width apart and flat, knees straight but not locked,
   barbell resting against the front of the thighs, shoulders back and down,
   chest up, lumbar spine neutral, gaze forward.
2. Start of the hinge. Knees soften to a fixed slight bend and hold there for
   the rest of the rep — this is a hinge, not a squat. Hips travel backwards,
   torso inclines maybe 20 degrees, bar slides down the front of the thighs and
   stays in contact with them.
3. Mid-range, torso at roughly 45 degrees. Hips clearly behind the heels, shins
   still near vertical, knee angle unchanged from frame 2, bar grazing the
   lower thigh just above the kneecap, lower back flat.
4. Bottom position, torso close to parallel with the ground, bar hanging at
   mid-shin height and still brushing the legs. Hamstrings visibly lengthened,
   hips at their furthest back point, lumbar spine still neutral with no
   rounding, head in line with the spine, shoulders slightly in front of the
   bar.
5. Ascent, back through roughly 45 degrees. Hips drive forward toward the bar,
   torso and hips rise together, bar tracks straight back up the shins and
   thighs in contact with the legs, knee angle still unchanged.
6. Standing tall again, identical to frame 1. Hips fully extended, glutes
   contracted, ribs down, no leaning back past vertical.

TECHNIQUE — must be correct in every frame:
- This is a hip hinge, not a squat — the knee angle is set in frame 2 and does
  not change until the lockout.
- The lumbar spine stays neutral and flat at every point, including the bottom.
- The bar stays in contact with the thighs and shins the whole way down and up.
- Shins stay close to vertical; the hips travel backwards, not down.
- The neck stays in line with the spine — no craning up to look forward.
- The rep never reaches the floor; the bottom is set by hamstring length.
```

## Form checkpoints (QA)

- [ ] Knee angle visibly identical in frames 2 through 5 — reads as a hinge, not a squat
- [ ] Bar stays touching the legs in every frame, no forward drift away from the body
- [ ] Lumbar spine flat at the bottom frame, no rounding at the low back
- [ ] Shins near vertical throughout, hips clearly travelling backwards
- [ ] Bar stops around mid-shin — it never touches the ground
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a hip hinge at 64 px wide
