# Build A Zoo: The Three-Tab Redesign

Written 4 September 2026, to sit beside the numbered frames. It supersedes the note of 2 September.
Where the two differ, this one stands. The frames it refers to are the numbered PNGs in
`zoo-flow-v2`, kept outside the repository.

**Build progress.** Step 1 of the build order below is done: the three artifact tabs, the lock on
the Sprint Backlog, and the events as takeovers over the artifact each one is about.

## What Changed Since The First Note

The first redesign made the park the whole screen and hung the board off it. This one turns that around. The navigation is the three Scrum artifacts, each with its own tab, and the events are takeovers over the tab they belong to. The park becomes the Increment tab.

Four decisions got us here.

1. **Tabs by artifact.** Product Backlog, Sprint Backlog, Increment. A learner who can name the tabs can name the artifacts.
2. **No "Build" or "Sprint" tab.** Sprint Planning is the first thing in the Sprint, so the Sprint Backlog is made in the Sprint. A tab beside it called Sprint would be wrong. Building is the Sprint Backlog in use, so it lives on that tab as a second state.
3. **The Increment tab carries the sites.** Done work and work in progress on the same ground, drawn so they cannot be confused. That frees the Sprint Backlog tab from needing a park at all, which is what unsquashes it.
4. **Drag is the decision.** Cards move from To do to Doing to Done by hand. Every drag is recorded with who did it. The Done column is the gate.

## The Three Tabs

### Product Backlog

Product Goal in a band across the top. Items on the left, ordered by the Product Owner, tagged ready, to estimate or epic. The right-hand card has two faces: before Sprint 1 it shows the three agreements (Sprint length, is the top ready, Definition of Done); select an item and it becomes the refinement bench for that item. Title, zone and type, acceptance criteria written as questions the park can answer, an estimate where the Developers vote and the PO does not, ordering, mark ready, split. Refining during a Sprint costs Developer time and the cost is shown in the tab's subline.

### Sprint Backlog

Locked until Planning, and the lock is written on the tab. Sprint Goal in the band, the bet beside it. Two states, switched top right:

- **Plan.** Product Backlog as a rail on the left, so a mid-Sprint pull is visible and costs something. The board across the rest of the width, every item open to its steps. Cards are dragged between columns. Doing has a WIP limit. Dropping on Done runs the Done check; not Done comes back with reasons, or in free play it lands marked "declared Done". The decision log lives here, collapsed.
- **Build.** The board is gone. The left column is the one item in hand: title, points, who is on it, the plan steps ticking as the build satisfies them, the acceptance criteria with what the park can already confirm. The studio takes the rest. "Place on the Increment" is the handoff to the third tab.

### Increment

Full-width park, all the time. Done items are real, coloured, fenced. Sites are grey ground with orange hoardings, the animal ghosted, the item name and "not Done" written on them. The stats box counts them apart: items in the Increment, sites not counted. Visitors walk past sites. "Show the Increment only" hides them; the Review turns it on. Placing an item is a short trip here and back. The Done gate opens here too, because this is where the placed item is and where the park's evidence comes from.

## Events As Takeovers

Tabs are artifacts. Events are moments. Each event dims the tab it belongs to and fills the screen.

- **Sprint Planning** launches from the Product Backlog tab, takes over the Sprint Backlog tab as it unlocks, and runs its three topics as a stepper. Start lands you on Plan state.
- **The day runs out** takes over the Sprint Backlog tab. Nothing is lost; the draft stays. The question is whether the Sprint Goal is still safe, and it hands you to the Daily Scrum.
- **Daily Scrum** takes over the Sprint Backlog tab and returns it to Plan state. Progress toward the goal, the burndown, one decision, and a line that says who is in the room.
- **Sprint Review** takes over the Increment tab with "Increment only" on. Goal met or not, the bet answered, four key value measures, visitor feedback with the PO's decision beside each.
- **Sprint Retrospective** takes over the Sprint Backlog tab. The decision log with attributed costs, one DoD line proposed, one improvement chosen.

## Frame By Frame

| # | Frame | Tab | Kind |
|---|---|---|---|
| 01 | Product Goal | Product Backlog | First state of the tab |
| 02 | Brief | Product Backlog | Who, areas, first zone; Backlog written on the right |
| 03 | Refine and agree | Product Backlog | Three agreements on the right-hand card |
| 03b | Refinement bench | Product Backlog | Same card, item selected |
| 04a | Planning: Why | Sprint Backlog | Takeover. Sprint Goal and the bet |
| 04b | Planning: What | Sprint Backlog | Takeover. Drag items in; forecast, not commitment |
| 04c | Planning: How | Sprint Backlog | Takeover. Steps and order; refinement allowance |
| 05 | Plan state | Sprint Backlog | Board, card mid-drag, WIP limit, Done rule |
| 06 | Build state | Sprint Backlog | Item in hand, studio |
| 07 | Placing | Increment | Site dropped on the park |
| 08 | The Done gate | Increment | Steps, acceptance criteria, DoD, park evidence |
| 09 | The day runs out | Sprint Backlog | Takeover |
| 10 | Daily Scrum | Sprint Backlog | Takeover, returns to Plan |
| 11 | Sprint Review | Increment | Takeover, Increment only |
| 12 | Retrospective | Sprint Backlog | Takeover, decision log |

## What This Changes In The Code

- **One renderer, and it is the isometric one.** Settled 4 September, correcting the line this note
  first carried: the blueprint is retired (PRs #459-#464) and the ISOMETRIC view stays. It is the
  one carrying the licensed artwork, and it is the view the park is meant to be seen in. Where the
  frames show a flat plan, read them as wireframes of the layout rather than of the projection.
  Drawn at full width on the Increment tab and nowhere else. Sites and Done items are a filter on
  the same data.
- **The AI seats advise rather than act.** If a drag is a decision, the AI Developers cannot drag for you or there is nothing to record. In the guided run they say what they would pull and you pull it. `aiSeats` changes from actor to adviser.
- **The Done gate is one card.** Steps, acceptance criteria and Definition of Done in one place, each line carrying the park's evidence or "your judgement". That is increment one of the DoD teeth scope.
- **Moments, not popovers.** The bet at Planning, the room at the Daily Scrum, the four measures at the Review, the attributed cost at the Retro. Coach cards go.
- **A mode object.** Teaching on or off, questions on or off, pause-all, DoD defaulted or agreed, trainer's view. Guided, classroom and self-study are three values of it.

## What The Frames Do Not Show

- Free play mode, where the gate asks instead of refusing. It changes the words on the buttons, not the layout.
- External events. They arrive as a rail message with a named cause and a way back.
- Hidden segment tastes, discovered through what is shipped. A change to the simulation, not a screen.
- The trainer's view across several zoos, and the pause-all control. Classroom only; needs its own design.
- Practice questions at the pause points and at the moment of decision. Same skeleton; a data file.

## Build Order Suggested

1. The three tabs and the persistent strip. Layout only, no rule changes.
2. One park on the Increment tab, with sites. (The blueprint is already retired; the isometric view stays.)
3. Drag between columns, recorded. Done column runs the gate.
4. The Done gate card with park evidence.
5. The refinement bench.
6. The bet at Planning and its verdict at the Review.
7. The four measures.
8. Decision log at the Retrospective, with costs.
9. Mode object, then questions, pause-all and the trainer's view.

Each step ships on its own. Each is worth having if the next never happens.
