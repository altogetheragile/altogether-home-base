# The Isometric Showcase

At the Sprint Review, the zoo is drawn from the corner: the same items, in the
same places, from the same state as the park view, in the shape a visitor
arriving at the gate would see.

It is **read-only on purpose**. The park is where a zoo is built - dragging,
drawing paths, resizing. This is where it is looked at. Keeping the two apart
means the Review gets its picture without the park view growing a projection
layer, back-to-front hit-testing and diamond drag maths.

## How it fits together

| File | What it does |
| --- | --- |
| `art/iso.ts` | The projection, and the geometry: ground patches, boxes, pitched roofs, wall panels, fence runs. |
| `art/isoArt.generated.ts` | Licensed props - fences, trees, hedges, benches, fountain, signpost, visitors. Generated. |
| `IsoZoo.tsx` | Reads the game state and puts the scene together. |
| `art/vehicleArt.generated.ts` | Licensed vehicles for the car park. Generated. |
| `scripts/extract-iso-art.mjs` | Cuts props out of a scene sheet. Hand-run; output committed. |
| `scripts/extract-vehicle-art.mjs` | Cuts vehicles out of an EPS sheet. Hand-run; output committed. |
| `scripts/lib/svg-clusters.mjs` | Finding drawings on a sheet that has no groups left. |
| `scripts/preview/iso-preview.tsx` | Renders a zoo with one of everything in it, to look at. |

The projection is true isometric: a world square becomes a diamond a little
under twice as wide as it is tall, which is the grid the props are drawn on.
World coordinates are the park's own design pixels, unchanged.

Everything is sorted by `depth()` - which is just `x + y` - and drawn back to
front. Get that wrong and a lion stands in front of the fence meant to be
holding it.

## Bought, and built

Two kinds of thing appear in the scene, and the split is deliberate:

- **Bought.** Anything organic or fiddly - trees, hedges, fences, benches, the
  fountain, the visitors - comes from a licensed sheet. Drawing these by hand
  goes badly.
- **Built.** Buildings are drawn from the item's own colours. A box with a
  pitched roof, a door and a window is a better kiosk than any single stock
  drawing, because it wears the colours the player chose.

Vehicles use the car park's own `CAR_HW`/`CAR_HH` footprints, so a car is drawn
at the size the visitors are already routing around.

## The car park

Eleven vehicles come from a licensed EPS sheet. They are all drawn facing one
way; mirroring an isometric drawing horizontally gives the other axis, which is
the pair the lot needs - cars nose up to the curb along one, coaches lie along
their lay-by on the other. Both rows of cars therefore face the same way, where
a real lot would have them nose to nose. At twelve pixels nobody can see it.

## Loading

The showcase is `lazy`-imported by the Sprint Review, so none of this artwork -
which is more than half of what the game weighs - is fetched until somebody
reaches a Review.

## Looking at it

Building a zoo by hand to see a change takes twenty minutes. Instead:

```
npx tsx --tsconfig tsconfig.app.json scripts/preview/iso-preview.tsx > /tmp/iso.html
```

That writes a standalone page holding a zoo with two habitats, four species
(one of them with no artwork, to exercise the fallback), two buildings, a
signpost, planting, paths and a full car park. Open it, or screenshot it.

## Sheets with no groups left

EPS is a page description, not a scene graph, so converting one to SVG loses
Illustrator's grouping: what arrives is a few thousand paths in a heap.

`scripts/lib/svg-clusters.mjs` handles this two ways.

**Islands.** Shapes that touch are one drawing, because a van does not overlap
the bus parked beside it. `findIslands` takes a `bridge` (how close counts as
touching) and `ignoreLargerThan` (a fraction of the page above which a shape is
a backdrop rather than a drawing - without it, one background rectangle welds
the whole sheet into a single island).

**Regions.** Islands fail where a sheet has something that deliberately touches
everything: a flowchart's connecting lines, a headline set behind the artwork.
Then say where each drawing is, with `"box": [x, y, w, h]`. A shape joins a
region if its middle is inside it *and* most of its area is - which is what
keeps a connector reaching into the box from being dragged in with it.

Either way, each drawing is cut with only the gradients and clip paths it uses,
and those ids are renamed per drawing, so the same van can be parked twice.
Gradients are then flattened to the colour halfway along them: a hundred stops
across a vehicle twelve pixels long is invisible and is most of the file.

This step needs Ghostscript and poppler:

```
brew install ghostscript poppler
```

## Adding props

Same shape as the animals - see [ZOO_ANIMAL_ART.md](ZOO_ANIMAL_ART.md):

1. Sheet into `art-src/zoo/`.
2. `npm run iso-art -- --index` for a numbered contact sheet.
3. Name the groups you want in `scripts/iso-art.config.json`.
4. `npm run iso-art`.

A prop given a `tint` list has those flat colours swapped for numbered slots, so
the game can recolour it - which is how a fence comes to wear the colour of the
zone it encloses.

Two drawings will be refused, both on purpose. One using `<use>` or `<clipPath>`
cannot be lifted out of its sheet: two copies on a page would both claim the
same id. One whose `tint` list misses a colour would come out half-painted.

## What is not here

- **No isometric buildings or animals from artwork.** Buildings are drawn;
  animals are the side-view drawings, which sit in an isometric scene by a long
  standing convention and look right.
- **Habitat floors and water** are flat colour, not drawn scenery.
- **Paths** are drawn as plain quads between the two things they join, rather
  than following the elbow or spine routing the park view offers.
