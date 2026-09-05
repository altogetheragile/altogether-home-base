# Build A Zoo: Live App Against The Mock-Ups

Written 5 September 2026. A screen-by-screen review of the twenty-six live screens against the frames in this folder. The isometric park stays; nothing here depends on the projection.

## The One Idea

The mock-up has one rule: **one job per screen, and nothing else on it.** Every frame shows the learner one thing to look at, one thing to decide, and where they are. The live app has the same bones now, and it works. What it has on top is the problem. On most screens the learner is reading four or five things before they reach the one that matters. That is cognitive load, and it is the difference between a game that teaches and a game that explains.

The fixes below are mostly removals.

## What Is Right

The skeleton matches the mock and should not be touched:

- Three tabs, one per artifact, with the Sprint Backlog tab locked until Planning.
- The Plan and Build states on the Sprint Backlog tab.
- Sprint Planning as three topics, and the master-detail layout on topic three.
- The Done column rule, the drop target, the Developers picking up work.
- The Done gate content: steps, acceptance criteria, Definition of Done, with the park's evidence.
- The four key value measures, shown as four numbers and never merged.
- The Review as Done, Visitors, What next. The Retro as Inspect, Adapt. Both better than the mock.
- The decision log with the actor named.
- Improvements with a mechanical effect.

## Across Every Screen

**Two headers where the mock has one.** A white brand bar, then a grey bar with Sprint, clock, goal, dials, Artifacts, Scrum. The mock is one teal strip, 56px, with the 皆 mark, carrying all of it. The live app spends 70px and two visual registers on the same information.

**The Sprint Goal appears three times.** In the strip, in a band under the tabs, and again in the working area. Once is the rule. The strip carries it everywhere; the Sprint Backlog tab may repeat it large in the band; nothing else does.

**No teal.** Orange, purple, blue, green, pink. Deep Teal is the brand's heading colour and it is on no screen. Every colour that is not teal or orange is a colour the learner has to decode.

**The Coach.** Popover cards with advice, often about refinement, often at the wrong moment, twice covering the button the learner needs. The mock has no Coach. Every lesson lives in the flow, at the moment it applies, as part of the screen.

**No bet.** Topic two says "Make a bet on this Sprint" and offers nothing to make it with. The bet is the one thing that gives a Sprint a question and the Review an answer. Without it the loop has no tension.

**Centred columns.** Several screens are still 860px to 1030px wide on a 1440px viewport. Full width is not about filling space. It is about giving each panel the room it needs so that nothing has to scroll inside a card.

## Screen By Screen

### 01 Scrum On One Page

Keep it; it is the pre-read. Two changes. Recolour the six pastel card accents to Mid Teal and Orange. Put the header strip on it so the learner meets the strip before the game.

### 02 Product Goal

The content is right. The layout is a centred column with no tabs. The mock puts this on the Product Backlog tab with an empty Backlog card on the right. The learner sees the three tabs from the first screen and the Backlog fills as they go. One screen, two panels, no wizard.

### 03, 04, 05 Brief

Three pages, each with three choice cards in the top third and 500px of white below. The mock is one screen: choices on the left, the Product Backlog being written on the right as each choice is made. The stepper can live inside the left card. Three page-loads become one, and the learner sees the consequence of each choice as they make it.

### 06 Refine

The closest screen to the mock. Tabs, locked Sprint Backlog, three agreements on the right, "Split it up" on epics, and "Refine with the Scrum Team" in the strip is an addition worth keeping.

Three gaps. No Product Goal band. Still a 1030px centred column. No refinement bench: selecting an item does nothing. The mock's right-hand card has two faces, the agreements and the bench for the selected item, and the same card serves the Product Backlog tab for the rest of the game.

### 07 Definition Of Done

The chips are right: "the park checks this" and "your judgement" are the mock. But expanding the DoD pushes the button below the fold and the Coach lands on top of it. Collapse agreements one and two once they are made, so the third has the room.

### 08, 09 Planning Topic One

Matches. Stepper, marked items, goal box, "Word it for me", the tab dimmed behind. The bet is missing. The mock puts it here, under the goal, as three numbers to pick from.

### 10, 11 Planning Topic Two

Matches. Two things. The footer says the order of work is set "once the Sprint starts", which contradicts topic three where it is set. And the "+" buttons are fine on their own, but the board uses drag, and one gesture for one idea is less to learn.

### 12, 13 Planning Topic Three

Master-detail, acceptance criteria read-only, tasks editable, "Plan the next item", and the habitat dependency picker, which is better than anything in the mock.

Two gaps. Start Sprint is disabled until every item has steps. The mock, and the Scrum Guide, let the Developers finish the plan in the Sprint. And "What kind? Tree, Bush, Flowers…" is a design decision inside Planning. It belongs in Build, when the item is picked up. Planning decides steps, not shrubs.

### 14 Sprint Backlog, Plan State

The board is right: Product Backlog rail, steps on cards, drop target with "Who takes it", Done column rule. Above it, in order: the two headers, the tabs, "What can we finish today?" with seat chips, the purple Product Owner look-ahead card, "Sprint Backlog (4)", the Sprint Goal band. Five blocks before the first column. The board starts 400px down a 940px screen.

The mock keeps the band and nothing else. The Product Owner's look-ahead becomes one line at the bottom of the screen with its two buttons inline. Cards also carry a Start button beside a drop target that does the same thing. Keep the drag.

### 15 Product Backlog Tab

The biggest gap. A read-only list, epics at the top, no Product Goal, no bench, nothing to do. The mock's Product Backlog tab is where mid-Sprint refinement happens and where its cost is shown. It is the same screen as 06 without the three agreements. As built, refinement can only happen before Sprint 1.

### 16 Increment Tab

Fine as a park. Above it, 200px of paragraph, stats and toolbar. The mock has one small stats box overlaid on the park, counting Increment items and sites separately, and a "Show the Increment only" toggle. The toggle is currently on the Build view, where it does not belong.

### 17 Work Started

The Doing card is right: "Next: build it on the park", Build, "+ pick up". Same stacked headers as 14.

### 18 Build State

The Done gate is here and it is the best thing in the set: criteria, plan two of four struck through, DoD lines with evidence like "nobody picked it up". Around it, the old squash has come back. The look-ahead card is still pinned at 170px. The design bench is below the fold. The DoD is cut off at the bottom.

The mock's Build state shows the one item in hand and the studio, and nothing else. Two smaller things. The Plan and Build toggle is top left here and top right on Plan; it must not move. And the acceptance criteria are tick-boxes for the player where the DoD lines are checked by the park. Make them the same: the park ticks what it can see, the player ticks only the judgement lines.

### 19, 20 Artifacts Drawer, Scrum Reference

Both fine as drawers. With the tabs in place the Artifacts drawer is half redundant: the Product Goal and the DoD now have homes. Keep it read-only or drop it.

### 21 Daily Scrum

Not a takeover. A 640px column on a white page, with the Plan state nowhere in sight. The decision, the reason the screen exists, starts at 800px with the Coach on top of it. The mock dims the board behind, shows progress, burndown and the decision on one screen without scrolling, and ends with a line naming who is in the room. The copy says the Daily Scrum "always happens"; the game lets you skip it. Keep the skip, change the copy.

### 22 Review, Done

The Increment is a 900px picture inside a card. This is the one moment the park is the point, and it is smaller here than on its own tab. The mock puts the park full-screen behind with "Increment only" on, and the verdict beside it.

The Product Goal progress bar reads 0% next to "no set number of Sprints". A bar implies a finish line. Give the goal a measurable target or drop the bar. The Sprint Goal verdict, the headline, is cut off under the button. And there is no bet to answer.

### 23 Review, Visitors

Right. Four measures as four cards, "not measured yet" where honest, happiness by segment. One gap: visitor feedback has no decision attached. The mock puts "Add to Backlog" and "Decline" beside each line and records the choice. As built, step three decides for the Product Owner.

### 24 Review, What Next

Undone items return to the top of the Backlog. Correct, and rarely taught. "End it here anyway" as the Product Owner's call is the met-or-abandoned rule made into a button.

Two defects. Giraffe Enclosure shows 3 points; it was 5 at Planning. The Savanna epic is still listed above the items that were split from it.

### 25 Retro, Inspect

The decision log with "You" and "Developers" as actors is the mock. The three "talk these through" questions are the classroom pause point built in. Keep them.

The log has no costs. "Day 2: the Daily Scrum was held" needs "blocker cleared, 10% of the day" beside it. Without the number the Retro is a diary. And "Delivered 0 of 0 points" should read 0 of 18.

### 26 Retro, Adapt

Improvements with mechanical effects are the teeth the design pack asked for. Three gaps. The options are the same three whatever happened; the mock draws them from the log. "Daily Scrums cost no build time" rewards the wrong thing: the Daily Scrum always costs its timebox, what improves is the cost of the blockers it catches. The third option has no effect line, and the DoD list scrolls inside its card.

## The Load, Counted

On the live Sprint Backlog tab in Plan state, before reaching the board, a learner reads: a brand bar, a strip with seven items, three tabs, a question, three seat chips, a help icon, a toggle, two chips, a 170px advice card with two buttons, a heading, a labelled band with the goal, and a column header. Twenty things. On the mock's frame, the same learner reads: one strip, three tabs, one band, one column header. Six.

That ratio holds on most screens. The mock is not simpler because it is a drawing. It is simpler because each screen was allowed to do one thing.

## Order To Fix

1. One teal strip. Remove the brand bar. The 皆 mark goes in the strip.
2. Remove the Coach. Move each surviving message to the moment it belongs to, in the flow.
3. The Sprint Backlog tab: band only above the board; look-ahead as a bottom rail; drag only.
4. The Product Backlog tab as a working bench, mid-Sprint, with cost shown.
5. Daily Scrum as a takeover, decision above the fold, who is in the room.
6. The bet at Planning and its verdict at the Review.
7. Visitor feedback as Product Owner decisions, recorded.
8. Costs in the decision log; improvements drawn from it.
9. Defects: 0 of 0, the enclosure's points, the persisting epic, "none ⭐", the progress bar, the moving toggle.
10. Brief as one screen; Product Goal on the tab; Increment tab stats box and toggle.

Each is a removal or a move. None adds a screen.
