# Pull-up — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `pull-up` |
| Category | Back / Pull |
| Camera | `side` |
| Frames | 6 |
| Equipment | Pull-up bar |
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
Exercise: Pull-up
Camera: side view, turned very slightly toward the viewer so the torso, the arm
angle and the bar all remain readable in every frame.
Equipment: simple straight chrome horizontal bar, supports out of frame. The
bar sits high enough that both feet hang clear of the shared ground line in
every frame. No band, no platform, no assistance of any kind.
Number of frames: 6, evenly spaced left to right.

Frames:
1. Dead hang. Both hands on the bar just wider than shoulder width, palms facing
   forward, arms fully extended, shoulders relaxed up toward the ears, body
   hanging vertically, knees straight, ankles crossed loosely, feet clear of the
   ground.
2. Scapular set. Arms still straight. Shoulder blades retract and depress so the
   chest lifts and the whole body rises two or three centimetres with no elbow
   bend at all. Ribs stay stacked over the pelvis.
3. Early pull. Elbows bent to roughly 140 degrees and driving down toward the
   ribs. Chin still below the bar, chest opening upward, a slight backward lean
   through the upper back.
4. Top position, highest point. Chin clearly above the bar, elbows bent to
   roughly 45 degrees and tucked close to the sides, shoulder blades fully
   retracted and depressed, chest travelling toward the bar, pelvis directly
   under the shoulders with no swing, legs still straight and together.
5. Controlled descent, halfway. Elbows opening back toward 140 degrees, chin
   just below the bar, shoulders still held down, body still vertical.
6. Return to a full dead hang, identical to frame 1. Elbows fully extended,
   shoulders allowed to rise under control, feet still clear of the ground.

TECHNIQUE — must be correct in every frame:
- The body stays vertical — no kipping, no hip swing, no leg drive.
- Shoulder blades depress and retract before the elbows bend.
- The chin passes above the bar at the top with the neck neutral, not craned.
- Elbows track down toward the ribs rather than flaring wide.
- Ribs stay down and the pelvis stays under the shoulders — no lumbar extension.
- Both feet stay clear of the ground line in every frame.
```

## Form checkpoints (QA)

- [ ] Frame 4 shows the chin clearly above the bar with a neutral neck
- [ ] Frame 2 shows scapular depression with the arms still straight
- [ ] Body stays vertical in all six frames — no kip or swing
- [ ] Feet clear of the ground in all six frames
- [ ] No band, platform, or assistance of any kind visible
- [ ] Same face, hair, wardrobe, and body proportions in all six frames
- [ ] Readable as a pull-up at 64 px wide
