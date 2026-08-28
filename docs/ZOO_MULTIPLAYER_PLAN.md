# Build A Zoo As A Multi-Player Learning Platform

A build plan, 28 August 2026. Supersedes the multiplayer half of
[zoo-game-course-and-multiplayer.md](zoo-game-course-and-multiplayer.md), whose
recommendation (course layer first) this reverses, and whose "host broadcasts from the
browser" sketch it rules out.

Four answers set the shape of everything below:

- **The host is a role, not a person.** A learner may invite teammates; a trainer may invite
  a cohort. Hosting has to be claimable and transferable.
- **A session persists across days.** A trainer runs short sessions over a week. The game
  must survive every browser closing, and be picked up on Thursday where Tuesday left off.
- **A Sprint does not have to finish in one sitting**, so a session can pause mid-Sprint and
  the day clock has to carry a part-spent day.
- **Unclaimed seats are played by AI**, in character and visibly not human.

The second one is the constraint that decides the architecture. A game that outlives every
tab cannot have its authority inside a tab.

## What Is Already Right

Verified against the code rather than assumed:

| Asset | Where | Why it matters |
|---|---|---|
| A pure reducer, 84 typed actions | `useZooGame.ts`, `types.ts` | Actions are already serialisable messages. This is the expensive thing to retrofit and it is done. |
| The whole game is one serialisable object | `ZooGameState`, stored as `jsonb` in `zoo_game_saves` with RLS | Shared state has somewhere to live without a new state model. |
| Deterministic | No `Date.now`, `Math.random` or `new Date` in `engine.ts`, `useZooGame.ts` or `config.ts` | Every client applying the same actions lands on the same state. |
| Realtime with presence, working | `src/hooks/canvas/useCanvasRealtime.ts` | Transport and presence are already written for another feature. |
| Seats already modelled | `ScrumTeam` - one Product Owner, one Scrum Master, named Developers | The seat model exists; it is just not bound to anyone. |
| A cohort structure | `events`, `event_registrations` | A trainer's session has something real to hang off. |

## The Three Things That Block It

### 1. No Action Knows Who Took It

None of the 84 actions carries an actor. Seats have names but no `user_id`, and nothing
stops any player doing anything.

This is the crux, and it is why the accountabilities work and the multiplayer work are the
same work rather than two projects. If everyone can order the Product Backlog, five people
share one mouse. If only the Product Owner can, the group has to talk, and the
accountability is felt instead of labelled. **Seat gating is the mechanic that makes a
multi-player Scrum game teach anything at all**, and in the no-facilitator mode it is doing
the job a trainer would otherwise do.

### 2. Game Time Lives In A Component, Not In The Game

`DayTimer.tsx` holds the day's remaining seconds in `useState` and counts down with
`setInterval`. `DailyScrum.tsx` does the same for its timebox. Neither is in `ZooGameState`,
so neither is saved, shared or pausable except through learn mode.

With several browsers this fails in three ways at once: each client runs its own countdown,
the clocks drift, and `onExpire` fires on every client, so the day advances several times.

The fix is not a shared wall-clock deadline. A session spread over days must never have a
timer running while nobody is playing, or Tuesday's Sprint expires overnight. **Game time
becomes explicit state that only advances while a session is live**, owned by one client and
broadcast. Learn mode already proves the paused case works.

### 3. The Park Is A Drag Surface

Positions, rotations and design choices change at pointer speed. Item-level ownership
("Ezra is moving the river") or ephemeral position broadcast is needed, or two people fight
over the same river. This is the piece most likely to be underestimated.

## The Architecture

**Postgres is the authority. The browser is a cache. Realtime is a notification, not a
transport for truth.**

That follows directly from persistence: if the game must survive every tab closing, the
truth cannot live in a tab. It also removes the host as a single point of failure, which is
what makes "host is a role, not a person" cheap rather than hard.

```
player action
  -> client applies it to its own reducer (optimistic, instant)
  -> write session row  WHERE version = <the version I read>
       conflict -> re-read, re-apply, retry
  -> Realtime broadcast: "version N"
  -> every other client re-reads and catches up
```

Optimistic concurrency on a `version` column does the heavy lifting. No server code is
needed to start, because the reducer is pure and already runs on the client.

**On enforcement.** Client-side seat gating is pedagogically sufficient: the point is that
the interface says "that is the Product Owner's call", not that a determined learner cannot
bypass it. Cheating is not a threat model in a training game. If enforcement is ever wanted,
the reducer is pure and could be lifted into an Edge Function, which is a reason to keep it
free of React imports.

### Session Model

A training session is not one run of the game. It is several, with reflection between them,
so there are two nested things: a **session** that persists over days and holds the people,
and a **game** inside it that holds one run of a few Sprints.

That split is what answers seat rotation. **Seats belong to the game, not the session**, so
changing seats is not an operation at all - it is what starting the next game means. Inside
a game the debrief's "who did what" stays unambiguous, and across games you get the better
question: you were Product Owner in game one and a Developer in game two, what looked
different?

```
zoo_sessions
  id, name,
  host_user_id            -- transferable; ownership, not authority
  event_id                -- null for a self-organised group
  status                  -- lobby | live | paused | done
  join_code               -- short code, so a trainer can read it out
  created_at, updated_at

zoo_games                 -- one run toward one Product Goal; a session has several
  id, session_id, seq,
  theme                   -- 'zoo' today; the seam for a resort or a city later
  seed, state jsonb, version int,
  status                  -- live | paused | done
  started_at, ended_at

zoo_session_participants  -- the people, for the whole session
  session_id,
  role                    -- player | observer
  user_id                 -- the person
  can_facilitate          -- acts ON the session, not in it. A trainer. Granted, not implied
                          --   by hosting, so an elected learner host cannot inject an
                          --   impediment into their own team's Sprint
  display_name, claimed_at, last_seen_at
```

```
zoo_game_seats            -- who sat where, for ONE game
  game_id,
  seat                    -- product_owner | scrum_master | developer
  participant_id          -- null when the seat is played by AI
  is_ai                   -- so the interface can always say which of your team is not a person
```

An observer is a participant with no seat in any game: present, named, and able to act on
nothing. That is the trainer, and it is also what a cohort view is later assembled from.

### A Game Is A Product Goal

The cleanest unit for a game is not "a few Sprints", it is **one Product Goal**. The Guide
says a Product Goal holds until it is met or abandoned and that a product has one at a
time, which means a product's life is a sequence of them. The game's own Product Goal card
says exactly that, and then a learner never sees the second half of the sentence, because
one run has one Goal and nothing ever comes after it.

That is a teaching gap, not just a missing feature: one Goal per run quietly teaches that a
Product Goal is a permanent thing you set at the start.

**Most of the machinery is already built.** A Goal can be written with measures
(`GoalShapes`), and at every Sprint Review `goalChecks` compares each measure against what
the park actually counts and ticks the ones that are met. The game already knows when a
Product Goal has been achieved. It just has nowhere to go afterwards.

So:

- **Game 1** - a bare minimum zoo: open at all, take money, get the first real feedback.
- **Game 2** - the same zoo, carried forward, with a new Product Goal: improve and expand,
  perhaps buying land and growing the footprint.
- Seats rotate between them, and the reflection in between has something concrete to be
  about, because the first Goal was either met or it was not and the measures say which.

This gives the between-games lobby two genuinely different offers rather than one:

| | What carries over | Teaches |
|---|---|---|
| **Same zoo, next Product Goal** | the park, the Backlog, the team's velocity | a product outlives any one Goal, and a Goal is met and replaced |
| **Fresh zoo, same seed** | nothing but the seed | comparison: identical start, different seats, different outcome |

The second only works with human seats, since AI breaks reproducibility. The lobby should
say so when it offers a replay.

**What expansion needs.** The park is a fixed `CANVAS_W` in `parkLayout.ts`. Buying land
means park size becomes state. Growing is the safe direction: positions are clamped through
`insidePark`, so everything already placed stays valid inside a larger boundary. Shrinking
would not be, so land is bought and never sold.

**The economy stays simple and fun.** No profit and loss, no budgets, no running costs,
nothing to balance. One chain, one number:

> a zoo people love -> more visitors -> a purse -> land

The purse fills from attendance and happiness, which the park already counts, and it is
spent once, on land. Nothing else costs anything.

That is not only the cheaper build, it is the better lesson. **You cannot buy a bigger zoo
by building more; you earn it by making a place people love.** It gives teeth to the thing
the Review already says out loud - value is the outcome, not the output - because a team
that spent three Sprints delivering things nobody enjoyed simply cannot afford the next
Product Goal. The measures on Goal 1 are therefore written in visitors and happiness, and
money is a consequence of them rather than a thing anyone manages.

### Changing Seats

Never inside a Sprint. Between games, always. Mid-Sprint rotation would break the one
promise a Sprint makes, and would make the Sprint's own debrief unreadable.

Between games there is a short lobby, and the same screen serves all three ways of playing:

- **Rotate one step** is the default and one click. The Product Owner becomes the Scrum
  Master, the Scrum Master becomes a Developer, a Developer takes the Product Owner seat.
  Over three games everybody has held every accountability, which is what a trainer wants
  and what a group would otherwise have to negotiate every time.
- **Assign** for a group that wants to choose.
- **Keep** for when the point is to get better at the seat you already have.

A facilitator can override. Without one, the group agrees, which is itself the sort of
conversation the no-facilitator mode exists to provoke. Unclaimed seats fall to AI, and
because seats are per-game a group that shrinks on day three simply picks up more AI.

Seats bind to `user_id` and persist, so Bob is still the Product Owner on Thursday. A seat
can be released and reclaimed for the people who do not come back. `status: 'paused'` is
what makes multi-day real: no clock advances and nothing expires.

`event_id` is nullable, and that single column covers both of your cases: a trainer's
session hangs off a course, a group of teammates' session hangs off nothing.

## Ways To Play

Three from the learner's side, two shapes in the code, and one permission.

| | Who is at the table | Shape | Needs |
|---|---|---|---|
| **Solo, all hats** | you, wearing all three accountabilities | single | what exists today |
| **Solo, one seat** | you in one seat, AI in the others | single + AI | steps 2 and 3 |
| **A group, no facilitator** | your teammates, AI filling what is unclaimed | session | steps 1 to 3, then 8 |
| **A course with a facilitator** | a cohort, plus a trainer | session | the same, plus `can_facilitate` and step 7 |

The last two are the same shape. A facilitated course session is a group session with one
extra participant who can act on the session rather than in it, which is the whole reason
for keeping that permission separate from the seat. Once a group can play, running a course
costs a permission and a screen rather than a mode.

**Solo splits in two, and the second half is the point.** Today a solo player is the Product
Owner and the Developers and the Scrum Master at once, which is exactly why the
accountabilities are invisible: you are all of them, so none of them can push back on you.
An AI team that holds the seats you are not in is the single-player form of seat gating. It
is the same mechanic, and it is what makes solo play teach an accountability rather than a
loop.

## Two Seams To Keep Open

Neither is work to do now. Both are cheap to preserve and expensive to recover, and both
depend on the same discipline: **the Scrum core stays clean and everything else layers onto
it.**

### Across: Another Theme

Measured rather than guessed:

| Layer | Lines | Zoo coupling | Reuse |
|---|---|---|---|
| Scrum teaching and events | ~1,900 | 8 hits in 382 lines, 2 in 158, 4 in 124 | as-is |
| Domain model (`types`, `config`, `blueprint`, `itemKinds`, `toolboxItems`) | ~1,000 | heavy, but naming only | rename |
| Simulation (`simulation/`) | 612 | visitors arrive, walk, are happy, tell friends | as-is |
| Drawing (`ParkView`, `IsoZoo`, `design.ts`, `carPark`) | ~4,500 | 274, 140 and 171 hits | redraw |

The item ontology is already generic and only wears zoo names:

```
ItemCategory = epic | enclosure | exhibit | amenity | flora | path
services     = food | toilet | rest
```

| | enclosure | exhibit | amenity | flora | path |
|---|---|---|---|---|---|
| Zoo | habitat | the animal | cafe, toilets | planting | paths |
| Holiday resort | pool area, villa block | the pool, the spa | bar, restaurant | landscaping | walkways |
| City | a block | a landmark | services | parks | streets |
| Theme park | the ride's plot | the ride | food stalls | planting | queue lines |

Every mechanic that teaches Scrum rides on that ontology and none of it cares what the words
mean. Slices not layers is identical in all four: somewhere to see the thing, the thing, and
a way to walk in.

So roughly 40% reuses untouched, 25% is a rename, and 35% is a redraw. **The bill is the
art, not the Scrum.** The animals are cut from licensed sheets through `npm run animal-art`;
a resort needs its own sheets and its own cutting pass.

**What to do now: nothing, except do not fork.** The tempting move when a second theme is
wanted is to copy the folder and rename, which forks the Scrum teaching into two codebases.
Every correction then needs making twice and within a month they disagree. When a second
theme is actually wanted, the zoo words move out of `types.ts` and `config.ts` into a theme
module - category labels, zone names, the starter blueprint, the toolbox, the art pack - and
the engine takes a theme rather than containing one.

**What to do in step 1:** give `zoo_games` a `theme` column. Free now, awkward later.

### Up: AgilePM3

AgilePM3 uses Scrum, unchanged, at the team level. The handbook is explicit: *"A Scrum Team
is the model assumed in this reference book for an Agile Delivery Team."*

That is the best possible news, because it means an AgilePM simulation is **a layer above
this game, not a change to it**. The Scrum loop that has taken the most effort to get right
is reused exactly as it stands.

| AgilePM3 | Already here |
|---|---|
| Sprint | the Sprint, unchanged |
| Project Increment | a **game** (which this plan already scopes to one goal) |
| The project | a **session** |
| Delivery Team | the Scrum Team and its seats |
| Multiple Delivery Teams | several seat groups in one session, which the multiplayer work makes possible |
| Business Case | the purse: love, visitors, land |
| MoSCoW | the Backlog already marks essentials |
| Business Sponsor, Business Visionary, Project Manager, Solution Architect | participants who hold no Delivery Team seat but may act - exactly what splitting the participant role from `can_facilitate` already allows |

Genuinely new work, none of it inside the Scrum engine: the lifecycle phases (Pre-Project,
Feasibility, Foundations, Delivery, Deployment, Realization), the Project Artifacts, MoSCoW
as a real prioritisation rather than a flag, the Project Approach Questionnaire, and
coordination across Delivery Teams.

**The discipline this asks for is the same one the theme seam asks for.** If AgilePM
concepts leak down into the Scrum engine, both products get worse and the Scrum game stops
being a faithful Scrum game. The project layer sits on top and reads the same state.

## Sequence

Each step is usable on its own, and each is a prerequisite for the next.

**Steps 1 to 3 are built and merged. They were the platform; what is left is product on top
of it.** What each turned out to involve is recorded under Built, below.

1. ~~**A group can play one game together.**~~ Done - PRs #418, #419, #420.
2. ~~**Seats and gating.**~~ Done - PR #422.
3. ~~**AI seats.**~~ Done - PR #423. The screens were pointed at a session in #424, so a
   seated team builds the same zoo rather than a panel proving the plumbing.
4. **Debrief.** Velocity trend, forecast against delivered, the decisions taken and who took
   them. Serves every way of playing. Still the biggest unlock for a trainer, and still
   unbuilt.
5. **Live rituals.** Planning Poker with real votes rather than a simulated hand, a Daily
   Scrum where each Developer speaks, a Retrospective board everyone writes on.
6. **Park concurrency.** Item ownership while dragging. **Likely wanted sooner than this
   position suggests**: the park is the one surface two people will touch at once on their
   first shared Sprint, and nothing currently stops them.
7. **Facilitator controls.** Pause and freeze input for discussion, rewind to a decision,
   inject an impediment or a scope change on cue, spotlight a screen, and a cohort view of
   several teams at once.
8. **No-facilitator prompts.** The game creates the conversations a trainer would provoke:
   an explicit "you are split, and this is the Product Owner's call", and a structured
   debrief that walks the group through their own run. Last, because it needs all of the
   above.

## Built

What steps 1 to 3 actually came to, including the things that were not in the plan.

**The tables** are `zoo_sessions`, `zoo_session_participants`, `zoo_games` and
`zoo_game_seats`, applied to the live database. Verified with three real user tokens rather
than the service role, which is what found that **the first participant row of every session
was unwritable**: PostgREST inserts with RETURNING, and under RLS that also requires the new
row to be visible through the SELECT policy, which raises the same 42501 an insert-check
failure gives. Reading participants required membership, and a host is not a member until
the row they are inserting exists. Eleven RLS checks now pass, including that a player
cannot grant themselves `can_facilitate` and an observer can read but not write.

**Game time** moved into `ZooGameState` as `daySecondsLeft` and `scrumSecondsLeft`, advanced
by `TICK_DAY` and `TICK_SCRUM` from one heartbeat. The reducer ends the day itself, so the
expiry cannot fire from two browsers. Two bugs fell out that pre-dated any of this: holding
the Daily Scrum cost nothing, because the day was sized before the event set `dayTimeMult`;
and a cancelled Sprint kept the old day's remaining seconds.

**Reconciliation** lives in `sessionSync.ts` as plain functions, so the races are pinned
down without a network: an action shows before any write lands, a rebase keeps the player's
unconfirmed intent while taking the other person's change, and a confirm clears only what
its write carried rather than swallowing what was queued mid-flight. Proven against the live
database as well - two writers at the same version, the second rejected, re-read, retried
and won.

**One action surface.** All 86 callbacks moved into `zooActions`, built around a carrier
rather than a reducer, so `useZooGame` and `useZooSession` offer the same thing and
`ZooSession extends ZooActions` makes a missing action a compile error.

**The gate** assigns only what the Guide assigns, and the list is short on purpose - the
Sprint Goal, the Definition of Done and refinement stay the whole team's, with a test
asserting they are *not* gated. It refuses with a sentence rather than a disabled control,
because the sentence is the teaching.

**AI seats turned out not to need a language model.** The game already holds the judgement
(`pokerHand`, `notReady`, the WIP limit), so an AI seat is mostly an accountability applied
to what the game knows. That kept all three things this plan worried about: determinism, so
a seed can still be replayed; no cost; and no latency.

## Not Yet Proven

Everything above is covered by 429 tests, RLS checks against real tokens, and a live write
race. **Two signed-in people have not yet built a zoo together**, because that needs real
accounts. That is the check most likely to find what the tests cannot - two people dragging
on the park at once, or a seat claim racing another - and it is worth half an hour with a
colleague and two laptops before a cohort sees it.

## What This Reverses

The August doc recommended the course-facilitation layer first (scenario seeds, challenge
modes, debrief export). Seeds and challenges are still worth having, but sessions and seats
are the thing that only gets harder to add later, and the reducer is in exactly the right
shape to take them now. Debrief survives the reordering and moves to step 4.

## Decided

### A Sprint Does Not Have To Finish In One Sitting

So a session can pause mid-Sprint, and the day clock has to carry a part-spent day across
days. That makes step 2 slightly larger but not different in kind: the day's remaining
seconds become state like anything else, and `status: 'paused'` stops them moving. It rules
out the simpler option of only pausing at an event boundary.

### Unclaimed Seats Are Played By AI

Three people cannot fill a Scrum Team, and a group should not have to double up just to see
Scrum work. There is already a precedent in the game: the **AI Product Owner** behind the
`zoo-po-refine` Edge Function, auth-gated and rate-limited, whose decisions the reducer
applies through `PO_REFINE`. An AI seat is that pattern with a wider brief.

Treated properly this is better than a gap-filler. An AI Product Owner that says "that is
not the most valuable thing next, and here is why" creates exactly the argument a learner
needs to have, and an AI Scrum Master can ask the question nobody in the room thought to
ask. **The seat should play its accountability in character, including pushing back**, not
quietly rubber-stamp whatever the humans want.

Three things to hold on to:

- **It costs determinism.** The game is seeded and reproducible today, which is what lets a
  trainer say "everyone at seed 42, what did you do differently?" An AI seat breaks that.
  The action log keeps a session **replayable** even when it is no longer **reproducible**,
  and that is the property the debrief actually needs.
- **It costs money and latency per session.** A seat that thinks for four seconds every time
  anyone moves a card will not survive a classroom. Batch its decisions to the moments its
  accountability actually owns.
- **It must be visibly an AI.** A learner has to know which of their team is not a person,
  or the Retrospective is about the wrong thing.

### What Watchers? The Trainer

There is one kind of watcher, and it is the trainer. Two things were being run together
under one word:

- **A class mirroring one screen** - the classroom-projector model carried over from the
  August doc. Cut. Neither real case wants it: a group of teammates all play, and a cohort
  does not learn Scrum by watching one person play it.
- **A trainer observing a team they are not seated in** - real, and needed. A trainer
  coaching four tables has to see what a table is doing without taking one of its five
  seats and without becoming a sixth Developer.

The consequence lands in **step 1, not step 7**. The cohort view is a screen and can come
late, but the access model cannot: a session has three kinds of participant from the
beginning.

**A trainer is not a participant type.** That was a person put in a column meant for what
you do in the game. Two independent things:

*What you do in the game* - your participant role:

| Participant | Has a seat | Can act in the game | Sees |
|---|---|---|---|
| Player | yes | within their accountability | everything their team sees |
| AI | yes | within its accountability | the compact context it is given |
| Observer | no | nothing | everything, plus who did what |

*Whether you can act on the session rather than in it* - a separate permission,
`can_facilitate`: pause and freeze input for discussion, inject an impediment or a scope
change, rewind to a decision, look across teams.

A trainer is usually an observer who can facilitate. But they might take the Product Owner
seat so a group has someone to negotiate with, or play a stakeholder who arrives at the
Sprint Review with an awkward request. Both are players who can facilitate. Keeping the two
apart is what allows that without a special case.

It also keeps the elected-player host honest. **Hosting is ownership, not authority**: the
learner who created a session can invite people and hand the session on, but they do not
get to inject an impediment into their own team's Sprint. `can_facilitate` is granted, not
implied by `host_user_id`.

Retrofitting a third kind of participant after seats are built is the expensive version of
this. Adding `role` to the participant table now is a column.

A trainer sees everything, including what the group has not worked out yet. That is the
point of coaching and there is nothing to protect them from. The one caution is a projected
observer view leaking an answer to the room, which is a matter for the screen rather than
the schema.
