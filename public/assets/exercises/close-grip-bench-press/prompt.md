# Close Grip Bench Press — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `close-grip-bench-press` |
| Category | Arms |
| Camera | `bench-side` |
| Frames | 6 |
| Equipment | Flat bench + Barbell |
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
Exercise: Close Grip Bench Press
Camera: bench-side view, the flat bench seen from the side and level with the
camera so the bar path, the tucked elbow angle and the touch point on the
lower chest are all readable.
Equipment: a low matte black padded bench on a simple black steel frame, and one long
brushed chrome bar with matte black bumper plates, evenly loaded both
sides, gripped overhand with the hands roughly shoulder-width apart —
narrower than a standard bench press but not touching, wrists stacked
directly over the forearms.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Start. Lying face up along the flat bench, head, shoulder blades and hips
   in contact with it, both feet flat on the floor either side. Arms
   pressed straight up, elbows extended but not locked, the bar held over
   the lower chest with a shoulder-width grip.
2. Early descent, elbows bent to roughly 30 degrees and already tucking in
   toward the ribs rather than flaring out. The bar has dropped a short
   way and is tracking down and slightly toward the lower chest.
3. Mid descent, elbows bent to roughly 70 degrees and held at about 45
   degrees to the torso — clearly tucked, not flared to 90. Shoulder
   blades pulled together and down into the bench, wrists straight.
4. Bottom position, the bar lightly touching the lower chest just below the
   sternum. Elbows tucked at roughly 45 degrees to the torso and sitting
   close under the wrists, forearms vertical, shoulder blades still
   retracted, hips and both feet still down.
5. Ascent, back through roughly 70 degrees of elbow flexion. The bar rises on
   the same tucked path, elbows still close to the ribs, wrists still
   stacked over the forearms, hips still on the bench.
6. Lockout, identical to frame 1. Elbows fully extended but not
   hyperextended, the bar back over the lower chest, shoulder blades still
   retracted and both feet still flat on the floor.

TECHNIQUE — must be correct in every frame:
- The grip is roughly shoulder-width — clearly narrower than a standard
  bench press, and the hands never touch each other.
- The elbows stay tucked at roughly 45 degrees to the torso through the
  whole rep — they never flare out to 90 degrees.
- The forearms stay vertical under the bar at the bottom; the wrists stay
  stacked over the forearms and never bend backward.
- The shoulder blades stay retracted and pressed into the bench in every
  frame.
- Head, shoulders and hips stay in contact with the bench and both feet stay
  flat on the floor.
- The bar touches the lower chest, not the collarbone or the neck.
```

## Form checkpoints (QA)

- [ ] Grip is visibly narrower than a standard bench press but hands are apart
- [ ] Elbows tucked at roughly 45 degrees in all six frames — no flaring
- [ ] Bar touches the lower chest below the sternum at the bottom
- [ ] Forearms vertical under the bar at the bottom position
- [ ] Hips stay on the bench and both feet stay flat in all six frames
- [ ] Elbows extended but not hyperextended at lockout
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a close-grip press at 64 px wide
