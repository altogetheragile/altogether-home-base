# Course and Board: Companion Note for Claude Code

Version: 2 October 2026. Owner: Alun Davies-Baker, Altogether Agile.

Read `DESIGN-NOTE.md` first. This note links the Scrum Big Picture board to the Build A Zoo game and the online Scrum course designed on 2 September 2026.

## How the Three Fit Together

- **The board** is the reference layer. It shows where everything sits in the Sprint, with a knowledge page behind every icon.
- **The game** is the practice layer. Learners play the Sprint.
- **The course** alternates the two: teach a thing, do the thing, pause.

One visual language should run across all three. Use the icons in `icons/` in the game and on lesson cards.

## Mapping the Board to the Game

| Board | Game |
|---|---|
| Product Backlog icon | Product Backlog tab |
| Sprint Backlog icon | Sprint Backlog tab (Plan and Build) |
| Increment icon | Increment tab (Done work only) |
| Product Goal peaks | The zoo's Product Goal |
| Sprint Goal flag | The Sprint Goal set at Planning topic 1 |
| Definition of Done gem | The team-wide DoD, shown separately from each item's acceptance criteria |
| Event icons | Event pill in the header, and the takeover screens for each event |
| Improvements icon | Retrospective decision log, and its effect at the next Planning |
| "Scrum on one page" | This board, used as block 3 of the course |

## Character Colours

Give the game's characters the board's role colours, so learners meet one language everywhere.

| Character | Accountability | Colour |
|---|---|---|
| Priya | Product Owner | Orange #FF9715 |
| Sam | Scrum Master | Plum #7B2D7B |
| Ada, Ben, Cara | Developers | Teal stack, #0E8C8C front |
| Visitors | Stakeholders | Coral #F07A2E |

Figures follow the board rules: same size everywhere, no outlines, heads joined to bodies, and several people in one role shown as a close stack.

## The Course Agenda

Six hours online with two breaks. Blocks 3 to 17 are a guided run, each learner playing their own copy in lockstep. Block 20 is the full run in groups.

| | Block | Mins |
|---|---|---|
| 1 | Introductions | 15 |
| 2 | Teach: agile and complexity, why empiricism | 25 |
| 3 | Sim: Scrum on one page (this board). Seats, values, the loop | 10 |
| 4 | Teach: the Product Goal, the first commitment | 10 |
| 5 | Sim: write the Product Goal. Pause | 20 |
| 6 | Teach: Product Backlog and refinement | 15 |
| 7 | Sim: refine, agree Sprint length. Default DoD, unremarked. Pause | 20 |
| 8 | Teach: Sprint Planning, Sprint Goal, Sprint Backlog | 15 |
| 9 | Sim: Planning topics one to three. Pause on the forecast | 25 |
| 10 | Reflect: forecast or commitment? | 10 |
| 11 | Sim: day 1. Pause at day end | 20 |
| 12 | Teach: the Daily Scrum. Hold it or not on day 2 | 10 |
| 13 | Sim: days 2 and 3. Pause | 25 |
| 14 | Teach: Sprint Review, stakeholders, empiricism made visible | 15 |
| 15 | Sim: Review. Write one visitor ask as a PBI. Pause | 20 |
| 16 | Teach: the Retrospective | 10 |
| 17 | Sim: Retro. The decision log with costs. Pause | 20 |
| 18 | Reflect: how did it go? What did Done mean? | 15 |
| 19 | Teach: Definition of Done, the third commitment | 15 |
| 20 | Sim: full run in groups, three Sprints, DoD raised at each Retro | 60 |
| 21 | Debrief: all zoos on one screen. What goes to Monday | 25 |

### Decisions in the Agenda

- **Definition of Done is taught last.** Sprint 1 runs on a thin default DoD nobody was asked about, so the Retro question "what did Done mean?" gets "we never said".
- **The three commitments are the thread.** Product Goal, then Sprint Goal, then Definition of Done, in the order a team meets them.
- **The Daily Scrum has its own slot.** The game lets learners skip it and then charges for it. The Retro shows the cost.
- **A human plays the Scrum Master in the group run.** In the guided run the AI holds that seat.
- **The full run has a time box and a debrief.** Without the debrief the learning stays inside the game.

## What the Game Needs for the Course

1. **Pause-all.** The trainer freezes every copy at the same moment and puts one question on every screen.
2. **Same seed for every team.** Same visitors, same blocker on the same day, so the debrief compares decisions, not luck. The reducer already supports this.
3. **A trainer's view.** Every team's four measures, Sprint Goal streak and decision log on one screen. This is the piece that most needs design.
4. **Course-mode flags.** DoD defaulted or agreed; teaching on or off; questions on or off.
5. **Seats mapped to breakout rooms.** One zoo per room, three to five people, each holding a seat. The `/zoo-game/together` route exists; it needs the trainer's view across rooms.

## Lesson Cards

Simple hand-drawn sketchnote style. One idea, one picture, one line to remember. Not slides. Use the board icons as the pictures where they fit.

## Scrum Rules for All Game and Course Copy

Al has corrected these before.

- The Scrum Team plans the Sprint together. Never "the PO planned it".
- The whole Scrum Team agrees the Definition of Done. The Developers hold each other to it.
- Refinement happens mid-Sprint, not as a phase before Sprint Planning.
- Velocity from a Sprint with no Definition of Done is a guess, not a measurement.
- Acceptance criteria belong to an item. The Definition of Done is the team-wide bar. Never merge or relabel them.
- Scrum Guide terms only. "Events", never "ceremonies".

## Earlier Material: What Is Current

| Source | Status |
|---|---|
| Course agenda and course requirements (2 Sep 2026) | Current. Reproduced above |
| Lesson-card spec, sketchnote style | Current |
| `zoo-flow-v2.zip` and `zoo-screen-flow.zip` notes on redesign rationale, attention hierarchy and course design | Use for rationale only; check against the items below |
| Isometric park frames | Superseded 9 Sep 2026. The park is top-down; a static isometric view lives on the Increment tab |
| Takeover build studio | Superseded 9 Sep 2026. Build straight on the park with controls around it |
| Separate design notes of 8 to 11 Sep 2026 | Superseded by `BUILD-A-ZOO-new-thinking.md` (hex park, river, car park, coins) |
| Build controls as panels or cards | Superseded 16 Sep 2026. One row of category dropdowns, with one palette dropdown for colour |

If anything in the older zips conflicts with this note or with `BUILD-A-ZOO-new-thinking.md`, the newer source wins. Ask Al before acting on a conflict.
