# Zoo Game UX Audit (Per Screen)

_Audited: 2026-09-10, and NOT re-run since - read it as a snapshot of that day. The
work list drawn from it, `ZOO_REVIEW_ACTIONS.md`, was re-run on 2026-09-16 and is
the current one; where the two disagree, that one is right._

_Method: a read-only pass over every screen's code, graded
against the usability checklist in the UX review. Verdicts are anchored to
file:line. Items that depend on visual hierarchy, readability, scale, animation,
juice, or actual novice confusion are tagged needs-play and were NOT graded from
code. Two correctness findings (the goal-critical star, the Final headline) were
verified first-hand; the remainder are anchored at the cited lines and should be
confirmed at those lines before acting._

## How To Read This

- ✅ pass - the code supports the good behaviour.
- ⚠️ partial or risk - present but with a gap.
- ❌ missing or wrong.
- 🎮 needs-play - cannot be graded from code; judge it in the running app.
- N/A - item does not apply to this screen.

Checklist items: (1) Orientation and no dead ends, (2) One decision at a time /
progressive disclosure, (3) Jargon one tap from a definition, (4) Empty vs
not-yet-exists states, (5) Reversibility and safety, (6) Occlusion and responsive
layout, (7) Status not colour-only, (8) Consistency and copy, (9) Input and
accessibility, (10) Feedback wiring.

## Executive Summary: The Cross-Cutting Themes

Ranked by how much they affect the player, these recur across screens:

1. **No undo primitive anywhere, and most irreversible actions do not confirm.**
   Only Cancel Sprint and Delete PBI have real confirms. End Day, Finish Item,
   Send Back, Split Epic, Start Sprint, Copy-from overwrite, plant/path deletes,
   signal Take/Decline, and the Final reset all commit immediately with at most
   tooltip consequence-text. Split Epic is the single most destructive refinement
   act and the least guarded (it can delete the epic outright).
2. **A fixed bottom-right dock over content, with no reserved gutter on several
   screens.** The two reported sprint occlusion bugs are now fixed, but the same
   `ActionBar` pattern leaves bottom-of-content coverage on Refine, Planning, the
   Backlog Wizard, and MeetTheTeam, and covers the park and the message rail below
   the `xl` breakpoint.
3. **Accessibility gaps in interactive controls.** A mouse-only nested clickable
   (the goal-critical star), sub-44px touch targets throughout, no keyboard path
   for drag interactions (card to column, park placement), and missing ARIA
   (radiogroup on the Retro pick-one, progressbar on the bars, labels on lobby
   inputs).
4. **One concept, several words.** Estimate is "Estimate" / "Size it" /
   "Commit pts"; release is Done / open / deploy / live; areas vs zones; two
   different "back" actions; and three different primary-action mechanisms across
   onboarding.
5. **Front-loaded cognitive load at three specific points.** The one-pager dumps
   the whole framework; Planning topic three ("How") stacks four decisions; the
   Review "done" step stacks about eight analysis panels before the visitor
   payoff.
6. **The visitor-simulation cause-and-effect chain is strong at the macro level
   and fragmented at the micro level** (see the dedicated section).

Genuine strengths worth protecting: empty-state design is thorough and
deliberately distinguishes null from zero; jargon is mostly explained at the point
of use; status is rarely colour-only (shape plus text almost everywhere); reduced
motion is gated; the Sprint bet verdict is an excellent cause-and-effect device;
direct manipulation has first-use hints and a non-drag fallback; and the two
reported occlusion bugs are resolved with a deterministic corner rule.

---

## 1. Onboarding

### ScrumOnePager (`ScrumTeaching.tsx:180-243`)
| # | Verdict | Anchor | Note |
|---|---------|--------|------|
| 1 | ✅ | `:193,230-238` | "Before you start" + two clear exits (skip / start). |
| 2 | ❌ | `:200-222` | Dumps the entire framework at once (foundations, accountabilities, artifacts, events, values). Opt-out, but the peak first-5-minute load. |
| 3 | ⚠️ | `:216-221` | Terms defined inline, but this screen is the definition wall; the values are hover-only `title` tooltips, redeemed only by a prose duplicate at `:221`. |
| 5 | ⚠️ | `:230-234` | "Turn the teaching off" is a global mode switch, no confirm, no stated undo path from here. |
| 6 | ✅ | `:184,227` | Own scroll; primary pill is in-flow sticky. |
| 7 | ✅ | `:139-158` | Colour + spine + chip + icon + text. |
| 8 | ⚠️ | `:227-238` | Hand-rolled pill, not the shared `ActionBar`. |
| 9 | ⚠️ | `:218,231,235` | Real buttons with focus rings; value definitions hover-only. |
| 10 | ✅ | `:230,235` | Buttons change the whole screen. |

Top issues: (1) whole-framework-at-once cognitive load; (2) value definitions are hover-only tooltips; (3) unconfirmed global "teaching off".

### ZooIntro (`ZooIntro.tsx`)
| # | Verdict | Anchor | Note |
|---|---------|--------|------|
| 1 | ✅ | `:51-54,114,117,43` | Title, Start, Resume, back-to-one-pager. |
| 2 | ✅ | `:58-68,99-104` | One real decision (write the goal); alternate goal shapes collapsed. |
| 3 | ⚠️ | `:67,78,81-84` | "Commitment of the Product Backlog" badge only decodes if the teaching card is on. |
| 4 | ⚠️ | `:117` | **Start is not disabled on an empty goal** - the one required input is unguarded. |
| 5 | ✅ | `:98,43` | Goal editable later and says so. |
| 6 | ✅ | `:40,108` | `pb-28` reserves space for the sticky pill. |
| 8 | ⚠️ | `:108-119` | Custom pill again; "Start building" vs one-pager's "Start building the zoo". |
| 9 | ✅ | `:86,94` | `sr-only` label + `aria-label` on input. |

Top issues: (1) Start fires with an empty Product Goal; (2) "commitment" badge undecodable when teaching is off; (3) action-mechanism/copy drift.

### MeetTheTeam (`MeetTheTeam.tsx`)
| # | Verdict | Anchor | Note |
|---|---------|--------|------|
| 1 | ⚠️ | `:76-77,131-133` | Clear title and forward label, but no Back - forward-only, unlike siblings. |
| 2 | ⚠️ | `:85-129` | Five seat cards + capacity + two prose blocks at once. |
| 3 | ❌ | `:77,81,120-123` | The only onboarding screen with no "?" - "accountabilities", "points", "capacity", "pull" all undefined at point of use. |
| 7 | ✅ | `:108-111,96` | Text labels ("Your seat" / "Played by the game"), not colour alone. |
| 8 | ⚠️ | `:104,122,131` | Plain in-flow button, not the shared bar; a point stated twice. |

Top issues: (1) no point-of-use definitions despite introducing core vocabulary; (2) no way back; (3) action-mechanism inconsistency and possible dock overlap.

### BacklogWizard (`BacklogWizard.tsx`)
| # | Verdict | Anchor | Note |
|---|---------|--------|------|
| 1 | ✅ | `:85,90-91,147-163` | `StepTrack` + question + Back + labelled Next/Write. |
| 2 | ✅ | `:31-35,112-145` | Exactly one question per step. |
| 3 | ⚠️ | `:86,34,141` | "refine"/"forecast" appear in copy without a one-tap definition here. |
| 4 | ✅ | `:76,159,70-72` | Deselect-all guarded; first-zone auto-repairs. |
| 5 | ✅ | `:150-153,98-104` | Commit states its consequence; seat-gate disables and explains. |
| 6 | ⚠️ 🎮 | `:82`, `ActionBar.tsx:52-57` | No bottom padding to clear the fixed dock (contrast ZooIntro `pb-28`); last rows can be covered on short screens. |
| 7 | ✅ | `:42-44` | Selected shows border + tint + Check. |
| 8 | ⚠️ | `:32-34` vs `scrumContent.ts:174-177` | "area(s)" here vs "zone(s)" in the teaching card. Does use the shared `ActionBar`. |

Top issues: (1) "area" vs "zone"; (2) no bottom gutter for the dock; (3) "refine"/"forecast" unglossed.

**Onboarding cross-cutting:** three different primary-action mechanisms (custom pill / plain button / shared `ActionBar`) even though `ActionBar.tsx:11-21` states every screen should end in the same bar; vocabulary drift (area/zone, undefined accountabilities/points/pull); keyboard and focus otherwise well covered (shared focus token, real controls).

---

## 2. Refine Backlog (`RefineBacklog.tsx`)
| # | Verdict | Anchor | Note |
|---|---------|--------|------|
| 1 | ✅ | `:128-135,233-240` | Eyebrow + question + numbered steps + persistent "Go to Sprint Planning" with a disabled-reason hint. |
| 2 | ✅ | `:164-224`; `BacklogBench.tsx:51-62` | Foldable steps; item refinement is a one-at-a-time takeover. |
| 3 | ✅ | `:132,111-112`; `DodEditor.tsx:36-43` | ExplainButton cards; DoD contrasted with acceptance. Weak spot: the term "Definition of Ready" itself is never surfaced. |
| 4 | ✅ | `Board.tsx:649`; `BacklogBench.tsx:84-97` | Empty backlog and bench placeholders; DoD distinguishes "nobody agreed yet". |
| 5 | ⚠️ | `Board.tsx:557-565`; `engine.ts:341-393` | Delete has a two-step confirm; estimate is redoable. **Split Epic has no undo and no confirm, and a full split deletes the epic** (`engine.ts:390`). No global undo exists. |
| 6 | 🎮 | `:146-157`; `ActionBar.tsx:51-57` | Stacks to one column; the fixed dock reserves no bottom padding here (`DOCKED_BAR_PX` unused). |
| 7 | ✅ | `Board.tsx:452-456,500-502` | RAG left-border backed by a text chip. |
| 8 | ⚠️ | `Board.tsx:466` vs `BacklogBench.tsx:165` vs `PlanningPoker.tsx:91` | Estimation labelled three ways: "Estimate" / "Size it" / "Commit N pts". |
| 9 | ⚠️ | `Board.tsx:505-514` | Non-drag reorder fallback (arrows) - good; but arrow/expand targets are ~12px, well under 44px. |
| 10 | ✅ | `:108-116,199-203` | Estimating flips to Ready and recomputes; agreeing DoD collapses and greens the step. |

Top issues: (1) Split Epic is the one unguarded destructive act; (2) sub-12px reorder/expand targets on the screen's core "order by value" task; (3) three labels for estimation.

---

## 3. Sprint Planning (`SprintPlanning.tsx`)
| # | Verdict | Anchor | Note |
|---|---------|--------|------|
| 1 | ✅ | `:333-347,668` | Topic label + question + StepTrack with locking + Back and one primary. |
| 2 | ⚠️ | `:518-664` | **Topic three ("How") is overloaded**: task steps + shape chooser + goal-critical stars + a refinement-point budget are four decisions on one screen, against this file's own "one question per screen" premise (`:24-31`). |
| 3 | ✅ | `:348,239-243,383,549` | Per-topic ExplainButton; velocity vs estimated velocity spelled out; the bet explained inline; goal-critical tooltip. |
| 4 | ✅ | `:423-427,497,658-659` | "Nothing forecast yet ... fills at topic two" distinguishes empty-now from not-yet. |
| 5 | ⚠️ | `:473-474,705` | Forecast toggle reversible. **Split Epic mid-planning is the same irreversible action; "Start Sprint N" fires with no confirm** (it does state its output). |
| 6 | 🎮 | `:354,364,435`; `ActionBar.tsx:51-57` | Nested scroll regions (outer plus inner `max-h-[46vh]` panes) risk double scrollbars; fixed dock can overlap the scroll tail. |
| 7 | ✅ | `StepTrack.tsx:34-38`; `:405,550` | Step track and capacity are text/number-led. |
| 8 | ✅ | `:76-80,678-705` | Topic names match the Guide; columns consistently labelled; buttons name the next state. |
| 9 | ⚠️ | `:547-552` | **The goal-critical star is a `<span onClick>` nested inside the row `<button>`** - semantically invalid, mouse-only, no role/tabindex/keyboard (verified first-hand). Poker/pick targets ~32-36px. |
| 10 | ✅ | `:100-122,494` | Rings items the AI seats just pulled and just-planned items; meter fills as items are added. |

Top issues: (1) "How" topic overloaded; (2) goal-critical star is a mouse-only nested clickable for a concept novices most need; (3) Split Epic irreversible and Start Sprint commits without confirm.

---

## 4. The Sprint Screen (Board + Park)

Note: `DesignBench.tsx` is not on the live screen (test-only). The live screen is
`ZooShell` (sprint tab) with `SprintBoard` plus the park panel (`ParkOptions`
build strip, `ParkPlan`, `ParkInspector`).

| # | Verdict | Anchor | Note |
|---|---------|--------|------|
| 1 | ✅ | `SprintBoard.tsx:753-768`; `ActionRail.tsx:128-134` | "Next: ..." on every Doing card; empty-hand rail hint; End-Day button states its destination. |
| 2 | ⚠️ 🎮 | `ZooShell.tsx:452-505`; `SprintBoard.tsx:186,775` | Board + park + build strip + inspector + rail + clock + End-Day dock co-resident. Layering exists (backlog closed by default, detail in a dialog, settings behind a gear) but the baseline is busy. |
| 3 | ✅ | `SprintBoard.tsx:551-554`; `DailyScrum.tsx:153-162` | WIP tooltip; "a block · one item" vs "an impediment · the whole team". Minor: "forecast" unglossed at `:542`. |
| 4 | ✅ | `Board.tsx:78,649`; `ParkOptions.tsx:88-93` | Every column, hand, backlog, and park-options empty state named. |
| 5 | ⚠️ | see below | Only Cancel Sprint and Delete PBI confirm; no undo anywhere. |
| 6 | ⚠️ | see below | Both reported bugs fixed; residual dock coverage remains. |
| 7 | ✅ | `Board.tsx:277-291`; `DayTimer.tsx:39-45` | Pips shape-coded (square=plan, circle=criteria) + fill + icon; cards carry text; clock is mm:ss + emptying bar. |
| 8 | ⚠️ | `SprintBoard.tsx:539,594,624`; `Board.tsx:348` | Release spread across Done/open/deploy/live; two "back" actions ("Send it back" to Developers vs "Hand it back" to the Backlog). |
| 9 | ✅ / ⚠️ | `ActionRail.tsx:134`; `Board.tsx:507-509` | Direct manipulation has first-use hints and a tap fallback (card to dialog to Start). But many targets are well under 44px, and there is no keyboard path for card-to-column moves or park placement. |
| 9 | ✅ | `ParkView.tsx:313-316`; `Celebration.tsx:5,22` | Visitor stroll and delivery confetti gated on reduced motion. |
| 10 | ✅ | `SprintBoard.tsx:312-318`; `ItemToolbar.tsx:380-385` | Refused moves become a persistent note (not a vanishing toast); illegal drops toast; design edits land live; plan auto-ticks. |

### Occlusion (the recurring issue)
Both reported bugs are addressed in current code:
- Build menus moved out of the floating layer to a static strip above the park
  (`ZooShell.tsx:464-479`), so nothing floats over them.
- The inspector's corner rule hard-excludes bottom-right where the dock lives
  (`ZooShell.tsx:279`).

Residual risks (not the reported bugs): the `fixed bottom-4 right-4 z-40` dock
(`ActionBar.tsx:52-57`) still covers bottom-right park content on the scrollable
`ParkPlan`, and below the `xl` breakpoint the stacked park and the `ActionRail`
message centre sit under that same dock (`ZooShell.tsx:452-454`); the board
reserves `pb-16` but the rail and park do not. The corner rule is deterministic
but coarse (single item centre, four corners).

### Reversibility (the recurring issue)
Strong where it matters most: Cancel Sprint has a full-consequence `window.confirm`
buried behind the gear (`BoardTools.tsx:73-84`); Delete PBI has a two-step guard;
a misplaced park item is re-pickable via "Move". Weak elsewhere: End Day, Finish
Item, and Send Back commit with consequence-text only, and **Send Back sits inside
the acceptance list right next to the Accept ticks** with its cost in a
touch-invisible tooltip (`Board.tsx:344-349`). Copy-from overwrites a design
outright; plant and path deletes have no confirm and no undo.

Top issues: (1) no undo and most destructive actions do not confirm; (2) Send Back
is destructive and adjacent to the common Accept control; (3) residual dock
occlusion over the park and, below `xl`, the rail; (4) everything-at-once density;
(5) release-vocabulary inconsistency. Minor: a stale "Open by default" comment at
`SprintBoard.tsx:186` (behaviour is `false`, which is fine).

---

## 5. Review, Retro, Final

### Sprint Review (`SprintReview.tsx`)
| # | Verdict | Anchor | Note |
|---|---------|--------|------|
| 1 | ✅ | `:101-110,479-483` | Step question + StepTrack + one primary. |
| 2 | ⚠️ | `:114-314` | The "done" step is overloaded: bet verdict + goal progress + measures + happiness history + Sprint Goal + zone slices + stats, all before the visitor payoff in step two. |
| 3 | ✅ | `:312,120-140,390` | Plain-language reframes throughout; "signal" is shown as "What the visitors said". |
| 4 | ✅ | `:219-224,317-318,425-429,248` | Thorough; distinguishes null from zero on purpose. |
| 5 | ⚠️ | `:399-403,466-473` | Take/Decline recorded with no undo; "Open it" cannot be un-opened; "End it here anyway" commits to Final with no confirm. |
| 7 | ⚠️ | `:366-369` | **Quote sentiment (praise/gripe/warning) is left-border colour only** - no icon/label. |
| 9 | ⚠️ | `:208-210,353` | Progress/happiness bars are plain divs, no `role="progressbar"`/`aria-valuenow`; StepTrack has no `aria-current`. |
| 10 | ✅ | `:399-424` | Decisions visibly land; counters and the "Decided this Review" list update. |

### Sprint Retro (`SprintRetro.tsx`)
| # | Verdict | Anchor | Note |
|---|---------|--------|------|
| 1-2 | ✅ | `:71-80,154-199` | inspect/adapt split; "Pick one improvement" placed first. |
| 3 | ✅ | `:137,172,162` | improvement/effect/because triad well explained. |
| 4 | ⚠️ | `:97,123-139` | **An empty decision log hides the entire "what it cost / earned" panel** (delivered/forecast/velocity) exactly when a team over-forecast and did nothing loggable. |
| 5 | ✅ | `:167-176,225` | Selection is free to change; primary disabled until one is picked. |
| 9 | ⚠️ | `:167-176` | Pick-one group has no radiogroup/`aria-checked` semantics. |
| 10 | ✅ | `:167,222,225` | Picking highlights, clears the hint, unlocks the primary; each option previews its effect and evidence. |

The Retro's "pick one improvement" is the strongest consequential choice in the
game and it is well built (each option shows its mechanical `effect` and its
`because` evidence). The main gaps are the empty-log hiding of the summary and the
missing radio semantics.

### ZooFinal (`ZooFinal.tsx`)
| # | Verdict | Anchor | Note |
|---|---------|--------|------|
| 1-2 | ✅ | `:22-25,33` | "Your zoo is open" + "Build another zoo". Single calm summary. |
| 3 | ⚠️ | `:32` | "Velocity across the Sprints: 5, 8, 7" with no gloss. |
| 5 | ⚠️ | `:33` | "Build another zoo" wipes the game with no confirm. |
| 8 | ❌ | `:23-24` | **Correctness bug (verified): the headline hard-asserts "You reached the Product Goal in N Sprints", but the Review's "End it here anyway" reaches Final below the goal threshold, making the line false.** No met/not-met branch. |
| - | ⚠️ | whole file | **No payoff:** the docstring says "a snapshot of the zoo you built", but the screen shows no zoo, no happiness trajectory, no before/after, no memorable quotes - four stat tiles and a velocity list for a game about visitors telling you what they value. |

Top issues: (1) headline can lie; (2) no cause-and-effect payoff on the ending; (3) unconfirmed full reset.

---

## Cause And Effect: The Visitor Simulation

**Strong at the macro level.** The Sprint bet verdict ("You said families' happiness
rises by 10. It rose by 13, from 34 to 47." - `SprintReview.tsx:120-140`,
`engine.ts:952-965`) is the best cause-and-effect device in the game and earns the
"a wrong bet is worth as much as a right one" lesson. Zone slices connect points
delivered to zones a visitor can consume, and even project forward ("1,200 people
came anyway and found no animal on show. They will tell their friends."). The
happiness-by-Sprint chips give an earned before/after trend.

**Fragmented at the micro level.** The chain the simulation actually computes -
this group is unhappy, because this need is unmet, so build this - is broken across
steps and largely discarded at render:
1. A complaint quote and its matching fix share a driver (`q.cause` and
   `sig.drivenBy`, e.g. `"unmet:food"`), but the quote lives in the "visitors" step
   and the fix in the "next" step, and the UI never draws the line
   (`SprintReview.tsx:361-375` vs `388-407`).
2. Per-segment happiness shows a label, a bar and a number, but not the driver
   (`topExhibit`, `unmetNeeds`, `crowdingLoss` from `simulation/types.ts:52-73` are
   computed and dropped at the view layer).
3. This Sprint's specific delivery is never tied to this Sprint's happiness move
   (`zonesOpenedSince` exists at `engine.ts:2813-2816` but is unused in the Review).

Surfacing `cause`/`drivenBy` on each quote and pairing it with its signal would
close the biggest gap; the Final screen carries none of this payoff at all.

---

## 6. Multiplayer (Together)

| # | Verdict | Anchor | Note |
|---|---------|--------|------|
| 1 | ✅ / ⚠️ | `ZooLobby.tsx:71-95,202` | Doorway explains the model; seats and enter-gating are clear. But "Back" only clears URL params - there is no true "leave session", so you stay seated and counted. |
| 2 | ⚠️ | `ZooTogether.tsx:132-142` | Sign-in is stated up front (good) but is a dead end - no sign-in button and no link to the solo game it mentions. |
| 2 | ✅ | `ZooLobby.tsx:90`; `useZooSessions.ts:105` | Join code force-uppercases and trims. Minor: button enables at length >= 4 though codes are 6. |
| 3 | ✅ | `ZooLobby.tsx:22-24`; `seatRules.ts:29-81` | Each seat carries its accountability rationale; refusals teach whose call it is. |
| 4 | ✅ | `ZooLobby.tsx:43,186-191` | empty / played-by-AI / holder-name; host gets a bulk "let AI play the N empty seats". |
| 5 | ⚠️ | `useZooSessions.ts:200-204` | The seat-mutation RLS gap is not exposed by this UI (safe by omission). **`setRole` has no try/catch/busy/error - an RLS rejection for a non-host is a silent no-op.** |
| 7 | ✅ | `SeatBand.tsx:80-90` | AI = Bot icon + "AI"; you = Check + "you"; covering = dashed + "covering"; not colour alone. |
| 9 | ⚠️ | `ZooLobby.tsx:80,89,125-130` | Name and join-code inputs are placeholder-only (no label/aria-label); copy-code button has no `aria-live` on "copied". |
| 10 | ✅ / ⚠️ | `useZooSessions.ts:70-77,123` | Realtime refresh propagates seat/participant changes. **Two issues: the seats subscription has no `session_id` filter (refreshes on every session globally); and "N here" counts everyone who ever joined, never decremented.** |

**Whose-turn legibility.** Baseline is decent and shown to everyone: the SeatBand
renders a one-line "who does what now" and each seat's current doing
(`SeatBand.tsx:39,90`), and the Sprint-Goal agreement panel is genuinely
glanceable. The gap: outside Sprint-Goal agreement there is no table-wide "the game
is waiting on the Product Owner" beacon - a blocked human seat is phrased as that
seat calmly "doing" something, with the actionable prompt only in that seat's rail.
Legible to the acting seat, not urgent for the rest of the table.

**Dropped-player handling.** Essentially absent in-game. Clock ownership re-settles
automatically to the lowest present id (`useZooSession.ts:194`), but a dropped
human seat-holder is never shown as absent (the band shows the generated name and a
false "available") and is never auto-converted to AI; recovery needs a manual
re-seat from the lobby, which still lists and counts the absent person.

Top issues: (1) dropped human seats invisible and unrecovered; (2) sign-in dead
end; (3) `setRole` fails silently; (4) "N here" overcounts.

---

## Needs-Play (Grade These In The Running App)

- Whether the one-pager and the busy sprint surface actually overwhelm a novice.
- Visual hierarchy and readability at tablet arm's length and projector distance.
- Scale believability of the park (the buildings-vs-visitors work).
- Animation and juice: whether each wired state change actually reads on screen.
- Real touch-target sizes and whether nested scroll regions produce double
  scrollbars.
- Whether the SeatBand communicates a block strongly enough for the table.

## Prioritised Fixes

1. Add a confirm-or-undo to the irreversible actions, starting with Split Epic
   (which can delete an epic), End Day, Send Back, and the Final reset. A single
   undo primitive would cover many at once.
2. Fix the two correctness bugs: the `ZooFinal` headline (branch on goal met), and
   the goal-critical star (make it a real, keyboard-reachable control outside the
   row button).
3. Reserve a bottom gutter for the fixed `ActionBar` on Refine, Planning, the
   Wizard and MeetTheTeam, and inset the park/rail from the dock below `xl`.
4. Reduce the two overloaded steps: Planning "How" and the Review "done" step.
5. Multiplayer: show dropped human seats as absent and offer to fall them to AI;
   add a table-wide "waiting on X" beacon; give `setRole` error handling; filter
   the seats subscription and fix the "N here" count.
6. Unify vocabulary (one word for estimate, one for release) and the primary-action
   mechanism across onboarding.
7. Accessibility pass: 44px targets, radiogroup semantics on the Retro pick,
   progressbar roles on the bars, labels on lobby inputs.
8. Close the micro cause-and-effect chain in the Review by pairing each visitor
   quote with its matching fix and surfacing per-segment drivers.

## Method And Confidence

Every verdict is anchored to file:line. The goal-critical star
(`SprintPlanning.tsx:547-552`) and the `ZooFinal` headline (`ZooFinal.tsx:23-24`)
were verified first-hand. The remaining findings come from a read of the cited
files and should be confirmed at those lines before acting. All items tagged 🎮
were deliberately not graded from code and need a play session.
