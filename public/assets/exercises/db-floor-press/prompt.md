# Dumbbell Floor Press — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `db-floor-press` |
| Category | Seeded Program |
| Camera | `floor-side` |
| Frames | 6 |
| Equipment | Two dumbbells — no bench |
| Status | `planned` |

> The differentiator from any bench press is the floor: she lies directly on
> the ground with NO bench anywhere in the image, and at the bottom of each rep
> the backs of the upper arms rest flat on the floor, which stops the range.

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
Exercise: Dumbbell Floor Press
Camera: floor-side view, the body seen from the side so the vertical forearm,
the elbow touching down, and the flat-on-the-floor torso are all readable.
Equipment: two matte black hexagonal-head dumbbells with brushed chrome
knurled handles, one held in each hand. There is NO bench — she lies directly
on the invisible ground line.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Lockout. Lying flat on her back on the ground, knees bent to roughly 60
   degrees with both feet flat on the floor, head, shoulders, back and hips
   all in contact with the ground. Both arms extended vertically over the
   lower chest, elbows straight but not hyperextended, dumbbells directly
   above the shoulders with neutral wrists.
2. Early descent. Elbows bending, upper arms lowering toward the floor at
   roughly 45 degrees to the torso, forearms staying vertical, dumbbells
   directly above the elbows.
3. Mid descent, elbows at roughly 90 degrees, the backs of the upper arms
   hovering just above the floor, forearms still vertical, wrists stacked over
   the elbows.
4. Bottom position. The entire back of each upper arm rests flat on the floor
   — the floor stops the range. Elbows on the ground at roughly 45 degrees
   from the ribs, forearms vertical, dumbbells held steadily above the elbows,
   head and hips still down, lower back gently neutral against the floor.
5. Ascent, halfway back up. Upper arms have pressed off the floor, elbows
   extending, dumbbells travelling straight up over the shoulders.
6. Lockout again, identical to frame 1, both arms fully extended.

TECHNIQUE — must be correct in every frame:
- No bench appears in any frame — the whole back is on the ground.
- Forearms stay vertical with the wrists stacked directly over the elbows.
- Upper arms stay at roughly 45 degrees to the torso, never flared to 90.
- In the bottom frame the upper arms rest on the floor; the elbows never
  bounce or dig in, and the dumbbells never touch the ground.
- Head, shoulders and hips stay in contact with the floor the whole rep.
- Both arms move symmetrically at the same rate.
```

## Form checkpoints (QA)

- [ ] No bench anywhere in the image — torso flat on the ground in all frames
- [ ] Bottom frame shows the backs of both upper arms resting on the floor
- [ ] Forearms vertical with wrists stacked over elbows in every frame
- [ ] Upper arms at roughly 45 degrees from the ribs, not flared to 90
- [ ] Knees bent with both feet flat on the floor throughout
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a floor press (not a bench press) at 64 px wide
