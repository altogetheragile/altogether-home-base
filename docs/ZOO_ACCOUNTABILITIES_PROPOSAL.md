# Giving the accountabilities something to do

A proposal, 22 August 2026. Covers three things that arrived together: the Scrum Master having no
verb, the thinking exercises from the Scrum Master deck, and Product Goals shaped as OKRs or epics.

## The problem, stated plainly

The game teaches **artifacts** by making you hold them: a Product Backlog you write and order, a
Sprint Backlog you fill and defend, an Increment you can walk around. It teaches **events** by making
you attend them: five screens, each with its own question and its own contract.

It teaches **accountabilities** by naming them. Three cards in the reference, a `PO SM A B C` strip on
the board, and a tooltip that says which hat you are wearing. Nothing you do is different because of
who you are, and nothing in the game ever pushes back on you for acting as the wrong one.

That is the gap. The fix is not more cards. It is giving each accountability a **verb** - something
only they may do, that the game notices.

---

## 1. The Scrum Master gets a turn

Of the three, the Scrum Master is the one with nothing at all. The Product Owner at least orders the
Backlog and writes the Goal; the Developers estimate, plan and build. The Scrum Master watches.

Worse, the game already generates the raw material and wastes it. Impediments surface at the Daily
Scrum, cost you time, and offer two responses - "adapt the plan" or "carry on regardless" - neither
of which is a Scrum Master act. The impediment is weather, not a problem anyone solves.

### 1a. Impediments become things you remove

An impediment arrives with three responses rather than two:

| Response | Cost | What it teaches |
|---|---|---|
| **Remove it** - the Scrum Master's own work | Some of today | The Scrum Master causes the removal of impediments. It costs real time, now. |
| **Work around it** | A smaller cut today, and it returns tomorrow worse | Living with an impediment is a choice with compounding interest |
| **Escalate it upward** | Nothing today; it resolves in a day or two, and the team learns to wait | Serving is not commanding. The team that escalates stops solving. |

None of the three is forbidden. The coach names what happened afterwards, and the Retrospective can
see the pattern across a Sprint - "you worked around four impediments and removed none".

### 1b. Somebody from outside asks for something

Mid-Sprint, a stakeholder wants a thing. Three doors:

- **Say yes** - it goes into the Sprint. The Sprint Goal is now at risk, and the game says so.
- **Say no** - cheap, and the relationship takes a knock the Review will mention.
- **Take it to the Product Owner** - the correct move, and the one the game should make feel good:
  the item lands in the Product Backlog, ordered by the Product Owner, and nobody's Sprint broke.

This is the single clearest way to teach that the Scrum Master protects focus by **routing**, not by
blocking, and that what goes into a product is the Product Owner's call and no one else's.

### 1c. A health signal, not a score

At the Review, alongside visitor happiness, the game reflects the team back at itself: how often the
Sprint Goal was protected when scope had to give, how many impediments were removed rather than
endured, whether the Daily Scrum was held. Not a mark out of ten - a mirror. The Retrospective then
has something real to inspect that is not the product.

### What this needs

- Impediments gain response options and a memory (removed / endured / escalated).
- A stakeholder-request generator, one or two a Sprint, on a day that is not the last.
- A small `teamHealth` record on state, surfaced at Review and Retro.

Roughly a day's work. It touches `engine.ts` impediments, `DailyScrum.tsx`, `SprintReview.tsx`.

---

## 2. The thinking exercises, as coaching

Nineteen exercises from the Scrum Master deck. They are **not one kind of thing**, and the mistake
would be to pour them all into the Retrospective.

The deeper danger: these are *discussion* exercises with no single right answer. Turned into multiple
choice with one correct option, they become worse than the classroom version - a quiz that teaches
there is a right answer where the point is that there is a conversation. **Every one of these must
respond with what the Guide says and what tends to happen, and say plainly where more than one
answer is defensible.**

### Type A - "What do you advise?" (situations)

Slides **37, 38, 39, 50, 57, 91, 107, 108, 110**.

These are situations, and the game already has a mechanic for situations: something arrives, you
choose, the game responds. They belong **in the Sprint**, as the stakeholder-request and impediment
machinery from part 1 - not in the Retrospective, where they would be hypothetical.

- 37 (no Product Owner), 38 (four Product Managers on commission), 39 (Backlog argued at Planning)
  → arrive as **Product Owner problems**, at Planning or Refinement.
- 50 (a few more days to finish testing), 57 (release untested to hit a date)
  → arrive **near the end of a Sprint**, when the pressure is real because your own clock is running.
- 91 (when will PBI X be done?) → arrives **at the Sprint Review**, from a stakeholder, once you have
  a velocity of your own to answer with. This one the game can genuinely check: the honest answer is
  a range, and the game knows your actual spread.
- 107, 108, 110 (forming teams, the one specialist, other projects) → these are organisational and
  sit outside a single zoo. Best as a **between-Sprints "the wider organisation" beat**, or held back
  for the trainer-led mode.

### Type B - "Shout out" (brainstorms)

Slides **48** (Daily Scrum anti-patterns), **65** (no Definition of Done), **68** (technical debt),
**102** (an effective Scrum Master).

A brainstorm cannot be graded, so do not pretend to. Make them **card sorts**: eight or ten
statements, some sound and some anti-patterns, and the player sorts them. The teaching is in the
feedback on each, not in a score. Best placed as **optional coaching**, reachable from the "?" on the
screen the topic belongs to - the Daily Scrum anti-patterns behind the Daily Scrum's "?", and so on.

### Type C - reflection

Slides **75** (what is a product), **104** (the best team you were in), **116** (Scrum Values in
behaviour), **119** (services to the Scrum Team).

These *are* Retrospective material - they ask you to look at yourself, which is what the event is
for. The Retrospective already asks open questions; these join that rotation, one per Retro, chosen
to match what actually happened in the Sprint. 116 in particular can be triggered by play: if you
cancelled a Sprint, ask about Courage; if you dropped scope to protect the Goal, ask about Focus.

### What this needs

A `coaching.ts` registry - id, type, prompt, options, and a response per option - plus three small
presenters (situation, card sort, reflection). The content is the bulk of the work: nineteen
exercises with three or four responses each, written so that no option is a trap.

Two to three days, most of it writing. All of it should be in the copy editor, like the Teaching
Cards, so you can polish the wording without a deploy.

---

## 3. Product Goals as OKRs or epics

The smallest of the three and the most immediately useful.

The Product Goal card already tells the player the shape is theirs - *"It can be shaped as an
objective and key results, or as an epic user story"* - and then the game offers a single-line text
box. The card says one thing and the screen affords another.

**Offer the three shapes where the Goal is written**, with a worked example behind each, taken from
the deck's BestU examples:

- **A plain outcome** - what it does today. "Open a zoo that visitors love and come back to."
- **Objective and key results** (slide 83) - the objective, then two or three observable measures.
  *"People who start BestU carry on after an initial two-week period... 80% continue to use it;
  interact at least 3 times a week; we lose less than 10% after 3 months."*
- **An epic user story** (slide 84) - as a &lt;who&gt; I want &lt;what&gt; so that &lt;why&gt;, with
  acceptance criteria and a horizon. *"As a dieter I want to eat healthily and take regular exercise
  so that I can feel better about myself..."*

The measures are the valuable part: a Product Goal with observable measures can be **checked against
the visitor simulation at the Review**. "80% of visitors come back" is a thing this game already
computes. That turns the Product Goal from a sentence at the top of the screen into something the
product is measured against - which is exactly what the Guide means by progress toward it being what
the Review discusses.

"Word it for me" would produce the chosen shape.

### What this needs

`productGoal` becomes `{ shape, text, measures? }`, a three-way picker on the intro and in Artifacts,
and a Review section comparing measures with what the visitors actually did. Half a day, plus the
Review comparison.

---

## What I would build first

1. **Product Goals as OKRs or epics.** Smallest, and it makes the Review meaningfully better.
2. **The Scrum Master's turn.** Biggest gap in the teaching, and it makes the Daily Scrum matter.
3. **The thinking exercises**, starting with the type A situations that plug straight into 2.

The exercises are worth doing last, not because they matter least, but because parts 1 and 2 build
the machinery they need to arrive through.
