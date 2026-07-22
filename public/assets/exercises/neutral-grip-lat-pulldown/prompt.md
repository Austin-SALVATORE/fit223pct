# Neutral-Grip Lat Pulldown — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `neutral-grip-lat-pulldown` |
| Category | Back Variants |
| Camera | `machine-three-quarter` |
| Frames | 6 |
| Equipment | Lat pulldown — close neutral-grip handle |
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
Exercise: Neutral-Grip Lat Pulldown
Camera: machine three-quarter view, the machine column set slightly behind and
to the side so the cable line, the handle path and the front of the torso all
stay readable.
Equipment: matte black seated frame with thigh pad and chrome cable. In place
of the long straight bar, the cable carries a compact simple black close
neutral-grip handle: two short parallel grips a fist-width apart, one for each
hand, palms facing each other. The woman is seated on the pad with both thighs
locked under the thigh pad, feet flat on the floor, shins vertical. The grip is
the loudest visual element: hands close together well inside shoulder width,
palms facing each other, in every frame.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Start position. Seated tall, thighs pinned under the pad, both arms fully
   extended overhead holding the parallel grips a fist-width apart, palms
   facing each other, hands well inside shoulder width. Shoulder blades
   elevated toward the ears by the load, elbows straight but not locked, torso
   vertical.
2. Initiation. Arms still straight, palms still facing each other on the
   narrow handle. The shoulder blades retract and depress — the shoulders
   visibly drop away from the ears — before the elbows bend. Torso begins a
   small backward lean of about 10 degrees from vertical.
3. Early pull. Elbows bent to roughly 140 degrees and driving straight down in
   front of the ribs — the close neutral grip keeps them tucked, not flared.
   Handle at forehead height, hands still a fist-width apart, palms facing
   each other, torso lean now 15 degrees and fixed there.
4. End position, deepest point. Handle just under the chin at upper-chest
   height, hands still close together with palms facing each other, elbows
   bent to roughly 60 degrees and tucked directly in front of the ribs,
   shoulder blades fully retracted and depressed, chest tall, torso still at
   the same 15-degree backward lean, wrists straight.
5. Controlled return, halfway. Elbows opening back toward 140 degrees, handle
   at forehead height, palms still facing each other, shoulder blades still
   held down, torso lean unchanged.
6. Return to full stretch, identical to frame 1. Arms fully extended overhead
   on the narrow parallel grips, shoulder blades allowed to rise again under
   control, thighs still locked under the pad.

TECHNIQUE — must be correct in every frame:
- Hands stay a fist-width apart with the palms facing each other — never an
  overhand or underhand grip, never a wide bar.
- Shoulder blades depress before the elbows bend on every rep.
- The handle travels to the upper chest in front of the head, never behind
  the neck.
- Elbows stay tucked in front of the ribs, pointing down, never flared.
- Torso lean stays fixed at roughly 15 degrees — no rocking backwards.
- Thighs stay pinned under the pad and both feet stay flat on the floor.
```

## Form checkpoints (QA)

- [ ] Compact two-grip neutral handle in every frame — no long bar anywhere
- [ ] Palms facing each other with hands a fist-width apart in every frame
- [ ] Frame 2 shows scapular depression with the elbows still straight
- [ ] Handle finishes at the upper chest in front of the head
- [ ] Elbows tucked in front of the ribs, never flared sideways
- [ ] Distinct from `lat-pulldown` (shoulder-width overhand on a long bar),
      `wide-grip-lat-pulldown` (hands far outside the shoulders) and
      `close-grip-lat-pulldown` (underhand on the long bar) — the giveaway here
      is the compact parallel-grip attachment
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as a vertical pull at 64 px wide

> Note: at 64 px thumbnails this asset, `lat-pulldown`,
> `wide-grip-lat-pulldown`, `close-grip-lat-pulldown` and
> `neutral-grip-lat-pulldown` are nearly indistinguishable — the app should
> consider showing one generic pulldown thumbnail for all four and reserving
> the grip-specific art for the full-size exercise detail view.
