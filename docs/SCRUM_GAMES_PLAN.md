# Scrum Games: The Plan

Where the games are going, from the flow Alun set out. The rules they must obey are in
[SCRUM_MODEL.md](./SCRUM_MODEL.md); this is what to build and in what order.

Source material: the Professional Scrum Master course deck (122 slides, two days) and the exercises
deck (35 slides). The exercises deck already contains a Scrum Simulation built around an animal
sanctuary website, so `/zoo-game` is a digital version of an exercise that is already taught.

## The Two Products

**Single player** is a self-contained training simulation. A learner works through the Scrum
framework by building a zoo with it, and can pass a mock exam at the end. It has to teach, not just
be played.

**Multiplayer** is the same simulation for one Scrum Team of six to eight learners (ten at most,
matching the Scrum Team guidance), usually remote, each in their own browser, with a trainer able to
observe, pause, coach and resume. Scaling to several teams is later, and would follow LeSS.

## Learning Outcomes (Single Player)

1. Understand the Scrum framework.
2. Describe each element and its purpose.
3. Pass a mock exam.

Everything aligns to the Scrum Guide. Where the game shows a practice the Guide does not define, it
says so.

## Where The Model And The Flow Need Reconciling

Four things to settle before building. Three are wording; one is a real gap.

1. **Who may suggest the Sprint Goal.** The flow says the Product Owner might suggest it, and the
   Scrum Team then discusses, refines and agrees it, with the Scrum Master facilitating. The model
   document currently reads as though the PO may never propose one. Both are right about different
   moments: a proposal *inside Sprint Planning topic one, as a discussion starter that the Developers
   must agree*, is sound; what was removed was the PO writing the Goal during refinement, before the
   event, which pre-empted the conversation. **Action: sharpen the model's wording, and add a "the PO
   suggests a starting point" affordance inside topic one only.**
2. **Whose commitment the Sprint Goal is.** Course slide 45 says "a commitment by the Developers".
   The game says the whole Scrum Team crafts it. The Guide has the Scrum Team collaborate to define
   it, and the Sprint Backlog is by and for the Developers. **Action: pick one phrasing and use it in
   both the deck and the game, so learners do not meet two.**
3. **Definition of Ready.** The deck teaches it positively (refinement produces ready items the
   Developers can size). The model calls it a working agreement rather than a gate. Compatible.
   **Action: none, beyond keeping the game's "not required by Scrum" note.**
4. **Sprint cancellation is missing from both games.** Course slide 41: if the Sprint Goal becomes
   obsolete the Sprint can be cancelled, and only the Product Owner can do it. **Action: build it.**
   It is also a good trainer lever.

## What Exists Today

| Flow step | Zoo game today |
| --- | --- |
| Product Goal presented and explained | Shown and editable; no teaching of why, who, when, how |
| Initial discovery and Backlog creation | Initial refinement pass, deliberately "just enough" |
| Ongoing refinement | During the Sprint, costs build time, prepares later Sprints, ready horizon shown |
| Definition of Done | Editable, gates Done, adapted at the Retrospective |
| Sprint Planning, three topics | All three, in order, gated on a drafted Sprint Goal |
| Execute the plan, timed | Day clock, design and build, deploy, impediments |
| Daily Scrum | Held at day start or end, configurable |
| Sprint Review | Increment, visitor response, signals into the Backlog, Product Goal decision |
| Retrospective | Reflection prompts, DoD editing, one improvement, Sprint length |
| Repeat until the Product Goal is met | The PO decides at the Review; no fixed Sprint count |

The loop is there. What is missing is the **teaching**, the **assessment**, and everything to do with
**other people in the room**.

## Increment 1: Teach As You Play

The largest gap against the learning outcomes, and the one that makes the game stand alone.

- **A one-page intro** before play: the three artifacts and their commitments, the five events, the
  three accountabilities, the Scrum Values, empiricism and lean thinking. One screen, not a course.
- **Why / Who / When / How cards** for each element, shown in context the first time it is met (the
  Product Goal, the Product Backlog, a Product Backlog item, the Definition of Done, each event, each
  accountability), dismissible, and revisitable from a Scrum reference panel that is always to hand.
- **Timeboxes**, scaled to the chosen Sprint length, on each event, with the note that refinement is
  ongoing work and not an event.
- Vocabulary aligned to the deck so the game and the slides say the same words.

Size: medium. Mostly content, with a small card component and a reference panel.

## Increment 2: Close The Flow Gaps

- **Sprint Review agenda** restructured to the common pattern the flow describes: Product Goal and
  progress, the Sprint Goal and why, a demonstration of the product inviting stakeholder feedback
  that can become Backlog items, how the Sprint went, and a look ahead at what is next. The pieces
  exist; the order and framing do not.
- **Topic three plans refinement in.** The flow calls for deciding, at Sprint Planning, whether the
  state of the Backlog means refinement needs planning into the Sprint. Today refinement just happens
  ad hoc and charges the day clock. Make it a visible decision with a cost.
- **Sprint cancellation** by the Product Owner when the Sprint Goal becomes obsolete.

Size: medium.

## Increment 3: The Mock Exam

- A question bank tagged to the model: accountabilities, artifacts and commitments, events,
  Definition of Done, empiricism and lean thinking, and the practices that are not Scrum.
- PSM-style formats: multiple choice, multiple answer, true or false. Scored, with a pass mark.
- **Explanations that point back at the play**: "you extended a Sprint in Sprint 2, which is why this
  matters" beats a paragraph of theory. This is the thing a static quiz cannot do, and the reason to
  build the exam inside the game rather than beside it.

Size: medium. The bank is the work; the runner is small.

## Increment 4: Trainer Mode, Still Single Player

Useful before any multiplayer exists, because a trainer can already run this with a class playing
individually.

- **Scenarios**: a seeded Backlog and situation built to make one lesson land. Everything too big.
  A Product Owner who over-forecasts. A Sprint Goal put at risk on day two. Cheap to author once the
  seeding exists, and worth more than most features.
- **Debrief**: a timeline of what the learner actually did, with the decision points marked, beside
  the outcomes. Exportable, and shaped like a Retrospective. The Sailboat format fits: what pushed
  them along, what held them back, what they were aiming for, what the risks were.
- **Coaching on a switch**: nudges on for learning, off for assessment.

Size: scenarios small each, debrief medium.

## Increment 5: Multiplayer, One Scrum Team

- **Session and join code**, state shared over Supabase Realtime. The reducer is pure and the state
  serialisable, so the transport is the new part, not the model.
- **Role assignment and role-gated actions.** This is the teaching, not the plumbing: the Developers
  size, the Product Owner orders the Backlog and decides the Product Goal is met, the Scrum Master
  facilitates and cannot do the work. The refinement conversation stops being generated lines and
  becomes a real one, with the game holding each person to their accountability.
- **Presence and conflict handling**: who is here, who is editing, last write wins on positions.
- **Facilitator view**: observe everything, pause and resume the clock, inject an impediment or a
  change of mind, step in at a teaching moment, then hand back.
- Remote first: browser per player, no install, works alongside a video call.

Size: large. Worth splitting: session and shared state, then role gating, then facilitator controls.

## Increment 6: Scaling, Later

Several teams on one product, following LeSS: one Product Backlog, one Product Owner, one Definition
of Done, shared Sprint. Explicitly deferred, and a reason not to bake single-team assumptions into
any shared core extracted before it.

## Order

1. Teach as you play (Increment 1).
2. Close the flow gaps (Increment 2).
3. Scenarios, then the debrief (Increment 4).
4. The mock exam (Increment 3).
5. Multiplayer (Increment 5).

Scenarios and the debrief are pulled ahead of the exam because they make the game usable in a
classroom immediately, with or without multiplayer.
