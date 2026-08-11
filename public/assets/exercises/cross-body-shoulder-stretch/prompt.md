# Cross-Body Shoulder Stretch — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `cross-body-shoulder-stretch` |
| Category | Recovery Stretch |
| Camera | `front` |
| Frames | 2 |
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
scale. Each pose occupies its own exclusive vertical band running the full
height of the image: a wide column of solid background magenta separates it
from every neighboring pose on both sides, and no part of any pose —
including hands, feet, or equipment — may share a horizontal (left-right)
position with any part of another pose, even when the two sit at different
heights. A straight vertical line drawn anywhere in a gap must be able to
pass from the top of the image to the bottom without touching either
neighboring pose. No figure overlaps, touches, or is cropped by another. The
entire body is visible in every frame, including both feet. Generous
background margin above and below. Eye-level camera at an identical angle and
distance for every frame.

STRICTLY EXCLUDE:
Text, numbers, labels, captions, arrows, motion lines, panel borders, dividing
lines, grids, watermarks, logos, background objects, mirrors, other people,
extra or missing limbs, distorted hands, any magenta on the figure, clothing or equipment, drop shadows or glow halos around the figure, broken or hyperextended joints.

MOVEMENT FOR THIS IMAGE:
Exercise: Cross-Body Shoulder Stretch (left side — the left arm is the one
drawn across the chest and the left shoulder is stretched; the right-side
repeat reuses this same illustration, named by the app's on-screen heading
rather than mirrored art).
Camera: front view, facing the viewer, so the arm sweeping across the
frontal plane and the assisting hand's grip both read clearly.
Equipment: none — bodyweight only.
Number of frames: 2, evenly spaced left to right.
Both figures stand on the same shared invisible ground line as each other, at
exactly identical scale and spacing.

This pair MUST show a large, unmistakable difference in the RIGHT arm's
position — not a subtle change in grip pressure. In frame 1 the right arm
is down and uninvolved; in frame 2 it has traveled all the way up and
across to grip the left elbow. If the right arm looks like it is already
up near the left elbow in frame 1, that is wrong — start it low.

Frames:
1. Entry position, right arm NOT YET involved. Standing tall facing the
   viewer, feet hip-width apart. LEFT arm already extended straight across
   the front of the chest at roughly shoulder height, elbow softly bent.
   RIGHT arm hangs DOWN, relaxed at her side, well below shoulder height,
   not touching the left arm at all — a large, visible gap between the
   right hand and the left elbow. Shoulders level, torso facing forward.
2. Full hold, right arm fully raised and gripping. The RIGHT arm has
   traveled all the way up from her side, elbow bent, right hand now hooked
   firmly around the LEFT upper arm just above the elbow, actively pulling
   it further across the body and in toward the chest. The left shoulder
   visibly relaxes down and away from the ear as the stretch deepens. Torso
   stays facing forward, square to the viewer — the pull comes from the
   right arm and hand, not from twisting the torso.

TECHNIQUE — must be correct in every frame:
- The right arm's position is the core difference between the two frames:
  DOWN at her side in frame 1, fully raised and gripping the left elbow in
  frame 2 — a large, unmistakable change in the right arm's height and
  position, not a subtle grip-pressure adjustment.
- The left arm stays at roughly shoulder height and crosses the body
  horizontally in both frames — it does not drop or rise between frames.
- The right hand grips above the left elbow, on the upper arm, never at the
  wrist or forearm, once it arrives there in frame 2.
- The torso stays square to the viewer in both frames — the deepening pull
  in frame 2 comes from the right arm drawing the left arm in, not from
  rotating the shoulders or twisting the spine.
- The left shoulder stays down, away from the ear, in both frames,
  especially in the deeper hold of frame 2.
- Feet stay planted and hip-width apart in both frames.
```

## Form checkpoints (QA)

- [ ] Frame 1 and frame 2 read as clearly, unmistakably different at a
      glance — the right arm is DOWN at her side in frame 1, fully raised
      and gripping in frame 2 (regenerated 11 Aug: attempt 1 rendered both
      frames as near-duplicates with the right arm already at the elbow in
      frame 1 — this is the defect being corrected)
- [ ] Left arm stays at roughly shoulder height, crossing the body
      horizontally, in both frames
- [ ] Right hand grips above the left elbow, on the upper arm — never the
      wrist or forearm
- [ ] Torso stays square to the viewer in both frames — the deeper pull in
      frame 2 comes from the right arm, not from twisting the spine
- [ ] Left shoulder stays down, away from the ear, in both frames
- [ ] No wall, bench, band, dumbbell, or block anywhere in either frame
- [ ] Same face, hair, wardrobe, and body proportions in both frames
- [ ] Both figures identical scale on one shared ground line
- [ ] Readable as a cross-body shoulder stretch at 64 px wide
