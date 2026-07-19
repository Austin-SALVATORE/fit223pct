# Cable Rear Delt Fly — image generation prompt

| Field | Value |
|---|---|
| Exercise id | `cable-rear-delt-fly` |
| Category | Shoulder Variants |
| Camera | `machine-three-quarter` |
| Frames | 4 |
| Equipment | Cable machine — pulley at shoulder height, single black handle |
| Status | `planned` |

> Near-duplicate cluster: this sits beside `rear-delt-fly` (hinged dumbbell
> version) and `face-pull` (rope, external rotation) and `rear-delt-machine`.
> This asset's differentiators are the upright torso, the single arm, and the
> horizontal cable pulled across the body. If the render does not show the arm
> sweeping across and away from the chest with a taut horizontal cable, it
> will be confused with its siblings.

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
Exercise: Cable Rear Delt Fly
Camera: machine three-quarter view, so the shoulder-height cable line and the
horizontal sweep of the working arm across and away from the body both stay
readable.
Equipment: matte black upright column, brushed chrome cable, simple black
handle, with the pulley set at shoulder height. The woman stands upright with
her left side toward the column, feet hip-width and flat in a slight stagger
for balance. Her right hand reaches across the front of her chest to hold the
handle, so the cable runs horizontally from her right hand to the pulley at
shoulder height. Her left hand rests lightly on her left hip.
Number of frames: 4, evenly spaced left to right.

Frames:
1. Start position. Torso tall and upright, the right arm reaching across the
   front of the chest, hand in front of the left shoulder at shoulder height
   holding the handle, palm facing down-and-in. The cable is taut and
   horizontal to the pulley. The right elbow is set at a soft fixed bend of
   about 15 degrees — this angle does not change at any point in the
   movement. Shoulders down, ribs down.
2. Mid sweep. The right arm has swept horizontally away from the chest and
   now points straight forward from the right shoulder, hand still at
   shoulder height, elbow angle unchanged, cable taut across the front of
   the body. The torso has not rotated.
3. End position. The right arm has swept fully out to the right side, level
   with the shoulders and a fraction behind the plane of the torso, the
   right shoulder blade fully retracted. The hand is still at shoulder
   height and the cable stretches taut across the chest to the pulley. The
   torso is still square and upright — all of the movement came from the
   shoulder.
4. Controlled return. The arm travels back along the same horizontal arc,
   now pointing forward again roughly as in frame 2, elbow bend still fixed,
   cable taut, torso unmoved.

TECHNIQUE — must be correct in every frame:
- The hand and the cable stay at shoulder height in every frame — the arc is
  horizontal, never a downward pull or an upward raise.
- The elbow angle is fixed at a soft bend and identical in all four frames —
  this is a fly, not a row, so the elbow never flexes to pull the handle in.
- The torso stays square, upright, and completely still; the sweep comes from
  the shoulder and the retracting shoulder blade, not from trunk rotation.
- At the end position the arm stops level with the shoulders, only a fraction
  behind the torso line — no exaggerated backswing.
- No shrugging — the shoulders stay down away from the ears throughout.
```

## Form checkpoints (QA)

- [ ] Hand and cable at shoulder height in all four frames — arc reads as horizontal
- [ ] Elbow bend fixed and identical throughout — reads as a fly, not a row or press
- [ ] Torso square and upright in every frame — no trunk rotation or lean
- [ ] End frame shows the arm level with the shoulders, shoulder blade retracted
- [ ] Only one working arm — the other hand stays on the hip in every frame
- [ ] Clearly distinct from the hinged dumbbell rear delt fly (upright torso, cable) and from the face pull (no rope, no elbow flexion)
- [ ] Same face, hair, wardrobe, and body proportions in all four frames
- [ ] Readable as a cable rear delt fly at 64 px wide
