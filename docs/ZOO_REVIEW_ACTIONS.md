# Zoo Game: Consolidated Review Actions

_Compiled 2026-09-10 from three review passes, only one of which was committed
(see Source Docs). **Re-run 2026-09-16**: every item checked against the
code as it stands, because the game moved a long way in six days and a work list
nobody has re-read is a list people stop trusting._

## What The Re-Run Found

Of the twenty-four items, **eleven are done** and one is half done. Most were not
closed by working this list: they were closed on the way past, by play-throughs and
by other work. That is worth knowing about this document rather than about the
game - it is a snapshot, and a snapshot of a moving thing is wrong by the time it
is read.

Four of the five P0s are done. The remaining work is mostly P2 and P3: conformance
wording, an accessibility pass, the multiplayer seat policy, and two proposals.

**Status tags below**: **[done]** with where it was closed; **[stands]** still true
at the cited anchor; **[partly]** one half closed; **[re-anchor]** the file or line
has moved and the item needs re-finding before it can be judged.

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

### P1-2. Add confirm-or-undo to irreversible actions - **[partly]**
Cancel Sprint confirms with its full consequence, and the Final reset has a
two-step confirm. **Split Epic and End Day still commit immediately**, and there is
still no undo primitive. Split Epic is the one that can destroy work.
Where: `SprintPlanning.tsx:510`; End Day in `SprintBoard.tsx`'s ActionBar.
Note: a general undo touches the reducer host - **[propose]** the approach first.

### P1-3. Send Back is destructive and sits next to Accept - **[done]**
It is a two-step now: "Send it back · N not met" opens a panel with "Keep looking at
it" beside it, and the cost is visible text rather than a `title`. `Board.tsx:395`.
The engine also refuses to send back work whose criteria were all settled (#619).

### P1-4. Definition of Ready is taught as Scrum - **[done]**
The DoR editor carries the caveat inline: "Your own agreement about what makes an
item ready to forecast - Scrum does not require one. A conversation, not a gate."
`ArtifactsPanel.tsx:132`.

### P1-5. Dropped human seat-holders are invisible - **[re-anchor]**
`ZooTogether.tsx` has moved from `components/zooGame/` to `src/pages/`. The
substance may still stand, but it cannot be judged from the cited lines and it is a
multiplayer behaviour that needs two browsers rather than a read. Re-find it, then
confirm live.

### P1-6. Any player can mutate another player's seat - **[partly]**
The client half is closed: `leaveSeat` and `fillWithAi` both refuse a seat held by
somebody else unless the caller is hosting (`useZooSessions.ts:193,213`).
**The policy is unchanged**: "Players manage seats" is still `for all` scoped to
`can_play_zoo_session`, so the database still permits it and only the client
declines. One layer of defence where the item asked for two. A follow-up migration
is still wanted - do not edit the applied one.

---

## P2 - Consistency, Accessibility, Conformance

### P2-1. Unify the estimation verb to "size" - **[done]**
No user-facing "Estimate" verb left in the Scrum layer; the board says "sized at N
points". The prop and action names (`onEstimate`, `ESTIMATE_ITEM`) are internal and
do not reach a learner.

### P2-2. Keep "Done" and "released" distinct - **[stands]**
Still worth a pass. The game is careful in places - "Done is built, accepted and
open", "Live to visitors" - and loose in others. Re-anchor at
`SprintBoard.tsx`/`ActionRail.tsx` before editing, as the line numbers have moved.

### P2-3. Label the other extra-Guide practices - **[stands]**
The product-goal card hedges the shapes ("the shape is yours") but carries no
`notScrum` line, while user stories, Planning-as-refinement and velocity all do.
The block/impediment split is still unlabelled. `scrumContent.ts:83`.

### P2-4. Accessibility pass - **[partly]**
Done: `role="progressbar"` with `aria-valuenow` on the Review bars
(`SprintReview.tsx:229,503`); `role="radiogroup"` and `aria-checked` on the Retro
pick-one (`SprintRetro.tsx:267`).
Still open: sub-44px touch targets on the reorder chevrons, placeholder-only lobby
inputs, and **no keyboard path for any drag move** - card to column, and placement
on the park. The last is the one that locks a keyboard user out of the game.

### P2-5. Reserve a gutter for the fixed dock - **[partly]**
The Sprint pane reserves it (`ZooShell.tsx:549`), and the below-`xl` half of this
item was closed from the other end: the board and the park no longer share a grid
cell at all, they stack and scroll (#624). **Refine, the Wizard, Planning, the
Review, the Retro and Final all render `ActionBar` and reserve nothing**, so
bottom-of-content controls on those screens can sit under the dock. Anchored, not
re-verified live: the bar is portalled and fixed, so confirm in a browser at a
short viewport before changing anything.

### P2-6. Multiplayer polish - **[re-anchor]**
Same as P1-5: `ZooTogether` has moved. The sign-in gate, the "N here" count, the
unfiltered seats subscription and the waiting-on-X beacon all need re-finding, and
the behaviours need two browsers to judge.

### P2-7. Vocabulary and mechanism consistency - **[stands]**
"Zone" and "area" are both still in use (`BacklogWizard.tsx:128` uses zone; the
teaching cards and the park labels say area). The two "backs" and the three
primary-action mechanisms are unchanged.

### P2-8. Minor conformance wording - **[stands]**
`scrumContent.ts:44-48` still lists "Iterative and incremental" as a third
foundation beside empiricism and lean thinking. The release-timing wording and the
"not Scrum" lines on the WIP limit and the Sprint bet are unchanged.

---

## P3 - Structure and Enrichment

### P3-1. Close the visitor-sim micro cause-and-effect - **[stands]**
The quote block keys on `q.cause` and the signal block on `sig.drivenBy`
(`SprintReview.tsx:519,549`), so the data is carried - but they are still separate
blocks and a player cannot trace a complaint to its fix in one movement. The Final
screen payoff is untouched. **[propose]** the Final redesign.

### P3-2. Reduce the two overloaded steps - **[needs-play]**
Unchanged, and still a hypothesis rather than a defect. The 2026-09-15 play-through
did not report Planning topic three or the Review as overwhelming; it reported the
opposite problem, that the middle of a build day is thin. Worth testing both.

### P3-3. Save-hook and migration de-duplication - **[stands, propose]**
Unchanged.

### P3-4. `applyParkChecks` runs on every clock tick - **[done]**
`CLOCK_ONLY` skips the park recompute for `TICK_DAY`, `TICK_SCRUM` and
`SET_CLOCK_PAUSED`. `useZooGame.ts:29,40`.

### P3-5. God-state / god-action union - **[stands, propose]**
Unchanged, and still not urgent.

---

## What Is Actually Left

In the order I would take them:

1. **P2-4's keyboard path for drag moves.** The one item here that locks somebody
   out of the game rather than making it harder.
2. **P2-8, P2-3, P2-2, P2-7** - the conformance and vocabulary pass. Small, and they
   are about whether the game tells the truth about Scrum, which is its whole job.
3. **P1-6's migration.** The client declines; the database should too.
4. **P1-2's confirms** on Split Epic and End Day. The undo primitive is a separate,
   larger question - propose first.
5. **P2-5's dock gutter**, after confirming it live at a short viewport.
6. **P1-5 and P2-6** - re-anchor, then judge with two browsers.
7. **P3-1, P3-3, P3-5** - propose before building.

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
