# T-Bar Row — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `t-bar-row` |
| Category | Back Variants |
| Camera | `side` |
| Frames | 6 |
| Equipment | T-bar row |
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
Exercise: T-Bar Row
Camera: side view, so the fixed hip hinge, the neutral spine and the vertical
path of the loaded end all stay readable.
Equipment: brushed chrome bar anchored to the ground at one end, matte black
plates and a simple black close-grip handle at the other. The anchored end
rests on the ground behind the woman; the bar runs forward between her feet so
the loaded end sits under her chest. She straddles the bar with one foot flat
on each side and holds the close-grip handle in both hands, palms facing each
other.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Start position. Straddling the bar, feet flat, knees softly bent, hips
   hinged so the torso inclines roughly 45 degrees, back flat, head in line
   with the spine. Both arms fully extended straight down holding the neutral
   close-grip handle, shoulder blades protracted, plates hanging just off the
   ground.
2. Initiation. Both arms still straight. The shoulder blades retract and
   depress — the shoulders pull back and down — before either elbow bends.
   Hinge angle unchanged.
3. Early pull. Both elbows bent to roughly 130 degrees, driving up and back
   close to the ribs, palms still facing each other, the loaded end rising
   toward the lower chest, hinge angle unchanged.
4. End position, deepest point. Handle drawn to the lower chest, both elbows
   bent to roughly 45 degrees and pointing up behind the torso line, shoulder
   blades fully retracted and depressed, chest proud, hinge angle still
   roughly 45 degrees, wrists straight.
5. Controlled lowering, halfway. Elbows opening back toward 130 degrees, the
   loaded end descending under control, shoulder blades beginning to protract.
6. Return to full stretch, identical to frame 1. Arms fully extended, plates
   hanging just off the ground, hinge angle and stance unchanged.

TECHNIQUE — must be correct in every frame:
- The hip hinge stays fixed at roughly 45 degrees — the torso never stands up
  to move the load.
- The spine stays neutral and flat, never rounded, including at full stretch.
- The shoulder blades retract and depress before the elbows bend.
- Palms face each other on the close neutral handle in every frame.
- Elbows track close to the ribs, not flared out to the sides.
- Both feet stay flat on the ground astride the bar and never move.
```

## Form checkpoints (QA)

- [ ] Straddling the bar with one foot flat on each side in all six frames
- [ ] Torso hinge angle identical in all six frames — no standing up on the pull
- [ ] Frame 2 shows scapular retraction with both arms still straight
- [ ] Spine neutral at full stretch — not rounded
- [ ] Distinguishable at a glance from the barbell row — the bar is anchored to
      the ground behind her and the grip is a close neutral handle
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as a hinged row at 64 px wide
