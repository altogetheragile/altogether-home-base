# Build A Zoo — UI Red Team v2 (tablet, no-scroll)

Re-reviewed at iPad-landscape **1024×768** (and checked at 1280×800), as a UI
designer with Scrum expertise, after PRs #150–#174. The v1 structural fixes
landed: the game is now an **app-shell** that no longer page-scrolls, panes
scroll internally, the DoD is de-duplicated, and the Park rides as a right rail
on wide screens. Those were the right moves.

The new problem is the opposite of v1's: not one long scrolling document, but a
**shell whose top is now silted up with too many always-on bands**. Every
feature we added since (Scrum Team strip, Day header, flow legend, burndown,
day-start / Timed toggles) claimed its own horizontal band, and together they
push the actual work — the board columns — off the screen.

## Diagnosis: the work is the least-visible thing on the work screen

Measured on the Sprint board at **768px** tall:

| Band (top → down) | Starts at |
|---|---|
| Marketing nav (Events / Coaching / …) | 0px |
| App header (Sprint · Day · goal · DoD/Save) | ~64px |
| Build / Park tabs | ~145px |
| **Scrum Team** strip (PO / SM / Devs) | ~155px |
| **Day 1 / 3** heading + day-start / Timed toggles + End Day | ~207px |
| **Flow legend** sentence | ~251px |
| **Burndown** chart (inline, left of columns) | ~285px |
| **To Do / Doing / Deploy / Done columns** | **467px** |

**61% of the tablet screen is chrome before the first column.** The columns then
get ~300px — about **1.5 cards** before the pane fold. The player spends a Sprint
looking mostly at headers, legends and an empty chart, and has to scroll a narrow
pane to see the work they are actually doing.

## Findings, ranked

1. **Four stacked bands bury the columns.** Scrum Team strip → Day/controls row →
   flow-legend sentence → a full-size burndown all sit *above* the columns. Each
   is individually reasonable; stacked, they cost ~300px of the ~700px board pane.
   This is the single biggest source of "messy."

2. **The burndown is oversized and premature.** ~250×160px, permanently parked to
   the left of the columns, but on Day 1 it is a single dot on an empty grid —
   maximum visual weight, near-zero information. It also already appears (rightly)
   inside the Daily Scrum. On the board it should be a small header sparkline
   ("13 pts left ▔╲"), not a chart competing with the work.

3. **The Scrum Team strip spends a whole row on a short label.** PO / SM / 3 Devs
   fill the left ~40% of a full-width band; the rest is empty white. A whole
   horizontal slice for what belongs as compact avatars next to the phase chip.

4. **The flow legend is a long jargon sentence.** "Start → Doing (WIP 3) → Design
   & build + tick the plan → Deploy (place & open) → Done, live to visitors" wraps
   to two lines, mixes UI labels with instructions, and largely restates the
   column headers beneath it. Reads as clutter, not guidance.

5. **Cards are text-heavy in narrow columns.** Every card shows title + category
   chip + points + full acceptance criteria ("Meet: Recognisable as a lion, Uses
   at least two colours, No bare patches") + a "Needs … built first" note + an
   expanded PLAN 0/3 checklist. Four columns at tablet width (~150px each) turn
   each card into a tall wall of wrapping text. Detail should be collapsed by
   default and expand on the active card (or on tap).

6. **Empty Deploy / Done columns hold equal width while empty.** On Day 1, two of
   four columns are just "Built – place & open it" / "Nothing live yet"
   placeholders taking half the board width, squeezing the two columns that
   actually have cards.

7. **Timer state is fragmented and configuration sits in prime space.** The
   "Paused" chip (header), the compact DayTimer, and the "Timed mode" toggle are
   three separate timer-related controls in different bands; "Scrum: day start" is
   a settings toggle living on the main board row. Config masquerading as content
   — the v1 smell, partly returned.

8. **Marketing nav still brackets a full-screen game.** 64px of
   Events / Coaching / About / … above a game meant to own the screen. Open since
   v1.

9. **Park path controls are unlabelled colour dots.** "Paths ●●●●●" — five raw
   swatches (gravel / paved / sand / boardwalk / brick) with no labels, and the
   "Route" vs "Paths" distinction is unexplained. Reads as anonymous brown/grey
   dots.

10. **Park stat band is heavy; Happiness has no value.** Four large cards
    (Zones / exhibits / Visitors / Happiness) take a full band above the park, and
    Happiness shows a neutral face with no number. Minor, but adds to the busy feel.

## Proposed fixes, prioritised

The shell is right. The fix is to **demote and consolidate the chrome so the
board columns own the screen** — target: header + one slim toolbar, then columns
starting by ~150px instead of 467px.

**P1 — Give the columns the screen back (biggest win).**
- Pull the burndown out of the inline board area. Keep it in the Daily Scrum
  (where it belongs); on the board show at most a small sparkline + "13 pts left"
  chip in the header.
- Delete the flow-legend sentence. The columns label themselves; if guidance is
  needed, put it behind a single `ⓘ` on the board heading.
- Net: columns move up by ~250px — roughly one full extra card row visible.

**P2 — Consolidate the top bands into one control row.**
- Fold the Scrum Team into the header as compact avatars beside the phase chip,
  with the names/roles popover on tap (the strip's edit affordance moves into the
  popover).
- Merge "Day 1 / 3" + End Day + day-start / Timed toggles into a single slim board
  toolbar; move day-start / Timed into an overflow `⋯` (they're settings, set once).
- Unify timer state: one DayTimer that shows running/paused, kill the separate
  "Paused" chip.

**P3 — Calmer cards, fairer column widths.**
- Collapse acceptance criteria + PLAN checklist by default (show title · category ·
  points · a "0/3 tasks" chip); expand on the Doing card or on tap.
- Let empty Deploy / Done columns shrink (or render as a slim combined "Not yet
  deployed" lane) so To Do / Doing get the width while they hold the cards.

**P4 — Park polish.**
- Replace raw path swatches with a labelled control — e.g. a single "Surface:
  Gravel ▾" dropdown, or swatches with text labels — and label the Route group.
- Give Happiness a value; slim the four stat cards to one compact row of stats.

**P5 — Full-screen game (still open from v1).**
- Render the game without the marketing Navigation (or behind a "Play fullscreen"
  toggle), reclaiming the top ~64px.

## Priority order

1. **P1** — remove the inline burndown + flow legend. Cheap, and it's most of the
   mess: the columns jump up ~250px.
2. **P2** — collapse Scrum Team + Day row + toggles into header + one toolbar.
3. **P3** — collapse card detail; let empty columns yield width.
4. **P4** — Park path labels + slimmer stat band.
5. **P5** — drop marketing nav for a full-screen game.

Net effect: on a 768px tablet the columns begin near the top, a full card row is
visible without scrolling the pane, and the screen reads as one calm board rather
than a stack of five competing bands.
