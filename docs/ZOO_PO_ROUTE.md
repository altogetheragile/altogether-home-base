# Build A Zoo: The Product Owner Route

Written 20 October 2026. A record of the discussion on 19 and 20 October about a Product Owner course built round the zoo, and the plan that came out of it. The flow is Al's. The reasoning and the build order are what we agreed.

## What It Is

An optional route for a Product Owner course. Learners do the discovery a Product Owner does before there is a Product Backlog: a vision, the stakeholders, the people the product serves, their journey, a story map, a roadmap. What they produce becomes the zoo's Product Backlog, and the game then shows them whether their discovery was any good.

A regular Scrum course is unchanged. It starts as it does now, with the Backlog Wizard's three questions writing the Product Backlog. The route is never the default.

## The Flow

| # | Step | Tool | Credit | In the app today |
|---|---|---|---|---|
| 1 | Vision | Press Release, then Product Vision Canvas | Amazon "working backwards"; Roman Pichler | Canvas yes (credited to Pichler); press release no |
| 2 | Stakeholders | Power/Interest Grid | Mendelow | No |
| 3 | Who it serves | Personas, then Value Proposition Canvas | Alan Cooper; Strategyzer | Persona Studio yes; canvas no |
| 4 | Their experience | Customer Journey Map | Common practice | Yes |
| 5 | What it could do | User Story Map | Mike Cohn's way of mapping (see below); Cohn's story format | Yes, but shaped differently |
| 6 | What first | Now, Next, Later Roadmap, drawn as slices on the map | Janna Bastow; Cohn's release slices | Partly (release slices exist) |
| 7 | The Product Backlog | The Now slice, Product Goal at the top, ordered by WSJF | Don Reinertsen | Yes, WSJF is supported |
| 8 | The Sprint | Sprint Goal written as a hypothesis | Scrum Guide; Gothelf and Seiden, *Lean UX* | Only inside the games |

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

Existing story maps are saved as project artifacts, so the change has to read the old shape: activities become backbone stories, cards become stories, releases become slices, and the old single Product Goal goes on the first slice.

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

## Taking Our Own Medicine

The route is planned with the app's own tools, not only in this document. One project, "Build A Zoo", with its own product backlog, "PO Route". The vision, personas, journey and story map for the route are made in the tools that the route teaches, and the building work comes off that backlog in its order.

Whatever gets in the way while doing it goes on the same backlog. The route and the tools it depends on are improved from one plan.

## Test Before Filling The Gaps

The first step is a test run, not building. A run is what tells us which gaps matter. Stand-ins for what does not exist yet:

| Gap | Stand-in |
|---|---|
| Press Release | A blank canvas, or text |
| Power/Interest Grid | The Impact Map's actors ("whose behaviour can help or hinder the goal"), or a whiteboard |
| Value Proposition Canvas | Skip it, or paper |
| Slices as goals | The existing release slices, with the goal written in the slice's name |
| Sprint Goal as a hypothesis | Plain text at the zoo's Sprint Planning |
| The hand-over | By hand: a facilitator answers the Wizard's three questions from the team's work |

The by-hand hand-over is the test that matters. If it feels like a payoff, the import is worth building. If the Wizard's three questions are too blunt to carry a day's discovery, which is likely, the import has to carry more than the Wizard asks for, and it is better to know that before writing it.

## Build Order

0. **Test run** with the stand-ins, planned in the "Build A Zoo" project. Friction goes on the PO Route backlog.
1. **Story Map changes.** Three tiers, priority by position, slices as Now, Next and Later each with a Product Goal, send the Now slice only, read old maps.
2. **The import.** The Now slice into the zoo's Product Backlog, with the "must name something the game can build" check, replacing the Wizard's questions when a team arrives with a map.
3. **Zoo presets for the discovery tools.** Personas name a segment; the journey map starts from the visit the game simulates (arrive, car park, entrance, paths, areas, food and rest, leave).
4. **Power/Interest Grid**, feeding the Sprint Review's stakeholders.
5. **Sprint Goal as a hypothesis** at the zoo's Sprint Planning, with a measure the simulation can check (families stay longer than four hours; food complaints halve).
6. **Press Release.**
7. **Value Proposition Canvas**, after its licence has been checked.
8. **The route itself.** A page that strings the steps together for one team's project, with facilitator notes and timings.

Steps 3 onwards are in this order on today's best guess. The test run reorders them.

## Open Questions

- **Now, Next, Later or Now, Near, Far** as the default wording.
- **How long the route takes.** A day is the working assumption; the test run will say.
- **The Value Proposition Canvas licence.** Strategyzer's terms need checking before it is built into the product.
- **Whether the regular Scrum course keeps its own Product Goal step** (Exercises deck, slide 17, straight after the Vision Board). It should, and the course should say why the two routes differ.
