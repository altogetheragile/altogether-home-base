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
| `scripts/extract-iso-art.mjs` | Cuts props out of a scene sheet. Hand-run; output committed. |
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
- **Built.** Anything that is honest geometry - buildings and vehicles - is
  drawn from the item's own colours. A box with a pitched roof, a door and a
  window is a better kiosk than any single stock drawing, because it wears the
  colours the player chose, and every car in the lot can be a different colour.

Vehicles use the car park's own `CAR_HW`/`CAR_HH` footprints, so a car is drawn
at the size the visitors are already routing around.

## Looking at it

Building a zoo by hand to see a change takes twenty minutes. Instead:

```
npx tsx --tsconfig tsconfig.app.json scripts/preview/iso-preview.tsx > /tmp/iso.html
```

That writes a standalone page holding a zoo with two habitats, four species
(one of them with no artwork, to exercise the fallback), two buildings, a
signpost, planting, paths and a full car park. Open it, or screenshot it.

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
