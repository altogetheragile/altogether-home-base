# Build A Zoo — UI Red Team (tablet, no-scroll)

Reviewed at iPad-landscape **1024×768**, as a UI designer with Scrum expertise. Goal: the game works on a tablet **without page scrolling**, using the screen well and improving flow.

## Diagnosis: it does not fit a tablet today

Measured content height vs the 768px viewport:

| Screen | Content height | Overflow |
|---|---|---|
| Intro | 1226px | +458 (footer / whitespace) |
| **Refine** | 1843px | **+1140** |
| **Sprint board** | 1634px | **+931** |

On the board, roughly the **top ~500px (⅔ of the screen)** is consumed by persistent chrome *before the first board column*, and the work then runs ~900px past the fold. Root cause in one line: **everything is always-on and stacked in one long document, so nothing has a fixed frame and the page scrolls.**

## Findings, ranked

1. **The header stack is enormous and permanent.** Every phase stacks: site nav (65px) → Save/PO toolbar → Product Goal + Sprint Goal + Sprint chips (full row) → **Definition of Done band (two rows of chips)** → "Hats" role hint (full row) → Work/Park tabs → screen heading → a paragraph of coach prose. ~440–640px gone before any interaction.
2. **Duplication and overlap.** The **DoD shows twice** (top band *and* the floating bottom bar "Definition of Done: 6 criteria"), and that **floating bar overlaps the Doing column's card**.
3. **The work area has no fixed height.** The backlog sidebar and To Do/Doing/Done columns grow with content and push the page taller instead of scrolling *inside* their panes. A 26-item backlog = infinite page.
4. **The Park is a tab, not a view.** During Build you can't see the park (the payoff) and the board at once, though a 1024-wide tablet has room for both.
5. **Marketing chrome wraps the game.** The site Navigation + Footer bracket a game meant to be full-screen.
6. **Settings masquerade as content.** "Daily Scrum: start of day", "Learn mode", "Hats", the DoD band — configuration/reference occupying prime vertical space.

## Proposed target: an app-shell, not a document

A fixed-height shell: a slim top bar, one flex body filling the remaining height, and panes that **scroll internally**. Nothing below ever moves.

```
┌──────────────────────────────────────────────────────────────┐
│ 🦁 Sprint 1 · Build · Day 1/3  ⏱1:16  🎯 Open Big Cats…  ⋯   │  ← ONE ~48px bar
├───────────────┬──────────────────────────────┬───────────────┤    (⋯ = DoD, Save,
│ BACKLOG       │  TO DO   DOING(0/3)  DONE     │   PARK        │    PO, Learn,
│ (scrolls) ▲   │  ┌────┐  ┌────┐     ┌────┐    │  (live,       │    Scrum-timing)
│ Big Cats  │   │  │Lion│  │    │     │    │    │   always      │
│  Lion Enc │   │  └────┘  └────┘     └────┘    │   visible)    │
│  Lion     ▼   │  (each column scrolls)        │               │
├───────────────┴──────────────────────────────┴───────────────┤
│                        [ End Day → Daily Scrum ]              │  ← docked, no overlap
└──────────────────────────────────────────────────────────────┘
```

Concrete refinements:
- **Collapse the header to one 44–52px bar:** phase · day · timer · Sprint Goal, plus a **`⋯` overflow menu** holding Save / Saved games / Ask the PO / Learn mode / Daily-Scrum timing / **DoD (popover, shown once)**. Drop "Hats" to a small `ⓘ` tooltip on the phase chip. Remove the per-screen heading + prose; make coaching a dismissible one-liner.
- **Fixed body, internal scroll:** `h-[100dvh] flex flex-col`; body is `flex-1 min-h-0`, each pane `overflow-y-auto`. The page frame stops scrolling.
- **Park as a persistent right rail** on ≥1024px (reuse the `fill` ParkView), collapsing to the tab only on narrow/portrait.
- **Dock the bottom action bar** into the shell footer (or fold "End Day" next to the timer). Kill the duplicate DoD.
- **Full-screen game layout:** render the game without the marketing Navigation/Footer (or behind a "Play fullscreen" toggle), reclaiming ~65px + the footer.
- **Planning stepper:** keep Why/What/How, but the "What" list lives in the internal-scroll backlog pane.

## Priority order
1. **App-shell layout + internal-scroll panes** — fixes the fundamental "no page scroll". Biggest win.
2. **Collapse header into one bar + `⋯` menu; de-duplicate the DoD; dock the action bar** — reclaims the ⅔-screen header, fixes the overlap.
3. **Park as a side rail on wide tablets.**
4. **Full-screen game layout** (drop site nav/footer).

Net effect: the whole game lives in 768px with **zero page scroll**, only the backlog and columns scrolling within their own panes, and the park always in view.
