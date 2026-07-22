# Dead Bug — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `dead-bug` |
| Category | Core |
| Camera | `floor-side` |
| Frames | 3 |
| Equipment | none — bodyweight only |
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
Exercise: Dead Bug
Camera: floor-side view, turned very slightly toward the viewer so that both the
near and the far arm and leg stay separable.
Equipment: none — bodyweight only.
Number of frames: 3, evenly spaced left to right.
All three figures lie on the same shared invisible ground line as each other,
at exactly identical scale and spacing.

Frames:
1. Neutral start. Lying face up with the lower back pressed flat against the
   ground and the ribcage drawn down. Both arms reaching straight up, vertical,
   directly above the shoulders with the palms facing each other. Both hips and
   both knees bent to 90 degrees, knees stacked over the hips, shins parallel
   to the ground. Head resting down, neck long.
2. First diagonal — right arm and left leg. The RIGHT arm lowers overhead
   toward the ground until it is nearly horizontal just above the floor, while
   the LEFT leg extends straight out from the hip until it hovers a few
   centimetres above the ground with the knee fully open. At the same time the
   LEFT arm stays exactly vertical above the shoulder and the RIGHT knee stays
   locked at 90 degrees above the hip. The lower back stays pressed flat, the
   ribs stay down, and the pelvis does not tilt or twist.
3. Opposite diagonal — left arm and right leg, the exact mirror of frame 2. The
   LEFT arm lowers overhead toward the ground and the RIGHT leg extends
   straight out just above the ground, while the RIGHT arm stays vertical and
   the LEFT knee stays at 90 degrees above the hip. Lower back still flat,
   pelvis still square.

TECHNIQUE — must be correct in every frame:
- The extended limbs are always the opposite arm and opposite leg — the
  contralateral pairing must be unambiguous in frames 2 and 3.
- The non-working arm stays vertical and the non-working knee stays at 90
  degrees above the hip; they do not drift.
- The lower back stays pressed flat against the ground in every frame — no arch
  appears under the waist when the leg extends.
- The pelvis stays square and level; it does not rotate toward the extending
  leg.
- The head stays resting on the ground with the neck relaxed.
```

## Form checkpoints (QA)

- [ ] Frames 2 and 3 clearly show opposite arm and opposite leg extended
- [ ] Frames 2 and 3 are exact mirrors of each other
- [ ] Non-working arm vertical and non-working knee at 90 degrees in both
- [ ] Lower back flat against the ground in all three frames
- [ ] Same face, hair, wardrobe, and body proportions in all three frames
- [ ] All three figures identical scale on one shared ground line
- [ ] Readable as a dead bug at 64 px wide
