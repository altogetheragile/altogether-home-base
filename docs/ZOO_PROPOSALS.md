# Zoo Game: Five Things To Decide Before Building

_Written 2026-09-16, closing out `docs/ZOO_REVIEW_ACTIONS.md`. Everything else on that
list is done or is one migration somebody has to run. These five were tagged
**[propose]** because they are design questions rather than defects: each one has more
than one defensible answer, and the wrong one costs more to undo than to get right._

Each has the same shape: what is actually there now, what it costs, the options, and
the one I would take. **None of them is started.**

---

## 1. A complaint and its fix, in one movement

### What is there

The Review shows two blocks, in two different steps.

**"What visitors said"** is a list of quotes, each carrying a `cause`
(`simulation/feedback.ts:11`): `unmet:food`, `crowding`, `truncation`,
`accessibility`, `loved:<exhibit>`.

**"What the visitors said · your call on each"** is a list of signals, each carrying a
`drivenBy` (`SprintReview.tsx:549`) - and `drivenBy` is drawn from exactly the same
vocabulary. `signalToPbi` in `engine.ts:2066` switches on it: `unmet:food` becomes a
Food outlet, `crowding` becomes an Extra viewing area.

So the join is already in the data. Nothing on the screen uses it. A player reads
"we queued twenty minutes for a sandwich" in one step, and presses "Add to the Product
Backlog" next to "Open a food outlet" in another, and nothing says those are the same
fact. The Final screen never mentions either.

### What it costs

The loop the whole game is built to teach - visitors tell you something, you change
the Backlog, the next Review tells you whether it worked - is the one loop the player
has to assemble in their own head.

### Options

**(a) Bind the quote to its call.** Render the signal row with its quote inside it, in
one step rather than two, and when a signal is taken or declined keep the quote
attached to the decision in the log. Small, mechanical, uses data already present.

**(b) (a), plus carry it forward.** When the same cause returns at the next Review,
show the quote with what was decided last time: "you declined this in Sprint 2, they
are saying it again". The engine already ages a signal (`signalAge`, `engine.ts:2052`)
and the decision log already records the call. This is the empirical loop said out
loud.

**(c) (b), plus the Final screen.** End with the three causes that most changed, from
first complaint to last, with what was built between them. This is the payoff and it is
also the largest piece of new design.

### What I would do

**(b).** (a) alone is tidying; (c) is a screen redesign that should wait until somebody
has played (b) and can say whether the Final screen still feels thin. (b) is the one
that turns two lists into a loop, and its cost is mostly wiring.

---

## 2. Undo

### What is there

Nothing. Four acts confirm instead: Cancel Sprint, the Final reset, End Day on the last
day of a Sprint, and Send Back. Splitting an epic explains itself rather than asking,
because it is reversible in substance if not in mechanism.

### What it costs

Every irreversible act has to be defended at its own call site, in its own words, and
each new one is a judgement about whether it deserves a dialog. That judgement has
already been got wrong in both directions on this list: Split Epic was asked to confirm
something safe, and End Day ended a Sprint without asking at all.

### Options

**(a) Leave it.** Keep confirming per act. Cheapest, and the game is a teaching tool
rather than a document editor: making a bad call and living with it IS the lesson in a
Sprint.

**(b) One step back, on the game state.** `useZooGame` is a reducer over one state
object, so a `previous` snapshot is roughly ten lines: keep the state before the last
action, and offer "Undo" on the dock for a few seconds after acts that qualify. The
hard part is not the mechanism but the *policy* - which acts qualify. Undoing "End
Day" would unwind a simulation; undoing "Split Epic" would not.

**(c) A full history.** A stack of states, a keyboard shortcut, undo anywhere.
Multiplayer makes this genuinely hard: whose undo, and what happens to the other four
people's screens when it fires.

### What I would do

**(a), and say so in the code.** This is a game about making calls under a clock, and
an undo stack quietly teaches that decisions are cheap. If it is wanted anyway, take
(b) and restrict it to acts inside one player's control that do not advance the
simulation - which is a short list, and worth writing down before any code.

**(c) is the one to refuse.** In a shared session it is a rewind of somebody else's
experience, and the game already has a rewind: the next Sprint.

---

## 3. Three ways to be told what to press

### What is there

Three mechanisms, all live, on the same screens.

1. **The dock** (`ActionBar`) - one primary action, bottom right, on all eight screens
   that render it, plus the shell. "What do I press to go on."
2. **The rail** (`ActionRail`) - what somebody is waiting on you for, one at a time,
   with its answers on the row. Three mounts. Never dismissed: answered, or it waits.
3. **Controls on the thing itself** - "Start it" and "Move it to Done" in the card
   dialog, "Open this ground" on an area, the toolbox on the park.

### What it costs

Nothing obviously, today. The audit flagged it as inconsistency; on the evidence it is
closer to a division of labour: the dock moves the game on, the rail says who is
waiting, the thing itself is where you work on it.

The real cost is at the seams, and there is one: **the dock and the rail can both be
asking at once**, and the dock is the louder of the two. In a shared session the rail
is where the game says "the Product Owner has to answer this" - and the dock beside it
says "End Day". The game offers to move on from a decision it is also waiting for.

### Options

**(a) Leave all three, fix the seam.** When the rail holds something addressed to this
player, the dock's primary action says so and offers the rail's answer instead of the
next step. One rule: the game never offers to move past a question it is asking you.

**(b) Fold the rail into the dock.** One place, always. Loses the "who is waiting"
model, which is one of the few places the game teaches that a Scrum Team is people
waiting on each other.

**(c) Leave it.** Document the division of labour so the next screen picks the right
one, and stop calling it an inconsistency.

### What I would do

**(a).** The seam is a real defect, and it is visible in any Sprint: Ada asks which shape the
habitat should be, the rail says the call is yours, and the dock beside it offers to
end the day. A game that says "somebody is waiting on you" and "move on" in the same
breath is teaching the opposite of what waiting on each other means. The change is
small. Then write down the division of labour, which is (c) done
properly.

---

## 4. Loading a save knows the answer twice

### What is there

Two places fill in what a save does not carry.

`readSave` (`zooSaves.ts:82`) returns
`{ ...read, value: read.value ?? 0, lastLedger: read.lastLedger ?? null, version: SAVE_VERSION }`.

`LOAD_GAME` (`useZooGame.ts:276`) returns
`{ ...initialZooState(...), ...action.state }`.

Both are defaulting. They do not agree on how: the reducer defaults *every* field by
merging over a fresh state, and `readSave` defaults two by name. The named two are
therefore doing nothing that the merge would not do - and the next field somebody adds
will be defaulted by the merge whether or not they remember the ladder in `readSave`,
so the ladder will look maintained while doing nothing.

### What it costs

Nothing today. It costs on the first save-format change that is not a new field with a
sensible zero - a field that CHANGES meaning. Then the migration has to happen in
`readSave`, and the merge in `LOAD_GAME` will quietly overwrite it with the old value,
because the loaded state wins over the fresh one.

### Options

**(a) One migration point.** `readSave` owns the whole job - validate, migrate, fill -
and `LOAD_GAME` stops merging: `return action.state`. Anything new is defaulted by the
ladder, on purpose, in the place that knows which version it came from.

**(b) One defaulting point.** `LOAD_GAME` keeps the merge and `readSave` stops
defaulting, dropping the two named fields. Less code, and it keeps the property that a
save can never be missing a field.

**(c) Leave it.**

### What I would do

**(a)**, and it is worth doing before the next save-format change rather than after.
The merge is the trap: it makes every migration look like it worked. (b) keeps the trap
and removes the ladder that was built to escape it.

---

## 5. One state, one action union

### What is there

`ZooGameState` is 70 fields (`types.ts:390`). `ZooAction` is 107 members
(`types.ts:616`). `engine.ts` is 3,717 lines. Everything the game knows is in one
object, and everything it can do is in one union.

### What it costs

Less than it looks like. A single reducer over a single state is what makes the save
format, the multiplayer replication and the whole test suite as simple as they are: an
action is a value, a game is an object, and `useZooSession` can ship one and store the
other without knowing anything about zoos. Splitting the state means deciding what
happens at the seams - and the seams are where this game is interesting, because
placing a habitat on the park changes the acceptance criteria of a Backlog item.

The real cost is navigational: a 107-member union is hard to read, and a 3,717-line
engine is hard to find anything in.

### Options

**(a) Leave the shape, improve the map.** Group the union with comments by what it acts
on, and split `engine.ts` by subject (park, sprint, review, backlog) keeping one
export surface. Pure rearrangement, no behaviour, no risk to saves or replication.

**(b) Namespace the actions.** `{ type: 'park/PLACE_ITEM' }` and so on, grouped into
per-area unions that compose into `ZooAction`. Better types and better grouping; a
large mechanical rename touching every call site, every test and every saved decision
log that recorded an action type.

**(c) Split the state.** Several reducers, composed. This is the one that breaks the
save format and the replication model, and it buys tidiness.

### What I would do

**(a).** The god-object complaint is real as a reading experience and mostly wrong as
an architecture complaint: the single state IS the feature that makes multiplayer and
saves work. Do the rearrangement, and reconsider (b) only if the union keeps growing.
**(c) is the one to refuse** unless the save format is being broken anyway for some
other reason.

---

## If only one gets built

**1(b)**, the complaint-to-fix loop. It is the only one of the five a player would
notice, and it is the loop the game exists to teach.
