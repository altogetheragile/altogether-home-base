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
   obsolete the Sprint can be cancelled, and only the Product Owner can do it. **Built in the zoo
   game.** Still to do in `/scrum-game`.

All four are now settled. The first three are recorded in the model's decision log with the Guide's
own wording, so they are not reopened: the Sprint Goal is both defined by the whole Scrum Team and a
commitment by the Developers; the Product Owner proposes value while the Developers pull the work;
and "ready" carries only the Guide's meaning, with a Definition of Ready labelled a common
practice.

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
- **All of it skippable.** A learner who has just sat through the taught session should be able to
  turn the teaching off and play, and turn it back on from the reference panel.
- **Why / Who / When / How cards** for each element, shown in context the first time it is met (the
  Product Goal, the Product Backlog, a Product Backlog item, the Definition of Done, each event, each
  accountability), dismissible, and revisitable from a Scrum reference panel that is always to hand.
- **Timeboxes**, scaled to the chosen Sprint length, on each event, with the note that refinement is
  ongoing work and not an event.
- Vocabulary aligned to the deck so the game and the slides say the same words.

Size: medium. Mostly content, with a small card component and a reference panel.

## How A Screen Is Built

Learned the hard way: every increment added a layer and none took one away, and Sprint Planning
ended up with twelve competing regions. A learner could not tell what they were being asked. These
are the rules the screens now follow, so the next one does not have to be corrected afterwards.

1. **One question per screen**, in full size, phrased as the question the event actually asks -
   "Why is this Sprint valuable?", "What can we finish today?", "How did we work this Sprint?".
   Under it, one line saying what to do. If a screen needs two questions it is two steps.
2. **One thing to act on.** Whatever does not serve this question belongs on another screen or
   behind a control. Four board columns at Sprint Planning, where three are empty, is noise.
3. **One primary action**, bottom right, naming the next step. A disabled one says what is missing:
   "Next: colour the foliage" beats a greyed-out button.
4. **The words live behind the "?"** beside the question (`Explain.tsx`): what the Guide says, what
   the event inspects and adapts, and the teaching card the first time through. Not on the page.
5. **Nothing is said twice.** The shell does not stack a teaching card over a screen that carries
   its own, and the coach never repeats a heading - what is left is only what the screens do not
   say, which is what makes it worth reading.
6. **Progressive disclosure by default.** The Product Backlog is tucked away during the Sprint; a
   plan opens when you ask for it; the artifacts live in one panel with their commitments.
7. **One idea at a time.** Sprint 1 is the plain loop - forecast, build, deploy, inspect, adapt.
   A work-in-progress limit, a burndown and marking the Goal's essentials arrive at Sprint 2, when
   there is a Sprint behind you to compare against, and each introduces itself with a "New" chip
   saying why it has turned up now (`revealed()` in engine.ts, `NewHere.tsx`). An idea that has not
   been met is not enforced either - a rule nobody has explained, quietly blocking a button, is the
   worst of both. A player who goes looking (setting a WIP limit themselves) turns it on early.
8. **Shared parts for shared meaning**: `StepTrack` for "how far through am I", `PickCard` for
   choosing work, `ExplainButton` for "where are the words". If two screens do the same thing they
   look the same doing it.

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

Much smaller than it first looked. The site already has the whole apparatus: an `exams` and
`questions` bank with a published **Professional Scrum Master** paper, an exam player with exam and
practice modes, multi-answer support and references, and `exam_attempts` for tracking. The mock exam
**reuses the existing questions and player** rather than growing a second one.

What is actually needed:

- **Length choice** at the start: the full paper, half of it, or twenty questions. Same bank, same
  scoring, fewer questions.
- **Save and return.** `exam_attempts` already stores answers as JSON, so an unfinished attempt can
  be resumed rather than restarted.
- **Explanations that point back at the play**: "you extended a Sprint in Sprint 2, which is why this
  matters" beats a paragraph of theory. This is the thing a static quiz cannot do, and the reason to
  put the exam inside the game rather than beside it. It needs the play history that the debrief work
  produces, which is why the exam sits after it.

Size: small to medium, most of it in the length choice and resuming.

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
