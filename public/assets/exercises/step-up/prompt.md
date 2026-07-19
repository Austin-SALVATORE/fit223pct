# Step-up — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `step-up` |
| Category | Lower Body Variants |
| Camera | `three-quarter-side` |
| Frames | 6 |
| Equipment | Plyo box / step, Dumbbell |
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
Pure flat white #FFFFFF, completely empty. No floor, no ground line, no shadow,
no gym environment, no gradient, no vignette, no frame or border.

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
Matte near-black metal #1D2025 with brushed chrome shafts and handles #EFEFEF.
Upholstery and bench pads matte near-black #1D2025. Simple, clean, realistic
proportions with believable weight and correct scale against the body.

COMPOSITION:
All figures stand on one shared invisible ground line, at exactly the same
scale, evenly spaced with clear white gaps between them. No figure overlaps,
touches, or is cropped by another. The entire body is visible in every frame,
including both feet. Generous white margin above and below. Eye-level camera at
an identical angle and distance for every frame.

STRICTLY EXCLUDE:
Text, numbers, labels, captions, arrows, motion lines, panel borders, dividing
lines, grids, watermarks, logos, background objects, mirrors, other people,
extra or missing limbs, distorted hands, broken or hyperextended joints.

MOVEMENT FOR THIS IMAGE:
Exercise: Step-up
Camera: three-quarter side view so the lead and trailing legs stay clearly
separable and the top of the box stays visible.
Equipment: one simple matte black rectangular box with flat vertical sides,
knee height, sitting on the shared ground line at an identical position and
scale in every frame. One matte black hexagonal-head dumbbell with a brushed
chrome knurled handle in each hand, hanging at arm's length by the sides.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Standing tall facing the box, about one foot-length behind it, feet
   hip-width apart and flat on the floor, dumbbells hanging at the sides,
   torso upright, gaze forward.
2. Lead foot planted fully flat on the box top, whole foot on the surface,
   lead knee bent about 90 degrees, trailing foot still flat on the floor,
   torso hinged slightly forward from the hips.
3. Mid drive. The lead leg extending and lifting the body, weight clearly
   over the lead foot, trailing foot just leaving the floor with its toes
   pointing down, dumbbells hanging vertically.
4. Standing tall on top of the box, both feet flat on the box top, hips and
   knees fully extended, torso upright.
5. Controlled descent. Lead foot still flat on the box, lead knee bending,
   trailing leg reaching back and down toward the floor, torso hinged
   slightly forward.
6. Back on the floor, identical to frame 1, both feet flat behind the box.

TECHNIQUE — must be correct in every frame:
- The whole lead foot stays flat on the box top — no heel or toes hanging off
  the edge.
- The lead leg does the lifting; the trailing foot never pushes off the
  floor.
- The lead knee tracks in line with the lead toes, never collapsing inward.
- Torso stays tall with only a slight forward hinge from the hips.
- Dumbbells hang vertically at arm's length — no swinging.
```

## Form checkpoints (QA)

- [ ] Lead foot fully flat on the box top whenever it is on the box
- [ ] Drive frames show the trailing foot passive, toes down — no push-off from the floor
- [ ] Frame 4 shows a full stand on top of the box, hips and knees extended
- [ ] Lead knee tracks over the lead toes — no valgus collapse
- [ ] Box identical scale and position in all six frames
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] All six figures identical scale on one shared ground line
- [ ] Readable as a step-up at 64 px wide
