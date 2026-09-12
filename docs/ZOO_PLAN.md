# Build A Zoo: the plan

Where the game is, and what is left. Written 12 September 2026.

The design this works from is `BUILD-A-ZOO-new-thinking.md` (Al's note of 11 September, frames 01-13),
as amended by the decisions listed under **Changed since the note**. Where the note and this document
disagree, this one is what was built.

---

## The spine

**Every mechanic should shorten the distance between a belief and its test.**

The game teaches empiricism, so the thing it is really about is finding out how wrong you are as soon
as possible - and the cost of being wrong growing with how long you took to find out. That is not a
feature; it is what the features are for, and it is the test to apply to any new one.

The game already has both ends of the spectrum. What is missing is the middle.

| when you find out | what it costs | where it is |
|---|---|---|
| The park answers as you choose | nothing - "a low hedge, Lion would be over it" | built |
| You ask a Developer or Priya mid-build | minutes of the day | partly - "Ask Priya to check" |
| You show it to visitors mid-Sprint | a slice of the day, and some rework | **missing** |
| The Sprint Review tells you | the Sprint | built |
| Nobody tells you | next Sprint's attendance | built |

Three rules follow, and they decide the shape of anything added here:

1. **Inspection needs transparency, or it misleads.** Every answer shows its working, the way the
   park already does - "the park says: 8 x 5, room for the lion". An inspection that only says "they
   did not like it" leaves nothing to adapt with.
2. **Inspection without adaptation is pointless.** If nothing can be changed at the moment of
   finding out, do not offer the inspection. Change it while it is in your hands, hand it back,
   reorder what is next, or carry on regardless - and the log records which.
3. **A belief has to be stated before it is tested.** The Sprint bet already does this at Sprint
   scale: what the team predicted the work would do, and what the visitors actually did. The
   mid-Sprint version is the same shape at item scale, so it is one idea to learn rather than two -
   and the gap between the prediction and the answer IS the information.

What this changes about the mid-Sprint inspection: it is not a meeting with attendees, and there are
not four kinds of review. It is one act - **predict, then find out** - and who you show it to is a
question of *who can know what*. A Developer cannot tell you whether the families will care; the
families cannot tell you whether the fence will hold. The prediction belongs only on the visitor
inspections, because Priya's answer and a Developer's are facts rather than preferences, and asking
somebody to predict a fact is a chore.

---

## Changed since the note

Four decisions that replace what the note says:

1. **Hexes are out; rectangular areas are in.** One area still equals one epic, and the car park is
   still the ground the zoo grows from, but there is no honeycomb, no neighbour maths and no shared
   hex edges. Areas own rectangular ground on a plot with a rough outer edge.
2. **The river is terrain, not work.** The note has the player drawing the river when a hex is
   bought. It comes with the plot instead: nobody builds it, it is on no Product Backlog, and it
   cannot be moved. The Bridge is what is built.
3. **Two levels became a camera.** Rather than a "zone screen" and a "whole zoo screen", the park has
   one box it is looking at. Framing an area, looking inside a habitat, the wheel and a drag all move
   the same thing.
4. **Animal looks, not a palette.** Named looks with a consequence (an unusual coat draws
   enthusiasts) rather than a grid of swatches. Per-part colour and patterns are deliberately not
   built - see **Deliberately not built**.

---

## Done

### The plot and its terrain
- **A rough outer edge**, wandering on three sides and straight across the built front, with a
  treeline along it. One definition read by both views. (#567)
- **Areas own ground.** Plots laid out from the brief in a fixed order, so opening an area later
  cannot disturb what is already built. Dropping something on another area's ground is refused and
  says whose it is. Paths, the river, signposts and the toilets own no ground - they are the fabric
  between the areas. (#568)
- **The river is terrain.** Bank to bank, winding, deterministic; the areas are laid out around it,
  and the area the zoo opens first is on the near bank, so Sprint 1 is dry. Nothing may be built in
  the water except the thing whose job is to cross it. (#569)
- **The plot is 1760 x 1080**, sized from what has to fit in an area - a lion, a tiger, a leopard and
  a kiosk - rather than from the pane it is drawn in. Saves from before it are refused, not
  migrated. (#570)

### The park as a thing you work in
- **A camera**: zoom in, zoom out, "Whole zoo", the wheel about the pointer, a drag on the ground to
  pan. Framing is an action rather than a mode, and the box IS the viewBox, so a thing lands where it
  was dropped at any magnification. (#571)
- **Build controls only for work in hand.** Clicking anything on the park used to open its bench,
  including work already released. (#577)
- **The acceptance criteria panel** can be moved, put away and got back, starts closed, and keeps out
  of the camera's corner. The pill keeps the count. (#570, #571, #572)

### The events
- **An event is a document**: as tall as it needs to be, scrolling once like a page, with the picture
  sticky beside the reading. It was pinned to the window, which made the column beside the Increment
  a scrolling well with its top line cut off. (#574, #575)
- **The Increment picture fits its pane** and can be made **Bigger** at a Review, where the picture
  is the event. (#573, #574)
- **The Retrospective uses its width** - the questions and habits beside the log, the improvements
  beside the agreements. (#579)
- **The header clock draws nothing when nothing is being counted.** (#574)

### Consequences that bite
- **What holds an animal in is a decision that can be wrong two ways.** Too little and the criterion
  fails in the words of the animal that would be over it; too much and the visitors cannot see what
  they came for. The default is the lightest barrier that will hold what lives there, so an escape is
  somebody's choice rather than a default's. (#586)
- **An escape shuts the zone.** Open a habitat that does not hold what lives in it and the animal
  gets out: everybody is walked back to the gate, so nothing in that zone is seen by anybody -
  including what was finished and fine. The keeper's report names the animal and the zone, and it
  goes into the decision log in the team's own words so the Retrospective can inspect it. Two honest
  routes to it: move an animal into a pen built for something smaller, or downgrade what holds them
  after it is open. (#587)
- **The Sprint Review pays for reach, not for what was built.** Work a visitor cannot walk to earns
  nothing; a zone is not open unless somebody can get there; the Review names what was out of reach
  and which Product Backlog item would fix it. This is what the river and the Bridge exist for: the
  Bridge has no visitors of its own, which is what makes it hard to order above the penguins. (#580)
- **The way in is part of the habitat.** "Can I walk to it from the way in?" is one of a habitat's own
  five acceptance criteria, answered by the park looking for a made path from the promenade to that
  pen, and the player draws it with the same pen the pathways are drawn with. There is no paths item
  per area any more: what stays an item of its own is infrastructure that serves many things - the
  Main Pathways through the grounds, and the Bridge. Two consequences of asking it: the automatic
  layout fills the visitors' side of the river first, because a habitat on the far bank cannot be
  walked to until something crosses the water; and "At the back", when the Product Owner asks for it,
  is kept this side of the river with the log saying why. (#588)

### Animals
- **An animal is drawn the colour it was given**, in both views, including while the work is in hand.
  The control wrote one field and the drawings read another; and the "rare coat" appeal rule read the
  same dead field, so the enthusiasts never got their reason to come. (#578, #583)
- **Named looks**: Natural, Pale, White, Dark, Black for a mammal; Coral, Gold, Blue, Jade, Rose,
  Silver for a fish. Fewer controls than the palette they replace, and an unusual look draws
  enthusiasts. (#581)
- **Tints are SVG filters**, so Safari draws them. As a CSS filter on a nested drawing they were
  ignored by WebKit - animals and planting both. (#584)

### Housekeeping worth remembering
- **Say Product Backlog or Sprint Backlog**, never just "Backlog", everywhere a player can read it.
  (#569)
- **Saves**: `SAVE_VERSION` is 2; an older or newer save is refused out loud. A name is proposed
  ("Big Cats zoo · 11 Sep") and a game that has one is not asked again. (#570, #576)

---

## Outstanding

In the order I would build them.

### 1. The rest of the bridge
- **The bridge snaps to the water.** A bridge can only be dropped on the river, and its "crosses the
  water" criterion goes green the moment it snaps - so a bridge can never be in the wrong place,
  only unbuilt.

### 2. Coins
Nothing exists. Visitors pay to come in; the header counts; a refund, a closure and a welfare fine
take coins away; ground costs coins. The guard the note sets: **points never buy anything**, and
coins come only from Done work that visitors used.

Open: entry per visitor, the price of ground, the size of a refund.

### 3. Ground is bought, not given
The first area is free; every area after it is bought with coins the visitors paid, and Priya places
it at refinement, because where an area sits is a value decision. Needs coins first.

### 4. The flow rewrite
The biggest piece, and the one that changes the shape of the game:
- **Start on the board.** Sprint 1 arrives pre-planned - Priya wrote the goal, the Developers chose
  the work. One screen, one button, under a minute to first action.
- **Sprint 1 has no Definition of Done**, so shoddy work can ship and the Review can punish it. The
  Retro names the habit and hands the team the Definition of Done.
- **One unlock per Sprint**, named at the Retrospective and adopted at Adapt. A control that has not
  been adopted is **absent** - not greyed, not padlocked.
- **Refinement is mid-Sprint** and costs something (see the open question below).
- **AI wands only after the learner has tried.**

### 5. Product Goals as a series
Al's idea, not yet designed: PG1 delivers the Big Cats; achieving it lets the player set the next
one, which is a new learning layer. Today there is one permanent Product Goal measured by happiness -
which can never be *met*, and so teaches nothing about achieving a goal and setting another.

My view on the shape: a Product Goal has to be an outcome the Review can judge (the area open,
reachable, and its visitors happy above a threshold), and the next one should be a choice between
outcomes with visible trade-offs rather than a free-text box, or it cannot be measured.

### 6. The visual system
From the note's section 9, and from "make everything more distinct and pop more":
- **One meaning per colour.** Orange does about five jobs today; it should mean "the next action" and
  nothing else.
- **Type**: DM Serif Display for titles, DM Sans for the rest, one page title per screen.
- **Components**: sticker, section fill, tag, point disc, bar-with-marker for every number that
  matters, speech sticker in the speaker's hue, one spotlight per screen, 40px icon buttons.

### 7. Sam and Priya
Two voices, never saying the same thing. Sam coaches - once per new screen, at the Retro to name the
habit, once as a warning before the designed mistake, then lets it happen. Priya is value and order,
and in Sprint 1 she opens the shoddy item because the lesson needs her to. Most "What is this?"
buttons go.

### 8. The deletions
The note's section 10. Several are already gone (the takeover window, the six-tool palette, "Holds",
the Backlog questionnaire). The rest: the intro screen, Meet the Team as cards, the Refine screen
before Sprint 1, the in-hand card, "Next step", "Plan 0/4", "More controls", the always-on Definition
of Done block, the instruction line, the Increment pill on the Sprint Backlog, "3 Developers on the
team".

### 9. Rules that must not drift
Section 11 of the note, as tests rather than prose: acceptance criteria belong to the item and are
never merged with the Definition of Done; the isometric view draws only what the model holds; ground
is bought only with visitors' coins; the Definition of Done is the whole team's and Priya decides
what opens; Planning is the whole team's and refinement is mid-Sprint; Sam warns once.

---

## Deliberately not built

- **Per-part animal colour** (mane apart from body) and **patterns** (stripes, spots). Both are
  possible - props are already extracted with tint slots, so animals could be, and a pattern could be
  an overlay clipped to the silhouette. Neither is here because a palette is a weak decision unless
  it has a consequence, and four more dials in the build step invites spending the Sprint painting.
  Revisit if learners in the room light up at making a white tiger - that is engagement no argument
  from here can measure.

---

## Open questions

Al's, answered:
- Sprint 2 Planning shows **all three topics**.
- The terrain is **pre-drawn**; the player never draws the river.
- **Coins** as proposed above.
- **Six areas** is the right number for the plot.

Still open:
- **What refinement costs.** The note says a point of the Sprint. My view: time, not points -
  refinement pulls the Developers who attend out of building for a slice of the day, which is what it
  actually costs and makes "we are slower this Sprint so the next one is possible" a decision you can
  see. A fixed point of a forecast is a number; a morning is a trade.
- The happiness threshold per area earned, and whether it rises each time.
- Coin prices: entry per visitor, ground, a refund.
- The Sprint 1 consequence numbers (the frames use happiness down 12, forty leaving early).
- Whether a full plot ends the game or opens a second one.

---

## How this gets built

Constraints learned the hard way, worth keeping in view:

- **Al plays in Safari; the suite is Chromium.** A CSS filter that WebKit ignores shipped twice under
  a green suite. Anything visual gets checked in WebKit: `npx playwright install webkit` once, then
  `node scripts/zoo-safari-check.mjs`.
- **One rule, one definition.** Nearly every fault in this game has been one rule with two
  implementations - the Done gate, the habitat size, the front of the park, the animal's coat, the
  river's course. When two things must agree, one of them must ask the other.
- **A test of a chain must follow the chain.** "Something in the park has a filter" passed on the
  trees. Press the control, take what it hands the game, and find the thing it was about.
- **The gate**: `npx tsc -b --noEmit`, `npx vitest run`, `npm run lint` (exactly 134 warnings),
  `npm run build`, then drive it in a browser and look at the screenshot. Merge only on green CI.
