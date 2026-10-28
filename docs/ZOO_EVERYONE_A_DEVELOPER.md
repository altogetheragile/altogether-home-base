# Everyone Is A Developer: Multiplayer Design

Status: **proposal, for Al to mark up.** Nothing here is built.

The third of three steps agreed on 26 October 2026. The first two are live:

1. Solo play has no AI Developers. The player is the Scrum Master and all the Developers, and the
   Product Owner is AI (#947).
2. Trainer cards: a trainer plays the drama into a shared Sprint, and admins can edit the deck
   (#948, #950, #951).
3. **Multiplayer: every player is a Developer, and one of them also holds Scrum Master, rotating
   each Sprint.** This document.

Al's words, which this design is held to:

> If it is multiplayer, during a Sprint each player is a Dev. The PO is AI as before or a trainer
> could be the PO?

> I'm not sure a SM unilaterally decides this - the default is always ask the team.

## Where It Stands Today

A shared game seats people **by accountability**. A new game creates six seats: one Product
Owner, one Scrum Master and four Developers (`STARTING_SEATS` in `useZooSessions.ts`). Each seat is
held by a person or played by AI. "Rotate seats" between games moves everyone one accountability
along, Product Owner to Scrum Master to Developer.

Three things about that do not fit the new model:

- **Every human Developer is the same person.** The game's "you" is `yourDev(state)`, which is
  always the first Developer on the team, Ada. A seat number is never mapped to a team member. Two
  learners in Developer seats are both Ada: the same name on their pulls, the same stand-up lines,
  and one of them can pick up a card the other thinks is theirs. About fifteen places in the game
  read `yourDev`.
- **The Scrum Master is a seat.** Somebody holds it for the whole game and does nothing else. That
  is the job that turned out, on 26 October, to be a few real decisions a Sprint and not a
  full-time screen.
- **The Developers beside a human are AI.** When a person holds a Developer seat, Ben and Cara are
  played by the game beside them (`alongside` in `ZooTogether.tsx`). Solo play has just dropped
  exactly this as unrealistic.

## The Model

### The Team Is The Players

- Each player is one named Developer. The team's Developers **are** the players, in the order they
  joined, under the names they chose in the lobby. Three players make three Developers. Nobody is
  played beside them.
- A Developer seat maps to a team member by number: seat 1 is `team.developers[0]`, seat 2 is
  `team.developers[1]`, and so on. "You" becomes **the member this browser's seat maps to**, so
  `yourDev(state)` takes the member id from the seat and stops assuming the first.
- A player who leaves mid-game keeps their place on the team. Their cards stay theirs, and the
  board says they are away, as the lobby already does for an empty seat. Nobody plays them.

### The Scrum Master Is A Hat, Not A Seat

- One Developer also holds Scrum Master. It is a field on the game, `scrumMasterId`, naming a team
  member, not a seat in the table.
- It **rotates at each Sprint Planning**, in the order of the team. Over a game everyone holds it
  at least once, which is what the two-day Scrum Master course wants.
- The holder is marked on the team strip (the same "SM" badge, on a Developer) and still builds.
  The Guide: "If the Product Owner or Scrum Master are actively working on items in the Sprint
  Backlog, they participate as Developers."

### What The Hat Does, After "Ask The Team First"

The built mechanic puts four answers to a blocker in one person's hands: leave it to the team,
remove it, work around it, escalate it. That has to change.

- **A blocker goes to the team at the Daily Scrum.** Any Developer can say "we will clear it
  ourselves" or "we will work around it". Those two are the team's.
- **"Remove it" and "escalate" are the Scrum Master's**, and only once the team has asked for help.
  The Daily Scrum offers the team an "ask Sam to help" answer; that is what puts the two Scrum
  Master answers in front of the hat holder.
- A trainer card that lands on the Scrum Master (an impediment beyond the team) is offered to the
  hat holder directly, which is the one case the Scrum Master acts first.
- Stakeholder requests can land on any Developer or the Scrum Master (Al, 26 October). A trainer
  card can target a named player. The lesson is routing it to the Product Owner, not who routes it.

### The Product Owner Seat

- **AI by default**, exactly as in solo play, with the same answers to questions and trainer
  cards.
- **A trainer can take it.** A trainer is a participant with `can_facilitate`; holding the Product
  Owner seat as well makes them a player who can facilitate, which the plan already allows.
- **Open question for Al:** can a learner take the Product Owner seat? The PO course route
  (`docs/ZOO_PO_ROUTE.md`) is built around a learner being the Product Owner. If yes, the seat stays
  open to anybody; if no, it is AI or the trainer only. See **Questions**.

### Decisions The Whole Team Makes

Several things today are one press by "the Developers". With several people, each needs a rule.

| Decision | Today | Proposed |
|---|---|---|
| Agree the Sprint Goal | each seat agrees | **each player** agrees; the Product Owner too |
| Forecast what fits (topic two) | one press | any Developer proposes; the others agree or change it, like a held card move today |
| Plan the steps (topic three) | one press per item | whoever is taking the item writes its steps |
| Pull a card | one press | your own pull, under your name; nobody asks permission |
| Your stand-up | you choose your lines | each player chooses their own lines |
| A blocker | the Scrum Master seat answers | the team answers; the Scrum Master only when asked (above) |
| Retrospective improvement | pick from a list | each player proposes or votes; the redesign is separate (below) |

"Like a held card move" means the mechanism the AI Developers used for asking ("Taking Seating Area
next. Yes, take it / Not yet"), turned round so a person proposes to people.

## The Lobby

- One table of seats: **Product Owner** (AI, the trainer, or a learner if allowed), and
  **Developers**, one row per player. No Scrum Master seat.
- "Rotate seats" goes. There is nothing to rotate between games: everyone is a Developer, and the
  Scrum Master hat rotates inside the game.
- The trainer row stays: **Make trainer**, and the trainer can sit in the Product Owner seat or
  watch.
- How many Developers: as many as are playing, up to nine. The Guide says a Scrum Team is
  "typically 10 or fewer people", which is a size it recommends rather than a rule, so nine
  besides the Product Owner is the game's cap and not a Scrum one. The table today allows four.

## What Changes Underneath

In the order it would be built.

1. **"You" is a member, not the first Developer.** `yourDev(state, memberId)`; the seat passes the
   member id down. Solo passes the first Developer, so solo play does not change. This is the step
   that fixes two learners both being Ada, and it is worth doing on its own.
2. **The team is the players.** At game start, `team.developers` is built from the seated players'
   names. No AI Developers in a shared game (`alongside` removed from `ZooTogether`).
3. **The Scrum Master hat.** `scrumMasterId` on the game state, set at the first Sprint Planning
   and moved along at each one after. The team strip badges the holder.
4. **Ask the team first.** The blocker answers split as above; "ask the Scrum Master to help" added
   to the Daily Scrum. Solo keeps all four, because there the player is the whole team.
5. **Team decisions.** Forecast proposed and agreed; Sprint Goal agreed per player.
6. **The lobby.** One Product Owner seat and a row per player; rotation removed.

Database: steps 1 to 5 change only the game state, which is JSON. Step 6 stops new games creating a
Scrum Master seat; the seats table's check constraint can keep `scrum_master` as an allowed value,
so games already played still load. Raising the Developer seats from four to nine is a change to
`STARTING_SEATS`, not to the schema. **No migration is expected.**

## What Stays The Same

- The AI Product Owner, the trainer cards, the deck editor.
- One browser drives the clock; actions are written and replayed as today.
- Solo play, apart from step 1's plumbing.

## Not In This Design

- **The Retrospective redesign.** Agreed on 26 October that it is too procedural. It deserves its
  own design: moments from the Sprint, sorted by the team, a dot-voted improvement that becomes a
  Product Backlog item. Multiplayer makes it more pressing, because five people picking from one
  list is worse than one.
- **Cohort view.** A trainer watching several tables at once.

## Questions For Al

1. **Can a learner be the Product Owner in a shared game?** The PO course route needs it. Proposed:
   yes, the seat is open to anybody, and AI by default.
2. **A team of one or two.** Two players make two Developers. Is that a Scrum Team, or should the
   game add AI Developers up to three? Proposed: no AI Developers, for the same reason as solo, and
   the capacity simply reflects two people.
3. **Who holds the hat first?** Proposed: the first player to join, then the order they joined.
   Alternative: the team chooses at the first Sprint Planning.
4. **The forecast.** Proposed: one Developer proposes and every other Developer agrees, like a held
   card move. Alternative: any Developer sets it and the rest can change it until Planning ends.
5. **A player who leaves.** Proposed: they stay on the team as away, and their cards wait. A
   trainer can hand a card to somebody else. Alternative: their cards go back to To Do.
