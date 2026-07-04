# Claude Design Briefs: Pipeline Surfaces

Copy-paste briefs for claude.ai/design, one per screen, for the new "Vision to
Value" pipeline surfaces that were designed but not yet built (see
[VISION_TO_VALUE.md](VISION_TO_VALUE.md)). These mock the net-new UX only; the
shipped admin/DataTable and Flow Game work is iterated in code, not mocked.

The "Altogether Agile UI" Claude Design project already has the shadcn/ui
component library and the guidelines (TOOLS.md, VISION_TO_VALUE.md,
style-guide.md) synced, so the design agent builds with the real components and
brand. Do NOT re-sync `packages/ui` onto that project (see
`.design-sync/NOTES.md`): it would delete the ~167 components already there.

Paste one brief per new design so each gets a clean canvas. If the agent reaches
for a generic table, nudge it toward assembling from `Table` and `Card` (the new
DataTable composite is not in the synced set yet).

Prepend this shared line to each brief:

> Use our synced components and brand tokens (deep teal primary, orange accent).
> Prefer Card, Tabs, Badge, Button, Select, Checkbox, Progress, Tooltip,
> DropdownMenu. This is for an agile coaching pipeline built on the ISA-O3
> stages: Intent, Scope, Approach, Operate, Outputs, Outcomes.

---

## Brief 1: Pathways Picker

```
Design a focused "Choose your pathway" screen shown when a user starts or
configures a project. It curates which tools appear and in what order, and it
must recommend rather than lock (any step can be changed later).

Two selection axes, stacked:

1. "What are you doing?" (context) - a row of selectable Cards, single-select:
   New Business, New Product, Improve an Existing Product, Just Manage a Backlog.
   Each card: an icon, a title, a one-line description.

2. "How does your team deliver?" (method) - selectable Cards, single-select:
   Kanban (continuous flow), Scrum (sprints), AgilePM (timeboxes), No framework.
   Under each, a small line of Badges showing what it implies, e.g.
   Scrum -> "Sprints · Ordered backlog", AgilePM -> "Timeboxes · MoSCoW",
   Kanban -> "Continuous flow · WSJF".

Right side or below: a live "Your pathway" summary that updates as they pick,
shown as a horizontal stepper of tool Cards/Badges in order, e.g.
Product Vision -> Personas -> Impact Map -> Backlog -> Simulate. Recommended
steps are solid (teal), optional steps are outlined/muted, with a note
"Recommended for your context. You can add, remove, or reorder later."

Primary Button: "Start project". Secondary Button: "Skip, I'll pick tools as I go".

Show these states: nothing selected; context chosen only; both chosen with the
summary populated; and the recommended-vs-optional visual distinction.
```

---

## Brief 2: Project Journey (produce two variants to compare)

```
Design the project workspace that shows progress across the six ISA-O3 stages:
Intent, Scope, Approach, Operate, Outputs, Outcomes. Produce TWO variants of the
same content so we can compare the shells:

Variant A: a horizontal stage journey/rail across the top; clicking a stage
expands its panel below.
Variant B: a Tabs bar where each tab is a stage; the active tab shows that
stage's content.

Shared content in both:
- Header: project name, a Badge showing the chosen pathway (e.g. "New Product · Scrum"),
  and an overall Progress bar.
- Each stage shows its coaching question in muted text (e.g. Intent: "Why does
  this matter, who does it serve, what would be different?").
- Within a stage, the mapped tools appear as Cards: tool name, a status Badge
  (Not started / In progress / Done), an artifact count when there can be several
  (e.g. "Personas: 3", "Backlogs: 2"), and a small "derived from" provenance chip
  linking back to an upstream artifact (use Tooltip/HoverCard for the trace).
- Stages are non-gated (jump to any). The recommended-next stage is highlighted
  with the orange accent.
- Include one tool shown as planned/coming (the Simulator at Operate/Outputs).

Show these states: a Done stage, an In-progress stage with multiple artifacts,
a planned tool, and the recommended-next highlight.
```

---

## Brief 3: Simulator Mode and Results

```
Design two linked screens for a flow simulation tool that can run in three modes.

Screen 1 - Setup:
- Mode selection as three selectable Cards: Kanban Flow, Scrum Sprint,
  AgilePM Timebox. Each card states what it changes across four short lines:
  Cadence (continuous / 10-day sprint / fixed date), Commitment (pull continuously /
  commit a batch up front / fixed date, flex scope), Prioritisation
  (WSJF / ordered / MoSCoW), Headline metrics.
- Source selector (Select): "Simulate: <a product backlog>" or
  "Teaching scenario (default)".
- If Sprint or Timebox is chosen, show a "Plan the sprint" panel: a list of
  backlog item rows with Checkboxes and a capacity/points Progress meter that
  fills as items are committed.
- WIP limit steppers per stage (Analysis, Development, Test).
- Primary Button: "Run".

Screen 2 - Results (mode-aware; show all three variants):
- Flow: cycle-time scatter, throughput bars, WIP line, a flow-efficiency
  percentage, and a Little's Law panel. A collapsible CFD.
- Sprint: a burndown, velocity vs prior sprints, committed-vs-done (say/do
  percentage), carryover count, with the flow charts available behind a Tabs toggle.
- Timebox: "Hit the date" confirmation, what shipped by MoSCoW (Musts done,
  Shoulds/Coulds dropped), scope delivered vs planned.
- End every variant with one plain-language debrief line.

Charts can be simple placeholders or lightweight SVG; the point is layout and
the metric panels, not chart fidelity. Use Card, Tabs, Badge, Checkbox, Progress,
and Button.
```

---

## Notes

- These surfaces map onto the existing `src/config/pipeline.ts` registry (stages
  and tool-to-stage mapping) and `src/config/prioritisationSchemes.ts` (MoSCoW,
  WSJF, simple). Pathways and simulator modes would be added as declarative
  config in the same spirit, not as forks.
- The project journey already exists in code as `ProjectJourney`
  (`src/pages/ProjectDetail.tsx`); Brief 2 is about deciding tabs vs rail and how
  pathways/provenance surface, before changing that component.
