# Band Row — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `band-row` |
| Category | Seeded Program |
| Camera | `side` |
| Frames | 6 |
| Equipment | Resistance band + anchor column |
| Status | `planned` |

> Standing two-arm row against a band anchored at mid-height. The band's
> visible length change — longest with the arms extended, shortest at the
> squeeze, taut in every frame — is what makes this asset read correctly.

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
Exercise: Band Row
Camera: side view, so the horizontal pull path and the band stretching and
shortening between the anchor and the hands are both clearly readable.
Equipment: one long matte near-black elastic resistance band with a smooth
matte surface, drawn visibly taut under load. The band is anchored at
mid-height — sternum height — to a matte black upright column standing at
the left edge of each frame. She faces the column and holds one end of the
band in each hand. The band is TAUT in every single frame: a straight line
from the anchor to the hands, never sagging, never slack.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Start. Standing tall facing the column, feet hip-width apart, knees soft,
   torso vertical. Both arms extended straight forward at sternum height
   toward the anchor, shoulders reaching slightly forward. The band is at its
   LONGEST, stretched and clearly taut in a straight horizontal line from the
   column to both hands.
2. Initiation. Arms still nearly straight while the shoulder blades draw back
   and down. The band is fractionally shorter but still fully taut and
   straight.
3. Mid pull. Elbows bent to roughly 90 degrees and travelling straight back
   close to the ribs, hands at sternum height. The band is visibly shorter
   than in frame 1 and still taut with no sag.
4. Full contraction. Hands drawn to the sides of the sternum, elbows behind
   the torso line, shoulder blades fully squeezed together, wrists straight
   and neutral, torso still vertical. The band is at its SHORTEST length of
   the rep but remains visibly taut and straight — never slack.
5. Controlled return, halfway. Arms extending forward again, the band
   lengthening under control, still a taut straight line to the anchor.
6. Back to the start, identical to frame 1. Arms long, shoulders reaching
   forward, band at its longest and clearly taut.

TECHNIQUE — must be correct in every frame:
- The band is TAUT in all six frames — a straight line from anchor to hands
  with zero sag, even at full arm extension.
- The band's length visibly changes across the strip: longest in frames 1 and
  6, shortest in frame 4.
- The torso stays vertical — no leaning back to cheat the pull.
- Elbows track close to the ribs and pull straight back, not flared upward.
- The pull finishes at the sternum with the shoulder blades squeezed.
- The column stands identically in every frame at the same position and scale.
```

## Form checkpoints (QA)

- [ ] Band taut and straight in all six frames — no sag or slack anywhere
- [ ] Band visibly longest at arms extended and shortest at the squeeze
- [ ] Anchor point at sternum height on the column in every frame
- [ ] Torso vertical throughout — no backward lean
- [ ] Elbows finish behind the torso with shoulder blades squeezed
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a band row at 64 px wide
