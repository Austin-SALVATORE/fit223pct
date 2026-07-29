# Half-Kneeling Hip Flexor Stretch — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `half-kneeling-hip-flexor-stretch` |
| Category | Recovery Stretch |
| Camera | `side` |
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
scale, evenly spaced with clear background gaps between them. No figure overlaps,
touches, or is cropped by another. The entire body is visible in every frame,
including both feet. Generous background margin above and below. Eye-level camera at
an identical angle and distance for every frame.

STRICTLY EXCLUDE:
Text, numbers, labels, captions, arrows, motion lines, panel borders, dividing
lines, grids, watermarks, logos, background objects, mirrors, other people,
extra or missing limbs, distorted hands, any magenta on the figure, clothing or equipment, drop shadows or glow halos around the figure, broken or hyperextended joints.

MOVEMENT FOR THIS IMAGE:
Exercise: Half-Kneeling Hip Flexor Stretch (left side — the left knee is
down and the left hip flexor is stretched; the right-side repeat reuses
this same illustration, named by the app's on-screen heading rather than
mirrored art).
Camera: side view, the body seen close to full profile so the pelvis tilt
and the forward hip shift are clearly readable.
Equipment: none — bodyweight only.
Number of frames: 2, evenly spaced left to right.
Both figures kneel on the same shared invisible ground line as each other,
at exactly identical scale and spacing.

Frames:
1. Entry position, half-kneeling — pelvis neutral, no posterior tilt at
   all, weight centered. This is the position before the stretch starts.
   Left knee down on the ground, left shin and the top of the left foot
   resting on the ground behind the body. Right foot planted flat on the
   ground well in front; the right (front) SHIN IS VERTICAL — perpendicular
   to the ground, the knee stacked directly above the ankle. Torso stacked
   upright directly over the hips, spine long, pelvis level and neutral.
   Weight is centered evenly between the two contact points: the rear
   (left) knee on the ground and the front (right) foot. Hands resting
   lightly on the front right thigh.
2. Full hold — the stretch itself. Pelvis visibly tucked (a clear
   posterior tilt). Weight has shifted forward onto the front (right)
   foot, and the front (right) SHIN IS NOW ANGLED FORWARD from vertical —
   the knee has moved forward, past where it was stacked over the ankle in
   frame 1. Torso stays upright — it is the pelvis and hip joint that
   change angle here, not the spine bending forward. Left knee stays down
   on the ground. Hands still resting lightly on the front right thigh.

CRITICAL — read before generating: frame 1 and frame 2 show the SAME
WOMAN IN THE SAME OVERALL POSITION on the canvas, exactly like every
other two-frame illustration in this library — she occupies the same
relative space within her own frame in both images, not shifted, slid, or
relocated sideways between them. The entire difference between the two
frames is a change in JOINT ANGLES on a figure that stays where she is:
the front shin's angle (vertical, then angled forward), the pelvis's tilt
(neutral, then tucked), the hip joint's extension. It is NOT a change in
where the figure sits or is cropped on the canvas. If you overlay the two
frames, the joints must land in different places relative to each other —
not the same pose simply moved sideways as a whole.

TECHNIQUE — must be correct in every frame:
- The two frames differ in JOINT ANGLES — front shin angle, pelvis tilt,
  hip extension — never in where the figure is positioned on the canvas.
  A version where frame 2 is frame 1's identical pose shifted or slid to
  a different spot on the canvas is wrong, even if the two frames look
  different as a result of that shift.
- Frame 1's front shin is VERTICAL, knee stacked directly over the ankle.
  Frame 2's front shin is ANGLED FORWARD, knee moved forward of the ankle.
- The pelvis is neutral, untucked in frame 1, and visibly tucked
  (posterior tilt) in frame 2.
- The torso stays upright in both frames — the stretch deepens through the
  pelvis/hip angle change, not through leaning the chest forward.
- The rear (left) knee stays on the ground in the same place in both
  frames.
```

## Form checkpoints (QA)

- [ ] Frame 1's front shin is VERTICAL, knee stacked directly over the
      ankle; pelvis neutral, untucked
- [ ] Frame 2's front shin is ANGLED FORWARD of vertical, knee moved
      forward of the ankle; pelvis visibly tucked
- [ ] The two frames differ in JOINT ANGLES (shin angle, pelvis tilt), NOT
      in where the figure sits on the canvas — she occupies the same
      relative position within her own frame in both images; overlaying
      the two should show the joints in different places, not the same
      pose shifted sideways
- [ ] Torso stays upright in both frames — no forward lean substituting for
      the hip shift
- [ ] No wall, bench, band, dumbbell, or block anywhere in either frame
- [ ] Same face, hair, wardrobe, and body proportions in both frames
- [ ] Both figures identical scale on one shared ground line
- [ ] Readable as a half-kneeling hip flexor stretch at 64 px wide
