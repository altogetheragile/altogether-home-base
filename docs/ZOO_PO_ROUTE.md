# Build A Zoo: The Product Owner Route

Written 20 October 2026. A record of the discussion on 19 and 20 October about a Product Owner course built round the zoo, and the plan that came out of it. The flow is Al's. The reasoning and the build order are what we agreed.

## What It Is

An optional route for a Product Owner course. Learners do the discovery a Product Owner does before there is a Product Backlog: a vision, the stakeholders, the people the product serves, their journey, a story map, a roadmap. What they produce becomes the zoo's Product Backlog, and the game then shows them whether their discovery was any good.

A regular Scrum course is unchanged. It starts as it does now, with the Backlog Wizard's three questions writing the Product Backlog. The route is never the default.

## The Flow

| # | Step | Tool | Credit | In the app today |
|---|---|---|---|---|
| 1 | Vision | Press Release (given), then Product Vision Canvas | Amazon "working backwards"; Roman Pichler | Canvas yes (credited to Pichler); press release is a handout, below |
| 2 | Stakeholders | Power/Interest Grid | Mendelow | No |
| 3 | Who it serves | Personas, then Value Proposition Canvas | Alan Cooper; Strategyzer | Persona Studio yes; canvas no |
| 4 | Their experience | Customer Journey Map | Common practice | Yes |
| 5 | What it could do | User Story Map | Mike Cohn's way of mapping (see below); Cohn's story format | Yes, but shaped differently |
| 6 | What first | Now, Next, Later Roadmap, drawn as slices on the map | Janna Bastow; Cohn's release slices | Partly (release slices exist) |
| 7 | The Product Backlog | The Now slice, Product Goal at the top, ordered by WSJF | Don Reinertsen | Yes, WSJF is supported |
| 8 | The Sprint | Sprint Goal written as a hypothesis | Scrum Guide; Gothelf and Seiden, *Lean UX* | Only inside the games |

The press release is given, not written. The facilitator hands it out at the start, and it fixes the product (the zoo) and its scope, so everything the learners invent is something the game can build. Learners start at the Vision Canvas. The text is under [The Press Release](#the-press-release).

The roadmap comes after the story map, not before it. A story map shows the whole product and is too much for one Product Goal; the roadmap is how it is split into goals the team can take one at a time.

## Whose Rule Is It

The route mixes Scrum's rules with the course's choices, and learners should always be told which is which.

**Scrum's.** "The Product Goal is in the Product Backlog. The rest of the Product Backlog emerges to define 'what' will fulfill the Product Goal." So the Product Goal is set before the Product Backlog, which this flow does. "They must fulfill (or abandon) one objective before taking on the next": that is what Now is. The Product Owner orders the Product Backlog. The Sprint Goal is the single objective for the Sprint. (2020 Scrum Guide.)

**The course's.** WSJF as the way to order. The hypothesis format for goals ("We believe ... will result in ... we will know when ..."). Now, Next and Later. Pichler's view that a Product Goal covers two to six months is his, not Scrum's: the Guide calls it "the long-term objective" and puts no time on it.

**A useful fit.** WSJF divides cost of delay by job size. Cost of delay is the Product Owner's call and job size is the Developers', which is the zoo's needs model: the Product Owner says what, the Developers decide how.

## The Story Map

Al teaches story mapping the way Mike Cohn does it (Scrum Master Exercises deck, slides 21 to 23):

- **Three tiers.** Higher-level backbone stories in one colour, stories in a row beneath each, smaller stories stacked below those.
- **Two axes.** Left to right is the sequence, the narrative. Top to bottom, priority falls and detail rises.
- **Horizontal slices for releases.** Cohn splits the map with horizontal lines. Because priority runs down the map, those slices are the roadmap: Now, Next, Later (or Now, Near, Far).
- **Built as a group.** Write alone in silence, share, group and consolidate, one tier at a time.

The app's Story Map (`src/types/storyMap.ts`) is Jeff Patton's: two tiers (activities and cards), release slices, and one Product Goal for the whole map. The changes:

1. **Three tiers**, each in its own colour, as the deck shows.
2. **Order in a column is priority.** Moving a card up raises it.
3. **Slices are the roadmap.** Named Now, Next and Later by default, with Now, Near and Far as the alternative wording. Each slice has its own Product Goal in the hypothesis format, replacing the single field.
4. **Send to backlog sends the Now slice only**, with its Product Goal at the top. When Now is met or abandoned, Next becomes Now.

Existing story maps are saved as project artifacts, so the change has to read the old shape. Decided with Al (20 October 2026), following common practice (Patton's walking skeleton): the slices cut across the smaller stories only, never the backbone or the stories row, so every step of the journey keeps something in Now. An old map loses nothing: each activity becomes a backbone step with one story left unnamed, for the team to name the missing middle tier; its cards become that story's smaller stories and keep their release as their slice; the old single Product Goal goes on the first slice.

Built (PR "The Story Map in three tiers"): steps 1 to 4 above, with slices reordered by arrows so Next can move up to become Now. Sending Now creates an epic per backbone step, a feature per story and a story per smaller story, in walking-skeleton order, and links the slice to what it sent so the backlog can show its Product Goal next.

## The Hand-Over Into The Zoo

This is what makes the route worth doing. If the discovery work does not change what happens in the game, it is a paper exercise with a game stapled on the end.

The zoo already has what the hand-over needs. Its visitors are three segments (families, enthusiasts, comfort seekers), each with their own needs for food, toilets and rest, and each area appeals to them differently. The Backlog Wizard writes a brief (which zones exist, the main audience, the zone to open first) and the brief shapes the Product Backlog. The Sprint Review draws its stakeholders from a pool.

The hand-over fills all of that from the team's work:

| The zoo needs | It comes from |
|---|---|
| Zones | The backbone stories on the map |
| Main audience | The primary persona, which must name one of the three segments |
| Zone to open first | The top of the Now slice |
| The Product Backlog and its order | The Now slice's stories, in the order the map puts them |
| The Product Goal | The Now slice's goal |
| Sprint Review stakeholders | The "manage closely" quadrant of the Power/Interest Grid |

Two rules keep it honest:

- **A story must name something the game can build** (an area, an animal, a facility, a path or bridge) to cross into the game. A story that cannot is allowed on the map; it stays there.
- **It is one way.** Nothing goes back from the game to the team's project.

The payoff is consequence. A team that built for families and whose journey map never mentioned food watches families leave hungry. A team that missed a stakeholder meets them at the Sprint Review. The Wizard's own comment says why: "a wizard whose answers do not matter teaches less than no wizard at all".

The route also gives the game a second act. When the Now goal is met or abandoned, the team brings Next forward as the new Product Goal. A Scrum course does not need that; a Product Owner course does.

## The Press Release

The handout. Everything in it is something the game models: the four areas and their animals, the kiosk, cafe, toilets and picnic area, the car park, entrance, paths and bridge, and the three visitor segments. It names all three segments without saying which matters most, and all four areas without saying which opens first. Those are the learners' calls.

The scope line ("no rides, hotel or shop") is what lets the hand-over turn away a story the game cannot build without it feeling arbitrary. The last two answers carry the Scrum message lightly: the Product Owner says what, the team decides how; each area should earn its place, which sets up the Product Goal and its measure.

Meadowbrook is made up. A quick search found no UK zoo by that name; check properly before it goes into printed material.

> **Meadowbrook Zoo Opens Its Gates**
>
> *A new zoo on the edge of town for families, animal lovers and anyone who wants a gentle day out*
>
> *Meadowbrook, 1 June.* Meadowbrook Zoo opened today on what was farmland, with room for four areas: **Big Cats, Waterside, Savanna and Forest**. Visitors can see lions, tigers and leopards; penguins and a reef tank; elephants, giraffes, zebras and rhinos; and bears and monkeys in the woods.
>
> The town has not had a zoo for twenty years. Families have driven an hour each way for a day out, and local schools have stopped organising trips. Meadowbrook wants to be the zoo people choose because it is close, and come back to because it is good.
>
> **Built round the visitor's day.** Visitors arrive by car, park, and come in through one entrance. Paths link the areas, and a bridge crosses the brook that gives the zoo its name. Each area has somewhere to eat, use the toilets or rest: a kiosk, a cafe, toilets and a picnic area.
>
> **For three kinds of visitor.** Families with young children, who need food, toilets and space to stop often. Animal enthusiasts, who come for the animals and will stay all day. And visitors looking for a comfortable, unhurried day, who need somewhere to sit and rest.
>
> "We didn't want to build a zoo and then hope people liked it," said the zoo's director. "We want to find out what our visitors need and build that first. The rest can wait until we know it's wanted."
>
> "I'd bring the kids every month if there was somewhere to sit down and get a decent lunch," said a parent from Meadowbrook.
>
> The zoo will grow area by area through its first season.
>
> **Will every area open on the first day?** No. The zoo opens one area at a time, starting with whichever matters most to its visitors.
>
> **What won't the zoo have?** No rides, hotel or shop. It is animals, the paths between them, and the places to eat, rest and use the toilets.
>
> **Who decides what gets built next?** The Product Owner, guided by what visitors and stakeholders say. The team building the zoo decides how.
>
> **How will you know it's working?** Visitors who stay, come back and recommend it. Each area should earn its place.

## Taking Our Own Medicine

The route is planned with the app's own tools, not only in this document. One project, "Build A Zoo", with its own product backlog, "PO Route". The vision, personas, journey and story map for the route are made in the tools that the route teaches, and the building work comes off that backlog in its order.

Whatever gets in the way while doing it goes on the same backlog. The route and the tools it depends on are improved from one plan.

## Test Before Filling The Gaps

The first step is a test run, not building. A run is what tells us which gaps matter. Stand-ins for what does not exist yet:

| Gap | Stand-in |
|---|---|
| Power/Interest Grid | The Impact Map's actors ("whose behaviour can help or hinder the goal"), or a whiteboard |
| Value Proposition Canvas | Skip it, or paper |
| Slices as goals | The existing release slices, with the goal written in the slice's name |
| Sprint Goal as a hypothesis | Plain text at the zoo's Sprint Planning |
| The hand-over | By hand: a facilitator answers the Wizard's three questions from the team's work |

The by-hand hand-over is the test that matters. If it feels like a payoff, the import is worth building. If the Wizard's three questions are too blunt to carry a day's discovery, which is likely, the import has to carry more than the Wizard asks for, and it is better to know that before writing it.

## One Item, One Look

A learner's Product Backlog becomes the zoo's Product Backlog. If the item changes appearance at that moment, the route says these are two different things. The zoo's card (`src/components/zooGame/PbiCard.tsx`) is already the better teacher: it shows where an item is in its journey, it shows "?" until the Developers have sized it, and it puts the Product Goal at the top. So the backlog tool comes to look like the zoo, and not the other way round.

They share a look, never a store. The zoo keeps `BacklogItem`, the tool keeps `backlog_items`, and the export between them stays one-way.

What the tool takes from the zoo:

- **The journey on the card.** Idea and Refined are plain, Ready says so, In Progress wears the accent, Done is green on white (and now leaves the list, #915).
- **"?" until sized.** No effort means nobody has sized it yet, which is different from a small item.
- **Priority in the backlog's own scheme.** Under MoSCoW a card says Must, Should, Could or Won't; under WSJF it shows the score. It never shows a word from another scheme.
- **The story and its criteria on the card**, not a count of criteria.
- **The Product Goal at the top.** The Scrum Guide puts the Product Goal in the Product Backlog. Today the backlog shows the initiative's "why", which is close but not the same: an initiative can have several backlogs, and on this route each Product Goal comes from a slice of the roadmap.

What the tool keeps that the zoo does not need: WSJF scores, business value, target release, tags and source.

What the zoo does not take from the tool: a priority badge. In the zoo the order is the priority, and the Product Owner sets it by dragging.

### Increments

1. **The tool's card reads like the zoo's.** Journey treatment from status, "?" points, priority in the backlog's scheme, the duplicate source badge gone. Touches the tool only.
2. **One card shell for both.** Pull the zoo's `PbiCard` layout into a shell that takes an icon, a name, a state and its chips; the zoo's card becomes a thin wrapper over it, looking exactly as it does now (checked by screenshot). The tool's card moves onto the same shell.
3. **Story and criteria on the tool's card**, shown when the card is opened, as the zoo's refinement panel shows them.
4. **The Product Goal.** Written on the roadmap slice; each product backlog shows the goal of the slice it was made from at the top, with the initiative's "why" kept on the initiative. Waits for the roadmap (Build Order step 1).

### Decided (20 October 2026)

- **Simple means the order is the priority.** No levels, no badge, nothing asked when adding an item: the item's place in the list says it. MoSCoW and WSJF stay for a team that wants a technique on top. An item's stored level is kept, and shows again if the backlog switches to MoSCoW.
- **A Product Goal is written on the roadmap slice** that becomes it (Build Order step 1). The Product Backlog shows the goal of the slice it was made from; it is not typed in a second time on the backlog.

## Build Order

0. **Test run** with the stand-ins, planned in the "Build A Zoo" project. Friction goes on the PO Route backlog.
1. **Story Map changes.** Three tiers, priority by position, slices as Now, Next and Later each with a Product Goal, send the Now slice only, read old maps.
2. **The import.** The Now slice into the zoo's Product Backlog, with the "must name something the game can build" check, replacing the Wizard's questions when a team arrives with a map.
3. **Zoo presets for the discovery tools.** Personas name a segment; the journey map starts from the visit the game simulates (arrive, car park, entrance, paths, areas, food and rest, leave).
4. **Power/Interest Grid**, feeding the Sprint Review's stakeholders.
5. **Sprint Goal as a hypothesis** at the zoo's Sprint Planning, with a measure the simulation can check (families stay longer than four hours; food complaints halve).
6. **Value Proposition Canvas**, after its licence has been checked.
7. **The route itself.** A page that strings the steps together for one team's project, with facilitator notes and timings, and the press release as its opening handout.

Steps 3 onwards are in this order on today's best guess. The test run reorders them.

## Open Questions

- **Now, Next, Later or Now, Near, Far** as the default wording.
- **How long the route takes.** A day is the working assumption; the test run will say.
- **The Value Proposition Canvas licence.** Strategyzer's terms need checking before it is built into the product.
- **Whether the regular Scrum course keeps its own Product Goal step** (Exercises deck, slide 17, straight after the Vision Board). It should, and the course should say why the two routes differ.
