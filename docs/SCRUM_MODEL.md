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
- **The Sprint Goal is crafted by the whole Scrum Team** during Sprint Planning. The Product Owner
  does not hand one down, and nothing outside Sprint Planning may write it.
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
- If work is not finishing, a longer Sprint is rarely the fix. Smaller items usually are.

## The Events

**Sprint Planning** answers three topics, in order: why this Sprint is valuable (the Sprint Goal),
what can be Done (the forecast), and how the work will get done (the plan). It does **not** size
items, split items or set the Sprint length. Only items that are ready may be forecast.

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

**Ready** is not a Scrum term in the sense of a gate. The Guide says only that items which can be
Done within a Sprint are "deemed ready for selection". A **Definition of Ready** is a working
agreement a team may choose to have, and the games must present it that way: the team's own, editable,
and a conversation rather than a stage gate. What the games actually enforce is the minimum that can
be checked: an item is not ready if it is too big to build in a Sprint, is unsized, or has no
acceptance criteria.

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
2. Sprint Planning cannot size, split, or set the Sprint length (`planSprint`, `notReady`).
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

## Decisions We Have Already Made

Kept so they are not relitigated:

- **2026-08-14** Refinement charges the Sprint it happens in, not the Sprint it prepares. An earlier
  model docked the Sprint about to be planned, which implied refinement buys the next Sprint.
- **2026-08-14** The Product Owner does not propose a Sprint Goal, even to seed an empty field. It
  bypassed the team crafting one.
- **2026-08-15** Sprint length moved out of Sprint Planning entirely.
- **2026-08-13** Work that is Done but not released carries forward as an Increment awaiting release,
  labelled with the Sprint it was built in. It is not re-estimated: it is finished.
