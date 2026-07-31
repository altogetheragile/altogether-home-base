# Build A Zoo: A Scrum Learning Game

**Design Spec v2.** Consolidated design across all prototypes and decisions.

**Status:** Prototyped in standalone HTML artifacts; the core loop is already
validated in the existing `/scrum-game` code. This document is the design
reference, and eventually the build brief.

**Content rules:** no em dashes; say "events" not "ceremonies"; never "certified";
Title Case headings.

---

## 1. Vision

You build and run a zoo, and learn Scrum by doing it. The zoo (the Product Goal)
grows exhibit by exhibit; real visitors give computed feedback; you plan, build,
review and adapt in Sprints. The Scrum is not narrated on the side: it is how you
play.

## 2. Two Versions, One Engine

- **Single-player (public website visitor):** self-guided, intuitive, relaxed. It
  must onboard a cold visitor with no coach in the room. Lighter timing and softer
  penalties.
- **Multiplayer (training courses):** the Scrum Team plays together, facilitated.
  Roles and information are split across people so finishing takes real
  coordination. Full timing and Daily Scrum accountability. (Detailed design of
  roles and split information is still open; see section 18.)

Both sit on the same pure, deterministic reducer (plan, build, review, retro)
reused from the existing `/scrum-game`.

## 3. The Scrum Loop

| Scrum | In the game | Reuse or new |
|---|---|---|
| Product Goal | "Open the zoo": fill the themed zones | Reuse, more tangible |
| Product Backlog | exhibits and amenities, grouped into zones; dynamic and emergent | Reuse plus growth |
| Refinement and Estimation | ready and size items (size and design complexity) | Reuse |
| Sprint Planning | commit items to a velocity-driven capacity | Reuse |
| The Sprint (build) | timed days, active Daily Scrums, design-and-build items | New build and timed days |
| Definition of Done and Acceptance Criteria | product-wide DoD plus per-item AC | Reuse DoD, add AC |
| Sprint Review | inspect what was Done and the visitor response, adapt the Backlog | Enhanced |
| Retrospective | one improvement; refine the DoD | Reuse |
| Velocity | Done points per Sprint; drives next capacity | Reuse |

## 4. Product Goal

Coached creation, like the Sprint Goal: "A wildlife park that [who] love, so that
[outcome]." It is long-lived: revisited and refined as the product evolves, and
replaced when met. It orients the Backlog and the zones.

## 5. Product Backlog: Dynamic And Emergent

The Backlog does not start as a finished list. It begins rough and partial (a few
obvious ideas) and grows and changes from play, mainly from visitor feedback and
signals. New items, and even new zones, emerge; planned ones get dropped or
reshaped. Refinement is continuous: a little every Sprint (add, remove, split,
estimate, re-order). It is never complete.

Items are **exhibits** (animals) and **amenities** (cafe, toilets, seating,
paths). They are grouped into **themes, which are zones** (Big Cats, Waterside,
and so on). A zone is an epic: a goal spanning several Sprints. A zone is not
truly done until it is served (a zone full of animals with no toilets nearby still
sends its visitors home early).

## 6. Refinement And Estimation

Ready means small, clear, and carrying acceptance criteria. Estimate from size and
complexity: bigger and more detailed exhibits, more colours and features, cost
more points. The people who will build it estimate (planning poker). Ongoing, not
a one-off.

## 7. Definition Of Done And Acceptance Criteria

These are different things.

- **Acceptance Criteria** are per item: what makes this exhibit correct (a parrot
  needs a beak, a crest, at least two colours). Set during Refinement, different
  for every item.
- **Definition of Done** is product-wide, team-owned and editable: the bar every
  item clears to be shippable ("meets its acceptance criteria", "fits its zone
  theme", "no unfinished patches", "safe and accessible"). Strengthened at the
  Retrospective.

An item is **Done** when it meets its acceptance criteria and the Definition of
Done. "Meets its acceptance criteria" is one line of the DoD.

## 8. Sprint Planning And Capacity

Commit items up to a **capacity**. The first Sprint uses a starter guess;
thereafter capacity is the team's **average velocity**. Over-commit is warned and
carries over. Agree and refine a **Sprint Goal** (coached, like the Product Goal).

## 9. The Sprint: Timed Days And The Daily Scrum

- A Sprint is **N timed days**. Each day is a timed building session.
- **Time is the only constraint on how much you build.** There is no artificial
  per-day cap: you build whatever you can carry to the Definition of Done. The
  lesson is to finish, not to start: a finished exhibit delivers value, a
  half-built one delivers nothing (not Done, no value, rolls over and is
  re-estimated to the work that is left). Rushing to "finish" more by cutting
  corners fails the DoD and creates defects and rework. So the game pushes you to
  commit less and finish it: focus and finishing beat starting and rushing.
- The **Daily Scrum is the Developers' event.** They run it each day to inspect
  progress toward the Sprint Goal and re-plan. The **Scrum Master is accountable
  for the event happening** and being effective, but does not have to attend or run
  it.
  - **Hold it:** you catch impediments early, so they cost less.
  - **Skip it** (tempting, because under the clock it buys building time): the next
    day an impediment surfaces that the Daily Scrum would have caught, with a
    coaching tip noting it could have been captured a day earlier and cost less.
    The penalty is that it is now more expensive, because the team did not inspect
    and adapt, not because anyone missed a meeting.
- **Ad hoc impediments** also arise during the Sprint regardless. The Daily Scrum
  is where the Developers surface them and the Scrum Master helps clear them.
- Calibration: full timing and real penalties in training; lighter timing and
  softer penalties for the casual single-player.

## 10. The Build Mechanic: Design And Build

Pick a **template** (guided): an animal (bird, fish, lion) or a piece of
infrastructure (cafe, toilets). **Tailor the finish** from curated options
(palette, pattern, features). The shape is given; the finish is your craft. It is
Done when it meets its acceptance criteria and the DoD.

Crucially, **design choices are the product**: they feed how much visitors value
it (section 12). During design you do not see appeal numbers; you commit a design,
open it, then learn from the real reaction. That keeps the empiricism honest.

## 11. Releasing And The Sprint Review

**Releasing is not the Review.** A Done exhibit is potentially releasable, and the
team can **open it to visitors at any point during the Sprint**. You do not wait
for the Review to deploy. Visitors react from the moment it opens, so feedback and
signals accrue during the Sprint. The zoo fills in as you open exhibits, not at the
Review.

The **Sprint Review** is a separate inspect-and-adapt event: the team and
stakeholders review what was Done, the visitor response so far, and progress
toward the Product Goal, and **adapt the Product Backlog** together (signals become
candidate items; re-prioritise). It is a working conversation, not an acceptance or
release gate. Items were Done, and possibly already released, during the Sprint.

## 12. The Visitor Simulation

Customer feedback is **computed, not scripted**, and deterministic per seed. See
the separate Visitor Simulation Spec v1 for the full model. In summary:

- Three segments (Families, Enthusiasts, Comfort Seekers) with different tastes and
  needs.
- A **dwell-time model**: visitors accrue joy at exhibits they like; needs (food,
  toilets, rest) fire over time; a matching nearby amenity continues the visit, an
  unmet need cuts it short. This makes "great exhibits, nowhere to eat" emerge, not
  get declared.
- **Word of mouth** compounds attendance; **crowding** bites when success outgrows
  capacity.
- **Anti-scripting:** per-game taste jitter and attendance drift, so you must read
  the feedback each game, not memorise a build order.
- **Signals** are hints the simulation emits: candidate improvements with a value
  band ("add toilets near Big Cats"). A signal is not auto-added to the Backlog;
  the Product Owner (the player) decides whether to act on it. **Ignored signals
  persist and get worse** until addressed.
- The player stays Product Owner: the simulation emits signals, it never reorders
  the Backlog.

## 13. Retrospective

Inspect how the team worked; pick one improvement to carry forward. This is where
the team refines and strengthens the **Definition of Done**.

## 14. Velocity

Done points per Sprint. It drives the next Sprint's capacity and settles as
forecasts get honest.

## 15. The Main Zoo Area

A top-down park of **themed zones**; each zone groups related exhibits with its own
nearby amenities. Exhibits show your tailored designs; visitors from the simulation
wander; a heads-up display tracks zones, exhibits, visitors and happiness. Items
are **auto-placed** into authored plots: there is no map-planning or pathfinding as
gameplay, so it stays a Scrum game, not a park-planning game.

## 16. Onboarding (Casual Version)

Welcome (the goal in one sentence), then a **pre-picked easy first item** so there
is no choice paralysis, then a **coach that always says the next step** and
introduces each Scrum term just in time. Skippable and hideable.

## 17. Prototypes Built So Far

At `claude.ai/code/artifact/<id>`:

- Guided zoo loop (plan, build, review, retro, with coach): `303fe39a-1353-4fcc-9ce3-c5aa68382436`
- Design studio (guided template, tailored finish, visitor reactions): `d96b2021-27f6-437b-9dde-047c89557dfa`
- Zoo scene (living park): `9cb5a0d4-2a2a-46a7-8b5f-766e9f164838`
- Themed zones (Big Cats and Waterside): `2558dd9c-7bcb-4b8f-bee2-31ac1ef1600a`

## 18. Open Decisions

- Multiplayer: how roles and split information work exactly (the single-player build
  does not depend on this).
- Whether the build stays purely design-and-build (customisation) or retains a
  puzzle or deduction element as an option.

Everything else is settled: timed days with finish-to-the-DoD (no per-day cap);
skipped Daily Scrum causes a next-day impediment plus a coaching tip; the Daily
Scrum is the Developers' event with the Scrum Master accountable for it happening;
the Review is not a release gate and Done work can be opened during the Sprint;
signals persist and worsen if ignored.

## 19. Build Approach

Reuse the existing `/scrum-game` pure-reducer engine (phases, estimation, velocity,
Definition of Done, Product Goal). New work: the build mechanic, the visitor
simulation (pure function plus acceptance tests first, per the sim spec), the zoo
and zones surface, timed days and the Daily Scrum, and the coach. Start with the
visitor simulation as a pure function with its honesty, determinism and no-script
tests, because it is cheap and it locks the architecture.
