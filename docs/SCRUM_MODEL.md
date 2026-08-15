# The Scrum Model

The rules every Altogether Agile Scrum game teaches. There are two games today, `/zoo-game` and
`/scrum-game`, and they must not teach contradictory things. This document is the shared model. The
code is one implementation of it; when they disagree, this document is what we meant.

Terminology follows the 2020 Scrum Guide, and is deliberate. Where we use something the Guide does
not define, we say so, both here and in the game.

## Why This Exists

Most of the design work on these games is not code, it is deciding what is true. That work keeps
being redone: the same correction has been made twice in two codebases, and would be made a third
time in a third game. Writing the model down makes the next game correct by construction rather than
corrected afterwards.

## The Scrum Team

One team, three accountabilities. Not roles, and not sub-teams.

| Accountability | Accountable for | In the games |
| --- | --- | --- |
| Product Owner | Maximising value; the Product Backlog and its order; the Product Goal | Orders the Backlog, clarifies items, decides when the Product Goal is met |
| Scrum Master | The team's effectiveness; Scrum being understood and enacted | Coaching voice; the events happening; impediments being removed |
| Developers | Creating a usable Increment each Sprint; the Sprint Backlog; sizing | Build, size, forecast, and plan how the work gets done |

Rules the games enforce:

- **The Developers size the work.** The Guide: "The Developers who will be doing the work are
  responsible for the sizing. The Product Owner may influence the Developers by helping them
  understand and select trade-offs." Sizing is never the Product Owner's, and never automatic.
- **The Sprint Goal is defined by the whole Scrum Team, and is a commitment by the Developers.**
  Both halves are the Guide's, and they are not in tension. Topic one: "The Product Owner proposes
  how the product could increase its value and utility in the current Sprint. The whole Scrum Team
  then collaborates to define a Sprint Goal." The commitment: "Although the Sprint Goal is a
  commitment by the Developers, it provides flexibility in terms of the exact work needed to achieve
  it." So the Product Owner proposes value, the Scrum Team shapes the Goal together, and the
  Developers are the ones committed to it. Nothing outside Sprint Planning may write it: a Goal that
  arrives before the event has pre-empted the conversation the event exists for.
- **Work is pulled, not pushed.** The Product Owner proposes value and answers questions; they do not
  tell the Developers what to build. Topic two: "Through discussion with the Product Owner, the
  Developers select items from the Product Backlog to include in the current Sprint." Topic three:
  "How this is done is at the sole discretion of the Developers. No one else tells them how to turn
  Product Backlog items into Increments of value."
- **The Product Backlog's order is the Product Owner's.** The Developers do not reorder it. Within a
  Sprint, the order of work is the Developers' own.

## The Sprint

- A Sprint is a **fixed-length container**. That consistency is the point.
- The length is **agreed once**, before the first Sprint, and changed **only at a Sprint
  Retrospective**, applying from the next Sprint.
- The length is **never a Sprint Planning decision**. Sizing the box to the work is backwards: the
  timebox is fixed and the scope flexes against it.
- A Sprint is **never extended** to finish work. Unfinished work returns to the Product Backlog. That
  is information, not failure.
- A Sprint **can be cancelled**, and only by the Product Owner, if the Sprint Goal becomes obsolete.
  Done work is reviewed and may be accepted; incomplete items go back to the Product Backlog to be
  re-estimated. Cancellation is rare, and a new Sprint starts straight after.
- If work is not finishing, a longer Sprint is rarely the fix. Smaller items usually are.

## The Events

**Sprint Planning** answers three topics, in order: why this Sprint is valuable (the Sprint Goal),
what can be Done (the forecast), and how the work will get done (the plan). Only items that are
ready may be forecast. Refining an item here is allowed - "The Scrum Team may refine these items
during this process, which increases understanding and confidence" - but a Backlog refined during
the previous Sprint should not need it, and the time comes out of Planning. It does **not** set the
Sprint length: that is a cadence, agreed once.

**The Daily Scrum** is a short progress sync toward the Sprint Goal, for the Developers. Impediments
are surfaced there and removed outside it. It is not a status report to anyone, and it is not where
impediments are solved in detail. The Scrum Master is accountable for it happening, not for
attending.

**The Sprint Review** inspects the Increment with the people the product is for, and adapts the
Product Backlog. It is a working session, **not a release gate**: anything Done could have been
released the moment it was Done. Progress toward the Product Goal is discussed here, and the Product
Owner decides whether the Product Goal has been met.

**The Sprint Retrospective** inspects how the Scrum Team works and picks improvements. It is the only
place the Sprint length changes, and where the Definition of Done is adapted.

## The Artifacts And Their Commitments

| Artifact | Commitment | Notes |
| --- | --- | --- |
| Product Backlog | Product Goal | Ordered by the Product Owner; the single source of work |
| Sprint Backlog | Sprint Goal | The Developers' plan: the Goal, the selected items, and how |
| Increment | Definition of Done | Something Done is a usable stepping stone toward the Product Goal |

**"Commitment" is reserved for those three.** Everywhere else the Developers *select* and *forecast*.
A Sprint forecast is not a promise, and the games' copy must not imply that it is.

## Product Backlog Refinement

- It is **ongoing work during a Sprint**, done by the whole Scrum Team. It is not an event, and there
  is no gap between Sprints for it to happen in.
- The Product Owner brings why an item matters and what they would trade. The Developers bring what
  it would take, what is unclear, and the size.
- It **prepares later Sprints**, typically two or three ahead. It does not settle what goes into the
  next Sprint. That is decided at Sprint Planning, from whatever is ready by then.
- It **costs the Sprint it happens in**. Time spent refining is time not spent building, and the
  games must make that trade-off felt rather than free.
- **Before the first Sprint** there is an initial pass: enough discovery to get started, a Sprint or
  two of ready work, not the whole product. Detailed analysis of work that may never be built is
  waste, and what is learned from the first Increment will change it.

## Ready And Done

**Done** is the Definition of Done: the Increment's commitment, product-wide, and the completion gate
every item passes. Acceptance criteria are per item and are not the Definition of Done.

**Ready** is the Guide's word, and it means one thing: "Product Backlog items that can be Done by
the Scrum Team within one Sprint are deemed ready for selection in a Sprint Planning event." That is
all it says. A **Definition of Ready** is a common practice, not mandated by the Scrum Guide, and the
games must present it that way: the team's own working agreement, editable, a conversation rather
than a stage gate. What the games enforce is the minimum that can be checked: an item is not ready
if it is too big to be Done in a Sprint, is unsized, or has no acceptance criteria.

## What Is Not Scrum

These appear in the games because they are useful and common, and each is labelled in the UI as a
practice rather than part of Scrum:

- Velocity, and capacity forecast from it
- Story points, and planning poker
- Epics, and splitting them
- The Definition of Ready
- Burndown charts
- Work in progress limits (Lean, not Scrum)
- Sprint length as a menu of options

## The Rules The Games Enforce

A checklist for any new game, and for reviewing an existing one. Zoo implementation in brackets.

1. Sprint length agreed once, changed only at a Retrospective (`setSprintDays`).
2. Sprint Planning cannot forecast unready work, and cannot set the Sprint length. It CAN refine an
   item to make it ready, while saying that a well-refined Backlog would not need it (`planSprint`,
   `notReady`).
3. Only ready items can be forecast, and the reason is shown when they cannot (`isReady`).
4. The Sprint Goal is written by the player, never seeded by the Product Owner or by refinement
   (`applyPoRefinements`, `isDraftedGoal`).
5. Refinement costs the Sprint it happens in, and prepares later ones (`chargeRefine`,
   `readyHorizon`).
6. Unfinished work returns to the Product Backlog to be re-sized against what is left
   (`reviewSprint`).
7. Done work can be released at any point in the Sprint, not only at the Review (`openItem`).
8. The Product Owner decides the Product Goal is met; there is no fixed number of Sprints
   (`productGoalProgress`).
9. The Developers size; the Product Owner influences trade-offs (`refinementTalk`).
10. Practices that are not Scrum say so where they appear.
11. Only the Product Owner can cancel a Sprint, and only when the Sprint Goal is obsolete
    (`cancelSprint`).

## Decisions We Have Already Made

Kept so they are not relitigated:

- **2026-08-14** Refinement charges the Sprint it happens in, not the Sprint it prepares. An earlier
  model docked the Sprint about to be planned, which implied refinement buys the next Sprint.
- **2026-08-14** The Product Owner does not propose a Sprint Goal *outside* Sprint Planning, even to
  seed an empty field: it bypassed the team crafting one. Suggesting a starting point inside topic
  one, for the team to discuss and agree, is a different thing and is sound.
- **2026-08-15** Sprint length moved out of Sprint Planning entirely.
- **2026-08-15** Refining IS allowed in Sprint Planning - the Guide permits it in topic two - but the
  game says you should not need to. An earlier rule forbade it outright, which was wrong.
- **2026-08-15** The Sprint Goal is both "defined by the whole Scrum Team" and "a commitment by the
  Developers": the Guide says both, and the games use both sentences rather than choosing.
- **2026-08-15** "Ready" carries only the Guide's meaning - can be Done within a Sprint. A Definition
  of Ready is labelled a common practice everywhere it appears.
- **2026-08-13** Work that is Done but not released carries forward as an Increment awaiting release,
  labelled with the Sprint it was built in. It is not re-estimated: it is finished.
