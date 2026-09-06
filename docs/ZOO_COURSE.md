# Build A Zoo: A Course Around The Sim

Written 6 September 2026. A record of the discussion on 2 and 3 September about running a Scrum course with the sim at its centre, and what the sim needs to support it. The agenda is Al's, refined. The rest is the reasoning around it.

## The Question

Given a working Scrum sim, how does it fit a training course, and could the same thing serve self-study? Four shapes were considered. One was chosen.

## Four Ways To Put A Sim In A Course

**Slides then sim.** Teach the framework, then play. Familiar and easy to timetable. Online, the energy drops after the slides and the play becomes a test of the lecture. This is how most Scrum courses run and it is why most are dull.

**Sim then slides.** Play cold, debrief with slides using what happened. The slides land on experience: "you skipped the Daily Scrum on day 3 and it cost half a day" is a better slide than a definition. Some learners dislike playing before knowing the rules.

**Sim as the spine.** No deck. The game's own screens are the slides. Pause the game and talk. One artifact, one vocabulary. Depends wholly on the game working and on pause points being built.

**Async play, live debrief.** Learners play Sprint 1 alone before the session. Live time goes on Sprints 2 and 3 in teams, and the debrief. Some will not do the homework.

The shape chosen is a hybrid of the second and third: short teach blocks, each followed immediately by the matching part of the sim, with a pause after each. The deck is cut to what fits a block. The game's screens carry the rest.

## The Agenda

Six hours online with two breaks. Blocks 3 to 17 are a guided run with every learner playing their own copy in lockstep. Block 20 is the full run in groups.

| | Block | Mins |
|---|---|---|
| 1 | Introductions | 15 |
| 2 | Teach: agile and complexity, why empiricism | 25 |
| 3 | Sim: Scrum on one page. Seats, values, the loop | 10 |
| 4 | Teach: the Product Goal, the first commitment | 10 |
| 5 | Sim: write the Product Goal, the brief. Pause | 20 |
| 6 | Teach: Product Backlog and refinement | 15 |
| 7 | Sim: refine, agree Sprint length. Default DoD, unremarked. Pause | 20 |
| 8 | Teach: Sprint Planning, Sprint Goal, Sprint Backlog | 15 |
| 9 | Sim: Planning topics one to three. Pause on the bet | 25 |
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
| 21 | Debrief: four zoos, one screen. What goes to Monday | 25 |

## Decisions In The Agenda

**Definition of Done is taught last.** The best sequencing decision in the plan. Learners play Sprint 1 with a thin default DoD they were never asked about. At the Retro the question "what did Done mean?" gets the answer "we never said". Then the DoD is taught, and the group run raises it at every Retro. This needs a course-mode flag in the game so the guided run starts with the default unremarked.

**Empiricism is taught after the first Review, not before.** Block 2 gives the reason for it. Block 14 shows it, once a visitor has said the zebra fence looks unfinished. An idea until then; a fact after.

**The Daily Scrum has its own slot.** It is the event the sim lets you skip and then charges for. It is taught at the end of day 1, and the learner decides whether to hold it on day 2. That is a decision with a cost, which the Retro shows.

**User stories get a job.** Scrum does not require them and the sim's items are exhibits with acceptance criteria. Rather than a slide, block 15 has the learner write one visitor ask as a PBI. Practised, not taught.

**The three commitments are the thread.** Product Goal at block 4, Sprint Goal at block 8, Definition of Done at block 19. "Scrum has three artifacts and each has a commitment; we meet them in the order a team meets them." It gives the day a shape and it is the same shape as the game's tabs.

**The full run has a time box and a debrief.** Three Sprints, then twenty-five minutes in the main room. Without the debrief the learning stays inside the game.

**The Scrum Master is a person in the group run.** The AI plays that seat in the guided run, so nobody feels the job. In the group run a human takes it and the blockers are theirs. Otherwise the course teaches two accountabilities and names three.

## What The Sim Needs For This

- **Pause-all.** The trainer freezes every copy at the same moment and puts a question on every screen. Without it the guided run is the trainer playing on a shared screen with the class calling decisions, which works today but is weaker.
- **Same seed for every team.** Same visitors, same blocker on the same day, so the debrief compares decisions rather than luck. The reducer already supports this.
- **A trainer's view.** Every team's four measures, Sprint Goal streak and decision log on one screen. The one thing not in the design pack that a course needs, and the piece that needs proper design.
- **Course-mode flags.** DoD defaulted or agreed; teaching on or off; questions on or off.
- **Seats mapped to breakout rooms.** One zoo per room, three to five people, each holding a seat. The shared session route exists; what it needs is the trainer's view across rooms.

## Coverage Against The Scrum Master Deck

The deck (122 slides, five modules, PSM I-shaped) was checked against the sim.

| Module | The sim carries | Left to teach |
|---|---|---|
| Scrum Theory | Empiricism and iterative-incremental, lived each Sprint. Lean as "work not serving the goal is waste". | Complexity, Cynefin, servant-leadership. |
| The Scrum Framework | All three artifacts with commitments, all five events, the one-pager. | Values are shown, not tested. The Scrum Master seat. |
| Quality and Done | DoD with park evidence; undone work as the DoD teeth increment. | Technical debt as a named concept. |
| Product Delivery | Product Goal shapes, ordering, refinement cost, story points, velocity, Sprint Goal as commitment. | User stories, Definition of Ready as formal, cone of uncertainty, forecasting, fixed price. |
| The Scrum Master and the Team | Self-management at the Daily Scrum; task switching if a WIP limit is added. | Nearly all of it. |

So the sim carries modules two, three and most of four. Module one is a teach block. Module five is a separate half-day whether or not the sim exists. The agenda above is a Scrum Foundations day; the deck is a Scrum Master course. They are not the same product and the sim serves the first better.

Three cheap additions to close gaps: a forecast line at the Review ("at this velocity the Forest opens in Sprint 4"), a WIP-limit toggle at the Retro to show task switching with a number, and a human Scrum Master in the group run with the stances slide as the debrief question.

## Practice Questions

Two kinds, treated differently.

**Questions at the moment of decision.** The sim produces the scenarios PSM questions describe. When the moment arises the game asks the question, the learner answers, and the game does what they said. Get it wrong and the cost lands in the Retro with the misconception named. The strongest form, because the answer has a consequence. Built last, because it needs the "learning by breaking" mechanics.

**Questions at the pause points.** Five after each Sprint, exam-style, drawn from what happened in that zoo, scored apart from the park. A cumulative score sits beside the four measures at the debrief.

Two constraints. Write the bank; the Scrum Open questions are Scrum.org's. Keep the exam score away from the game score. And pick one voice for the answers, the Scrum Guide's or the deck's, because the deck departs from the Guide in places and so does the game's copy.

A sample set of five was written on 2 September, each answerable from something the learner had just done. A bank of about sixty in that shape, tagged by the moment that triggers each, covers the deck's first four modules.

## Self-Study From The Same Skeleton

Guided solo, classroom and self-study are three ways of driving one engine.

| | Guided solo | Classroom | Self-study |
|---|---|---|---|
| Engine | Same reducer, same seed | Same | Same |
| Seats | AI plus one human | Humans, one zoo per team | AI plus one human |
| Teaching | One-pager | Trainer talks; game pauses | Lesson cards at the pause points |
| Questions | None | At pause points, trainer-run | At pause points, self-marked |
| Pacing | Player's own | Trainer's pause-all | Player's own, with a syllabus |
| Record | Save file | Trainer's view | Progress, scores, a summary |

Four things make the layer, all data: **moments** (named points in the state, about twenty), **lessons** (a card keyed to a moment), **questions** (the bank, keyed to moments, with a consequence flag), and a **mode** object (teaching, questions, pause-all, DoD default, trainer's view). The reducer stays pure. Lessons and questions read state and record an answer; they never touch the park.

Lesson cards use the sketchnote style agreed on 4 September: a title box, one line underlined, four panels, and the line to remember boxed in orange. One card per moment. The fourth panel, "in the zoo", ties it to the screen the learner is looking at. Module five of the deck will not cut down to cards; it stays a deck or a reading.

Self-study is a Scrum Foundations course with practice questions, built and assessed by Altogether Agile. It cannot be called PSM prep.

## Two Trade-Offs Left Open

**Gameplay first or course mode first.** Course mode is where the revenue is and what a Westminster cohort could test this term. Gameplay is what is boring, and a teaching layer on a boring loop makes a boring course. The lean: hoardings and the bet first, because they are a fortnight and they change how the game feels; then course mode. If a cohort date is fixed, the reverse is defensible.

**One product or two.** Self-study on the website, classroom licensed to trainers. Same code, different price. The trainer's view is the only classroom-only piece and the one that turns a course into a tool other trainers would pay for.

## Build Order

1. Moments and the mode object. Small; makes everything else pluggable.
2. Question bank at pause points, no consequences. Ship in guided mode and see whether people answer.
3. Pause-all and the trainer's view. Run one cohort.
4. Lesson cards, from the deck. That is self-study, and it is mostly writing.
5. Questions with consequences. Last.

Each ships alone. The first two are a week each. The trainer's view needs proper design.
