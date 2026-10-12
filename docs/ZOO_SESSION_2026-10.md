# Build A Zoo: The October 2026 Session

A record of the work done between 5 and 12 October 2026, written so it can be picked up cold in a
new terminal. Five pull requests, four merged, one waiting. Plus a course overview drawn up from the
sim and the existing Scrum Master deck.

## Where Things Stand

| | | |
|---|---|---|
| #899 | An animal is stocked, not placed | merged |
| #900 | The ghost tells the truth about the ground | merged |
| #901 | The board and the thread, said once and sized the same | merged |
| #902 | Nothing moves a card but you | merged |
| #903 | The Sprint Goal verdict, said once | **open, all checks green, mergeable_state clean** |

`origin/main` is at `417efbc1` (the #902 merge). The only thing in flight is #903 on branch
`said-twice-two-inches-apart`, which needs nothing but a merge.

## What Each One Did

### #899 An Animal Is Stocked, Not Placed

Reported: *"Placing lions in the Lion Enclosure is a step I thought we were going to remove."*

It had been removed three times and one line never heard. The On the park menu does not appear over
an animal; `structureChosen` says in as many words that an animal is "drawn or stocked, not placed";
the Lives in control says "an animal has no place of its own on the park". But `placingId` in
`ZooShell` excluded a path and nothing else, so picking a lion's card handed you a lion with exactly
one thing it could ever say, about the habitat already named on its own card.

The rule is written once now as `putDownByHand` in `buildGroups.ts`, read by both the menu and the
thing that puts something in your hands. What survives is the gesture that decides something: an
animal nobody has given a habitat to. Dragging one that is already standing now moves it in rather
than writing a position the park never reads.

### #900 The Ghost Tells The Truth About The Ground

Reported: *"I cannot move the structures. The seating area and toilets are in the middle and block
the placement of other enclosures."*

Two faults, one root. `setItemPos` has refused drops on reserved ground since the zone outline went
in, and the ghost under the cursor asks its own question, which had never heard of reserved ground.
Green box, let go, nothing happens, nothing says why. `whyNotHere` had been written for exactly this
and **had no readers at all**. It has one now, and the reason travels with the refusal: "the path
through Big Cats runs here", "the way in has to stay clear".

The toilets and benches are in `Facilities`, which owns no ground on purpose. The packer read
"anywhere" as the first gap it found, and the gaps are nearly all inside somebody's plot, so the
toilets landed in a corner of Big Cats **covering** a slot without standing in one. They take a slot
now: the ones left after every area's own work, from the back, and on the visitors' side of the
water.

A test walks the whole park with something in hand and asserts the ghost never promises a drop the
engine will refuse.

### #901 The Board And The Thread, Said Once And Sized The Same

Reported from a screenshot of four lines from two people: *"Can the messaging be combined? Can the
spaces be better used?"* and then *"I want the message window and the board to be similar in height
and width."*

Three faults. Every lend-a-hand wrote two lines in two voices (the beat's and the reducer's);
`NARRATED` exists to stop that and held one move, so it holds this one now. `say` already collapses
two lines in a row from one person about one card and never fired, because the beat looked for the
card under `action.id` and this action calls it `itemId` (`aboutCard` knows both names now;
`ASSIGN_DEV` has the same shape and is still live). And the name and figure were redrawn for every
line, including a second from the same person.

The message centre now gets `flex-1 basis-0` beside the board: 702x311 each at 1440x900, 622x261 at
1280x800.

### #902 Nothing Moves A Card But You

Reported: *"The pulling of the PBIs and the messages that pop up is very quick and confusing. All
card movements need to be at least prompted and agreed."*

A Developer played by the game no longer moves a card. They hold it up, say what they want to do,
and wait. `ASKS_FIRST` is the three moves that move a card between columns: into Doing, into Done,
and the Sprint Planning forecast. Lending a hand is not one, because it moves nobody's card.

The day clock holds while a question is open and the whole beat stops. "Not yet" is remembered for
the day as `devId:itemId` and cleared when the day ends. Still one line per movement: the asking
happens on the rail, the thread gets the Developer's own sentence when the move lands.

**The rail says whose call it really is**, on every one of these rows: the Developers own the Sprint
Backlog and who takes what is theirs to settle. This is a pace control for a learner, not a rule of
Scrum, and a game that asks your permission for a colleague's pull and says nothing about it teaches
the opposite of a self-managing team. That sentence is the one thing in #902 worth arguing about.

### #903 The Sprint Goal Verdict, Said Once

The verdict was printed twice on the Sprint Backlog, word for word, 170 pixels apart: once on the
strip, once on the board's banner. Both read `goalLine` so they could never disagree, which is
precisely why they came out identical. The strip keeps it (it is on every screen); the banner keeps
the Goal itself in full beside the cards.

A first attempt went the other way, hiding the strip's copy while the board shows its banner. That
needed `ZooShell` to work out whether its own `children` were drawing a banner, and two existing
tests caught it within a minute by rendering the shell with a stub child. Cutting the duplicate from
the banner needs no inference at all.

## Rules That Came Out Of It

1. **One rule, asked by both.** Three of these five bugs were the same shape: two places answering
   one question and disagreeing. The ghost and the drop; the beat and the reducer; the strip and the
   banner. When a second reader is added, point it at the first reader's function.
2. **A function with no readers is a bug waiting.** `whyNotHere` was written for the exact fault it
   later failed to prevent. If something is written "for a screen that wants to say so", give it
   that screen or delete it.
3. **A shell must not infer what its children drew.** See #903's wrong turn.
4. **Dense layout is measured, not estimated.** See the course overview below.
5. Existing tests that encode changed behaviour get their **reasoning** rewritten, not their
   assertions flipped. Nine tests were rewritten across these five PRs on that basis.

## Still Open

- **#903 needs merging.** Nothing else.
- **`Next site (apps/web)` intermittently never gets a runner.** Three occurrences in this session
  (runs cancelled at exactly 15m01s with zero steps recorded, while `ci` got a runner in seconds
  from the same pool). Not the workflow: plain `ubuntu-latest`, no `needs`, no `environment`, no
  container, no `concurrency` block, no `timeout-minutes`. The whole job was run locally and passes.
  The one repo-side lever is folding `web-next` into `ci` so only one runner is requested per push,
  at the cost of about four minutes of wall clock and the deliberate parallelism the workflow
  comment calls out. **Offered to Al, not taken up.**
- **A built facility can stand on a plot the zoo has not opened yet** ("not the zoo's ground"). The
  old packer did this too, so it is not a regression, but what should happen when a finished
  building has nowhere legal to stand is an open question.
- **The generic message deck (spec section 12).** The stakeholder half is built; the generic
  `ChatCard` deck with eligibility predicates, caps per thread per day and unlock rungs has no
  second consumer yet.

## The Course Overview

Asked for a one-page overview of an online course built from the existing Scrum courses, the
materials on the site and the zoo-game, in the shape of the STAR Coach and Manager Practitioner A3
sheet.

**It is an Artifact, not a file in this repo:** <https://claude.ai/artifact/YGsEudMQrKfGgpVdDMbcpy>
(A3 landscape, 1587x1123, Export PDF gives one page). A full-size render is at
`~/Desktop/zoo-shots/course-overview.png`.

Drawn from the Scrum Master deck at
`~/Library/Mobile Documents/com~apple~CloudDocs/0. Work/Agile/Agile & Other Courses/Scrum Master_Altogether Agile/`
(115 slides in five modules, plus a 35-slide exercise pack), `docs/ZOO_COURSE.md`, the sim's 21
teaching cards and `docs/TOOLS.md`. Colours and type from `docs/style-guide.md`.

Al's direction, applied: it is **all Scrum Master**, over **two days as standard**, one row per day.
Scrum Guide language throughout (Product Goal, not Goal). **No Flow Game and no Impact Mapping.**
The zoo-game is named explicitly wherever it is used.

How the two days split:

- **Day 1, The Framework, Run.** Scrum Theory and The Scrum Framework taught, then a full Sprint in
  the zoo-game, guided, everyone in lockstep on the same seed. The overnight work asks "what did
  Done mean?"
- **Day 2, Done, Product, Team.** Quality And Done, Product Delivery, and The Scrum Master And The
  Scrum Team, then the full run in teams, one zoo-game per breakout room with a human Scrum Master.

That order keeps the sequencing decision already recorded in `docs/ZOO_COURSE.md`: Day 1 runs a
Sprint with a Definition of Done nobody was asked to agree, and Day 2 opens on the answer.

Invented and needing Al's numbers: six hours live per day with two breaks, and the week-by-week
pacing. Everything else comes from the deck or the sim.

## Resume

```
cd ~/altogether-home-base && npm run dev
```

Branch `said-twice-two-inches-apart` holds #903 and is clean. Everything else is on `origin/main`.
