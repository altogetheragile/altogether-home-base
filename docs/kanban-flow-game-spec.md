# Kanban Flow Simulation - Game Design Spec
## AltogetherAgile | Free Resource Tool

---

## Overview

A solo, browser-based Kanban flow simulation game, designed as a free resource on the AltogetherAgile website. Target play time: 10 minutes. The core learning objective is experiential understanding of why WIP limits improve flow, demonstrated through two contrasting rounds and a Little's Law reveal.

A multiplayer version (for course attendees, behind login) is planned as a future sprint. Build this single-player version in a way that does not make that harder later.

---

## Learning Objectives

By the end of one session, the player should be able to:

1. Describe why limiting WIP reduces cycle time
2. Read a basic throughput chart and a cycle time scatter plot
3. Articulate Little's Law in plain language: cycle time = WIP / throughput

---

## Game Structure

### Two Rounds

**Round 1 - No WIP limits (chaos)**
The player runs the board with no constraints. Work piles up, blockers compound, cycle times balloon. The metrics screen shows the damage.

**Round 2 - WIP limits applied (flow)**
The player sets a WIP limit for each active column before the round starts. The same simulation runs. Metrics improve. Little's Law is shown numerically across both rounds side by side.

The contrast between the two metric screens is the primary learning moment.

---

## Board Structure

Five columns, generic knowledge-work framing:

| Column | Type | WIP Limit applies? |
|---|---|---|
| Backlog | Input queue | No |
| Analysis | Active | Yes |
| Development | Active | Yes |
| Test | Active | Yes |
| Done | Output | No |

20 work items per round. Items start in the Backlog and move left to right.

---

## Workers (Meeples)

Six workers. Each has a specialism - one column where they work at full effectiveness. Outside their specialism they work at reduced effectiveness (e.g. 60%).

Suggested specialist distribution:
- 2 x Analysis specialists
- 2 x Development specialists
- 2 x Test specialists

Player assigns workers to cards each day. They can split workers across cards or stack multiple workers on one card.

---

## Day Mechanics

Each simulated day follows this sequence:

1. Blockers are applied randomly (12% chance per in-progress item)
2. Player assigns workers to cards
3. Player clicks "Run Day"
4. Dice rolls (1-6) are calculated per worker; specialist bonus applied
5. Work is deducted from each card's effort remaining
6. Completed cards move to Done; cycle time recorded
7. Summary bar shows day result
8. Player reviews and clicks "Next Day"

### Blockers

When a blocker lands on a card:
- The card is visually flagged
- The player must assign a worker to clear it before work can resume
- Clearing effort is determined by which column the card is in
- Blockers introduce variability that compounds badly without WIP limits

### Round length

20 simulated days per round.

---

## WIP Limit Setting (Round 2)

Before Round 2 starts, the player sees a simple WIP limit configuration screen. They set a number for each of the three active columns (Analysis, Development, Test). Suggested defaults shown as starting point (e.g. 3/3/3) but player can adjust.

A short prompt nudges them: "Based on what you saw in Round 1, what limits would help?"

---

## Metrics Screen

Shown at the end of each round. After Round 2, both rounds are shown side by side.

### Lead charts (always visible)

1. **Throughput over time** - bar chart, items completed per day
2. **Cycle time scatter** - dot per item, x = completion day, y = cycle time in days
3. **WIP over time** - line chart, total WIP across active columns per day

### Little's Law panel

Displayed as a simple equation with the player's actual numbers filled in:

```
Average Cycle Time = Average WIP / Throughput Rate
Round 1: [X] days = [Y] items / [Z] items per day
Round 2: [X] days = [Y] items / [Z] items per day
```

Short plain-English explanation beneath it.

### Dig deeper (toggle, collapsed by default)

Cumulative Flow Diagram with a two-sentence explanation of how to read it.

---

## Styling

Match AltogetherAgile brand conventions:
- Primary: deep teal
- Accent: orange
- Typography and component patterns consistent with the existing site
- Do NOT reference or imitate the TWiG visual design (meeple avatars, colour palette, layout)
- Cards should feel like the Kanban board in the site's existing UI vocabulary
- Workers represented as simple labeled tokens or initials circles, not cartoon figures

---

## Technical Constraints

- React component, TypeScript, Tailwind - consistent with existing site stack
- Self-contained: no backend calls in this version, all state in React
- Designed so that game state shape can later be lifted to Supabase for multiplayer
- Route: `/resources/flow-game` or similar, consistent with site routing conventions
- Should work on desktop; mobile is a nice-to-have, not a requirement for v1

---

## Out of Scope (v1)

- Multiplayer / shared game state
- User accounts or score persistence
- EPR scenario skin (planned for later)
- Mobile-optimised layout
- Facilitator controls

---

## Future Hooks to Leave Clean

- Game state should be a single serialisable object (for Supabase later)
- Worker and card data should come from a config object (easy to swap in EPR scenario)
- Metrics calculation should be a pure function (testable, reusable for multiplayer analytics)
