# Straight Arm Pulldown — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `straight-arm-pulldown` |
| Category | Back / Pull |
| Camera | `machine-three-quarter` |
| Frames | 4 |
| Equipment | Cable machine — straight bar at a high pulley |
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
Exercise: Straight Arm Pulldown
Camera: machine three-quarter view so the high cable line, the fixed elbow angle
and the wide arc of the hands all stay readable.
Equipment: matte black upright column with the pulley set well above head
height, brushed chrome cable, simple straight bar attachment gripped overhand at
shoulder width. The woman stands facing the column about an arm's length away,
feet hip-width apart and flat, knees softly bent, hips hinged back a few degrees
so the torso leans forward roughly 20 degrees.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start position. Torso leaning forward roughly 20 degrees with a flat neutral
   spine, both arms reaching up and forward toward the high pulley, bar at about
   forehead height, elbows almost completely straight with only a small fixed
   bend of about 10 degrees, both shoulders reaching forward and up as the
   shoulder blades protract and elevate.
2. Early sweep. The movement happens at the shoulder joint only: the straight
   arms sweep down in a wide arc, the bar now at chest height, the elbow angle
   unchanged at that same fixed 10 degrees. Shoulder blades begin to depress.
   Torso angle fixed.
3. Late sweep. The straight arms continue down, bar at hip height, elbow angle
   still unchanged, lats fully shortened, shoulder blades depressed, wrists
   neutral, torso angle still fixed.
4. End position. Bar against the front of the thighs, arms still essentially
   straight with the same 10-degree bend, shoulders pulled down and back, ribs
   down, spine neutral, hips still hinged back a few degrees. The return simply
   reverses this same fixed-elbow arc.

TECHNIQUE — must be correct in every frame:
- The elbow angle is identical in all four frames — roughly 10 degrees and fixed.
- The movement comes only from the shoulder joint, sweeping straight arms in an
  arc.
- This must never read as a triceps pushdown: the elbows never bend and then
  extend, and the upper arms are never pinned against the sides.
- The torso angle stays fixed at roughly 20 degrees of forward lean — no rocking.
- The spine stays flat and neutral and the ribs stay down.
- Both feet stay flat and the knee angle stays constant.
```

## Form checkpoints (QA)

- [ ] Elbow angle visibly identical in all four frames — no bend-and-extend
- [ ] Hands travel in a wide arc from forehead height down to the thighs
- [ ] Upper arms are never pinned to the sides — this is not a pushdown
- [ ] Torso lean fixed at roughly 20 degrees across all four frames
- [ ] Flat neutral spine with the ribs down in every frame
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] Readable as a straight-arm pulldown at 64 px wide
