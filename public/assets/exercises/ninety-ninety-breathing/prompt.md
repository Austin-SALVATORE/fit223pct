# 90/90 Breathing — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `ninety-ninety-breathing` |
| Category | Warm-up / Activation |
| Camera | `floor-side` |
| Frames | 2 |
| Equipment | Bodyweight + low bench — she lies supine on the ground with her lower legs (calves) resting flat on the bench pad, hips and knees each near 90 degrees |
| Status | `hard-negative — do not re-attempt without a new strategy` |

> Style-block gate (answered 27 Aug): `dead-bug`/`glute-bridge` prove a
> genuinely supine bodyweight figure renders correctly; `hip-thrust` and the
> flat-bench presses prove a flat bench renders correctly as a body-adjacent
> support surface. This combines the two — supine, calves resting ON a
> bench — with no direct precedent, so the calf-to-bench contact is stated
> explicitly rather than assumed, per the wall lineage's rule that contact
> is always stated, never assumed.
>
> **Hard negative, 27 Aug — 3 attempts, all rejected, all the same defect.**
> Every attempt rendered her hips lifted into a hip-thrust/glute-bridge
> silhouette instead of the prescribed flat-supine, only-calves-elevated
> position, despite two materially different correction strategies between
> attempts: attempt 2 added an explicit, capitalized anti-bridge prohibition
> ("hips and lower back stay flat on the ground... never lifted... NOT a hip
> thrust or glute bridge") — no change. Attempt 3 replaced that with a
> concrete geometric anchor to the shipped `dead-bug` starting position
> ("use the SAME lying-down hip and knee geometry as dead-bug's starting
> position... the ONLY difference is the shins continue to rest on a bench")
> — still identical defect. The committed `reference.png` in this directory
> (gitignored, not shipped) is attempt 3, kept as evidence, not source for
> conversion — it was never run through `convert-assets.mjs` and carries no
> manifest entry. Same failure shape as `bicycle-crunch`/`mountain-climber`'s
> alternating-limb collapse: a pose class the current image route cannot
> reliably produce. Left in `KNOWN_MISSING`
> (`src/lib/exerciseAsset.coverage.test.ts`) pending the same open owner
> decision on an alternate image model those two ids are waiting on.

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
Exercise: 90/90 Breathing
Camera: floor-side view, turned very slightly toward the viewer so both legs
read as resting together on the bench rather than overlapping into a single
silhouette.
Equipment: one matte black padded bench on a simple black steel frame — the
same ordinary flat bench used elsewhere in this library (the same one a
dumbbell bench press or hip thrust would use), NOT an unusually short or
low one. It is positioned perpendicular to her body, its near long edge a
short distance beyond her hips, at ordinary bench-seat height — roughly the
height of her own shin length above the ground. There is no dumbbell, band,
wall, or any other equipment in the image.

CRITICAL, explicit anti-bridge instruction (do not assume — state it): her
torso, from the back of her head down through her shoulder blades, spine,
and all the way to her hips and glutes, lies COMPLETELY FLAT AND STRAIGHT
along the ground, like someone lying flat on a yoga mat to rest — it is a
single flat line with NO arch, NO incline, and NO ramp shape rising up
toward her feet. Her hips are at the exact same low height above the ground
as the back of her head. This is NOT a hip thrust or glute bridge, and her
silhouette must NOT read as one: her hips, glutes and lower back are NEVER
lifted, raised, or bridged into the air, in either frame.

Use the SAME lying-down hip and knee geometry as the dead-bug exercise's
starting position — hips and knees each bent to roughly 90 degrees, thighs
vertical straight up from the hip, exactly as if she were doing a dead-bug
with her back flat on the ground and her shins parallel to the ground,
knees stacked directly over her hips. The ONLY difference from that dead-bug
starting position is that here her shins, instead of floating in the air,
continue that same horizontal line a little further out to rest flat on top
of the bench. The bench is positioned at exactly the height and distance
needed to meet her shins where they naturally are in that dead-bug-style
position — her hips do not move or lift to reach it.
If her hips or lower back are off the ground, or her body forms an arched
bridge shape, that is WRONG — redraw it with the torso flat as described.
Number of frames: 2, evenly spaced left to right.
Both figures lie on the same shared invisible ground line as each other, at
exactly identical scale and spacing, each with her calves resting on her own
copy of the bench.

CRITICAL, explicit contact instruction (do not assume — state it): her
calves are in DIRECT, CONTINUOUS PHYSICAL CONTACT with the top of the
bench's pad along their full length from the back of the knee to the
ankle — there is ZERO gap, and absolutely no strip of magenta background,
between the underside of her calves and the pad's surface, in both frames.
The bench pad's top edge and the silhouette of the underside of her calves
are the SAME LINE in the image: her legs begin exactly where the pad's flat
color ends, resting directly on it, the way a dumbbell or barbell touches
the surface it rests on elsewhere in this library. Her heels and ankles
extend a short distance past the bench's far edge so both feet remain fully
visible, relaxed, toes softly pointing, not gripping or flexing.

Frames:
1. Settling in. Lying flat on her back in the dead-bug-style starting
   geometry — her ENTIRE TORSO FLAT ON THE GROUND FROM HEAD TO HIPS, no
   arch, no incline, hips at the same low height as her head, head resting
   down with a long neck. Hips and knees bent, thighs vertical, shins
   horizontal, in the process of settling her lower legs onto the bench
   pad — one hand is lightly guiding a shin/ankle into place on the pad
   while the other arm rests on the ground at her side, torso still relaxed
   and not yet consciously braced.
2. Full hold, mid-exhale. The same flat supine position — her ENTIRE TORSO
   STILL FLAT ON THE GROUND FROM HEAD TO HIPS, exactly as in frame 1, hips
   at the same low height as her head, no arch, no bridge, no incline. Both
   calves rest flat along the top of the bench pad with the contact
   described above, hips and knees each at roughly 90 degrees, thighs
   vertical. Both hands now rest lightly flat on her lower ribs and upper
   belly, gently monitoring the breath. The ribcage reads visibly settled
   and drawn down rather than flared or lifted, a light natural belly rise
   under the hands, lips softly parted mid slow exhale, eyes open, calm
   and focused expression.

TECHNIQUE — must be correct in every frame:
- Her calves stay in direct contact with the bench pad's top surface along
  their full length in both frames — no gap, no magenta strip visible
  between calf and pad.
- Hips and knees each stay bent at roughly 90 degrees, thighs vertical, in
  both frames — the bench height is fixed, it does not change between
  frames.
- Her entire torso, from the back of her head to her hips, stays FLAT ON
  THE GROUND in a single straight line with no arch or incline, in both
  frames — her hips are never lifted, raised, or bridged into the air. This
  is a supine floor position, the same lying-flat torso as the dead-bug
  exercise, not a hip thrust or glute bridge — only her lower legs are
  elevated, resting on the bench.
- Frame 1 and frame 2 must read as a clearly different pair at a glance:
  frame 1 shows one hand still adjusting a shin onto the bench with the
  other arm down at her side; frame 2 shows both hands resting flat on the
  ribs/belly with the legs already fully settled.
- In frame 2 the ribcage reads settled and drawn down, not flared upward,
  and the mouth is softly open mid-exhale rather than closed and neutral.
- Both feet remain fully visible past the bench's far edge, relaxed, in
  both frames.
- The bench renders as a single low, matte black padded bench on a simple
  black steel frame — no other equipment, no wall, anywhere in the image.
```

## Form checkpoints (QA)

- [ ] Her calves are in direct, continuous contact with the bench pad along
      their full length — zero gap or visible magenta strip between calf
      and pad, in both frames
- [ ] Hips and knees each read at roughly 90 degrees, thighs vertical, in
      both frames, on a bench of fixed, unchanging height
- [ ] Frame 1 clearly reads as still settling (one hand adjusting a shin,
      other arm at her side); frame 2 clearly reads as a fully settled hold
      with both hands resting on the ribs/belly — a genuine hand/limb
      configuration change, not a subtle tilt
- [ ] Frame 2's ribcage reads settled/drawn down, not flared, with lips
      softly parted mid-exhale
- [ ] Lower back rests naturally on the ground — no aggressive flattening
      or arching in either frame
- [ ] Both feet fully visible past the bench's far edge in both frames
- [ ] No wall, dumbbell, band, or any other equipment anywhere in the image
- [ ] Same face, hair, wardrobe, and body proportions in both frames
- [ ] Both figures identical scale on one shared ground line
- [ ] Readable as a supine breathing drill with legs on a bench at 64 px
      wide
