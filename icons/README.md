# Storvv icons

Every icon in the app comes from here. Components import them by their Lucide names from `~/icons`
(`import { Plus, Store } from '~/icons'`), so the props are the same as Lucide's: `size`,
`stroke-width`, `color`, `absolute-stroke-width`, plus any class.

- `geometry.ts`: shared shapes (`circle`, `rrect`, `leaf`, `dot`) and the part type.
- `sets/*.ts`: the drawings, grouped by theme, keyed by Lucide name.
- `index.ts`: turns each drawing into a component.
- Preview a set next to the Lucide original: `node scripts/icons/preview.mjs <set> [Name ...]`
  writes `scripts/icons/out/<set>.png`. The dev gallery is at `/dev/icons`.

## Style

**Grid.** 24 × 24 viewBox. Keep drawings inside 2.5–21.5; most sit in 3–21. Optical sizes: a
circle about r 9, a square about 17 × 17, a wide card about 18 × 14. Centre everything on 12, 12
unless the shape needs to sit low (bags, bins) or high (pins).

**Stroke.** The component strokes every untinted part, with round caps and joins. Callers choose
the width (the app uses 1.5 to 2), so draw geometry only and leave `width` unset. A detail that
must stay thinner (tiny text lines inside a receipt) may use `width: 1.3`, but rarely. Leave a 2px
gap between parallel strokes so nothing clogs at 16px. Avoid detail under 1.5 units.

**The leaf corner (house signature).** The Storvv mark is two leaves, each with one big rounded
corner. Containers — cards, screens, phones, boxes, bubbles, folders, documents, tags — use
`leaf(x, y, w, h, big, small)`: big radius top-left and bottom-right, small radius on the other two.
For a container about 18 wide, use big 4.5 and small 1.6. For about 12 wide, use 3.5 and 1.4.
When a shape can't be a rectangle (a speech bubble tail, a shield, a tag), carry the same idea:
one generous curve and one tight one, on opposite corners. Round shapes (coins, clocks, user heads)
stay round.

**Two tones.** Colour is always `currentColor`.
- `tone: 'soft'` (0.14 tint) fills the body of an object, usually with `outline: true`, so the
  object reads as a solid thing.
- `tone: 'fill'` (0.3 tint) marks the one part that matters: the screen of a phone, the flap of a
  parcel, the lid of a box, the head of a user, the bar that is rising.
- An icon gets at most one soft part and one fill part. Put toned parts first and outlines last.
- **Glyphs stay pure strokes, with no tints:** arrows, chevrons, check, x, plus, minus, menu,
  ellipsis, refresh, sort, filter lines, play/pause, loader. Glyphs on a container — circle-check,
  circle-x, circle-plus, alert badges — get a soft-tinted container and a plain stroked glyph.

**Glyph proportions.**
- Plus and minus arms run 6 to 18.
- X runs 7 to 17.
- Chevrons are 5.5 deep on a 5.5 half-height (`m10 6.5 5.5 5.5-5.5 5.5`).
- Arrow heads are open, 4.5 long, with the shaft running 5 to 19.
- Check is `m5.5 12.6 4.1 4.1L18.6 7.4`.
- Inside a circle, shrink glyphs to about 60%.

**Meaning first.** Keep what Lucide's version means, so nobody has to relearn the app: a bin is
still a bin. Change the drawing, not the idea. Simplify where Lucide is fussy. Each icon must read
at 16px in one glance.

**Families match.** Variants share the exact base geometry:
- Package / PackagePlus / PackageX / PackageCheck / PackageMinus / PackageSearch share one box.
- Folder* share one folder.
- User* share one head and shoulders.
- Circle* share one circle.
- Chart* share one baseline.

For badges such as + − × ✓ added to a base, draw them in the bottom-right quadrant, centred near
(17.5, 17.5), and cut the base back so strokes don't touch.
