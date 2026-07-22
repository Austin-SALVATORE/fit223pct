# Inverted Row — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `inverted-row` |
| Category | Back Variants |
| Camera | `side` |
| Frames | 6 |
| Equipment | Smith / press machine — bar racked low |
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
Exercise: Inverted Row
Camera: side view, so the rigid straight line of the body, the fixed bar height
and the path of the chest toward the bar all stay readable.
Equipment: matte black frame with chrome guide rails and simple black handles.
The chrome bar is racked and locked on the rails at hip height and never moves.
The woman lies supine on the ground line beneath the bar, gripping it overhand
with the hands slightly wider than the shoulders. Her legs are straight with
only the heels touching the ground, so the whole body hangs as one rigid
straight line from heels to shoulders, inclined at a shallow angle.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Start position. Hanging under the racked bar with both arms fully extended,
   overhand grip slightly wider than the shoulders, shoulder blades
   protracted. Body one rigid straight line from heels to shoulders, hips
   level, legs straight, only the heels on the ground, head neutral looking up
   at the bar.
2. Initiation. Arms still straight. The shoulder blades retract and depress —
   the chest lifts slightly toward the bar — before either elbow bends. The
   body line stays rigid and straight.
3. Early pull. Both elbows bent to roughly 130 degrees, driving down and back
   close to the ribs, chest rising toward the bar, hips rising exactly in line
   with the shoulders so the body stays one straight line.
4. Top position, deepest point. Mid-chest almost touching the bar, both elbows
   bent to roughly 45 degrees and pointing down behind the torso line,
   shoulder blades fully retracted and depressed, body still one rigid
   straight line from heels to shoulders — no sagging hips, no piked hips —
   wrists straight.
5. Controlled lowering, halfway. Elbows opening back toward 130 degrees, the
   body descending as one rigid line, shoulder blades beginning to protract.
6. Return to the full hang, identical to frame 1. Arms fully extended,
   shoulder blades protracted under control, heels still the only ground
   contact.

TECHNIQUE — must be correct in every frame:
- The bar stays locked at the same height on the rails — the body moves, the
  bar never does.
- The body forms one rigid straight line from heels to shoulders — the hips
  never sag toward the ground and never pike upward.
- Only the heels touch the ground; the legs stay straight.
- The shoulder blades retract and depress before the elbows bend.
- The chest, not the chin or the hips, travels toward the bar.
- The head stays neutral, in line with the spine.
```

## Form checkpoints (QA)

- [ ] Bar locked at identical height on the rails in all six frames
- [ ] Body one rigid straight line from heels to shoulders — no hip sag or
      pike in any frame
- [ ] Only the heels touch the ground, legs straight, in all six frames
- [ ] Frame 2 shows scapular retraction with both arms still straight
- [ ] Mid-chest meets the bar in the top frame, not the chin or the hips
- [ ] Distinguishable at a glance from the pull-up — the body is horizontal
      and the heels stay grounded
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as a horizontal bodyweight pull at 64 px wide
