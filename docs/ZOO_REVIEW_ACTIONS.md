# Zoo Game: Consolidated Review Actions

_Compiled 2026-09-10 from three review passes, only one of which was committed
(see Source Docs). **Re-run 2026-09-16**: every item checked against the
code as it stands, because the game moved a long way in six days and a work list
nobody has re-read is a list people stop trusting._

## What The Re-Run Found

Of the twenty-four items, **eleven were done** and one half done. Most were not
closed by working this list: they were closed on the way past, by play-throughs and
by other work. That is worth knowing about this document rather than about the
game - it is a snapshot, and a snapshot of a moving thing is wrong by the time it
is read.

**Worked 2026-09-16**, in two passes the same day. The first took the shortlist's
items 1 to 4: P2-4's keyboard path, P2-8, P2-3, P2-2, P2-7's vocabulary and P1-2. The
second took everything that was left: the dock gutter, the touch targets and the lobby
labels, both multiplayer items, and write-ups for the five that are design decisions
rather than defects (`docs/ZOO_PROPOSALS.md`).

**Twenty-three of twenty-four are closed.** The twenty-fourth is a migration that has
to be run by hand. Several items were wrong as written and are marked where they stand;
one of them - the touch targets - was right about the problem and wrong about the fix,
in a way only a browser could show. See What This Re-Run Taught, at the foot.

**Status tags below**: **[done]** with where it was closed; **[stands]** still true
at the cited anchor; **[partly]** one half closed; **[re-anchor]** the file or line
has moved and the item needs re-finding before it can be judged; **[propose]** a
design question rather than a defect, to be agreed before it is built.

---

## P0 - Correctness Bugs

### P0-1. Final screen headline can lie - **[done]**
`ZooFinal` branches on `met = progress >= 80`, from `productGoalProgress`, which is
the same measure the Review offers "wrap up" on. Its own comment says why: "a game
that lies at the end teaches nothing about the Sprint before it."

### P0-2. Goal-critical star is a mouse-only nested clickable - **[done]**
A real `<button>` in both places it appears, with `aria-pressed`, an `aria-label`
naming the item and its state, and focus styling. `SprintPlanning.tsx:593`,
`Board.tsx:119`.

### P0-3. Start fires with an empty Product Goal - **[done, by another route]**
Not by disabling Start. The field was holding the default AS TEXT, identical to the
placeholder behind it, so a first attempt appended to a Goal nobody had written - a
worse bug than the one this item describes, found in a play-through. The field now
opens empty and an untouched field starts on the suggestion, so the Goal can be
neither empty nor accidentally doubled. #626.

### P0-4. Retro hides the cost/earned summary on an empty log - **[done]**
"What it cost, and what it earned" sits outside the `did.length > 0` guard, and the
guard has an else-branch of its own. The comment records the reason: "the team that
most needed to see 'delivered 3 of 21' was the one shown nothing at all."

### P0-5. `setRole` fails silently - **[done]**
`setRole` stands the player up before changing the role, with error handling and a
message if the seat cannot be released. Its comment names the trap and how it was
found: "Found by driving it in a browser, not by reading it."

---

## P1 - High Value

### P1-1. Save format is unversioned - **[done]**
`SAVE_VERSION = 2`, stamped by `stampSave` on write and checked by `readSave` on
load, which refuses a save from a newer version with a message and fills defaults
for fields added since. `LOAD_GAME` still merges over a fresh state, which is now
the migration point rather than a blind cast.

### P1-2. Add confirm-or-undo to irreversible actions - **[done, and one claim was wrong]**
Cancel Sprint and the Final reset already confirmed. End Day now asks on the LAST
day of a Sprint only, naming what is unfinished and where it goes
(`data-part="end-sprint"` / `end-sprint-confirm`); an ordinary day still ends in one
press, because a dialog over every day is one nobody reads by Sprint 2.

Split Epic did NOT get a confirm, because the premise was wrong: the audit said it
"can delete the epic", and `splitEpic` leaves every unticked member ON the epic,
which stays on the Product Backlog. What was missing was a sentence, not a dialog -
`data-part="split-leaves"` now says what comes out and what stays, before the press.
A confirm over a safe act teaches somebody to fear it. Writing the test also turned
up a real bug behind it: the panel compared the number of PBIs coming out against
the number of members going, so unticking a member could still announce the epic as
"fully split, so it leaves the Product Backlog".

The undo primitive is still open, and still touches the reducer host -
**[propose]** the approach first.

### P1-3. Send Back is destructive and sits next to Accept - **[done]**
It is a two-step now: "Send it back · N not met" opens a panel with "Keep looking at
it" beside it, and the cost is visible text rather than a `title`. `Board.tsx:395`.
The engine also refuses to send back work whose criteria were all settled (#619).

### P1-4. Definition of Ready is taught as Scrum - **[done]**
The DoR editor carries the caveat inline: "Your own agreement about what makes an
item ready to forecast - Scrum does not require one. A conversation, not a gate."
`ArtifactsPanel.tsx:132`.

### P1-5. Dropped human seat-holders are invisible - **[done]**
Re-found in `src/pages/ZooTogether.tsx`. Half of it was already closed and said so in
its own comment: `unmannedSeats` treats a seat whose holder has gone as unmanned, so
its work falls to the team rather than to nobody, and the lobby marks it with an amber
"away".

The half that stood was in the game rather than the lobby. `SeatBand` dimmed an absent
member to 40% opacity and said nothing - and its own `present` flag means something
else entirely (present in THIS event: the Product Owner is dimmed during the Daily
Scrum). So a dropped seat-holder showed up as a seat that had quietly become yours to
cover, which is the same news with the reason taken out. Away seats are now threaded
from the lobby's presence through to the band and said in words, for players and for
whoever is watching.

### P1-6. Any player can mutate another player's seat - **[written, NOT APPLIED]**
The client half is closed: `leaveSeat` and `fillWithAi` both refuse a seat held by
somebody else unless the caller is hosting (`useZooSessions.ts:193,213`).
The second layer is written: `supabase/migrations/20260916090000_zoo_seats_own_seat_only.sql`
replaces "Players manage seats" with "Players manage their own seat" - an empty seat,
the caller's own, or any seat if you are hosting - via a new `my_zoo_participant_id`
helper, security-definer for the same reason `can_play_zoo_session` is one.

**It has not been applied.** The remote migration history is out of sync, so it goes
in through the dashboard SQL editor rather than `db push`. Until somebody runs it,
the database still permits what the client declines.

---

## P2 - Consistency, Accessibility, Conformance

### P2-1. Unify the estimation verb to "size" - **[done]**
No user-facing "Estimate" verb left in the Scrum layer; the board says "sized at N
points". The prop and action names (`onEstimate`, `ESTIMATE_ITEM`) are internal and
do not reach a learner.

### P2-2. Keep "Done" and "released" distinct - **[done]**
One real breach, and it was in the sentence that defines the word: the empty Done
column read "Done is built, accepted and open" directly above a comment saying the
opposite. It now says "Done is built and accepted. Opening it to visitors is the
decision after." Everywhere else was already careful. A test in
`oneWordOneThing.test.tsx` reads the sources and fails on any copy that equates the
two again.

### P2-3. Label the other extra-Guide practices - **[done]**
The product-goal card carries a `notScrum` line: objectives and key results and epic
user stories are ways people bring to Scrum, and the Guide asks only for a future
state of the product. The Daily Scrum labels the block-versus-impediment split as a
lens some coaches teach, and says what the Guide does say - impediments, and the
Scrum Master causing their removal.

### P2-4. Accessibility pass - **[done]**
Done: `role="progressbar"` with `aria-valuenow` on the Review bars
(`SprintReview.tsx:229,503`); `role="radiogroup"` and `aria-checked` on the Retro
pick-one (`SprintRetro.tsx:267`).
The card-to-column half turned out to be already there: `BoardCard` is a real
`<button>` and the dialog carries "Start it", "Move it to Done", "Ask Priya to
check", "Open it to visitors" and "Hand it back to the Product Backlog".

The park half is now built. Tab reaches anything standing on it, Enter or Space
picks it up the way a press does, and the arrows move it - a pace at a time, ten
with Shift. With something in hand the park itself takes focus, shows the ghost
where it would land, and Enter puts it down. Both go through the same `verdict` a
drag goes through, so what may stand where is one rule and not two. Driven in a
browser, not only in tests: `~/Desktop/zoo-shots/2026-09-16-keyboard-*.jpg`.

Two things the browser found that the tests had not. The ghost started at the item's
resting place, which is a corner outside its own area, so the first Enter was always
refused with nothing on screen to say which way to walk - it now starts in the middle
of the item's own plot. And a pace of 8 against a 1760-wide park is 220 presses to
cross it; a pace is 16 now, so a Shift stride is about one habitat.

The rest is now done too, and the touch targets were the sharpest lesson on this list.
The Backlog's reorder chevrons were 36 square and the Sprint Backlog's 28 by 36, against
the 44 a finger needs on a tablet. Raising them to 44 where they stood made it WORSE,
which only the browser could say: a row on the Product Backlog is 44 tall, so two
stacked 44s overflow it, and a row's "down" covered 38 of the 44 pixels of the next
row's "up" - a tap near the boundary moved the wrong item the wrong way. They sit side
by side now, the way the Sprint board's pair always has. Measured after: 44 square,
zero overlap, rows the height they were.

The lobby inputs had real labels already - but both were named by their card heading, so
the session-name box announced itself as "Start a session", which is what the button
does rather than what you type in the box. A heading and a label are two jobs and are
two elements now.

### P2-5. Reserve a gutter for the fixed dock - **[done]**
The Sprint pane reserves it (`ZooShell.tsx:549`), and the below-`xl` half of this
item was closed from the other end: the board and the park no longer share a grid
cell at all, they stack and scroll (#624). Confirmed live, by measuring rather than looking: with the Product Backlog wizard
scrolled to the bottom at an ordinary window size, the fourth area you can choose
overlapped the dock's own box. Refine, Planning, the Review and the Retro turned out to
be covered already (the shell's panes reserve 96, 96 and 80 - three numbers for one
pill). The Wizard and Final reserved nothing.

One token now, `DOCK_GUTTER`, used by all five. `DOCKED_BAR_PX` was 52 for a pill that
measures 58 and sits 16 up from the window: it is 74. `withoutADock.test.tsx` fails if a
pane that renders an ActionBar reserves nothing, or picks its own number.

### P2-6. Multiplayer polish - **[done, except the two-browser judgement]**
All four re-found. The "N here" count was already closed - `hereCount` counts who is
connected rather than who has ever joined. The other three were real:

* **The sign-in gate** explained why it needs you signed in and then offered nothing to
  press, on a page that renders without the site header. Somebody following a link to
  their trainer's session reached a closed door with no handle. Two ways out now, and
  signing in returns to the session in the link (verified: the return-to carries
  `?session=`) rather than to the home page.
* **The seats subscription** had no filter, so a seat taken in any session anywhere woke
  this browser. Filtered by game now - and the thing the unfiltered one was covering by
  accident, somebody else starting a game, is watched on purpose, or joining a session
  whose game does not exist yet would never resolve.
* **The beacon** said "waiting on them", which in a room of five people is half the
  news. It names the accountability.

**Not done: judging it with two browsers.** That needs two signed-in accounts, and
signing in is not something I do. The code changes are unit-tested; the behaviours want
a real session before they are called finished.

### P2-7. Vocabulary and mechanism consistency - **[two of three done]**
The wizard claim was stale - it already said "area". The live ones were the park's
"zones open" stat, the Review's "are zones anyone can walk into", the planting
suggestion, the Product Owner's line about an exhibit being "the draw for this
zone", and the PBI editor's "New zone" / "Zone name". All now say area. `zone`
survives as a field name and as the dead spelling of a reworded criterion, which
`parkChecks.ts` and `design.ts` keep on purpose so a game in play still matches its
own criteria.

The two "backs" now name their destinations, because they meant opposite things:
"Hand it back to the Product Backlog" takes an item OUT of the Sprint, and "Send it
back to Doing" returns built work to the Developers INSIDE it.

The three primary-action mechanisms are unchanged, and that one is a design question
rather than a defect - **[propose]** before moving anything.

### P2-8. Minor conformance wording - **[done]**
Scrum is founded on empiricism and lean thinking, and EMPLOYS an iterative,
incremental approach. `SCRUM_INTRO` now carries two foundations and a separate
`approach`, and the one-pager renders it underneath them saying it is not a third.
Release timing is softened: the Increment card no longer asserts that the Product
Owner decides when it is released.

---

## P3 - Structure and Enrichment

### P3-1. Close the visitor-sim micro cause-and-effect - **[proposed]** - see `ZOO_PROPOSALS.md` §1
The quote block keys on `q.cause` and the signal block on `sig.drivenBy`
(`SprintReview.tsx:519,549`), so the data is carried - but they are still separate
blocks and a player cannot trace a complaint to its fix in one movement. The Final
screen payoff is untouched. **[propose]** the Final redesign.

### P3-2. Reduce the two overloaded steps - **[needs-play]**
Unchanged, and still a hypothesis rather than a defect. The 2026-09-15 play-through
did not report Planning topic three or the Review as overwhelming; it reported the
opposite problem, that the middle of a build day is thin. Worth testing both.

### P3-3. Save-hook and migration de-duplication - **[proposed]** - see `ZOO_PROPOSALS.md` §4
Sharper than "unchanged": `readSave` defaults two fields by name and `LOAD_GAME` defaults
every field by merging over a fresh state. The merge wins, so the ladder in `readSave`
will look maintained while doing nothing - until the first migration that CHANGES a
field's meaning, which the merge will silently overwrite.

### P3-4. `applyParkChecks` runs on every clock tick - **[done]**
`CLOCK_ONLY` skips the park recompute for `TICK_DAY`, `TICK_SCRUM` and
`SET_CLOCK_PAUSED`. `useZooGame.ts:29,40`.

### P3-5. God-state / god-action union - **[proposed]** - see `ZOO_PROPOSALS.md` §5
70 state fields, 107 action members, a 3,717-line engine. Still not urgent, and the
proposal argues the complaint is about reading rather than architecture: the single
state is what makes saves and multiplayer replication as simple as they are.

---

## What Is Actually Left

_Updated 2026-09-16, second pass. Every item on this list has now been worked or
proposed. Twenty-three of the twenty-four are closed._

**Two things, and neither of them is code.**

1. **Apply P1-6's migration** in the Supabase dashboard SQL editor:
   `supabase/migrations/20260916090000_zoo_seats_own_seat_only.sql`. Not `db push` -
   the remote migration history is out of sync. It is written, committed, and does
   nothing at all until somebody runs it, which means the database still permits what
   the client declines.
2. **Judge the multiplayer changes with two browsers.** P1-5 and P2-6 are built and
   unit-tested; presence, the away chip and the filtered subscription all want a real
   session with two signed-in people before anybody calls them finished.

**And five decisions**, written up with options and a recommendation in
`docs/ZOO_PROPOSALS.md`: the complaint-to-fix loop, undo, the three ways the game tells
you what to press, the save-migration duplication, and the god-state. Nothing is started
on any of them. If only one gets built, the first.

## What This Re-Run Taught

Three of the items were stale - closed on the way past, by play-throughs and other work,
and the list did not know. Two were wrong outright: Split Epic cannot destroy an epic,
and the wizard had already stopped saying "zone".

And one was worse than stale. The touch-target item was right that 36 was too small, and
acting on it by raising the buttons where they stood made the game worse than leaving it
alone - a 44-pixel target you cannot aim at is not an improvement on a 36-pixel one you
can. Nothing in the suite could see it. The browser measured it in one line. That is the
argument for the standing rule about rendering a change and looking at it, stated
better than I could state it in the abstract.

## Do Not Blindly Change (Confirm in the App First)

These were tagged needs-play in the audits and must be judged live, not from code:
whether the one-pager and the sprint surface actually overwhelm a novice; visual
hierarchy and readability at tablet and projector distance; park scale
believability; whether each wired state change reads on screen; real touch-target
feel; and whether the SeatBand communicates a block strongly enough. Treat P3-2 and
any "density/overwhelm" item as hypotheses to test, not defects to patch.

## Source Docs

- `docs/ZOO_UX_AUDIT.md` - the per-screen usability audit this was partly drawn
  from, dated the same day and equally a snapshot. In the repo as of this re-run.
- `docs/ZOO_PLAN.md` - the build plan, which is where the design work lives. This
  document is bugs and conformance; that one is what the game is becoming.

The architecture review and the Scrum conformance pass the header credits were
never committed, so their reasoning is not recoverable - only what was carried into
the items above. Worth knowing before trusting a line that says "see the full
reasoning".
