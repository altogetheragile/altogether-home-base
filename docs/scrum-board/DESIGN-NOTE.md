# Scrum Big Picture: Design Note for Claude Code

Version: 2 October 2026. Owner: Alun Davies-Baker, Altogether Agile.

## What This Pack Contains

- `scrum-big-picture.html`: the full page. One file, no build step. It is the source of truth for layout, icon drawing code, hover labels and knowledge-page content.
- `icons/`: every icon as a standalone SVG, tightly cropped. Use these in the zoo game and course material.
- `icons-sheet.html`: a contact sheet of all icons. Open it to check names.
- `COURSE-AND-BOARD.md`: how the board links to the Build A Zoo game and the online course, plus what earlier material is superseded.

## Where Things Live in the HTML

- `ICON` object: drawing code for artifacts, commitments, events and the four extra inputs.
- `roleGlyph()`: draws the PO, SM, stakeholder and Developers figures.
- `TEAM` and `grp()`: the Scrum Team group of three figures.
- `INPUTS` and `OUTPUTS`: what each event inspects and what it adapts or creates.
- `P` array: the knowledge pages. One object per page.

## Icon Meanings

| Icon file | Meaning |
|---|---|
| `product_backlog.svg` | Product Backlog. Mid Teal tablet, Product Goal peaks on top, yellow items getting larger and paler lower down |
| `sprint_backlog.svg` | Sprint Backlog. Deep Teal tablet, Sprint Goal flag, checklist |
| `increment.svg` | Increment. Orange cube with the Definition of Done gem on its corner |
| `product_goal.svg` | Product Goal. Orange peaks |
| `sprint_goal.svg` | Sprint Goal. Orange flag on a Deep Teal pole |
| `definition_of_done.svg` | Definition of Done. Flat teal gem with a tick |
| `event_sprint.svg` | Sprint. Plum loop around the Increment |
| `event_sprint_planning.svg` | Sprint Planning. Product Backlog becoming the Sprint Backlog |
| `event_daily_scrum.svg` | Daily Scrum. Sprint Backlog in a dashed daily loop |
| `event_sprint_review.svg` | Sprint Review. Three figures with different views, discussing the Increment and the Product Goal |
| `event_sprint_retrospective.svg` | Sprint Retrospective. Scrum Team inside a backward loop |
| `product_owner.svg`, `scrum_master.svg` | Single accountabilities, initials on the body |
| `developers.svg` | Developers. Three identical figures stacked close |
| `scrum_team.svg` | Scrum Team. PO, Developers and SM side by side |
| `stakeholder.svg` | Stakeholder. Not a Scrum accountability |
| `improvements.svg` | Improvements. Used for both Retrospective outputs and Sprint Planning inputs |
| `past_performance_capacity.svg` | Past performance and capacity |
| `changes_in_environment.svg` | Changes in the environment |
| `how_the_sprint_went.svg` | How the Sprint went: individuals, interactions, processes, tools |

## Rules Al Has Set

These have been corrected before. Do not break them.

1. **No outlines on figures.** No white edges, halos or strokes around any person figure, single or grouped.
2. **Every figure is the same size.** A figure in a group is never smaller than a figure on its own.
3. **Several people in one role are stacked.** Three identical figures, offset slightly up and to the right, told apart by shade only. The back figures barely show.
4. **Different roles together sit side by side.** The Scrum Team is PO left, Developers front centre, SM right.
5. **Heads join the body.** No floating heads.
6. **Backlogs sit on rounded tablets.** Product Backlog on Mid Teal (#007A7A), Sprint Backlog on Deep Teal (#004D4D). Check colours never merge with what sits next to them.
7. **Acceptance criteria and the Definition of Done are separate.** Acceptance criteria belong to an item. The Definition of Done is the team-wide bar. Never merge or relabel them.
8. **Scrum Guide terms only.** No "Delivery Plan", "ceremonies" or other non-Guide terms on the board. Use "events".
9. **Minimal text on the board.** Icons carry meaning; names appear in the legend and on hover.
10. **Hover shows the label.** Every icon shows its name on hover, with any qualifier smaller underneath.

## Colours

| Token | Hex | Use |
|---|---|---|
| Deep Teal | #004D4D | Sprint Backlog tablet, headings, flag pole |
| Mid Teal | #007A7A | Product Backlog tablet |
| Teal | #0E8C8C | Developers, Increment gem base |
| Orange | #FF9715 | Product Owner, commitments, accents |
| Plum | #7B2D7B | Scrum Master, events, improvements |
| Coral | #F07A2E | Stakeholders |
| Gold to cream | #E0A800 to #FFEBAD | Product Backlog items, deepest at the top |

Fonts: DM Sans for body and UI, DM Serif Display for editorial headings.

## Licence

Page text draws on the Scrum Guide 2020 (CC BY-SA 4.0). Keep the credit line. The icons, layout and exercises are Altogether Agile's own; keep Guide-derived text separate from them if the material is sold.
