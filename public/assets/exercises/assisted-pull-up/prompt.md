# Assisted Pull-up — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `assisted-pull-up` |
| Category | Back / Pull |
| Camera | `side` |
| Frames | 6 |
| Equipment | Pull-up bar + long elastic assistance band |
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
Exercise: Assisted Pull-up
Camera: side view, turned very slightly toward the viewer so the torso, the arm
angle, the bar and the assistance band all remain readable in every frame.
Equipment: simple straight chrome horizontal bar, supports out of frame, plus
one long matte near-black elastic assistance band looped over the middle of the
bar. The band hangs down in front of the body and the woman rests both shins in
its bottom loop with her knees bent behind her and her ankles together. The band
is the visual difference between this exercise and the unassisted pull-up and
must be clearly visible in all six frames.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Bottom of the hang. Both hands on the bar just wider than shoulder width,
   palms facing forward, arms fully extended, shoulders relaxed up toward the
   ears. Knees bent to roughly 90 degrees behind the body with both shins in the
   band loop, the band stretched long and thin under the load.
2. Scapular set. Arms still straight. Shoulder blades retract and depress, the
   chest lifts, the whole body rises slightly and the band shortens a little.
3. Early pull. Elbows bent to roughly 140 degrees driving down toward the ribs,
   chin still below the bar, the band visibly slackening as the body rises.
4. Top position, highest point. Chin clearly above the bar, elbows bent to
   roughly 45 degrees and tucked close to the sides, shoulder blades fully
   retracted and depressed, shins still in the loop, band now noticeably shorter
   and less stretched than in frame 1.
5. Controlled descent, halfway. Elbows opening back toward 140 degrees, chin
   just below the bar, band re-stretching, shoulders still held down.
6. Return to the bottom of the hang, identical to frame 1. Arms fully extended,
   band stretched long again, shins still in the loop.

TECHNIQUE — must be correct in every frame:
- The band assists but never bounces the body — the pull stays deliberate.
- Shoulder blades depress and retract before the elbows bend.
- The torso stays vertical, the knees stay behind the hips, the ankles stay
  together.
- Elbows track down toward the ribs rather than flaring wide.
- The band stays looped over the bar and under both shins in every frame.
- Ribs stay down and the pelvis stays under the shoulders.
```

## Form checkpoints (QA)

- [ ] Assistance band visible and correctly routed over the bar and under both shins in all six frames
- [ ] Band reads longer and thinner at the bottom, shorter at the top
- [ ] Frame 4 shows the chin clearly above the bar
- [ ] Knees stay bent behind the body — the feet never touch the ground line
- [ ] Distinguishable at a glance from the unassisted pull-up asset
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as an assisted pull-up at 64 px wide
