# Chest Supported Row — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `chest-supported-row` |
| Category | Back / Pull |
| Camera | `bench-side` |
| Frames | 6 |
| Equipment | Incline bench + two dumbbells |
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
Exercise: Chest Supported Row
Camera: bench-side view, the incline bench seen from the side so the chest
support, the torso angle and the elbow path all stay readable.
Equipment: matte black padded bench set to roughly 30 degrees on a black steel
frame, and two matte black hexagonal-head dumbbells with brushed chrome knurled
handles. The woman lies face down along the bench with her chest and abdomen in
full contact with the pad, her head just clear of the top edge, both feet flat
on the ground behind her and knees softly bent. Lying prone with the chest on
the pad is what distinguishes this from the upright seated machine row.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Start position. Chest flat on the incline pad, both arms hanging straight down
   toward the floor, palms facing each other, both shoulders reaching toward the
   floor as the shoulder blades protract. Neck neutral, feet flat.
2. Initiation. Arms still straight. Both shoulder blades retract and depress,
   lifting the dumbbells a few centimetres. The chest stays pressed to the pad.
3. Early pull. Elbows bent to roughly 130 degrees, travelling up and back close
   to the ribs, dumbbells rising alongside the bench.
4. End position, highest point. Dumbbells drawn to the sides of the lower ribs,
   elbows bent to roughly 45 degrees and behind the torso line, both shoulder
   blades fully retracted and depressed, wrists straight, chest still in full
   contact with the pad and no lift of the ribcage off the bench.
5. Controlled descent, halfway. Elbows opening back toward 130 degrees, dumbbells
   lowering along the same path, shoulder blades beginning to release.
6. Return to the start, identical to frame 1. Arms fully extended toward the
   floor, shoulders reaching down under control, chest still on the pad.

TECHNIQUE — must be correct in every frame:
- The chest stays in contact with the pad for the entire rep — no pushing off it.
- Shoulder blades retract and depress before the elbows bend.
- Elbows travel back along the ribs, not out to the sides.
- Both dumbbells move symmetrically and finish level with each other.
- The neck stays neutral and the head never cranes forward over the bench.
- Both feet stay flat on the ground with the knees softly bent.
```

## Form checkpoints (QA)

- [ ] Chest in contact with the incline pad in all six frames
- [ ] Bench angle identical in every frame at roughly 30 degrees
- [ ] Both arms symmetric — dumbbells level at the top
- [ ] Frame 2 shows scapular retraction with the arms still straight
- [ ] Distinguishable at a glance from the seated machine row asset
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as a chest-supported row at 64 px wide
