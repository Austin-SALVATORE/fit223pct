# Machine Shoulder Press — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `machine-shoulder-press` |
| Category | Shoulders |
| Camera | `machine-three-quarter` |
| Frames | 6 |
| Equipment | Smith / press machine |
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
Exercise: Machine Shoulder Press
Camera: machine three-quarter view, so the frame, the guided path of the handles and the body position are all readable together.
Equipment: a matte black frame with chrome guide rails and simple black handles, configured as a seated shoulder press with an upright back pad and the handles starting at shoulder height.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Start position. Seated with the hips all the way back, the upper back and
   shoulder blades flat against the back pad, feet flat on the ground roughly
   hip-width apart. Hands on the handles at shoulder height, elbows bent to
   roughly 90 degrees and stacked directly under the wrists, wrists neutral
   and straight rather than bent back.
2. Early press, roughly a quarter of the range. Handles at ear height, the
   forearms still in line with the guide rails, torso unchanged against the
   pad.
3. Mid press. Handles just above the top of the head, elbows at roughly 120
   degrees, shoulders beginning to shrug and upwardly rotate, the lower back
   still in contact with the pad.
4. Lockout, the highest point. Elbows fully extended but not hyperextended,
   arms following the fixed path of the rails, ribs down and not flared,
   hips and shoulder blades still pinned to the seat and pad.
5. Controlled descent, back to roughly the height of frame 2. Elbows tracking
   back down along the same fixed path, wrists still neutral.
6. Return to the start position, identical to frame 1. Handles back at
   shoulder height, elbows under the wrists.

TECHNIQUE — must be correct in every frame:
- The upper back and shoulder blades stay in contact with the back pad in
  every frame.
- Wrists stay neutral and stacked over the elbows — never bent back over the
  handles.
- The arms follow the fixed path of the machine; both hands are at the same
  height in every frame.
- Both feet stay flat on the ground the whole time.
- Elbows lock out fully without snapping into hyperextension, and the ribs
  stay down rather than flaring at the top.
```

## Form checkpoints (QA)

- [ ] Machine frame, rails and handles identical in all six frames
- [ ] Both handles at the same height in every frame
- [ ] Upper back stays in contact with the pad; no arching off the seat
- [ ] Wrists neutral and stacked over elbows throughout
- [ ] Both feet flat on the ground in every frame
- [ ] Correct scale of the machine against the body
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as a seated machine shoulder press at 64 px wide
