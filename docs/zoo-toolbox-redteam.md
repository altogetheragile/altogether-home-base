# Build A Zoo — Toolbox Red-Team (as a Gaming Expert)

An adversarial look at the toolbox and the wider game: where does the creative /
immersive / feedback loop fall short, and what would most enrich play?

## The lens

The fun loop is: **deliver value through Scrum → watch the zoo grow → visitors
respond**. The engagement drivers a builder game leans on:

1. **Creative expression** — "build *my* zoo." The toolbox is this surface.
2. **Legible feedback** — visitors, happiness, word-of-mouth react to choices.
3. **Mastery** — Scrum discipline + spatial/economic optimisation.
4. **Collection / completion** — variety to chase (species, buildings, zones).
5. **Immersion / theming** — a place that feels real and characterful.

Red-teaming the toolbox = *where do 1, 4 and 5 run out of runway, and what
content or systems unlock the next hour of play?*

## Current inventory

- **Habitats:** 3 enclosure sizes.
- **Animals:** ~30 across Big Cats / Savanna / Waterside / Birds / Forest.
- **Facilities:** Kiosk, Cafe, Gift Shop, Toilets, Picnic Area, Seating.
- **Flora & decor:** Trees, Bushes, Flowerbed, Signpost.

Strong on animals; thin on **arrival, circulation, landscape, and theming** — the
things that turn "a grid of enclosures" into "a zoo."

## Gaps, prioritised

### 1. Wayfinding & arrival — HIGH (your instinct is right)
The zoo has no sense of **arrival** or **circulation**. Today paths are only drawn
incidentally when you deploy an enclosure/building; there's no way to treat a path
as intentional work.
- **Pathway PBI** — a first-class deliverable: plan it, deploy it, draw the route.
- **Entrance / main gate** — the front door (currently just an "ENTRANCE" label).
- **Car park** — where visitors arrive from; grounds the zoo in a world.
- **Plaza / forecourt** — a gathering space inside the gate.
- **Zoo map board / directional signs** — wayfinding beyond a lone signpost.

### 2. Landscape & terrain — HIGH (immersion)
Everything sits on flat green. Real zoos are landscaped.
- **River / stream** — a meandering water body (distinct from an enclosure pool).
- **Lake / pond** — a larger feature, maybe with an island.
- **Rocks / boulders** — terrain drama and natural barriers.
- **Woodland / grove** — a cluster of trees, bigger than a single plant.
- **Gardens** — themed planting beds.
- **Ground variation** — sand, gravel, mulch, decking patches (you already have a
  path-surface picker; extend the vocabulary to areas).

### 3. Amenity depth — MED (dwell time & spend)
Visitor needs are food / toilet / rest. Add reasons to **stay and spend**.
- **Playground** — a huge family-appeal magnet.
- **Restaurant** — higher-capacity food than a cafe.
- **Ice-cream / drinks stand** — quick snacks, impulse.
- **First aid / info point, Baby care, ATM** — realism + niche needs.

### 4. Attraction variety — MED (headline draws)
Animals are individual PBIs; add **attractions** that pull crowds.
- **Petting zoo / farm** — family magnet.
- **Reptile house, Insect house, Nocturnal house, Aquarium** — themed buildings
  that hold several species (a different "container" from an open enclosure).
- **Show arena / amphitheatre** — scheduled shows.
- **Feeding stations / encounters** — better modelled as *events* (see §6).

### 5. Theming & personalisation — MED ("make it mine")
- **Fountain, statue, sculpture** — focal points.
- **Hedges / fences / barriers** — define spaces decoratively.
- **Flags, banners, arch** — colour and identity.
- **Zone-themed decor** — savanna rocks, arctic ice, jungle vines.

### 6. Systems that deepen the loop — the biggest upside (beyond the toolbox)
Red-teaming past content, these multiply engagement:
- **Make paths MATTER.** Visitors should follow the paths you build — an exhibit
  not connected to the network gets few visitors. This turns wayfinding, the
  entrance, and the Connect tool from cosmetic into **strategy**, and gives the
  "connect your zoo" theme a real mechanic. *Highest-leverage single change.*
- **Light economy** — ticket revenue + shop income vs. build/upkeep cost; a budget
  gives the PO genuine value trade-offs (maps perfectly onto Scrum prioritisation).
- **Events / timetable** — feeding times, shows tied to the day cadence.
- **Reputation / star rating** — one headline score to optimise (a Product-Goal
  proxy).
- **Weather / seasons** — variety and demand shifts.
- **Milestones / achievements** — concrete goals to chase.

## Recommended sequence

- **Phase 1 — Landscape & Wayfinding pack** (theming + your paths ask):
  Pathway PBI, Entrance/Gate, Car park, River, Pond, Rocks, Hedge, Fountain.
  New placeable landscape items + the Pathway deliverable (reuses the deploy-time
  Connect tool). Delivers the "arrival + circulation + landscape" jump.
- **Phase 2 — Amenity & attraction depth:** Playground, Restaurant, Ice-cream,
  Petting zoo, Reptile/Aquarium houses.
- **Phase 3 — Make paths matter (+ light economy):** visitors follow the network;
  unconnected exhibits under-perform. This is the engagement multiplier — it makes
  everything in Phase 1 strategically meaningful.

## The one killer move

If you only do one thing beyond content: **make paths mechanically matter.** The
moment an exhibit's footfall depends on being connected to the entrance via the
path network, the whole toolbox (paths, entrance, car park, wayfinding) becomes a
spatial optimisation game layered on the Scrum loop — which is exactly the kind of
"decisions have consequences" depth that keeps a builder game alive.

## Note on the Pathway PBI (your specific ask)

A **Pathway** toolbox item creates an infrastructure PBI. It has no studio design;
its "build" is trivially met, and **deploying** it drops you into the existing
place-&-connect step with the Connect tool active, so drawing the route *is* the
delivery. It renders as the connectors it lays, not as a park sprite. This keeps
paths PBI-driven and consistent with "adding paths is part of deployment."
