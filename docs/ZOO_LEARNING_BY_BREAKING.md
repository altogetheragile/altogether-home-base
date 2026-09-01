# Learning By Breaking The Rules

A design plan, 1 September 2026. It brings three threads into one shape: the rule-breaking and
external pressure from the mind map, Evidence-Based Management as the scoreboard, and the
question of why the game currently feels flat.

## The Principle

The game refuses. Reach outside your accountability and the gate stops you and says whose call it
was. That is right for somebody's first game and wrong for their second, because nobody learns why
the Product Owner does not choose the Sprint Backlog by being told they may not. They learn it by
doing it and watching the Developers stop owning the number.

So: **allow it, name it, cost it, and show the cost at the Retrospective.** Three rules for the
costs, or the whole thing turns into a refusal with extra steps:

- **Delayed.** A cost that lands the moment you transgress reads as punishment. One that lands next
  Sprint teaches the systemic lesson, and is truer to how it goes at work.
- **Attributed.** The Retrospective names what the team did differently beside what it cost.
  Without the attribution nobody learns anything: they just had a bad Sprint.
- **Recoverable.** Stop doing it and the measure comes back over a Sprint or two. A game that
  punishes permanently is a game people stop experimenting in, and experimenting is the point.

## Two Modes

| Mode | The gate | For |
|---|---|---|
| **By the book** | Refuses, as it does today, and says whose call it was | A first game, and solo learners |
| **Free play** | Asks instead. "That is the Developers' call. Do it anyway?" Every yes is recorded | A facilitated session, and any second game |

A facilitator can also **pre-break a rule** for a cohort: run this game with no Definition of Done,
or with the Scrum Master choosing the Sprint Backlog. Making the point deliberately is what a class
is for, and it means the trainer decides what today's lesson is rather than hoping somebody
transgresses.

## What Each Break Should Cost

Every row is from the mind map. "Now" is what the game does today, verified against the code.

| The break | Now | What it should cost | Where you see it |
|---|---|---|---|
| **A Sprint runs with no Definition of Done** | The DoD must be agreed before the first Sprint | Nothing gates quality: items open with criteria unmet, so visitors find things half-built, and rework items land on the Backlog next Sprint | Current Value falls; Ability to Innovate falls as capacity goes to fixing |
| **The Scrum Master tells people what to do** | No such move exists | The Developers stop owning their sizing, so estimates drift from what things really cost, and they stop raising impediments early | Predictability (forecast against delivered) and Time to Market |
| **The Product Owner picks the Sprint Backlog** | `SET_FORECAST` is the Developers' and the gate refuses | Selection by value with nobody checking capacity: over-commitment, carry-over, Sprint Goals missed | The Sprint Goal streak, and carry-over at the Review |
| **The Scrum Master picks the Sprint Backlog** | Same gate | As above, and the improvement each Sprint stops happening, because the Scrum Master is busy doing somebody else's job | Ability to Innovate |
| **The Scrum Master or Product Owner runs the Daily Scrum** | The Scrum Master holds it; the Product Owner cannot | It becomes a status report: the day costs more, impediments surface a day late, the plan is not adapted. The machinery already exists (`dayTimeMult`, `scrumDiscipline`, the skip penalty) | The day clock, and impediments that grow overnight |
| **The Scrum Master or Product Owner owns the Product Backlog alone** | Ordering is the Product Owner's; refinement costs Sprint time and is a Scrum Team activity | Items arrive under-refined, so sizes are wrong and unready work gets pulled into Sprints | Carry-over, and the ready horizon shrinking |

Two of these need no new simulation at all. The Daily Scrum as a status report and the Product Owner
choosing the Sprint Backlog can both be built from mechanics the game already has, which is why they
are first in the increments below.

## External Pressure

The mind map's second branch. These move the market-value measures rather than the capability ones,
and between them they give the game the stakes it currently lacks.

- **Bad feedback from customers.** Attendance falls through word of mouth, which the simulation
  already models, and the signal says what they disliked. Taking it into the Backlog is the Product
  Owner's call, and declining it is a decision too.
- **No feedback from customers.** Worse than bad, and more interesting: nothing arrives, Unrealized
  Value stops moving, and you are building blind. No news is not good news.
- **Bad or no feedback from stakeholders.** The owner stops coming to the Review, then imposes a
  constraint. A stakeholder you have stopped talking to is a stakeholder who starts deciding things
  for you.
- **Bad press: television, media, social.** A shock to attendance with a named cause. Recovery takes
  visibly fixing the thing and being seen to fix it, which is a Sprint Goal worth having.

One rule for all of them: **an event is never random punishment.** It follows something the zoo did
or failed to do, and it says which. Randomness that cannot be traced teaches superstition.

## The Scoreboard

Evidence-Based Management gives four lenses rather than one number, which is exactly what a game
about outcomes needs: there is nothing single to game. From the EBM Guide (Scrum.org, May 2024):

| Key Value Area | What the zoo measures |
|---|---|
| **Current Value** | Visitor happiness and its trend, visitors a Sprint, what is open |
| **Unrealized Value** | The satisfaction gap per visitor segment, and requests not yet taken |
| **Time to Market** | Lead time from Backlog to open, releases a Sprint, days to clear an impediment |
| **Ability to Innovate** | New capability against rework, and build time actually spent building |

The rule-breaks damage capability (Time to Market, Ability to Innovate). The external events hit
market value (Current Value, Unrealized Value). Together they make one board where a shortcut taken
in Sprint 2 is visible in Sprint 4.

Never roll the four into a single score: the Guide is explicit that they are four lenses for a
balanced perspective. And its End Note says implementing parts of EBM is possible but the result is
not Evidence-Based Management, so the screen says "key value measures for this zoo" and claims
nothing more.

## The Sprint's Question

EBM's Experiment Loop is the best gameplay idea in any of this. At Planning the Product Owner states
a bet in the game's own terms: *if we open the cafe, comfort seekers' happiness rises by ten*. At the
Review the visitor simulation says whether it did. That gives every Sprint a question worth waiting
for, and it turns the visitor segments from decoration into the point of the game.

It also settles the levels question. EBM has three goal levels, and they map without strain:

- **Strategic Goal**: the campaign. A zoo people love and come back to.
- **Intermediate Goal**: the chapter, and the level-complete moment. Families rate us 70 or better.
- **Immediate Tactical Goal**: this Sprint's experiment.

Which is a better structure than a Sprint being a level, and avoids teaching Sprints as phases.

## Increments

Each is worth shipping alone, and each is a prerequisite for the ones under it rather than a phase.

1. **Notice what the team did.** Record decisions as they happen (who chose the Sprint Backlog, was
   the Daily Scrum held, was anything pulled unready) and replay them at the Retrospective beside
   what happened. No new rules and no costs: just the game paying attention. *Half a session, and
   everything else rests on it.*
2. **Free play mode.** The gate asks instead of refusing, and the answer is recorded. *Half a
   session.*
3. **Two costs.** The Daily Scrum as a status report, and the Product Owner choosing the Sprint
   Backlog. Both from mechanics that already exist. *One session.*
4. **The four dials at the Review.** Current Value and Unrealized Value first, since the simulation
   already knows what each visitor segment wants and is not getting. *One to two sessions.*
5. **One external event.** Bad press with a named cause, and a way back. *One session.*
6. **The hypothesis.** One line at Planning, one verdict at the Review. *One session.*

## What Not To Do

- **No instant punishment.** The cost lands later, or it is just the gate again.
- **No unexplained randomness.** Every event names its cause.
- **No single score.** Four dials, or people optimise the number instead of the zoo.
- **Do not take the gate away from a first game.** Somebody meeting Scrum for the first time needs
  to be told whose call it was. Breaking the rules is a thing you do on purpose, which means knowing
  they exist.
