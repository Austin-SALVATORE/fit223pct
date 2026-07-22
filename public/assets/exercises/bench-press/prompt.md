# Bench Press — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `bench-press` |
| Category | Chest / Push |
| Camera | `bench-side` |
| Frames | 6 |
| Equipment | Barbell, Flat bench |
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
Exercise: Bench Press
Camera: bench-side view, the bench seen from the side so the vertical bar path,
the elbow angle and the arch of the upper back are all readable.
Equipment: one long brushed chrome bar with matte black bumper plates, evenly
loaded both sides, plus one low matte black padded bench on a simple black
steel frame. The bench lies along the frame with the head end toward the left
and the feet toward the right; no uprights or rack in frame.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Lockout start. Lying face up on the flat bench, head, upper back and glutes
   in contact with the pad, slight natural arch in the lower back, feet flat on
   the floor under or slightly behind the knees. Hands just wider than shoulder
   width with a full thumbs-around grip, wrists stacked directly over the
   elbows, arms vertical, bar held over the upper chest.
2. Early descent, elbows bent to roughly 25 degrees. The bar has left lockout
   and travels down and very slightly toward the feet, upper arms starting to
   tuck to roughly 45 degrees from the torso rather than flaring to 90.
3. Half descent, elbows at roughly 90 degrees, forearms vertical, bar level
   with the front of the shoulders, shoulder blades pinned back and down into
   the bench.
4. Bottom position. The bar lightly touches the lower chest just below the
   nipple line, elbows still tucked to roughly 45 degrees and sitting under the
   wrists, forearms vertical from this side view, chest lifted, upper back
   tight, glutes still on the bench, feet still flat.
5. Ascent, back to roughly a half press. The bar drives up and very slightly
   back toward the shoulders on a shallow arc, elbows extending, hips staying
   down on the bench.
6. Lockout again, identical to frame 1, elbows fully extended, bar over the
   upper chest.

TECHNIQUE — must be correct in every frame:
- Shoulder blades stay retracted and pinned into the bench throughout.
- Elbows stay at roughly 45 degrees to the torso, never flared to 90.
- Forearms stay vertical with the wrists stacked over the elbows — no bent
  wrists and no bar drifting behind the elbows.
- Head, upper back and glutes stay in contact with the bench and the feet stay
  flat on the floor.
- The bar path is a shallow arc from the lower chest to over the upper chest,
  and the bar stays level and evenly loaded on both sides.
```

## Form checkpoints (QA)

- [ ] Bar touches the lower chest at the bottom, not the throat or the belly
- [ ] Elbows tucked to roughly 45 degrees in all six frames
- [ ] Forearms vertical with wrists stacked over elbows in the bottom frame
- [ ] Glutes and upper back stay on the bench, feet flat on the floor
- [ ] Bar stays level and evenly loaded in all six frames
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as a barbell bench press at 64 px wide
