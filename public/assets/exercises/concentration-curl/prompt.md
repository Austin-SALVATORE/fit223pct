# Concentration Curl — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `concentration-curl` |
| Category | Arms Variants |
| Camera | `side` |
| Frames | 4 |
| Equipment | Flat bench + Dumbbell (single) |
| Status | `planned` |

> Differentiators against the other seated curls: a single dumbbell and the
> working elbow braced against the inner thigh. The brace must be visible in
> every frame.

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
Exercise: Concentration Curl
Camera: side view, the working arm on the near side so the braced elbow, the
inner-thigh contact and the dumbbell arc all stay readable in every frame.
Equipment: a low matte black padded bench on a simple black steel frame,
plus one matte black hexagonal-head dumbbell with a brushed chrome knurled
handle, held in the near hand with an underhand (supinated) grip.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start. Seated on the edge of the flat bench, feet wide and flat on the
   floor, torso hinged slightly forward from the hips. The working arm
   hangs straight down inside the near leg, the back of the elbow braced
   against the inner thigh, elbow extended but not locked, palm supinated
   and facing forward. The free hand rests on the opposite thigh.
2. Early flexion, elbow bent to roughly 45 degrees. Only the forearm has
   moved — the elbow stays braced against the inner thigh, the upper arm
   has not shifted, palm still supinated. Torso angle unchanged.
3. Top position, elbow bent to roughly 120 degrees, the dumbbell near the
   front of the shoulder, palm supinated and facing up toward the
   shoulder. The elbow is still braced against the inner thigh; the
   shoulder has not lifted or rolled and the torso has not rocked back.
4. Controlled lowering, back through roughly 90 degrees of elbow flexion,
   the dumbbell descending on the same arc under tension, palm still
   supinated, elbow still braced, torso angle still unchanged.

TECHNIQUE — must be correct in every frame:
- The elbow stays braced against the inner thigh in every frame — the
  upper arm never moves; only the forearm swings.
- Palm stays supinated for the whole rep; wrist neutral and in line with
  the forearm.
- The torso angle is identical in all four frames — no rocking or leaning
  back to lift the weight.
- The free hand rests on the opposite thigh in every frame.
- Feet stay wide and flat on the floor.
```

## Form checkpoints (QA)

- [ ] Elbow visibly braced against the inner thigh in all four frames
- [ ] Only one dumbbell, in the working hand — free hand resting on the
      opposite thigh
- [ ] Palm clearly supinated in every frame
- [ ] Torso angle identical across all four frames — no rocking
- [ ] Seated on a flat bench with feet wide and flat
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] All four figures identical scale on one shared ground line
- [ ] Readable as a concentration curl at 64 px wide
