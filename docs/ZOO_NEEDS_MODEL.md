# The Needs Model

_Agreed 2026-09-16, in conversation. This replaces the data-model half of
`build-toolbar-brief.md`; the toolbar half of that brief still stands and is
unaffected._

## The principle

The Product Owner captures **what is needed**. The Developers decide **how**.

The game is currently wrong about this, in the one place it matters most. A
Product Backlog item called "Lion Enclosure, large, 8 points" is the Product
Owner choosing the paddock, the footprint and the barrier. That is the
Developers' work, and the game hands it to them already done.

Half of it is already right. The acceptance criteria are **already needs**:

> Is it bordered safely, with no way out of it?
> Can I fit them in the habitat with room to spare?
> Can I tell an animal lives here, not a shed?
> Can I see a group rather than one animal on its own?
> Can I walk to it from the way in?

Nothing in those says paddock. What is wrong is the binding underneath: one
item, one object, named for the answer.

---

## The four pieces

### 1. Criteria are the vocabulary

One closed set. Each criterion is an id, the sentence a person reads, and **the
thing that answers it**.

```ts
interface Criterion {
  id: CriterionId;
  asks: string;              // "Can I walk to it from the way in?"
  short: string;             // "a way to walk to it" - for catalogue rows
  answer: (state, item) => Verdict | null;   // null = a person judges it
}
```

The answer travels with the criterion. It is not optional and it is not a
lookup somewhere else, because this game has shipped a criterion nothing could
answer **three times**: "Can I find it from the entrance?", "Placed where
visitors can reach it", and the Gift Shop's three, where the only route to Done
was the Product Owner waiving all of them. Every time, the cause was the same:
the sentence was data and the answer was code, and nothing held them together.

Criteria come in three kinds, and the difference is worth teaching:

| kind | met by | example |
| --- | --- | --- |
| **chosen** | placing the right thing | a way to walk to it |
| **configured** | a property off its default | bordered safely |
| **relational** | a fact about the pair | a low hedge holds a tortoise and loses a lion |

The third kind is the one the game is good at and the one a data-only model
loses. `barrierVerdict(design, living)` reads the animal, not the dropdown. Keep
those as functions.

Some criteria have no answer at all and that is correct: "Can I buy something to
take home?" is a person's judgement, because the zoo does not model shopping.
The game now says so rather than claiming the criterion is unmet.

### 2. The catalogue is the bound

Every buildable thing declares what it can meet.

```ts
interface CatalogueItem {
  id: string;
  category: 'Flora' | 'Fauna' | 'Habitats' | 'Buildings' | 'Infrastructure';
  name: string;
  meets: CriterionId[];
  properties: PropertyDef[];   // some gate a criterion, some are cosmetic
  built_for?: string;          // "birds" - said on the row, never enforced
}
```

**No `cost`.** Points are a forecast in this game, never a budget. A price
column against each row turns the Sprint into a wallet, and the repo is
emphatic about why: *"a team that could spend its estimates would be a team
whose estimates were a currency... It is the one rule this whole mechanism
exists to protect."*

**No `requires` and no blocking.** An aviary can be built for a lion. A tank
can. The row says what a thing is built for, which is information, and then the
park says what happened, which is the lesson. Choosing the right home is the
Developers' professional judgement, and a game that will not let them be wrong
cannot teach them anything. It is the rule the park already lives by: the
mistake is not building a weak fence, it is opening the place with one.

### 3. A need is a story and a set of criteria

```ts
interface Need {
  story: { as: string; want: string; soThat: string };   // free wording
  criteria: CriterionId[];                                // closed set
}
```

The wording is the Product Owner's own. The criteria are not, because a
criterion nothing can answer is a dead end rather than an ambition.

> As a zoo visitor I want to see lions in a suitable enclosure, so that they
> are well kept, not exploited.

Needs arrive from three places, and all three are needed:

1. **Seeded**: what the zoo opens with, from the brief.
2. **Earned**: pushed by what the visitors said at the Review. This is where
   most of them should come from after Sprint 1: Evidence-Based Management
   generating the work rather than reporting on it.
3. **Authored**: the Product Owner's own, driven by the Product Goal. "Open
   the Waterside" is not a complaint, it is a decision about where the zoo is
   going.

If every need arrives from a signal, the Product Owner becomes a button-presser
at the Review. All three, or the accountability is a formality.

### 4. The studio offers what serves the item in hand

The Developers cannot build whatever they like. The catalogue offers what meets
an **open criterion of the item being built**. Everything else is browsable, so
you can see what exists, and not placeable.

That is the bound. Within it, nothing is refused.

---

## Two invariants, and they are tests

1. **Every criterion a need can hold is met by something in the catalogue.**
   No unsatisfiable need can be written.
2. **Every `meets` names a criterion that exists.**
   No catalogue item can claim something imaginary.

Together these make the bug class above impossible by construction rather than
by vigilance. They are cheap tests and they should be written first.

---

## What changes in the code, in the order I would do it

Each step ships working. The game never stops being playable.

**1. Criteria become data with their answers attached.**
Today a criterion is a string and `checkCriterion` is a long if-chain keyed on
exact text, with `WAS_CALLED` as a migration for re-wordings. Turn it into a
registry: id, sentence, answer. Acceptance lists hold ids; a text-to-id
migration covers saves in flight. **No behaviour change**, and invariant 2
becomes testable immediately.

**2. The catalogue declares what it meets.**
`toolboxItems.ts` gains `meets`. Invariant 1 becomes testable.

**3. Need-shaped items live alongside solution-shaped ones.**
A PBI may carry a need instead of a template. Seed one or two that way and
leave the rest. The contrast is the teaching - a bridge over the river is a
bridge, and the difference between a need and a specification is itself the
lesson - and it makes the migration gradual rather than a cutover.

**4. ~~The studio places from the catalogue.~~ Refinement tells a composite item from a
fine-grained one.** _Revised 2026-09-16, and done._

The step as written was for a need that owns several placed objects. It is not
needed, because the Product Owner's answer was that a composite item is **split at
Refinement into fine-grained items that are ready for a Sprint** - which is what an
epic already does, and the lion and its enclosure stay two decoupled items.

What that leaves is the question the game could not previously answer: WHICH items
are composite? It took the Product Owner's word for it, and a need could be written
that no choice would ever satisfy.

The catalogue answers it. If one piece can settle everything an item asks, it is one
piece of work; if nothing can, it is asking for more than one thing and no decision
the Developers make will change that. `noOnePieceMeets` is the rule, and a composite
need is told to be split rather than offered a choice that cannot work. Criteria only
a person can answer are left out of the sum, or every item in the zoo is composite.

**5. ~~Signals produce needs, not buildings.~~** _Done._

`itemFromSignal` is `needFromSignal`. A signal read "Add somewhere to eat (a cafe or
kiosk)" - the parenthetical is the simulation choosing the building - and taking it
put a "Food outlet" on the Backlog with its services set and its size decided. The
quote that drove it was need-shaped all along: "Lovely morning, but we left at
lunchtime. Nowhere to eat."

`signalNeeds.ts` is the table, and the Review's words come out of the same entry as
the item, so what the Product Owner is offered and what they get cannot drift.

Two things fell out of it that were not in the plan:

- **The Product Owner's look-ahead had the same fault**, on the route the Product
  Owner drives: it proposed a Kiosk and a Toilets block with their services already
  set. It proposes the same two needs now, from the same table. The only difference
  between the two routes is WHEN, which is the argument for looking ahead.
- **A team that has not adopted refinement cannot choose**, so a need raised for
  them would be stuck twice over - unsizable until somebody decides, and nobody able
  to decide. The Developers decide it off-screen, which is the rule that already
  sized new work for them. Before you take refinement on, refinement still happens:
  you just do not see it, and you have no say in it.

The two crowding criteria were statements - "Eases the queues", "Good sightlines" -
and are questions now, which is the house style for a reason: a statement can be
waved through where a question has to be answered.

**6. Sizing follows the choice.**
`effortOf` currently reads the category and the footprint, which is only
possible because the item already decided what it is. When the Developers
choose, the estimate has to follow what they chose. This is **more** correct
Scrum, not less: you size the work you intend to do. It also connects to the
right-sizing evidence already gathered in the Retro panel.

---

## Risks, named

- ~~**The save format.**~~ _Done, and the mechanism was not what this said._ The
  duplication in `readSave` / `LOAD_GAME` is gone. The merge could not overwrite a
  migration - the save was spread second, so it won - but it refilled any key the save
  did not have, so a migration that TOOK A FIELD AWAY could not. One place fills gaps
  now, and two tests hold it there.
- **Losing the relational checks.** If criteria become pure data, the escape
  mechanic dies and "suitable" degrades to "the dropdowns are filled in". Keep
  the third kind.
- **Points becoming currency.** See above. The one rule.
- **The catalogue getting rich.** Every new thing is a thing to draw, and the
  licensed sheet holds what it holds. Two views must agree about every item.

---

## Decisions still open

- **Planting.** Is "Big Cats Planting" a need of its own - the park feels like
  somewhere rather than a field - or part of "I can tell an animal lives here,
  not a shed"? Both are defensible and it is the Product Owner's call, which
  makes it the clearest example of the line. The seeded Backlog has to pick one.
- **Placing.** Held on the cursor, then click the park. This is already decided
  by the existing mechanic and it has a keyboard path. Placing on pick would
  regress it.
- **Ground.** Not a category. "Ground" already means something in this game:
  you buy an area with what the zoo is worth.
