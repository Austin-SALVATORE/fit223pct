# Barbell Row — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `barbell-row` |
| Category | Back / Pull |
| Camera | `side` |
| Frames | 6 |
| Equipment | Barbell |
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
Exercise: Barbell Row
Camera: side view, turned very slightly toward the viewer so the hip hinge, the
flat back and the bar path all stay readable.
Equipment: one long brushed chrome bar with matte black bumper plates, evenly
loaded both sides, held in an overhand grip just outside shoulder width, arms
hanging straight down from the shoulders.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Set position. Feet hip-width apart and flat, knees bent to roughly 20 degrees,
   hips pushed back into a hinge so the torso sits at about 45 degrees to the
   floor, spine long and flat from tailbone to head, neck in line with the spine,
   arms hanging vertically, bar just below the knees over the mid-foot.
2. Initiation. Arms still straight. Shoulder blades retract and depress, the
   upper back tightens and the bar rises a few centimetres. Hip and torso angles
   unchanged.
3. Early pull. Elbows bent to roughly 130 degrees, driving up and back along the
   sides of the ribs, bar tracking close to the thighs, torso angle still 45
   degrees.
4. End position, highest point. Bar touching the lower abdomen just below the
   navel, elbows bent to roughly 45 degrees and clearly behind the torso line,
   shoulder blades fully retracted, back still flat, hips still back, knee angle
   unchanged, head neutral.
5. Controlled descent, halfway. Elbows opening back toward 130 degrees, bar
   lowering along the thighs, shoulder blades beginning to release, torso angle
   still 45 degrees.
6. Return to the set position, identical to frame 1. Arms fully extended, bar
   just below the knees, back still flat.

TECHNIQUE — must be correct in every frame:
- The torso angle stays fixed at roughly 45 degrees — it never rises with the bar.
- The spine stays flat and long; the lower back never rounds and never overarches.
- The hips stay pushed back and the knee angle stays constant through the whole rep.
- Shoulder blades retract before the elbows bend.
- The bar stays close to the body and touches the lower abdomen, not the sternum.
- Head and neck stay in line with the spine, gaze down and slightly forward.
```

## Form checkpoints (QA)

- [ ] Torso angle identical in all six frames — no trunk rise on the pull
- [ ] Flat neutral spine at every point, including the bottom
- [ ] Bar contacts the lower abdomen, not the sternum
- [ ] Knee angle constant across all six frames
- [ ] Plates evenly loaded and identical on both sides
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as a bent-over barbell row at 64 px wide
