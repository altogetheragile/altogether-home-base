# Build A Zoo: Red-Team For Fun And Engagement

A game designer's critique of the play experience, ranked by impact. The game is a
strong *teaching* artifact. This review is about the *game* underneath it, and how
to make the Scrum lessons land through genuine fun rather than alongside it.

## The Governing Principle

It is an edu-game. The failure mode of edu-games is that the "game" is a thin candy
shell around a lesson, so it plays like homework with sprites. The fix is not to add
fun *next to* the teaching. It is to make the Scrum truth *be* the source of the fun:
every mechanic should teach and delight at the same moment. Each idea below is scored
on both.

## What Is Already Working

- The Scrum spine is honest and complete (Backlog, refine, poker, Why/What/How, timed
  days, Daily Scrum, Deploy/Done split, Review with a real customer sim, Retro with
  improvements that bite, carry-over re-estimation). This is rare and valuable.
- The build studio is charming and tactile: parametric pixel-art, per-item colouring,
  smooth resizable scenery. Craft feels good.
- The place-then-confirm deploy flow and build-vs-deploy acceptance split are elegant
  and true to "you can't accept placement before you have placed it."
- Inspect-and-adapt has teeth (WIP limit, Daily Scrum discipline).

The bones are good. The game is under-delivering on *feeling*, *stakes*, and *payoff*.

## The Biggest Gaps, Ranked

### 1. The Customer Is Invisible Until Review (highest impact)

The whole emotional promise of a zoo game is watching guests enjoy the place you
built. Right now the park is a static diorama and visitors are a number that appears
once, at Review, with a quote. The customer, the most important character in Scrum,
has no presence during play.

- Fun: add living visitors on the park. Little figures arriving at the entrance,
  walking the paths you drew, queuing at exhibits, emoting (delight, boredom, "need a
  toilet"), and leaving if unhappy. This is the dopamine engine of every tycoon game.
- Scrum lesson, made visceral: value is realised only when delivered to the customer.
  The instant you Deploy Complete an exhibit, guests should flock to it. You *see*
  "working software in the hands of users," continuously, not as an end-of-Sprint
  report.

This single change does more for engagement than any other. It converts an abstract
lesson ("deliver value early") into a thing you watch happen.

### 2. There Are No Stakes (economy + reputation)

You cannot really lose, and velocity is a number with no felt cost. Without stakes,
the core Scrum decisions (how much to commit, what to prioritise, WIP limits) are
academic. The player has no reason to feel the pain of over-committing or the reward
of finishing value early.

- Fun: a light money + star-rating loop. Visitors pay entry; happy visitors spend and
  return; revenue funds the next Sprint's capacity. A zoo star rating (1 to 5) that
  rises and falls at each Review gives a progress bar and a win target.
- Scrum lesson: this *is* ROI. Finish valuable increments early and they earn from day
  one; leave work half-built and it is tied-up investment returning nothing. Over-
  commit and you strand WIP and starve the next Sprint. The economy makes "finish
  fewer things properly" a felt truth, not a slogan.

Keep it light. This is not a spreadsheet tycoon. It is a pressure gauge that gives the
Scrum choices consequence.

### 3. Rewards Are Back-Loaded (juice on every delivery)

The payoff arrives only at Review, after a whole Sprint. The moment of actual delivery,
"Deploy Complete," is silent. That is the single most celebratory beat in the whole
loop and it is a no-op.

- Fun (cheap, high return): when an item opens, pop it. Confetti, a coin burst, a
  happiness "+", guests rushing over, the animal doing a happy idle. Sound: a short
  delivery jingle. Game feel lives in these 300ms moments.
- Scrum lesson: every increment is a shippable, celebrate-able win. Reward the
  increment, not just the Sprint. It teaches that Done is a real event worth marking.

### 4. Design Craft Has No Visible Consequence

Exhibits already derive "appeal" from their design (families like bright and lively,
comfort seekers calm, enthusiasts distinctive). This is a great system that is
completely hidden. The player colours an animal with no feedback that it mattered.

- Fun: show a live appeal read-out in the studio as you design: "Families star star
  star, Enthusiasts star, Comfort star star." Now colouring is optimisation with a
  payoff, not decoration.
- Scrum lesson: quality and craft are value. The Definition of Done and polish change
  the outcome for the customer. Make that legible.

### 5. Progression Is Flat (unlocks and tiers)

The whole toolbox is available from turn one. There is no growth, no unlock, no
escalating challenge, no reason the tenth Sprint feels different from the first.

- Fun: gate content behind zoo rating or milestones. New animals, new zones, bigger
  enclosures, decor, and event types unlock as your zoo climbs. This is the tycoon and
  roguelike hook: the product visibly grows, and you keep playing to see the next tier.
- Scrum lesson: incremental delivery compounds. The product grows release over release;
  early value funds later ambition.

### 6. Choices Lack Tradeoffs (make audience a strategy)

Building an enclosure vs an animal vs a cafe is mostly dictated by the Sprint Goal, not
by an interesting decision. The visitor segments exist but are not a lever the player
pulls.

- Fun: surface the segment mix. Let the player target an audience (a family park vs an
  enthusiast collection), have content appeal differently, and let scarce capacity and
  budget force real prioritisation with a visible payoff.
- Scrum lesson: the Product Owner maximises value by ordering the Backlog. Make that
  ordering a real, rewarded choice, not an admin step.

### 7. Not Enough Surprise (events and seasons)

Impediments and visitor signals add welcome variety, but they are reactive nudges. A
run of Sprints feels same-y, which hurts replayability.

- Fun: incidents and seasons. A heatwave (guests need shade and water now), a school
  trip (families spike), a VIP animal, a sponsor offer, a keeper strike. Each forces
  mid-run adaptation and mixes up priorities.
- Scrum lesson: empiricism and adapt-to-change. The plan meets reality; you inspect and
  re-order. This is inspect-and-adapt as gameplay, not a Retro checkbox.

### 8. The Day Timer Feels Abstract

The 90-second day is a stopwatch. Time-boxing is the lesson, but a bare countdown reads
as arbitrary stress rather than rhythm.

- Fun: make it diegetic. It is a zoo *day*: gates open, guests arrive and flow, dusk
  falls, the day closes. A day-night cycle with visitor arrival makes the clock feel
  like a living day, not a timer.
- Scrum lesson: the time-box is fixed and real; the day ends whether you are ready or
  not. Felt through immersion instead of pressure.

### 9. No Satisfying Finish

What is the "I won" moment? The Product Goal percentage is quiet. Sessions need a
climax.

- Fun: a clear target (a 5-star zoo, or the Product Goal met) and a Grand Opening
  finale you watch: ribbon cut, guests pour in, a final zoo "card" you can share.
- Scrum lesson: the Product Goal is the north star; reaching it is the point of all the
  Sprints. Give it a payoff.

### 10. Ceremony Friction

Some flows are click-heavy paperwork (refine, estimate, Why/What/How, tick ACs, place,
confirm, complete). The teaching ones should stay; the ones that are pure clicking
should be faster so the game keeps flow. Guard against "death by dialog."

## Cross-Cutting: Game Feel

- Sound. Ambient zoo audio, UI clicks, a delivery jingle, a Review fanfare. Silence is
  the enemy of juice.
- Idle animations. Animals blinking, pacing, splashing. The "aww" is free engagement.
- Attachment. Players can name enclosures; let them name animals too. Named things get
  cared for.
- Comeback arcs. Let a zoo dip (unhappy guests churn) and recover. Recovery is one of
  the most satisfying feelings a management game can offer, and it teaches that a bad
  Sprint is data, not defeat.

## If You Only Do Three Things

1. Put living, reacting visitors on the park (gap 1). Biggest fun-per-effort.
2. Add a light money + star loop so decisions have consequence (gap 2).
3. Celebrate every Deploy Complete with juice (gap 3). Cheapest, instant lift.

Together these turn the loop from "fill in the board, read the report" into "build a
thing, watch guests love it, earn, grow." The Scrum lessons ride along for free,
because in this framing delivering value early literally *is* the winning strategy.

## Suggested Sequencing

- Quick wins (days): delivery juice (3), live appeal read-out in the studio (4), sound
  and idle animations, name your animals.
- Medium (a week or two): walking/reacting visitors on the park (1), a light economy +
  star rating (2), a Grand Opening finale (9).
- Bigger bets: progression/unlock tiers (5), audience strategy (6), incidents and
  seasons (7), diegetic day-night (8).
