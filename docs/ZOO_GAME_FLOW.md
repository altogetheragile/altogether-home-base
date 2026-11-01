# The Game Flow: The Whole of Scrum, And A Trainer's Own Flows

Status: **proposed, 1 November 2026.** Al's direction and three answers are under **Decided**. The
open questions are under **Questions**. Nothing here is built yet.

## What Al Asked For

> I think I want a solo player to start from a Product Goal, refine enough stories to start a PBL
> based upon a starter from the PO - epics for the zoo zones, write DoD, do Sprint Planning,
> execute the plan, refine large PBIs, run / attend a Sprint Review, run / attend a Sprint Retro.
> Multi-players do the same but work together. A trainer has the ability to set-up a flow based
> upon their teaching. A trainer could seed a PBL completely and set the initial Sprint Goal for
> example to get started quickly. They could skip a DoD and then drop a card saying no one is sure
> what finished actually looks like, etc.

## Decided

Al, 1 November 2026:

1. **The ladder becomes a trainer preset.** Starting on a planned Sprint 1 and being handed one
   practice per Retrospective stays in the game, but as one of the flows a trainer can choose. It
   is no longer how a game starts.
2. **Setup is for trainers only.** A solo player always plays the whole flow. There is no setup
   screen for them.
3. **Flows are reusable, and a trainer can reset one.** A trainer saves a flow ("Day 1 morning")
   and uses it again in later sessions. Reset puts a flow back to how it started.

## Where It Stands Today

There are two ways into a game, both on the opening screen.

- **"Start building"**, the main button. Sprint 1 arrives planned: Priya wrote the Sprint Goal, the
  work is already chosen, and there is no Definition of Done. Each Retrospective then hands over
  one practice, in a fixed order (`LADDER` in `engine.ts`): the Definition of Done, Sprint
  Planning, refinement, the bet on the Sprint. The code calls the order "deliberately not
  configurable".
- **"Write the Product Backlog myself"**, a quiet link beside it. This is most of the flow Al
  describes: the Product Goal, the Backlog Wizard's three questions, Refinement (which includes the
  Definition of Done), Sprint Planning, the Sprint, the Review and the Retrospective.

So most of the pieces exist. What is missing is that the whole flow is not the default, a trainer
cannot shape it, and the starter Product Backlog is not quite the one Al describes.

| Al's step | Today |
|---|---|
| Start from a Product Goal | Yes, on the opening screen |
| A starter Product Backlog from the Product Owner: an epic for each zone | Nearly. The first area arrives already refined (its habitat and animal), and every other area is an epic (`starterBacklog` in `config.ts`) |
| Refine enough stories to start | Yes, the Refinement screen: size, split, order |
| Write the Definition of Done | Yes, inside Refinement |
| Sprint Planning | Yes, the three topics |
| Execute the plan | Yes |
| Refine large Product Backlog items during the Sprint | Yes, once refinement is adopted; in the whole flow it is there from the start |
| Run or attend the Sprint Review | Yes. The redesign is queued, below |
| Run or attend the Sprint Retrospective | Yes. The redesign is queued, below |
| Several players doing the same together | Yes, since every player is a Developer (`docs/ZOO_EVERYONE_A_DEVELOPER.md`) |
| A trainer sets up a flow | **No** |
| A trainer seeds the Product Backlog or sets the Sprint Goal | **No** |
| A trainer skips a step and plays a card about it later | Half. Trainer cards exist; skipping a step does not |

## The Model

### The Whole Flow Is The Default

A solo game, and a shared game with no trainer, always runs the whole flow in Scrum's order:

1. **Product Goal.** The player writes or picks one, as now.
2. **The starter Product Backlog.** The Product Owner hands over **an epic for each zone**, plus the
   park's own pieces (the main pathways, the bridge). Nothing arrives refined. Today the first area
   arrives with its habitat and animal ready to build; in the whole flow that is the team's first
   piece of refinement.
3. **Refinement.** The team splits and sizes enough to start: at least a Sprint's worth, which the
   screen already measures.
4. **The Definition of Done.** Written by the team, in Refinement.
5. **Sprint Planning**, all three topics.
6. **The Sprint.** Build, the Daily Scrum, refining large items as they come up.
7. **The Sprint Review.**
8. **The Sprint Retrospective.** Its improvement goes on the Product Backlog or changes how the next
   Sprint runs, as now. It no longer hands over practices, because the team already has them all.

"Start building" goes from the opening screen. A solo player has one way in.

### A Flow Is A List Of Choices About Where The Game Starts

A flow is a name and a set of choices, each of which either leaves a step for the team or does it
for them before the game starts. Nothing in it changes the rules of Scrum. It changes what the team
is handed.

| Choice | Options | What "done for them" means |
|---|---|---|
| Product Goal | team writes it / given | The trainer's sentence is the Product Goal |
| Product Backlog | epics only / first area refined / fully refined | Fully refined: every zone split, sized and ordered |
| Definition of Done | team writes it / given / **none** | None: the team starts without one, and nothing asks for it |
| Sprint Goal for Sprint 1 | team writes it / given | The trainer's sentence, already agreed |
| Sprint 1's forecast | team chooses it / given | Sprint 1 starts planned, on the board |
| Refinement during a Sprint | available / not yet | "Not yet" is the ladder's rung |
| Sprint length | days | As the Numbers drawer has it today |
| Chance | on / off | Off: only the trainer's cards get in the way |
| The ladder | off / on | On: practices left out are handed over at Retrospectives, in the ladder's order |

**Presets** are flows that ship with the game, so a trainer never starts from nothing:

- **The whole of Scrum.** Every step is the team's. The default, and what a solo player gets.
- **Start building.** Today's main button: Sprint 1 planned, no Definition of Done, the ladder on.
- **Ready to go.** The Product Backlog fully refined, a Definition of Done given, the Sprint Goal
  given. The team starts at Sprint Planning topic two. For a short session.
- **Nobody knows what Done means.** The whole flow, with no Definition of Done.

A trainer copies a preset, changes it and saves it under their own name. Presets cannot be edited
in place, so a trainer always has the original to go back to.

### A Choice Can Bring A Card With It

Leaving something out is the setup half of a lesson. The other half is noticing it. So a choice can
suggest a trainer card, which appears at the top of the trainer's deck with the reason:

- **No Definition of Done** suggests **"Nobody is sure what finished looks like"**: two Developers
  call the same item Done for different reasons, and the Product Owner sends one back.
- **Sprint Goal given** suggests **"Who wrote this Goal?"**: a Developer asks at the Daily Scrum why
  the team is aiming at something it never agreed.
- **Product Backlog fully refined** suggests **"This item was never really ready"**: an item
  forecast at Planning turns out to be two items.

The card is suggested, not played. The trainer decides when, which is the point of a trainer. The
cards are ordinary deck cards, so an admin can edit or add to them in the deck editor as today.

### Reset

**Reset** puts a saved flow back to the preset it was copied from. It asks first, and it does not
touch games already played with the flow.

A second meaning is worth asking about (see **Questions**): restarting the current game from the
start of its flow, so a trainer can run the same opening twice in a session.

## Do We Need A Trainer View?

Yes, but a small one, and not during play.

- **Before the game: a Flows page.** This is new. It lists the presets and the trainer's own flows,
  with copy, edit, rename, reset and delete. The lobby's "Set up the game" asks which flow to use.
  Editing a flow is the choices table above: one row per choice, plain controls, and the suggested
  card beside a choice that has one.
- **During the game: the panel the trainer already has.** The trainer watches the team's own board,
  because a card played from somewhere else is played blind. The trainer panel (cards, chance, the
  Scrum Master hat) gains one section: **"Left out in this flow"**, listing what the flow skipped
  and the card each one suggested.
- **Not in this design: a cohort view** of several tables at once. That is its own piece of work.

## What Changes Underneath

In the order it would be built, each its own PR.

1. **The whole flow is the default.** The opening screen loses "Start building"; a new game goes to
   the Product Owner's starter. The Retrospective stops offering practices when every practice is
   already in use. `startOnTheBoard` and `LADDER` stay, for the preset.
2. **The starter is epics only.** `starterBacklog` gains an option for whether the first area
   arrives refined. The whole flow uses epics only.
3. **The flow, as data.** A `ZooFlow` type, the four presets, and `applyFlow(state, flow)`, which
   does the "done for them" steps in the engine and records which steps were left out. Pure and
   tested, with no screens yet.
4. **The lobby picks a flow.** "Set up the game" offers the presets. A shared game with no trainer
   uses the whole flow.
5. **Saved flows, and the Flows page.** A trainer's flows are stored, and copied, edited, reset and
   deleted from one page. **This needs a database table** (below).
6. **Cards that come with a choice.** The three cards above go into the shipped deck, and the
   trainer panel shows "Left out in this flow" with each one's card.

### The Database

Flows are reusable across sessions, so they cannot live in game state. Step 5 adds one table:

- `zoo_flows`: `id`, `owner_user_id`, `name`, `based_on` (the preset), `choices` (JSON),
  `created_at`, `updated_at`.
- Row-level security: a trainer reads and writes their own flows.
- Grants in the same migration, as the project now requires for a new table.

The SQL will be shown before it runs against production.

## What Stays The Same

- Every player is a Developer, the Scrum Master hat, the AI Product Owner.
- The trainer cards, the deck editor and the hat handover.
- Solo play's rules. Only where it starts changes.

## Questions

1. **Who can make a flow?** Proposed: anyone signed in, with "trainer" meaning a person running a
   session, as now. The alternative is admins only.
2. **Should flows be shared?** Proposed: each trainer's own to start with. Sharing a flow with
   another trainer can come later.
3. **Reset a game, too?** Should a trainer be able to restart the current game from the start of
   its flow, as well as resetting a saved flow to its preset?
4. **The Product Owner's starter.** Should the whole flow keep the park's own pieces (main
   pathways, bridge) as ready items beside the zone epics, or should those be refined by the team
   too?

## Queued For Review

Other changes waiting on Al, as of 1 November 2026, separate from this design.

**Asked, waiting on an answer:**

- **The Daily Scrum buttons.** Remove "Hold the Daily Scrum", which only repeats "We will work
  around it", and rename "Carry on regardless" to say what it does: nobody deals with the blocker.
- **The message board.** Make the kinds of message look different: what needs you (bold, pinned
  until answered, with a count), what is waiting on someone else (quiet, "waiting on Priya"), and
  the team talking (chat bubbles, with room to read them).
- **The Sprint Review.** Open with the Sprint Goal as the headline, met or not met. Then what got
  Done. Everything else folds under "More detail", and "Round the room" moves into the team chat.

**Planned earlier, not started:**

- **The Retrospective redesign.** Moments from the Sprint, sorted by the team, a dot-voted
  improvement that becomes a Product Backlog item. More pressing with several players.
- **Style C for the plan view.**
- **The planning map** in Sprint Planning's How step.
- **The Story Map** (#920).

**To try with people:**

- **A real shared game**: a trainer and two learners signed in on separate browsers. Nothing from
  the multiplayer design has been tried that way yet.

**Housekeeping:**

- **The playtest key** in `.env` expired on 31 October 2026. The newcomer playtester
  (`scripts/playtest/`) will not run until it is replaced.
