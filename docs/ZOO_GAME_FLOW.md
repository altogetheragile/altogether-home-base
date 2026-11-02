# The Game Flow: The Whole of Scrum, And A Trainer's Own Flows

Status: **agreed with Al, 1 November 2026.** His direction and answers are under **Decided**.
Nothing here is built yet.

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
4. **A trainer is a role.** "All admins are trainers but not all trainers are admins." So
   `trainer` is a role on a person's account, granted by an admin, and every admin counts as one.
   See **The Trainer Role**.
5. **A trainer's flows are their own.** Admins can share a flow with every trainer.
6. **A trainer can restart the game** from the start of its flow, as well as resetting a saved
   flow.
7. **The team builds the park's own pieces too.** The main pathways and the bridge arrive
   unrefined, like the zone epics, for the team to split and size.

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
| A starter Product Backlog from the Product Owner: an epic for each zone | Yes. An epic for each area, one for the Grounds and one for the facilities, plus the Somewhere to eat need (`starterBacklog` in `config.ts`). Starting on the board still has the first area refined |
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
2. **The starter Product Backlog.** The Product Owner hands over **an epic for each zone**, and
   one for the park's own pieces (the main pathways, the bridge). Nothing arrives refined. Today the first area
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

### Led Through It: Simple, Intuitive, Not Boring

Al, 1 November 2026: "A solo player and teams playing without a trainer are all led through the
flow. It needs to be simple and intuitive but not boring."

Without a trainer, the game is the trainer. Eight steps of Scrum before and around the first Sprint
can easily read as a form to fill in, which is exactly what the ladder was built to avoid. So the
flow is held to these rules.

**Simple: you always know where you are and what to do next.**

- **One journey line across the top.** The eight steps (Product Goal, Product Backlog, Refinement,
  Definition of Done, Sprint Planning, Sprint, Review, Retrospective) on one line, with the current
  one lit and the finished ones ticked. It replaces the phase pill, which names a step but not
  where it sits. After the first Retrospective the line loops back to Sprint Planning, so the
  Sprint visibly becomes a cycle.
- **One thing to do on each screen, and one button to move on.** The one-question-per-screen rule
  the game already follows, applied to the whole flow.
- **Priya says what she needs.** The Product Owner hands each step over in the team chat, in her own
  voice: "Here is my starter, one epic for each area. Split enough for one Sprint and we can
  plan." What she asks for is pinned as a "needs you" card (see the message board redesign under
  **Queued For Review**), so it cannot be missed.
- **The teaching waits behind "?".** Each step says what to do in one line. Why Scrum does it lives
  in the Teaching Card for that step, one press away, never in the way.

**Intuitive: you do the thing, rather than being told about it.**

- **Start from something, never from a blank page.** The Definition of Done offers suggested lines
  to pick and change. The Sprint Goal offers candidates drawn from the top of the Product Backlog,
  as it does today. Picking and changing is still the team's decision; facing an empty box is
  where people stall.
- **"Enough to start", and no more.** Refinement stops asking once a Sprint's worth of work is
  ready, and says so. Refining the whole Product Backlog before Sprint 1 is the up-front planning
  the game exists to argue against.
- **Every step shows on the park.** The Product Goal sets out the empty park; the starter shows
  each zone as a plot waiting for its epic; refined items appear as outlines where they will
  stand; the forecast lights the outlines being built this Sprint. The park is the reason to
  care, so it should change at every step, not only once building starts.

**Not boring: get to the zoo quickly, and make choices matter.**

- **Building within ten minutes.** The steps before Sprint 1 together should take a newcomer under
  ten minutes. That is a target, measured with the newcomer playtester
  (`scripts/playtest/`), whose key needs renewing first.
- **Choices come back.** What the team chose earlier pays off or bites later, and the game says
  which choice it was: a thin Definition of Done is what the Product Owner sends work back for; an
  item left unrefined is the one that turns out to be two items at Planning; a Sprint Goal nobody
  believed in is the one the Review says was not met. That is what turns the early steps from
  paperwork into setting the game up.
- **Something happens in every Sprint.** The Daily Scrum turns things up by chance (or the
  trainer's cards), visitors arrive and react at the Review, and stakeholders ask for things. The
  Sprint is where the variety lives, which is another reason the steps before it are kept short.
- **Voices, not instructions.** Priya, the visitors and the suppliers say things as people do, as
  they already do at the Review. A line from Joy on the visitor panel is more interesting than a
  sentence starting "The Sprint Review is".

**Together, without a trainer.** A shared game is led the same way. Anybody at the table can move
the flow on, except where Scrum says the team decides together (the Sprint Goal and the forecast,
from #958), where it waits for everybody. The "needs you" card says whose turn it is.

**How we will know it works.** Before it ships, the newcomer playtester plays the whole flow from
the opening screen, and the run is timed and read for the places it stalls. After it ships, one
of Al's own sessions with real learners.

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

Two kinds, both asking first:

- **Reset a flow** puts a saved flow back to the preset it was copied from. Games already played
  with it are not touched.
- **Restart the game** starts the session's game again from the start of its flow, so a trainer
  can run the same opening twice, or start over when the room has gone off track. It is a new game
  in the same session, as "Next game" is today, so the game just played is kept to look back on.
  Everybody keeps their seat.

## The Trainer Role

Today "trainer" exists only inside a session: the host marks somebody with **Make trainer**
(`can_facilitate`), and only for that session. Flows outlive a session, so somebody has to be a
trainer before any session exists.

- **`trainer` is a role on the account**, beside `admin`, `moderator` and `user`. An admin grants it
  from the user management screen that already grants the others. A person can hold it as well as
  their other roles.
- **Every admin is a trainer.** Checked as "has the trainer role, or is an admin", in one function
  used everywhere, so the rule cannot drift.
- **Only trainers see the Flows page** and the flow choice when setting up a game.
- **In a session**, a trainer who hosts is its trainer without being marked. **Make trainer** is
  offered only for participants who are trainers, so a learner cannot be made one by mistake.
  Somebody can still be a trainer in a session without playing in it: they watch.
- **Flows are a trainer's own.** An admin can **share** a flow, which puts it in every trainer's
  list beside the presets. Only its owner or an admin can change it; anybody it is shared with can
  copy it.

## Do We Need A Trainer View?

Yes, but a small one, and not during play.

- **Before the game: a Flows page.** This is new, and only trainers see it. It lists the presets,
  the flows shared by an admin, and the trainer's own flows, with copy, edit, rename, reset and
  delete. The lobby's "Set up the game" asks which flow to use.
  Editing a flow is the choices table above: one row per choice, plain controls, and the suggested
  card beside a choice that has one.
- **During the game: the panel the trainer already has.** The trainer watches the team's own board,
  because a card played from somewhere else is played blind. The trainer panel (cards, chance, the
  Scrum Master hat) gains two things: **"Left out in this flow"**, listing what the flow skipped
  and the card each one suggested, and **Restart the game**.
- **Not in this design: a cohort view** of several tables at once. That is its own piece of work.

## What Changes Underneath

In the order it would be built, each its own PR. The message board redesign (under **Queued For
Review**) comes before step 3.

1. **The whole flow is the default.** The opening screen loses "Start building"; a new game goes to
   the Product Owner's starter. The Retrospective stops offering practices when every practice is
   already in use. `startOnTheBoard` and `LADDER` stay, for the preset. **Built.**
2. **The starter is epics only.** `starterBacklog` gains an option for whether the first area
   arrives refined, and the park's own pieces become an epic of their own. The whole flow uses
   epics only. **Built.** The facilities are an epic too; Somewhere to eat stays a need, which is
   not refined either.
3. **Led through it.** The journey line, Priya handing each step over in the chat, the pinned
   "needs you" card, suggested lines for the Definition of Done, "enough to start" in Refinement,
   and each step showing on the park. Depends on the message board redesign, which goes first.
   Timed with the newcomer playtester against the ten-minute target. **Started:** the journey line
   (#968), and Priya handing over Refinement, the Definition of Done and Sprint Planning's first
   topic, with the "needs you" card under her line (`handover.ts`). Her handover is drawn as a chat
   line on the screen it belongs to, because the team chat is not on screen before the Sprint.
   The Definition of Done opens when Priya asks for it, its lines marked as a suggestion and the
   library of further lines open, until the Scrum Team agrees one.
4. **The flow, as data.** A `ZooFlow` type, the four presets, and `applyFlow(state, flow)`, which
   does the "done for them" steps in the engine and records which steps were left out. Pure and
   tested, with no screens yet.
5. **The lobby picks a flow.** "Set up the game" offers the presets. A shared game with no trainer
   uses the whole flow.
6. **The trainer role.** The new account role, granted by admins, with every admin counted as a
   trainer; a trainer who hosts is the session's trainer; Make trainer is offered only for
   trainers. **Needs a migration** (below).
7. **Saved flows, and the Flows page.** A trainer's flows are stored, and copied, edited, reset,
   shared by an admin and deleted from one page. **Needs a migration** (below).
8. **Cards that come with a choice, and restart.** The three cards above go into the shipped deck;
   the trainer panel shows "Left out in this flow" and offers Restart the game.

### The Database

Two migrations, each shown before it runs against production.

- **Step 6, the role.** Add `trainer` to the `app_role` enum, and an `is_trainer(user)` function:
  true for the trainer role or the admin role. The session's "Make trainer" policy checks it.
- **Step 7, the flows.** One table, `zoo_flows`: `id`, `owner_user_id`, `name`, `based_on` (the
  preset), `choices` (JSON), `shared` (set by admins only), `created_at`, `updated_at`.
  Row-level security: a trainer reads their own flows and shared ones, and writes their own; an
  admin reads and writes all of them. Grants in the same migration, as the project now requires
  for a new table.

## What Stays The Same

- Every player is a Developer, the Scrum Master hat, the AI Product Owner.
- The trainer cards, the deck editor and the hat handover.
- Solo play's rules. Only where it starts changes.

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
