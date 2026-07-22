# App icon — Round 2 final mark (direction C2)

| Field | Value |
|---|---|
| Asset | App icon mark — alpha master |
| Picked | C2 — "23" display-serif monogram + cream superscript "%" (owner pick, 2026-07-22) |
| Canvas | 1024×1024 on flat chroma `#FF00FF` |
| Inks | Amber `#D9A048` digits, cream `#F2E8D8` percent sign |
| Output | `mark-magenta.png` (source) → chroma extraction → `mark-alpha.png` (straight-alpha handoff to dev) |
| Status | `generated` — pending owner review of the alpha master |

> Anchor: the C2 tile cropped from `concept-round1.png` is attached at
> generation time. The mark is redrawn at high resolution; the tile's
> near-black background and rounded square are NOT reproduced.

## Prompt

```text
Create one square 1024x1024 image containing a single flat vector logo mark,
perfectly centered, on a completely uniform flat solid chroma-key magenta
#FF00FF background. The magenta is ONLY the background: no magenta, pink, or
purple may appear anywhere in the mark itself. No rounded-square tile, no
dark panel, no frame, no border — the mark floats alone on flat magenta.

THE MARK — reproduce the attached reference mark exactly, redrawn crisply at
high resolution: the number "23" set large in an elegant high-contrast
display serif typeface (soft wedge serifs, generous curves, strong
thick-thin stroke contrast, in the spirit of the attached reference),
solid warm amber #D9A048, the two digits tightly kerned so they almost
touch, confident like a jersey number. At the upper right of the "3", a
small percent sign "%" as a superscript, solid soft cream #F2E8D8, drawn in
the same serif spirit, its top roughly aligned with the top of the digits.

PROPORTIONS: the complete mark (digits plus percent sign) spans roughly 70%
of the canvas width, centered horizontally and vertically, with generous
even magenta margin on all sides. Nothing touches the canvas edge.

STYLE: flat solid vector shapes only. Exactly two colors in the mark: amber
#D9A048 and cream #F2E8D8. No gradients, no shading, no bevels, no
outlines, no drop shadow, no glow, no halo of any kind — the mark's edges
end crisply with pure flat magenta touching them directly.

STRICTLY EXCLUDE: any letters or words, any numerals other than "23", any
symbols other than the single "%", tiles or panels or backgrounds other
than flat #FF00FF, gradients, shadows, glows, outlines, texture, noise,
watermarks, captions, magenta or pink or purple tones inside the mark.
```

## Gate (advisory — owner's eyeball is the acceptance gate)

- [ ] Mark matches the picked C2 tile: same serif spirit, kerning, % placement
- [ ] Flat #FF00FF background edge to edge; zero magenta inside the mark
- [ ] Exactly two inks: amber digits, cream %
- [ ] No shadow/glow/halo — crisp edges against pure magenta
- [ ] Chroma QA: zero opaque near-magenta, zero fringe after extraction
- [ ] Alpha master is straight-alpha, tight-cropped, RGB alpha-bled under transparency
