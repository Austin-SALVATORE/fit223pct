# One-Arm Cable Row — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `one-arm-cable-row` |
| Category | Back Variants |
| Camera | `machine-three-quarter` |
| Frames | 6 |
| Equipment | Cable machine — mid pulley, standing single-arm |
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
Exercise: One-Arm Cable Row
Camera: machine three-quarter view, the cable column in front of the woman and
slightly to the side so the cable line, the working arm and the split stance all
stay readable.
Equipment: matte black upright column with the pulley set at mid-torso height,
brushed chrome cable, simple black handle held in the right hand only. There is
no bench and no footplate — the woman stands unsupported in a short split
stance, left foot forward, right foot back, both feet flat. The split stance
and the single-arm handle are what distinguish this from the two-handed
standing cable row and from the seated cable row.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Start position. Standing in a short split stance, knees softly bent, hips
   square to the machine, torso upright and inclined forward only a few degrees.
   Right arm fully extended forward at mid-torso height, right shoulder reaching
   forward as the shoulder blade protracts. Left hand resting quietly at the
   left hip.
2. Initiation. The right arm is still straight. The right shoulder blade
   retracts and depresses, pulling the shoulder back and down, before the elbow
   bends. Hips and shoulders stay square — no rotation.
3. Early pull. Right elbow bent to roughly 130 degrees, travelling straight back
   past the ribs, forearm parallel to the floor, torso still square and upright.
4. End position, deepest point. Handle drawn to the right lower rib, right elbow
   bent to roughly 45 degrees and behind the torso line, right shoulder blade
   fully retracted and depressed, chest tall, hips and shoulders still square to
   the machine, wrist straight.
5. Controlled return, halfway. Right elbow opening back toward 130 degrees,
   handle travelling forward at the same height, the shoulder blade beginning to
   protract.
6. Return to full stretch, identical to frame 1. Right arm fully extended
   forward, shoulder reaching forward under control, split stance unchanged.

TECHNIQUE — must be correct in every frame:
- The feet stay in the same split stance and never move.
- Hips and shoulders stay square to the machine — no torso rotation on the pull.
- The shoulder blade retracts and depresses before the elbow bends.
- The handle travels horizontally to the lower rib, not up toward the shoulder.
- The working elbow stays close to the ribs, not flared out.
- The spine stays neutral and the free hand stays quiet at the hip.
```

## Form checkpoints (QA)

- [ ] Standing split stance, no bench and no footplate, in all six frames
- [ ] Single working arm — the free hand stays at the hip throughout
- [ ] Hips and shoulders square in the end position — no rotation
- [ ] Frame 2 shows scapular retraction with the arm still straight
- [ ] Distinguishable at a glance from the two-handed standing cable row (one
      hand, split stance) and from the seated cable row
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as a standing single-arm cable pull at 64 px wide
