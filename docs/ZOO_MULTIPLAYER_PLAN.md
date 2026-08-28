# Build A Zoo As A Multi-Player Learning Platform

A build plan, 28 August 2026. Supersedes the multiplayer half of
[zoo-game-course-and-multiplayer.md](zoo-game-course-and-multiplayer.md), whose
recommendation (course layer first) this reverses, and whose "host broadcasts from the
browser" sketch it rules out.

Two answers set the shape of everything below:

- **The host is a role, not a person.** A learner may invite teammates; a trainer may invite
  a cohort. Hosting has to be claimable and transferable.
- **A session persists across days.** A trainer runs short sessions over a week. The game
  must survive every browser closing, and be picked up on Thursday where Tuesday left off.

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

```
zoo_sessions
  id, name, seed, state jsonb, version int,
  host_user_id            -- transferable
  event_id                -- null for a self-organised group
  status                  -- lobby | live | paused | done
  join_code               -- short code, so a trainer can read it out
  created_at, updated_at

zoo_session_seats
  session_id, user_id, seat ('product_owner' | 'scrum_master' | 'developer'),
  display_name, claimed_at, last_seen_at
```

Seats bind to `user_id` and persist, so Bob is still the Product Owner on Thursday. A seat
can be released and reclaimed for the people who do not come back. `status: 'paused'` is
what makes multi-day real: no clock advances and nothing expires.

`event_id` is nullable, and that single column covers both of your cases: a trainer's
session hangs off a course, a group of teammates' session hangs off nothing.

## Sequence

Each step is usable on its own, and each is a prerequisite for the next.

1. **Sessions and shared state, watch-only.** Session table, join code, Realtime catch-up.
   One person plays, everyone else sees it live. Proves the plumbing and is immediately
   useful in a classroom.
2. **Game time into state.** Day clock and Daily Scrum timebox move into `ZooGameState`,
   advanced by one owner, pausable. Required before more than one person can act, and it
   fixes save-and-resume in the single-player game as a side effect.
3. **Actor on actions, seats, gating.** Every action carries `by`. A guard layer refuses
   what a seat may not do, and says why. This is the step that turns a synchronised screen
   into a team game and makes the accountabilities bite.
4. **Debrief.** Velocity trend, forecast against delivered, the decisions taken and who took
   them. Serves both modes and the single-player game. Still the biggest unlock for a
   trainer, and still unbuilt.
5. **Live rituals.** Planning Poker with real votes rather than a simulated hand, a Daily
   Scrum where each Developer speaks, a Retrospective board everyone writes on.
6. **Park concurrency.** Item ownership while dragging.
7. **Facilitator controls.** Pause and freeze input for discussion, rewind to a decision,
   inject an impediment or a scope change on cue, spotlight a screen, and a cohort view of
   several teams at once.
8. **No-facilitator prompts.** The game creates the conversations a trainer would provoke:
   an explicit "you are split, and this is the Product Owner's call", and a structured
   debrief that walks the group through their own run. Last, because it needs all of the
   above.

Steps 1 to 3 are the platform. Everything after is product on top of it.

## What This Reverses

The August doc recommended the course-facilitation layer first (scenario seeds, challenge
modes, debrief export). Seeds and challenges are still worth having, but sessions and seats
are the thing that only gets harder to add later, and the reducer is in exactly the right
shape to take them now. Debrief survives the reordering and moves to step 4.

## Open Questions

- **Does a Sprint have to finish in one sitting?** If a session can be paused mid-Sprint,
  the day clock has to hold a part-spent day across days. Cleaner alternative: a session
  pauses only at an event boundary, which is also better teaching.
- **What happens to a seat nobody claims?** A three-person group cannot fill a Scrum Team.
  Either the unclaimed seats are played by the game, or the group doubles up and the game
  says so out loud.
- **How much does a watcher see?** In a classroom, showing the Product Owner's screen to
  everyone may give away what the group should be working out for themselves.
