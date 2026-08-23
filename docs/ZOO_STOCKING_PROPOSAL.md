# Stocking a zoo, not modelling one

A proposal, 23 August 2026, answering two questions: should animals be built at all, and would
picking ready-made things beat picking colours?

> **Status.** All of it shipped on 23 August: ready flora pieces, stocking fauna, the six kinds, and
> every criterion rewritten as a question. What remains unbuilt is the last paragraph of part 4 -
> letting the park auto-tick the criteria it can answer for itself.

Short answer to both: **yes** - with one condition that decides whether the change helps or quietly
guts the best teaching in the game.

---

## The condition, first

The Product Owner's acceptance criteria are the strongest thing the game has. "A visitor would know
it is a lion", "It looks finished, not half-painted", "The animals have room to roam" only mean
anything because **you can fail them**. That is where the learning is: you thought it was Done, the
criteria say otherwise, and the sign-off does not tick.

Pick everything from a catalogue of finished pieces and nothing can fail. Every criterion is met the
instant you choose, the sign-off becomes a rubber stamp, and the game loses the one moment where
Done bites.

So the rule for both changes below: **replace fiddly choices with meaningful ones, not with no
choices at all.** Every criterion must still have a way to be not-met.

---

## 1. Animals: stock them, do not build them

### What it is now

An animal PBI arrives already shaped like a lion - the template sets body, head, ears, tail and
markings - and the "build" is re-picking those five shapes and colouring them in. You are not
designing a lion. You are re-specifying one that was already right, from a menu that can only make
it wrong.

It is also expensive. That is real minutes of a 90-second day spent on pixel art, in a game about
Scrum.

### What it becomes

An animal PBI is a **stocking decision**: which animals, how many, and of what ages.

| Choice | What it changes | What it teaches |
|---|---|---|
| **How many** - a single specimen, a pair, a family group | Appeal, and how much of the habitat is used | More is not free: a family needs room, and room is the enclosure PBI you already sized |
| **Ages** - adults, juveniles, cubs | The sprites, and a small appeal bonus for a family | The most valuable version is not always the biggest one |
| **A variant** - the colour morph, the white tiger | Rarity, appeal | Value is the Product Owner's call, and it costs |

The animal renderer already scales sprites inside a habitat, so a pride of four adults and two cubs
is a rendering change, not a new engine.

### The criteria still bite

Rewritten so they can fail:

- *"Enough of them that it reads as a group, not a specimen"* - fails with one animal.
- *"They have room to roam"* - fails when six animals go in a small habitat. This one the game can
  check itself against the enclosure footprint, which makes the enclosure PBI matter.
- *"A visitor could tell what they are from the path"* - fails if they are behind the planting.

Three criteria, all of them judgeable, none of them satisfied by the act of choosing.

### What it costs

The five part menus and their colours go for animals. Roughly half a day: a stocking panel, a
`count`/`ages` shape on the design, the appeal and room calculations, and the reworded criteria.

**Worth doing.** It removes the least Scrum-ish minutes in the game and replaces them with a product
decision that has a trade-off in it.

---

## 2. Scenery: pick the thing, not the colour

### The part that was simply wrong (fixed)

The `Type` menu offered the whole catalogue on every scenery item, so a PBI called **Trees** could be
turned into a **car park**. That is not a design decision, it is a different Backlog item. Scenery
now offers the other sorts of its own kind: planting offers planting, water offers water. Done, with
a test.

### The part that is a judgement call

Choosing "green" from a grid of swatches is a weak choice. It is not obvious what a good answer
looks like, no answer is wrong, and the result rarely looks better than the default.

Choosing **an oak, a pine, a palm, blossom** is a real one. It is faster, it looks better, and it is
a decision you can have an opinion about.

Proposal: each sort gets a handful of ready pieces with their colours already right.

- **Trees** - oak, pine, palm, blossom, bare
- **Bushes** - box, fern, flowering
- **Flowers** - bed, wild, planter
- **Water** - pond, stream, waterfall, fountain
- **Rocks** - boulders, outcrop, cave

Colour stays, one level down, as *tailoring* - open the swatch if you want an autumn oak. The Toolbox
model the game already committed to: **pick a ready piece, then tailor it.**

### The criteria still bite

The scenery criteria are already about fit rather than correctness - *"Fits the planting"*,
*"Coloured, no bare patches"*, *"Placed where it looks right"* - and a catalogue does not satisfy
them. Palms in the Forest zone still look wrong, and one tree is still not planting.

### What it costs

The pieces are the work: a dozen or so presets with sensible colours. Perhaps a day, most of it
choosing what a pine looks like at 20 pixels.

**Worth doing, and it is the cheaper of the two.** It also makes the park look better immediately,
which nothing else on the list does.

---

## What I would build first

1. **Ready scenery pieces.** Cheapest, most visible, and the catalogue is reusable.
2. **Stocking animals.** Bigger, and it buys back the most time in the day.

Both before the Scrum Master's turn, because both shorten the loop that everything else runs inside.

---

## 3. What kind of thing is it? (shipped)

`category` says how a thing BEHAVES - what renders it, what can be dragged into it, what it blocks
on. That is an engine concern and it has not changed. What the player sees is now a separate,
honest taxonomy, because `flora` had become a bin for everything that was not an animal, a habitat,
a building or a path - so the river, the bridge, the signposts and the car park were all filed as
planting. A bridge is not planting.

| Kind | What only it does |
|---|---|
| **Habitat** | a footprint you size, that contains other things |
| **Fauna** | blocked on its habitat; what visitors come for |
| **Flora** | plantable inside a habitat, and put down many times over |
| **Landscape** | a footprint you resize and rotate; changes where visitors can walk |
| **Facility** | serves a visitor need - food, rest, a lavatory |
| **Infrastructure** | how visitors get about and find their way |

**Not a seventh for "utilities".** A bridge and a signpost *are* the utilities of a park, and they
belong beside the paths they serve - the visitor pathfinding already treats water as impassable
except at a bridge, so infrastructure is exactly the set of things that decide where anyone can go.

**Zoning belongs to the item, not the piece.** "Big Cats Planting" is zoned because that is how you
deliver a zone at a time. An oak is an oak wherever it goes, so the catalogue is universal.

## 4. Every criterion is a question (shipped)

All of them now begin "Can I" and end in a question mark. Not a house style: a statement can be
waved through, and a question has to be answered - which is what an acceptance criterion is for. It
also forces you to say who is doing the looking, and the answer is always a visitor standing in the
park rather than a developer reading a spec.

It caught one that had been there since the first version. Planting had to meet **"Fits the
planting"** - the planting fits the planting - which cannot be failed because it does not mean
anything. In the question form it will not even write.

**The dividend.** Several are now things the game itself could answer: *"Can I get to this zone
without crossing the grass?"* is exactly what the visitors' pathfinding computes. That is the next
piece of work, and it is worth doing carefully: about half of them are checkable and half are
judgement, which is true of real acceptance criteria too. The ones the park can answer should
arrive ticked with their evidence underneath; the rest stay yours, and the sign-off waits for all
of them either way.
