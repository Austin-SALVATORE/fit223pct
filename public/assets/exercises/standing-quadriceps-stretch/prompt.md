# Standing Quadriceps Stretch — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `standing-quadriceps-stretch` |
| Category | Recovery Stretch |
| Camera | `three-quarter-side` |
| Frames | 2 |
| Equipment | Wall — one hand lightly against it for balance only; the wall is never the source of the stretch |
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
Exercise: Standing Quadriceps Stretch (left side — the left leg is the one
bent behind and stretched; the right-side repeat reuses this same
illustration, named by the app's on-screen heading rather than mirrored art).
Camera: three-quarter-side view so the standing right leg and the bent left
leg behind it stay clearly separable.
Equipment: a wall, for balance only — it is never the source of the stretch,
attention stays on the quadriceps. Render it as a single flat, FILLED
vertical plane, matte warm charcoal #4A4138 — the app's own mid-value
border register, shifted warm. It must be unmistakably, clearly visible
against the background — not near-invisible — while staying clearly darker
and less saturated than her skin, hair and white sneakers, so she stays
the brightest thing in the frame. No gradient, no rim light, no texture,
no floor line, no baseboard, no corner.
The wall must NEVER float in open space with background visible on both
sides of it — that reads as a free-standing column, not a wall, and is
wrong. It is CUT OFF by the picture's own edge, on the right in both
frames. Between frame 1 and frame 2, leave only the minimum clean strip of
plain magenta needed to tell the two frames apart — noticeably narrower
than the wide, generous spacing used elsewhere in this library. In frame
1: the wall's flat color sits hard against that narrow gap, not set back
from it, so there is essentially no open background visible on the wall's
right side there. In frame 2: the wall's flat color runs off the true
right edge of the entire generated strip — zero magenta is visible between
the wall and that outer border, as if the wall simply continues past what
the picture shows. Unlike every other piece of equipment in this library,
the wall gets no padding or background margin on that side. The wall runs
the full height of the frame, top to bottom, with no gap above or below,
in both frames.
Number of frames: 2, evenly spaced left to right.
Both figures stand on the same shared invisible ground line as each other, at
exactly identical scale and spacing, each with their own copy of the wall at
their right hand.

Frames:
1. Entry position. Standing tall on the right leg, right hand resting
   lightly against the wall for balance. Left knee bending, left foot
   lifting off the ground and moving behind the body, left hand reaching
   back and down toward the left ankle but not yet gripping it. Torso
   upright, hips level and facing forward.
2. Full hold. Left hand now holding the left ankle or the top of the left
   foot, drawing the left heel up toward the glute. Both knees held close
   together, the left thigh pointing straight down in line with the right.
   Hips pressed gently forward, torso staying tall with no arch forced into
   the lower back. Right hand still resting lightly against the wall for
   balance, right (standing) leg softly bent, not locked.

TECHNIQUE — must be correct in every frame:
- The right hand rests lightly against the wall for balance only — it never
  bears significant weight or pulls the body off balance.
- Both knees stay close together in both frames — the bent left knee never
  drifts out to the side.
- In the hold, the hips press gently forward from a tall torso; the lower
  back does not arch to fake the range.
- The right (standing) leg stays softly bent, never locked, in both frames.
```

## Form checkpoints (QA)

- [ ] Frame 1 clearly reads as reaching for the ankle, not yet gripping it
- [ ] Frame 2 shows the ankle held with both knees close together and hips
      pressed gently forward
- [ ] Right hand rests lightly on the wall in both frames, clearly not
      bearing weight
- [ ] No forced lower-back arch in the hold
- [ ] Wall renders as a single flat, filled vertical plane in matte warm
      charcoal #4A4138 — no texture, no floor line, no corner, no gradient,
      no rim light — cropped at the frame's own edge
- [ ] Wall is flush to the frame's edge in BOTH frames — zero background
      visible beyond it; it does not float as a free-standing column with
      open background on either side
- [ ] Wall recedes: it is darker and lower-contrast than the figure in
      every frame; skin and sneakers stay the brightest things on screen
- [ ] No bench, band, dumbbell, or block anywhere in either frame
- [ ] Same face, hair, wardrobe, and body proportions in both frames
- [ ] Both figures identical scale on one shared ground line
- [ ] Readable as a standing quadriceps stretch at 64 px wide
