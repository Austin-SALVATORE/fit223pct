# Tempo Bodyweight Squat — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `tempo-bodyweight-squat` |
| Category | Seeded Program |
| Camera | `side` |
| Frames | 6 |
| Equipment | None — bodyweight only |
| Status | `planned` |

> Tempo variation of the bodyweight squat. The differentiator is the deliberate
> three-second eccentric — spatially the positions match `bodyweight-squat`,
> and that is intentional. The tempo lives in the app's cueing; the image only
> needs to read as a controlled, unhurried squat.

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
Exercise: Tempo Bodyweight Squat — a slow-eccentric squat. The descent is
deliberately controlled over roughly three seconds, so every descent frame must
look composed and balanced, never mid-fall.
Camera: side view, turned very slightly toward the viewer so both the torso and
the working leg stay readable.
Equipment: none — bodyweight only. Arms extend forward at chest height as a
counterbalance during the descent and return to the sides at the top.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Standing tall, feet shoulder-width apart and flat, toes turned out roughly
   10 to 15 degrees, hips and knees fully extended, arms hanging at the sides,
   chest up, gaze forward.
2. Early descent, roughly a quarter squat, perfectly balanced mid-tempo. Hips
   have travelled back, knees bent about 30 degrees, torso leaning forward
   only a few degrees, arms beginning to lift forward.
3. Half squat, thighs at roughly 45 degrees. Knees bent about 70 degrees and
   tracking forward over the toes, hips clearly back, back flat, arms extended
   forward at chest height, whole body still and controlled.
4. Bottom position, deepest point. Hips below knee level, thighs below
   parallel, shins inclined forward, heels flat on the ground, chest up, spine
   neutral, arms straight forward at chest height.
5. Ascent, back to roughly a half squat. Hips and chest rising together at the
   same rate, knees still tracking over the toes, arms starting to lower.
6. Standing tall again, identical to frame 1, hips and knees fully extended,
   arms back at the sides.

TECHNIQUE — must be correct in every frame:
- Heels stay flat on the ground through the whole rep, including the bottom.
- Knees track in line with the toes, never collapsing inward.
- Spine stays neutral — no rounding of the lower back at the bottom.
- Torso angle and shin angle stay roughly parallel through the descent.
- Every position looks controlled and balanced — no dropping or bouncing.
- Hips and shoulders rise at the same rate on the way up.
```

## Form checkpoints (QA)

- [ ] Bottom frame reaches hips below knees with heels down
- [ ] Knees track over toes in all six frames — no valgus collapse
- [ ] Lumbar spine neutral at depth, not rounded
- [ ] Arm counterbalance rises and falls consistently across the strip
- [ ] Descent frames read as controlled and balanced, not collapsing
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a squat at 64 px wide
