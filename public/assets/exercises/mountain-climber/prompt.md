# Mountain Climber — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `mountain-climber` |
| Category | Core |
| Camera | `floor-side` |
| Frames | 2 |
| Equipment | none — bodyweight only |
| Status | `planned` |

## Provenance (21 Oct 2026)

Generated with `gpt-image-2.5-sunburst` through the Images edits endpoint, called directly with no orchestrator. Reference image: `goblet-squat/reference.png`. Size 1536x1024, quality `max` (the highest tier documented for this model). Candidate 3 of 3 from one concurrent run of 15 requests (median 71.6 s per image). The Images API response names no snapshot, so the model is recorded as requested. Two-frame strip by the owner's ruling of 21 Oct ("Two-frame strips"). Depicts ONE side only: half of one repetition; the athlete alternates legs in practice. Owner ruling of 21 Oct 15:52 ("one side only, two frames"). The generation prompt contains no alternation wording by design.

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
Exercise: Mountain Climber
Camera: floor-side view, turned very slightly toward the viewer so that the near and far legs stay separable in both frames.
Equipment: none — bodyweight only. She is on the bare ground line: no bench, no mat or mat edge drawn as an object, no dumbbells, no bar, no props of any kind.
Number of frames: 2, evenly spaced left to right.
Both figures are on the same shared invisible ground line, at exactly identical scale, each facing the right of its frame (head toward the right, feet toward the left).
FRAMING FOR THIS STRIP: draw EXACTLY 2 figures: one figure in the left half of the image and one figure in the right half, at exactly the same scale, each fully visible, with a wide empty magenta gutter between them. Leave a clear empty magenta margin of at least 8 percent of the image width around each figure, including at the far left edge and at the far right edge: no hand, foot, hair or any other part of either figure may touch or be cut off by the left, right, top or bottom edge of the image.

Frames:
1. Start position, high plank. Hands flat on the ground directly under the shoulders, arms straight but not locked, both feet back on the balls of the feet, hip-width apart. One straight line runs from the head through the shoulders and hips to the heels, hips neither sagging nor piked. Core braced, neck long, gaze at the ground a little in front of the hands.
2. Knee drive. The RIGHT knee is driven forward in under the chest, the right hip and knee bent sharply, the right foot lifted well clear of the ground with the toes off the floor. The LEFT leg stays straight and planted, extended back on the ball of the left foot. Hands and shoulders unchanged from frame 1: arms straight, shoulders directly over the wrists. Hips stay level with the shoulders, neither piked up nor sagging. Head neutral, gaze at the ground.

TECHNIQUE — must be correct in every frame:
- The shoulders stay stacked directly over the hands and the arms stay straight in both frames.
- The hip line stays level with the shoulders — no piking the hips up and no letting the lower back sag down.
- Only the one knee moves forward; both hands and the planted foot stay still.
- The trunk stays braced and flat, with no twisting of the hips as the knee drives in.
- The neck stays in line with the spine and the gaze stays down.
- Same camera angle, scale and ground line in both frames.
```

## Form checkpoints (QA)

- [ ] Shows ONE side only (one knee driven in, the other leg planted) — half of one repetition; the athlete alternates legs in practice
- [ ] Frame 1: true high plank, hands under shoulders, one straight line head to heels, both feet back
- [ ] Frame 2: one knee driven in under the chest with the foot clear of the ground; the other leg straight and planted on the ball of the foot
- [ ] Hip line level with the shoulders in both frames — no pike, no sag; arms straight, shoulders stacked over the wrists
- [ ] Frames 1 and 2 clearly differ in leg configuration (not a subtle tilt)
- [ ] Same face, hair, wardrobe, and body proportions in both frames; same scale on one ground line
- [ ] No bench, mat edge, dumbbells, bar or other equipment drawn; nothing touches or is cut off by an image edge
- [ ] Readable as a mountain climber at 64 px wide
