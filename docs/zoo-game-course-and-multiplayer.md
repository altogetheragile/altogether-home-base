# Build A Zoo: Supporting A Course, And A Multi-Player Team Game

Taking stock of what the Scrum-teaching game is now, and how it can grow into
(a) a facilitation tool for a course, and (b) a multi-player team game.

## What We Have Built (The Asset)

It is not a quiz or a checklist. It is a **full, faithful Scrum loop with a
consequence engine**. Three properties make it valuable for both directions:

1. **The whole loop, end to end.** Product Backlog -> refinement -> Sprint
   Planning (Why / What / How) -> a timed Sprint (To Do -> Doing -> Deploy ->
   Done, with Daily Scrums) -> Review -> Retrospective -> repeat. Most Scrum
   simulations only cover a fragment; this covers all of it, with the events,
   artifacts and commitments (Product Goal, Sprint Goal, Definition of Done),
   empiricism (transparency on the board, inspection at the Daily Scrum and
   Review, adaptation at the Retro), a self-organising team that pulls work, and
   a WIP-limited board.
2. **A real feedback system.** The visitor simulation turns decisions into
   outcomes: happiness, word-of-mouth attendance, empirical velocity, forecast
   versus delivered. Over-commit, weaken the Definition of Done, or ignore a
   blocker and you feel it the next Sprint. Consequences without real-world cost
   is what makes it experiential rather than didactic.
3. **Deterministic and seated.** A seeded RNG makes every run reproducible; games
   save and resume (Supabase auth). The Scrum Team is already visible and
   "seated" (Product Owner / Scrum Master / Developers with editable names) - we
   built that deliberately as a multiplayer foundation.

Whole-loop, consequences, deterministic-and-seated: those are exactly the
properties a course and a team game both need.

## Direction A: Supporting A Course (High Value, Low Engineering)

Mostly leverages what already exists.

- **Scenario seeds.** Because the game is deterministic, hand a cohort the same
  seed and everyone starts from an identical backlog and state. That enables a
  shared debrief: "everyone at seed 42 - what did you do differently, and why?"
  Extend to **scenario cards**: a seed plus one twist (a weak DoD, a mid-Sprint
  scope change, a blocker on day one) so each card teaches one lesson.
- **Debrief export (the biggest single unlock).** Add "share my Sprint summary"
  - velocity trend, forecast versus delivered, happiness, the Retrospective
  answers - so learners bring their own run into the room. Facilitation lives or
  dies on having something concrete to inspect together.
- **Facilitator and challenge modes.** Learn mode already pauses the clock for
  teaching. Add objective-based challenges ("hit the Product Goal in three
  Sprints without over-committing"; "recover from a weak DoD") for assessment or
  exam-prep reinforcement, and map key moments to the practice-exam topics
  (Professional Scrum Master, AgilePM).
- **Course embedding.** The game can hang off a course page as the "lab", gated
  to enrolled learners - the auth and Supabase plumbing already exists.

Every one of these also serves multiplayer later, so none of it is throwaway.

## Direction B: A Multi-Player Team Game (Bigger, Phased)

The one real architectural fork: the game is currently **client-side and
deterministic**; multiplayer needs **shared state** (Supabase Realtime). Take it
crawl, walk, run.

1. **Shared / observed session (lightest).** One facilitator drives the game; the
   class mirrors the same board live on their own screens, read-only. Ideal for a
   classroom where the instructor plays and the group discusses. A modest
   Realtime addition - broadcast state, everyone watches.
2. **Seated roles (true multiplayer).** Players take Product Owner / Scrum Master
   / Developer seats and each performs their own actions: the PO orders the
   Backlog and sets the goals; the Developers pull, estimate and build; the Scrum
   Master removes impediments. State syncs between them. This teaches the
   accountabilities by making people actually do them, not read about them. This
   is the step that needs authoritative shared state, presence, and role-gated
   actions.
3. **Collaborative rituals.** Real multi-player Planning Poker (the mechanic
   already exists), a live Daily Scrum, a shared Retrospective board people add
   to together. This is where it becomes a genuine team experience rather than a
   synchronised single-player game.

## Recommendation And Sequence

Do the **course-facilitation layer first**. It is small, ships value immediately
into the training business, and every piece (scenario seeds, debrief export,
challenge mode) is reused by multiplayer. Then take multiplayer in phases,
starting with the observed shared session (phase 1), which is the cheapest way to
prove the shared-state plumbing before investing in seated roles.

Suggested order:

1. Debrief export + scenario seeds (days, not weeks).
2. Challenge / objective mode + a couple of scenario cards mapped to exam topics.
3. Multiplayer phase 1: observed shared session (Realtime mirror).
4. Multiplayer phase 2: seated roles with role-gated actions.
5. Multiplayer phase 3: collaborative rituals (poker, Daily Scrum, Retro board).

## The Decision

Pick where to invest first:

- **A.** Build the course-facilitation layer now (seeds / scenarios + debrief
  export + challenge mode).
- **B.** Go straight for multiplayer, starting with the observed shared session.
- **C.** Expand any of the above into a detailed build plan before committing.

Any of these can be prototyped against the current single-player engine without
throwing work away.
