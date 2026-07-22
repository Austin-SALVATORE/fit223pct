# Barbell Back Squat — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `barbell-back-squat` |
| Category | Squat / Lower Body |
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
Exercise: Barbell Back Squat
Camera: side view, turned very slightly toward the viewer so the bar, the torso
and the working leg stay readable.
Equipment: one long brushed chrome bar with matte black bumper plates, evenly
loaded both sides, resting across the upper back on the shelf of the rear
deltoids and mid-trapezius, hands gripping the bar just outside the shoulders,
elbows pointing down and slightly back, wrists stacked over the bar.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Standing tall, feet slightly wider than shoulder-width and flat, toes turned
   out roughly 20 degrees, hips and knees fully extended, bar centred over the
   midfoot, chest up, gaze forward.
2. Early descent, roughly a quarter squat. Hips travel back first, knees bent
   about 30 degrees, torso inclined forward slightly, bar still stacked
   vertically over the midfoot.
3. Half squat, thighs at roughly 45 degrees. Hips back, knees bent about 70
   degrees and tracking out over the toes, back flat, bar path still vertical
   over the midfoot.
4. Bottom position, deepest point. Hips just below knee level, thighs below
   parallel, heels flat, shins inclined forward, torso inclined forward about
   40 degrees with a neutral spine, bar still directly above the midfoot.
5. Ascent, back to roughly a half squat. Hips and shoulders rising at the same
   rate so the torso angle is unchanged, knees still tracking over the toes.
6. Standing tall again, identical to frame 1, hips and knees fully extended,
   ribs down.

TECHNIQUE — must be correct in every frame:
- The bar stays stacked vertically over the midfoot in every frame.
- Heels stay flat on the ground, including at the bottom.
- Knees track in line with the toes, never collapsing inward.
- Spine stays neutral — no rounding of the lower back and no excessive arch.
- Hips and shoulders rise at the same rate; the torso angle does not change on
  the way up.
```

## Form checkpoints (QA)

- [ ] Bar sits on the upper back, not on the neck, in all six frames
- [ ] Bar stays vertically over the midfoot through the whole strip
- [ ] Bottom frame reaches hips below knees with heels down
- [ ] Knees track over toes — no valgus collapse
- [ ] Plates evenly loaded and identical on both sides in every frame
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a barbell squat at 64 px wide
