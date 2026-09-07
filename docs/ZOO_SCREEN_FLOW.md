# Build A Zoo: Screen Flow (7 September 2026)

The manifest below came with the mock-up set of 7 September. `docs/ZOO_BUILD_SEATS_HEADER.md` is the
note it points at; read that one first. The mock-ups themselves are not in the repo - they are in
`~/Desktop/zoo-screen-flow-2026-09-07`.

## Build order, and where we are

| # | Slice | State |
|---|---|---|
| 1 | The header: strip, tabs, band, the two-clock rule. Remove what it replaces. | **done** |
| 2 | Board state and park state with the slide; simple cards; the card dialog. | to do |
| 3 | The palette, ghost verdicts, docked inspector; the park checks criteria. | to do |
| 4 | The rail as the one action channel; Learn takes messages and the log. | to do |
| 5 | Meet the Scrum Team; the pull by name at topic 2. | to do |
| 6 | The question channel: cards addressed to seats, "waiting on", the clock, the guess. | to do |
| 7 | The Daily Scrum at the board with "hand it back". | to do |
| 8 | Compact refinement. | to do |
| 9 | Free-play naming of the Product Owner anti-patterns. | to do |

Two label corrections run through all of them: the item's criteria are headed "What this needs to
be" (done), and "Approved by the PO" leaves the Definition of Done for "acceptance criteria
confirmed" on the item (to do).

One deliberate difference from the manifest: the park stays on all three steps of the Sprint Review,
not only the first. It comes off Sprint Planning and the Retrospective, which is what the note asks.

---

# Build A Zoo: Screen Flow

Written 7 September 2026. One numbered sequence from a new game to the end of Sprint 1, mixing the live screens that stand and the mock-ups that replace others. LIVE means keep the live screen with the note applied. MOCK means build to the frame. GAP means not yet drawn.

| # | Screen | Source | File | Note |
|---|---|---|---|---|
| 01 | Scrum on one page | LIVE | `01-live-scrum-on-one-page.png` | Keep. Recolour the six cards to teal and orange; add the strip. |
| 02 | Meet the Scrum Team | MOCK | `02-mock-meet-the-scrum-team.png` | New. Seats, characters, where capacity comes from. |
| 03 | Product Goal | LIVE | `03-live-product-goal.png` | Keep the content. Move onto the Product Backlog tab with the strip. |
| 04 | Brief: areas | LIVE | `04-live-brief-areas.png` | Fold the three brief pages into one screen on the tab. |
| 05 | Brief: visitors | LIVE | `05-live-brief-visitors.png` | As above. |
| 06 | Brief: first area | LIVE | `06-live-brief-first-area.png` | As above. |
| 07 | Refine and agree | MOCK | `07-mock-refine-and-agree.png` | Replaces the live refine screen: 44px rows, one-line agreements, bench beneath. |
| 08 | Refine: split an epic | LIVE | `08-live-refine-split-an-epic.png` | Keep, but inline in the bench rather than a modal. |
| 09 | Planning: Why | MOCK | `09-mock-planning-why.png` | No park. Backlog left, goal and bet right. |
| 10 | Planning: What, the pull | MOCK | `10-mock-planning-what-the-pull.png` | No park. Developers pull by name; PO argues. |
| 11 | Planning: How | MOCK | `11-mock-planning-how.png` | No park. Items left, plan editor right. |
| 12 | Sprint Backlog: board | MOCK | `12-mock-sprint-backlog-board.png` | Replaces live board. Cards carry four things. |
| 13 | Card dialog | MOCK | `13-mock-card-dialog.png` | New. The only place item detail lives. |
| 14 | Pull to Doing | MOCK | `14-mock-pull-to-doing.png` | Drag, pick who, the park slides in. |
| 15 | Build: draw habitat | MOCK | `15-mock-build-draw-habitat.png` | Palette, ghost verdict, docked inspector. |
| 16 | Build: paint water | MOCK | `16-mock-build-paint-water.png` |  |
| 17 | Build: place shelter | MOCK | `17-mock-build-place-shelter.png` |  |
| 18 | Build: paint path, swarm | MOCK | `18-mock-build-paint-path-swarm.png` | Two in Doing, WIP 2. |
| 19 | Done gate and open now | MOCK | `19-mock-done-gate-and-open-now.png` | Replaces live gate on the Increment tab. AC and DoD kept apart. |
| 20 | Build: place lion, studio popover | MOCK | `20-mock-build-place-lion-studio-popover.png` |  |
| 21 | Build: planting, lion criteria | MOCK | `21-mock-build-planting-lion-criteria.png` |  |
| 22 | Lion Done, essential | MOCK | `22-mock-lion-done-essential.png` |  |
| 23 | Live on the Increment tab | MOCK | `23-mock-live-on-the-increment-tab.png` | Replaces live Increment tab: stats on the park, sites marked, toggle. |
| 24 | Strip: goal at risk | MOCK | `24-mock-strip-goal-at-risk.png` | The clock in the strip goes orange; the goal line names what is at risk. Rest of the screen unchanged. |
| 25 | The day runs out | MOCK | `25-mock-the-day-runs-out.png` | Takeover over Plan state. |
| 26 | Daily Scrum | MOCK | `26-mock-daily-scrum.png` | In front of the board, no park. Board stays live; the panel asks the one question. |
| 27 | Learn drawer | MOCK | `27-mock-learn-drawer.png` | Value section drawn; Scrum, This Sprint, Notes described. |
| 28 | Review: Done | LIVE | `28-live-review-done.png` | Keep. Park earns its place here. Add the bet verdict. |
| 29 | Review: Visitors | LIVE | `29-live-review-visitors.png` | Keep. Add Add or Decline beside each visitor line. |
| 30 | Review: What next | LIVE | `30-live-review-what-next.png` | Keep. Remove the park; feedback verdicts feed this list. |
| 31 | Retro: Inspect | LIVE | `31-live-retro-inspect.png` | Keep. Remove the park. |
| 32 | Retro: Adapt | LIVE | `32-live-retro-adapt.png` | Keep. Remove the park; add a cost line per improvement. |
| 33 | End of game | GAP | `` | Not drawn. Product Goal met or abandoned, three Sprints of measures, the log summarised. |

## Counts

11 live, 21 mock, 1 gap.

## Not In The Sequence, Described Elsewhere

- Sprint 2 Planning with measured velocity and the carried-over item.
- The rail carrying a stakeholder ask or a blocker mid-day.
- The PO question channel: a Developer asks about a criterion, the PO answers, the card shows who it is waiting on.
- Learn drawer: Scrum, This Sprint and Notes sections.
- Free play: a card declared Done that is not.
- A practice question at a pause point.
- The trainer's view (classroom only).

## The Header

Every screen from 02 onward carries the same three rows. Strip (72px, Deep Teal): the mark; the event pill top-left at 22pt, teal on a working day and orange during an event; one big clock dead centre at 44pt, which is the day's remaining time on a working day and the event's timebox during an event, with the other shown small beside it; the goal line to its right; Learn at the far edge. Tabs (36px). Band (52px): one sentence on who does what now, and the five seats with what each is doing; seats not in the event are greyed, the learner's seat is outlined. Every event is inside the Sprint, so the day clock keeps running through Planning, the Daily Scrum, the Review and the Retro. On live screenshots the header has been composited over the original and the body scaled to fit; rebuild to the frame. Reference: `21a` to `21c` in zoo-flow-v2.

## The Notes

Five notes in zoo-flow-v2 explain the reasoning: `00-what-changed-v2.md` (three tabs), `01-live-app-review.md` (screen-by-screen against the mock), `02-what-matters-on-the-screen.md` (attention, the strip, Learn), `03-course-design.md` (the course and self-study), `04-lesson-cards-spec.md` (lesson cards for Claude Code), and `05-build-seats-and-header.md` (the build interface, the seats, the header; copied into this folder). Read 05 first for this set.

## Rules The Sequence Follows

- One strip: event pill, clock centre, goal line, Learn. One band: sentence, timebox, seats.
- Tabs are artifacts; events are takeovers over their tab.
- The park has the next click during Build and at the Review's first step, and nowhere else. It is not on Sprint Planning.
- Acceptance criteria belong to the item; the Definition of Done belongs to the product. Never merged.
- The Developers pull; the PO makes the case; nobody assigns.
