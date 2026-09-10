# Build on the park

Al's note of 9 September 2026, as built. This supersedes the takeover build model of 8 September.

## The rule

Everything is built on the park. There is no dialog.

- Pick a card and the object is in your hands: it follows the cursor until you put it down. Dropped, it is built, not Done.
- Select anything, new or old, and one options strip under the park shows only what that object has. The same strip builds a thing and changes it a Sprint later, because those are the same act.
- A habitat's inside is worked on by zooming the park to it ("Look inside"), not by opening a window. Same renderer, same coordinates, closer in. "Back to the park" zooms out.
- Path is a tool because a run is drawn rather than dropped. Everything else is a card.

## The options strip

One row under the park. The label on the left names what is selected. Groups appear only if the object has them.

| Object | Groups |
|---|---|
| Habitat | Footprint (S/M/L), Shape, Ground, Fence, Inside, Turn, Move |
| Inside a habitat | Add (water, rocks, tree, bush, flowers, hedge), Back to the park |
| Scenery | Kind (planting only), Size, the colours that kind has, Turn, Move |
| Facility | Type, Walls, Roof, Sign, Turn, Move |
| Pathway | Draw, Width, Surface |

No "what kind" for a landscape feature that came from a card: the card already said what it is.

## The inspector

A slim panel docked on the park, in whichever corner is furthest from the selected object.

- Acceptance criteria only. The Definition of Done is the product's bar and is shown at the Done gate and on the Increment tab. The two are never merged.
- Each line: a tick, the criterion, one evidence line, and a tag - `here` (checked on the object) or `park` (checked on placement or path).
- Footer: "<PO> judges the rest and signs off when you ask", becoming "Ask <PO> to check" when every fact the park can check is in.
- Inside a habitat it collapses to a single pill, so it does not cover the pen.

## What went

- The build takeover and its "Where it will go" panel.
- The habitat picker for animals: an animal is dropped on the habitat it is to live in.
- "Building X · N Developers on the team" under the park - the event band already says who is on what.

## Two views, one model

The Increment tab's isometric view is the only place the learner sees the park as a visitor does, and it is what the Sprint Review shows. It renders what the grid edits: the same positions, the same colours, the same pieces inside a pen. If the two ever disagree, trust in both goes.

## Still open

- Removing a single piece from inside a habitat (selecting one and deleting it).
- Whether Turn is worth having for symmetric objects.
- Whether fence colour and path surface change anything a visitor does. If not, they are decoration and can go.
