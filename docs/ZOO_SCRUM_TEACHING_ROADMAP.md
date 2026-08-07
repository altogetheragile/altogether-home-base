# Zoo Game - Scrum Teaching Roadmap

A gap analysis of the Build A Zoo game against the Scrum Guide (2020), organised by the
four areas of the Altogether Agile Professional Scrum Master exam (Scrum Theory, Scrum
Team, Scrum Events, Scrum Artifacts), plus a concrete implementation plan for the gaps.

Grounding: the exam's own questions live in Supabase (kept out of the repo to preserve
exam value). The in-repo teaching content is `src/components/scrumGame/learning.ts` (~11
paraphrased points), which the zoo game's event structure mirrors. That content is itself
missing the five Scrum Values and Sprint cancellation, so those gaps exist in both places.

---

## What The Zoo Game Already Teaches Well

- Empiricism in action: the Daily Scrum inspects and re-plans, the Review inspects the
  Increment with real stakeholders (the visitor simulation), the Retrospective chooses
  improvements, and a burndown shows progress toward the Sprint Goal.
- Definition of Done gates "Done" AND shapes the outcome (a weak DoD hurts the sim).
- The Sprint Goal is an outcome with starred essentials, not a to-do list.
- Empirical velocity: a forecast, not a cap; a rolling average of actual delivery;
  forecast vs delivered shown at the Review.
- The Product Owner orders the Backlog and never estimates; the Developers estimate.
- WIP limit, ongoing refinement that costs Sprint time, impediments removed by the Scrum
  Master, unfinished work returning to the Backlog, and releasing at any time (not waiting
  for the Review).

---

## Gaps vs The Scrum Guide, By Exam Area

### Scrum Theory (biggest gap)
- The five Scrum Values (Commitment, Focus, Openness, Respect, Courage) are absent. The
  game exercises them but never names them.
- The three empiricism pillars (Transparency, Inspection, Adaptation) are done but not
  labelled, so the "why" stays implicit.
- Transparency and Lean (reduce waste) are implied by the board, DoD and WIP, never
  called out.

### Scrum Team
- The Scrum Master is thin - modelled only as a blocker-remover. Missing: coaching
  self-management, serving the Product Owner (Backlog techniques) and the organisation,
  and making events effective (not just ensuring they happen).
- The Product Owner is one accountable person (may delegate the doing, keeps the
  accountability) - not tested.
- Developers holding each other accountable and instilling quality - only partly, via DoD.
- Cross-functional, self-managing, ten or fewer, no sub-teams - hard in solo play; worth
  a one-line teach.

### Scrum Events
- Cancelling a Sprint is entirely missing, and is a classic exam item: only the Product
  Owner can cancel, and only when the Sprint Goal becomes obsolete.
- The Daily Scrum is by and for the Developers (the Scrum Master ensures it happens but
  does not run it; it is not a status report) - the current framing is generic.
- The Sprint as a container, no changes that endanger the Goal, quality never decreasing -
  mostly present.

### Scrum Artifacts (and their commitments)
- The artifact-to-commitment triad (Product Backlog -> Product Goal, Sprint Backlog ->
  Sprint Goal, Increment -> Definition of Done) exists in the game but is not taught as
  the unifying frame.
- Defects and bugs go on the Product Backlog - no notion of a released item developing an
  issue.
- Multiple Increments per Sprint, and an Increment being usable regardless of release -
  partly (release-anytime); could be named.

---

## Prioritised Teaching Points

1. Sprint cancellation (Product-Owner-only, obsolete Goal) - top exam gap, memorable
   mechanic.
2. Surface a Scrum Value at the moment it is used - cheap, high pedagogy.
3. Name the empiricism pillars - light coaching labels.
4. Defects -> Product Backlog - deepens the DoD and quality lesson.
5. Flesh out the Scrum Master - coach and servant-leader, not just blocker-remover.
6. Reframe the Daily Scrum as the Developers' event; make the triad explicit.

---

## Implementation Plan

The engine is pure: `engine.ts` functions -> `useZooGame.ts` reducer and callbacks ->
`types.ts` / `config.ts` state, rendered through the phase components (`SprintBoard`,
`DailyScrum`, `SprintReview`, `SprintRetro`, `SprintPlanning`) inside `ZooShell`.

### 1. Sprint Cancellation (Product-Owner-only, Obsolete Goal)
- Model: add `goalObsolete: { reason: string } | null` to state (default null). A seeded,
  low-probability "demand shift" event fires mid-Sprint (same mechanism as
  `generateImpediment`, keyed on `gameSeed` + `sprintNumber` + day) and sets it, e.g.
  "Families have flocked to a rival's new aquarium; opening Big Cats no longer wins them
  back."
- Engine: `cancelSprint(state)` - keep Done/open items (they met the DoD, they are
  usable), return committed-but-unfinished work to the Backlog (reuse `reviewSprint`'s
  unfinished path), record velocity for Done points, then route to the Review with a
  `cancelled` flag so the copy explains it. Action `CANCEL_SPRINT` plus callback.
- UI: a banner on `SprintBoard` ONLY when `goalObsolete` is set - "As Product Owner, you
  may cancel this Sprint - the Goal is obsolete." - plus a "Cancel Sprint (Product Owner)"
  button. It is absent when you are merely behind. That absence is the teaching:
  cancellation is the PO's call, only for an obsolete Goal.
- Effort: medium (one PR).

### 2 + 3. Scrum Values + Empiricism Pillars = One "Coaching Layer"
- Model: none - pure UI. A `SCRUM_VALUES` and `PILLARS` table (key, label, one-liner,
  icon) in a small module.
- UI (contextual badges and tooltips):
  - Focus on the WIP chip when you hit the limit; Commitment on the Sprint-Goal chip at
    Planning ("to the Goal, not the scope"); Courage at the Daily Scrum when behind or
    blocked ("surface the risk"); Openness on the burndown; Respect at the Review (the
    visitors are the customer's voice).
  - Pillars as eyebrows: the board = Transparency, the Daily Scrum / Review / Retro =
    Inspection -> Adaptation.
  - A "Scrum At A Glance" header popover (same pattern as the DoD and Product-Goal
    popovers) listing the five values and the pillars.
- A `coaching` toggle (persisted, like Learn mode) so experienced players can mute it.
- Effort: low (one PR), high pedagogy.

### 4. Defects -> Product Backlog
- Model / Engine: in `reviewSprint`, deterministically flag at-risk released items (low
  appeal, or a weak DoD = few criteria, or a rushed build) and, with seeded probability,
  add a bug PBI to the Backlog (unsized), e.g. "Fix: Lion enclosure fence gap."
- UI: it surfaces in the Review's "What visitors said" as a complaint, with a note "A
  defect was added to the Product Backlog."
- Teaching: bugs are ordinary PBIs the PO orders against new value; a strong Definition of
  Done prevents them - reinforcing the DoD-to-quality link the game already models.
- Effort: medium (one PR).

### 5. Flesh Out The Scrum Master
- Today the SM is only blocker-removal plus `scrumDiscipline`. Extend the Retro
  improvement catalogue with servant-leader options framed as serving team / PO /
  organisation, e.g. "SM coaches self-management -> the team pulls work without being
  assigned" (unlocks a small focus or flow benefit), "SM facilitates the Review ->
  sharper stakeholder feedback." These plug into the existing `improvements` mechanism,
  plus SM coaching tips at each event.
- Effort: low to medium (fits alongside the coaching layer, or its own PR).

### 6. Reframe The Daily Scrum + The Artifact-To-Commitment Triad
- Daily Scrum copy (`DailyScrum.tsx`): make it explicitly the Developers' event - inspect
  toward the Sprint Goal and re-plan; the SM keeps it effective but does not run it; not a
  status report.
- Triad in the "Scrum At A Glance" popover: Product Backlog -> Product Goal, Sprint
  Backlog -> Sprint Goal, Increment -> Definition of Done.
- Effort: trivial (folds into the coaching layer PR).

---

## Suggested Build Order

1. Coaching layer (items 2, 3, 6 plus the triad) - one low-risk PR that lifts teaching
   everywhere.
2. Sprint cancellation (item 1) - the headline exam gap.
3. Defects -> Backlog (item 4) - deepens the DoD and quality lesson.
4. Scrum Master depth (item 5) - rounds out the accountabilities.

Each ships the usual way: branch, then lint (eslint at the 134-warning cap) / tsc /
vitest, then a PR, then CI, then merge, then verify both Vercel deploys.

---

## Revisions From Review (v2)

### Fidelity Corrections (Bake Into The Teaching)
1. Velocity and story points are NOT mandated by the Scrum Guide - they are common
   complementary practices for forecasting, not Scrum itself. Teaching: add a coaching
   note at estimation / Planning - "Scrum asks the Developers to size and forecast the
   work and to inspect empirically; it does not mandate story points or velocity. We use
   them here as one honest way to forecast." This is a real exam point.
2. WIP limits and flow are NOT Scrum Guide elements; they come from Lean thinking, which
   Scrum Theory names as a foundation alongside empiricism. Teaching: label the WIP chip
   and the burndown as Lean thinking that supports Scrum, not as Scrum rules.
3. "Re-plan" should read "adapt" throughout - adaptation is the Scrum term. Update the
   Daily Scrum copy (and this doc) accordingly.

### 4. Coaching Questions In The Retrospective
- Engine: `retroQuestions(state)` returns two or three contextual reflective prompts based
  on what actually happened this Sprint (goal missed, over-committed, weak Definition of
  Done, blocker ignored, WIP breached), drawn from a catalogue tagged by condition and
  seeded for variety.
- UI: render as prompts in `SprintRetro` - reflective, optional self-answer, no scoring -
  e.g. "The Sprint Goal was missed - what would have protected it?", "Which Scrum Value
  was hardest to live this Sprint?", "Where did a weak Definition of Done cost you later?"
- Effort: low to medium (one PR). Pairs well with the coaching layer.

### 5. Visible Scrum Team
- Goal: make the Scrum Team visible (as the /scrum-game does), so the accountabilities are
  concrete rather than "hats" in a tooltip.
- Scoped build: a team strip showing the three accountabilities - Product Owner (orders
  the Backlog, owns value), Scrum Master (clears the way, coaches self-management), and a
  small number of Developers (build the Increment). During the Sprint, Developers can be
  assigned to Doing items (swarm), tying into WIP and flow: more Developers on one item
  finishes it sooner; spreading them thin slows everything (teaching Focus / limit WIP,
  which is Lean thinking per correction 2).
- Model: a `team` on state (Developer count and names) plus per-item assignment; capacity
  and build speed derive from Developers on the item. This is the larger item - scope to
  confirm (avatars only, vs a full assignment / swarm simulation).
- Effort: medium to large.

### 6. The Product Backlog Drives All Work (Place And Open)
- Note: this REVISES an earlier deliberate decision that kept "place" and "open" OUT of
  the plan (a free Open button and a free drag). The new principle: nothing reaches the
  park except by delivering Backlog work, and placing and opening ARE part of that work.
- Options to confirm:
  - (a) Make "Place in the park" and "Open to visitors" the final steps of an item's plan
    or Definition of Done, so an item is not truly delivered until it is placed and opened.
  - (b) Keep build -> Done, but "release" (open) becomes an explicit acceptance step and
    placement a required task - both flowing from the item rather than free actions.
- Either way, the park changes only as a result of completing Backlog items, reinforcing
  "plan the work, work the plan" and that the Increment is what has actually been
  delivered.
- Effort: medium; touches the plan / Definition of Done model and the Open / drag flows.
