# 90/90 Breathing — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `ninety-ninety-breathing` |
| Category | Warm-up / Activation |
| Camera | `floor-side` |
| Frames | 2 |
| Equipment | Bodyweight + low bench — she lies supine on the ground with her lower legs (calves) resting flat on the bench pad, hips and knees each near 90 degrees |
| Status | `shipped — attempt 1/2 of the gpt-image-2 corrective pass, 27 Aug` |

> Style-block gate (answered 27 Aug): `dead-bug`/`glute-bridge` prove a
> genuinely supine bodyweight figure renders correctly; `hip-thrust` and the
> flat-bench presses prove a flat bench renders correctly as a body-adjacent
> support surface. This combines the two — supine, calves resting ON a
> bench — with no direct precedent, so the calf-to-bench contact is stated
> explicitly rather than assumed, per the wall lineage's rule that contact
> is always stated, never assumed.
>
> **Renderer note — read before re-running this prompt.** The shipped
> `reference.png` was NOT produced by this pipeline's default route. It was
> rendered with the Responses API `image_generation` tool's `model` field
> set by hand to `gpt-image-2` (Sol kept as the orchestrator), a parameter
> `scripts/generate-via-sol.mjs` does not expose and has never set — every
> other asset in this library used the tool's unstated default (evidence
> suggests `gpt-image-1`-generation, never confirmed). Running
> `generate-via-sol.mjs` against this prompt as it stands will NOT reproduce
> this image; it will render on the default model, which failed this exact
> pose 4/4 times (see history below). Reproducing this asset requires the
> same explicit `model: 'gpt-image-2'` override, not currently wired into
> any committed script.
>
> **History — 4 failed attempts, then the fix, 27 Aug.** The first 3
> attempts (default renderer) and a 4th (gpt-image-2, but with the frame-1
> wording below) all rendered her hips lifted into a hip-thrust/glute-bridge
> silhouette instead of the prescribed flat-supine, only-calves-elevated
> position — this held across a capitalized anti-bridge prohibition
> (attempt 2), a concrete geometric anchor to `dead-bug`'s starting position
> (attempt 3), and a renderer swap alone (attempt 4), so the flatness
> wording itself was not the defect. **Root cause, found by comparing the
> two frames of the gpt-image-2 attempt against each other**: frame 1 alone
> additionally described an action — "one hand is lightly guiding a
> shin/ankle into place on the pad" — that frame 2 never had. A reaching
> hand in an otherwise-supine pose appears to override the flatness
> instruction regardless of how forcefully that instruction is stated
> elsewhere; frame 2, with no such action, rendered correctly every time.
> The fix (this prompt, attempt 1 of a 2-attempt cap) removed the action
> rather than strengthening the wording again: both frames now use frame
> 2's already-proven hand position (flat on the ribs from the start) and
> leg position (calves already settled on the bench), differentiated only
> by breath phase. Passed clean on the first try. **Lesson for the next
> supine or floor pose in this library: audit every distinct action a
> frame's prose describes for whether it independently cues an unwanted
> pose archetype — restating the target position harder does not neutralize
> a competing action cue.**

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

CRITICAL, explicit anti-bridge instruction (do not assume — state it, and it
applies IDENTICALLY to BOTH frames with zero exception): her torso, from the
back of her head down through her shoulder blades, spine, and all the way to
her hips and glutes, lies COMPLETELY FLAT AND STRAIGHT along the ground, like
someone lying flat on a yoga mat to rest — it is a single flat line with NO
arch, NO incline, and NO ramp shape rising up toward her feet. Her hips are
at the exact same low height above the ground as the back of her head, and
her buttocks and lower back stay in continuous contact with the ground. This
is NOT a hip thrust or glute bridge, and her silhouette must NOT read as one:
her hips, glutes and lower back are NEVER lifted, raised, or bridged into the
air, in either frame — not even slightly, not even in a frame described as
"beginning" or "starting" the hold. There is no moment in this movement where
her hips rise off the ground; the hold begins and stays flat throughout.

Use the SAME lying-down hip and knee geometry as the dead-bug exercise's
starting position — hips and knees each bent to roughly 90 degrees, thighs
vertical straight up from the hip, exactly as if she were doing a dead-bug
with her back flat on the ground and her shins parallel to the ground,
knees stacked directly over her hips. The ONLY difference from that dead-bug
starting position is that here her shins, instead of floating in the air,
continue that same horizontal line a little further out to rest flat on top
of the bench. The bench is positioned at exactly the height and distance
needed to meet her shins where they naturally are in that dead-bug-style
position — her hips do not move or lift to reach it, and her legs do not
reposition at any point between frame 1 and frame 2: both calves are already
resting on the bench, in the identical place, in BOTH frames.
If her hips or lower back are off the ground, or her body forms an arched
bridge shape in EITHER frame, that is WRONG — redraw it with the torso flat
as described.

CRITICAL, explicit hand-position instruction (do not assume — state it, and
it applies IDENTICALLY to BOTH frames): both of her hands rest lightly flat
on her lower ribs and upper belly in BOTH frames — this is the ONLY hand
position used anywhere in this image. No hand ever reaches down toward her
knee, shin, ankle, or the bench in either frame. No hand ever rests on the
ground at her side. There is no frame in this image where she is adjusting,
guiding, or touching her legs or the bench with her hands — her legs are
already resting on the bench, fully settled, in both frames, and her hands
are already on her ribs, fully settled, in both frames. The two frames are
the SAME hold, at two different points in one slow breath cycle — they are
NOT an "adjusting into position" frame followed by a "settled" frame.

Number of frames: 2, evenly spaced left to right.
Both figures lie on the same shared invisible ground line as each other, at
exactly identical scale and spacing, each with her calves resting on her own
copy of the bench in the identical position and each with her hands already
resting on her ribs in the identical position — legs and hands do NOT move,
reposition, or change contact point between frame 1 and frame 2. The ONLY
things that change between the two frames are her breath phase (chest/belly
rise and fall) and her mouth/expression.

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
1. Beginning the hold, first slow breath in. The exact same flat-supine
   position as frame 2 — her ENTIRE TORSO FLAT ON THE GROUND FROM HEAD TO
   HIPS, no arch, no incline, hips at the same low height as her head, head
   resting down with a long neck. Both calves already rest flat along the
   top of the bench pad with the contact described above, hips and knees
   each at roughly 90 degrees, thighs vertical — identical leg position to
   frame 2. Both hands already rest lightly flat on her lower ribs and upper
   belly — identical hand position to frame 2, not reaching toward her legs
   or the bench. Mouth closed, gently drawing her first slow breath in,
   ribcage beginning to expand softly under her hands, calm and settled
   expression, eyes open.
2. Full hold, mid-exhale. The same flat supine position — her ENTIRE TORSO
   STILL FLAT ON THE GROUND FROM HEAD TO HIPS, exactly as in frame 1, hips
   at the same low height as her head, no arch, no bridge, no incline. Both
   calves rest flat along the top of the bench pad with the contact
   described above, hips and knees each at roughly 90 degrees, thighs
   vertical — identical leg position to frame 1. Both hands rest lightly
   flat on her lower ribs and upper belly, in the SAME position as frame 1,
   gently monitoring the breath. The ribcage reads visibly settled and drawn
   down rather than flared or lifted, a light natural belly rise under the
   hands, lips softly parted mid slow exhale, eyes open, calm and focused
   expression.

TECHNIQUE — must be correct in every frame:
- Her calves stay in direct contact with the bench pad's top surface along
  their full length in both frames — no gap, no magenta strip visible
  between calf and pad. Legs do not move or reposition between frames.
- Hips and knees each stay bent at roughly 90 degrees, thighs vertical, in
  both frames — the bench height is fixed, it does not change between
  frames.
- Her entire torso, from the back of her head to her hips, stays FLAT ON
  THE GROUND in a single straight line with no arch or incline, in BOTH
  frames without exception — her hips are never lifted, raised, or bridged
  into the air in either frame, including frame 1. This is a supine floor
  position, the same lying-flat torso as the dead-bug exercise, not a hip
  thrust or glute bridge — only her lower legs are elevated, resting on the
  bench.
- Both hands rest flat on her lower ribs/belly in BOTH frames — identical
  hand position in both frames. No hand reaches toward her legs, knees, or
  the bench in either frame.
- Frame 1 and frame 2 must still read as a clearly different pair at a
  glance, but ONLY via breath phase and expression, never via a body,
  hand, or leg position change: frame 1 shows the first breath in with the
  mouth closed and the chest just beginning to expand; frame 2 shows a
  deeper mid-exhale moment with the mouth softly parted and the ribcage
  visibly drawn down.
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
- [ ] Both hands rest flat on the ribs/belly in both frames — identical
      hand position throughout, never reaching toward the legs or bench
- [ ] Frame 1 and frame 2 differ only by breath phase and expression (mouth
      closed vs. softly parted, chest beginning to expand vs. ribcage drawn
      down) — no change in hand, leg, or torso position between frames
- [ ] Lower back and hips rest flat on the ground in BOTH frames, including
      frame 1 — no arch, no incline, no bridge, at any point
- [ ] Both feet fully visible past the bench's far edge in both frames
- [ ] No wall, dumbbell, band, or any other equipment anywhere in the image
- [ ] Same face, hair, wardrobe, and body proportions in both frames
- [ ] Both figures identical scale on one shared ground line
- [ ] Readable as a supine breathing drill with legs on a bench at 64 px
      wide
