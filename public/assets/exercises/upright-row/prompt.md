# Upright Row — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `upright-row` |
| Category | Shoulder Variants |
| Camera | `front` |
| Frames | 4 |
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
Exercise: Upright Row
Camera: front view, because the frontal plane carries all of the information
in this movement — the vertical bar path and the outward flare of the elbows.
Equipment: long brushed chrome bar with matte black bumper plates, evenly
loaded both sides, held with a narrow overhand grip, hands inside shoulder
width and roughly a fist-width apart, knuckles facing forward.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start position. Standing tall, feet hip-width and flat, the bar hanging at
   arm's length against the front of the thighs, narrow overhand grip, arms
   straight but not locked, shoulders down and back, ribs down, gaze forward.
2. Early pull. The bar has risen vertically to just below navel height,
   grazing the torso. The elbows bend and flare out and up to the sides,
   already clearly higher than the hands. Wrists stay neutral, the bar stays
   horizontal, torso upright and still.
3. Top position. The bar is at upper-chest height, just below the
   collarbones — NOT at chin height. It stays close against the torso. The
   elbows point up and out to the sides, clearly above the hands, upper arms
   just below parallel with the ground. Wrists neutral, not curled. The
   shoulders stay down away from the ears.
4. Controlled lowering. The bar descends vertically along the same close path,
   now at roughly waist height, elbows still leading above the hands as the
   arms straighten, torso upright and motionless.

TECHNIQUE — must be correct in every frame:
- The bar travels straight up and down, staying close against the torso the
  whole rep — it never drifts forward away from the body.
- The elbows lead the movement and stay above the hands in every frame where
  the arms are bent.
- The top of the pull is upper-chest height, just below the collarbones —
  the bar never rises to chin or throat height.
- Wrists stay neutral and in line with the forearms — no curling or cocking
  of the wrists at the top.
- The torso stays upright and still; no leaning back, no hip drive, no calf
  raise to throw the bar up.
- The bar stays perfectly horizontal in every frame — both sides at the same
  height.
```

## Form checkpoints (QA)

- [ ] Top frame stops at upper-chest height, below the collarbones — never chin height
- [ ] Elbows clearly above the hands in every bent-arm frame
- [ ] Bar close to the torso through the whole rep, no forward drift
- [ ] Bar horizontal and grip narrow — hands inside shoulder width
- [ ] Wrists neutral, not curled, at the top
- [ ] Torso upright and still — no lean-back or hip drive
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] Readable as an upright row at 64 px wide
