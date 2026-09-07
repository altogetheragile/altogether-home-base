# Build A Zoo: The Build Interface, The Seats, And The Header

Written 7 September 2026. The fifth note in this folder. It records the decisions of 6 and 7 September, which are drawn in frames 15a onward in zoo-flow-v2 and in the zoo-screen-flow set. Where this note and an earlier note disagree, this one stands.

## Why These Changes

Two complaints drove them. The build screen was confusing: board, panel, In hand card and park all at once, and nothing said what mattered. And the roles were invisible: no team set-up, no sign of who did what, the Product Owner idle for three days between Planning and Review.

The fixes borrow from world-building games, where the patterns are settled, and from the Scrum Guide, where the accountabilities are.

## 1. The Build Interface

### Patterns Borrowed

- **A palette, not a menu.** Six tools along the bottom of the park: path, habitat, animal, facility, planting, water. Each is a glyph with a small label and a gesture: paint, draw or place. There is no second level.
- **Ghost placement with a verdict.** The chosen item follows the cursor as a translucent copy, green where it can go and red where it cannot, with the reason as glyphs: "paw → fence ✕". No dialog.
- **Draw the boundary, fill the inside.** A habitat is a rectangle dragged on the grid. The fence follows the drag; the inside becomes ground for water, shelter and planting.
- **A live checklist.** The item's acceptance criteria sit in an inspector docked on the park and go green as the park sees each met. This is Planet Zoo's welfare panel and it is also "the park checks this".
- **Click anything to inspect it.** Detail lives in a dialog, opened on demand, never on the surface.
- **Few tools, big consequences.** Six tools is the whole catalogue. Expression lives in the animal studio, not the park.

### Two States Of The Sprint Backlog Tab

The state is decided by what the learner is doing, not by a toggle.

- **Board state.** Nothing in hand. The board at full width. Each card carries four things: name, points, who is on it as avatars, and a row of dots for the steps. No step text, no Start or Build buttons. Click a card for the dialog.
- **Park state.** A card was dropped on Doing, so the park slides in and takes the width. The board becomes a column of tokens down the left edge, each token a glyph, a name, points and dots. On the park: the inspector top left, the stats top right, the palette along the bottom, the ghost on the cursor. Drop the card on Done and the board slides back.

### The Card Dialog

1000px wide. Name and points across the top, who is on it under them. Two columns: Steps on the left, numbered; What this needs to be on the right, each criterion with its glyph. Four lines a side. One button. One small link: the Definition of Done is the same for every item, see Learn. Nothing the card does not own.

### The Studio Is A Popover

For an animal, dropping it into its habitat opens two choices: how many, which coat. Then it lands. There is no bench.

### Where The Panels Went

The live Actions & Messages panel did three jobs. They go to three places.

- **Actions** (open now or later, drop or keep, split or not, blocker responses) are the rail: one line at the bottom, actor label, buttons inline, one at a time with a count if more are waiting. An action with buttons is never dismissed; it is answered or it waits.
- **Messages** that need no click go to Learn, Notes section, with a dot on the Learn button.
- **Just happened** is the decision log: Learn, This Sprint section.

Two of the three items in the live panel ("PO to accept", "Dev to review") no longer exist as actions. The park checks the criteria as they are met and peer review is satisfied by two Developers on the card. Both became evidence lines in the Done gate.

### The Flow, Pull To Live

Screens 14 to 23 in the screen-flow set. Pull to Doing and pick who on the drop. Draw the habitat. Paint water. Place shelter. Paint the path round it while a second Developer swarms in. Drop the card on Done: the gate runs once, four DoD lines with evidence, then the release question, open now or later. Pull the lion, drop it into its habitat with the studio popover, plant, drop on Done. The Increment tab shows two items open with visitors at the lion and two sites marked and not counted.

The clock runs from 2:00 to 0:02 across ten frames and about eight decisions. If the live day is 90 seconds this is too long; either the day is longer or an enclosure has fewer steps.

## 2. Acceptance Criteria Are Not The Definition Of Done

The rule, held everywhere in the game:

- **Acceptance criteria** belong to the item. The PO writes them, refines them with the Developers, and can be asked about them at any time. They answer "is this the right thing?" The panel is headed "What this needs to be".
- **Definition of Done** belongs to the product and the Scrum Team. Same for every item. Raised at the Retro, never lowered to get work through. It answers "is it built properly?"
- **Done** means both are met. The gate checks both, in two lists, and never merges them.

Two live labels break this and should change. "What Done looks like" over the item's criteria should read "What this needs to be". "Approved by the PO" as a DoD line makes the DoD look like the PO's; it is "acceptance criteria confirmed" and belongs with the item.

## 3. The Seats

### Meet The Scrum Team

A screen after the Product Goal and before the brief. Five seats: Priya (PO), Sam (SM), Ada, Ben, Cara (Developers). Each shows the accountability in one line, what that person does in this game, and a line of character. The learner's seat is outlined; in a shared session seats fill as people join and the AI plays the rest in character. Under the row: three Developers times a three-day Sprint is about 22 points, and the number moves if the team or the Sprint changes. Nobody assigns work.

### The Pull Is Visible

At Planning topic 2 the Developers pull, one at a time, in their own words, and the card carries the avatar of who pulled it. A human Developer drags. A human PO watches, can clarify, argue and mark an essential, and cannot drag; trying gets "the Developers select; you can make the case". The capacity bar fills with each pull, and the pull that would go over is the moment a Developer asks the PO which matters more.

### What The PO Does

Writes the Product Goal, chooses who the zoo is for and which area opens first. Orders the Backlog, writes and edits criteria, splits epics, says no, buys refinement time and pays for it in Developer time. Proposes value and places the bet at Planning. Answers questions during the days, rules on mid-Sprint pulls, handles stakeholder asks, decides when Done work opens. Splits the next epic before the team needs it. Presents at the Review, reads the bet's verdict, accepts or declines each piece of feedback, reorders, decides whether the Product Goal is met or abandoned. One voice among five at the Retro.

In free play a PO can drag a card or pick an item for the Developers. The game allows it, names it in the log, and the Retro shows the cost.

### Mid-Sprint Interaction Is Expected

The PO is in the room. One mechanism: a question is a card addressed to a seat. It sits on that seat's rail, shows as "waiting on Priya" on the item card for everyone, and carries a clock. Answered, it goes to the log with who asked, who answered, how long. Unanswered past a threshold, the Developers guess, and the guess is logged.

Interactions this covers: Developers ask the PO what an item needs to be (the criteria the park cannot check). The PO brings a stakeholder ask to the Developers and they answer with cost. The Daily Scrum's outcome goes to the PO's rail before the Review. The PO opens Done work early and the visitors react before the Review. Refinement together on the bench. And the question the PO should not answer ("timber or stone?"), where the right reply is "your call" and the wrong one is named.

Anti-patterns, played: the absent PO (questions pile up, Developers guess, the Retro counts the rebuilds); the PO who changes scope silently (the build fails a line the Developers never saw); the PO on the tools; Developers who never ask.

### The Daily Scrum Is In Front Of The Board

Not a takeover. The board stays live at two thirds of the width; the Developers adapt the Sprint Backlog by dragging: reorder, swap who is on what, or drag an item into "hand it back" at the foot of To do, which returns it to the Product Backlog and tells the PO. A panel on the right asks one question, "are we on track for the goal?", with essentials, points, days left, the burndown read in plain words, the decision priced both ways, and the blocker with its responses. No park; the Increment tab is one click away. Priya and Sam are greyed in the band: not in the room.

## 4. The Header

Three rows on every screen from 02 onward.

**Strip, 72px, Deep Teal.** The mark. The event pill top left at 22pt: teal on a working day ("Day 2 · Building"), orange during an event ("Sprint Planning · What", "Daily Scrum · Day 3", "Sprint Review · Visitors", "Retrospective · Adapt"). One big clock dead centre at 44pt with a bar under it, orange when the time is nearly gone. The goal line to its right ("Goal safe · 1 of 2 essentials · 8 of 21"), with the goal text small beneath it. Learn at the far edge. Nothing else.

**Tabs, 36px.** Product Backlog, Sprint Backlog, Increment.

**Band, 52px.** One sentence on who does what now ("Developers select. Priya makes the case."). The five seats with avatar, name and three or four words on what each is doing ("building Lion Enc.", "clearing blocker", "waiting on you"). Seats not in the event are greyed. The learner's seat is outlined.

### Two Clocks, One Big

Every event is inside the Sprint, so the day clock keeps running through Planning, the Daily Scrum, the Review and the Retro. That is a lesson: Planning consumes day 1; a long Planning is less building. But only one number is big at a time. On a working day the centre is the day's remaining time and the event timebox does not exist. During an event the centre is the timebox, and the day's remaining time is a small figure under it ("day 1 · 1:42 left"). The bar tracks whichever is big.

Before the first Sprint the clock shows a dash and the goal line says "No Sprint yet". That is the honest state.

### What The Header Removed

The second brand bar, the wordmark, the seat chips row, the "Drag a Developer onto a card" instruction, the help and settings icons, the four dials, Artifacts, Scrum, the green display clock, and the goal band under the tabs. Each was either said twice or said in the wrong weight.

## 5. Compact Refinement

Rows at 44px: icon, name, type, ready, points. Groups collapsible, so 23 items fit one screen. The three agreements are three one-line rows with the value inline, and the DoD row says "nobody has agreed it yet" in amber rather than hiding. The bench for the selected item sits under them: the conversation with avatars, "What this needs to be", the sizing vote, three buttons. Nothing scrolls inside a card. The explanatory paragraphs go to Learn.

## 6. The Park Is Not On Sprint Planning

A panel earns its width by having the next click in it. The park has the next click during Build and at the Review's first step. On Planning topics 1, 2 and 3 it is decoration and halves the width of the work. It is off all three.

## 7. Build Order For This Note

1. The header: strip, tabs, band, two-clock rule. Remove what it replaces.
2. Board state and park state with the slide; simple cards; the dialog.
3. The palette, ghost verdicts, docked inspector; the park checks criteria.
4. The rail as the one action channel; Learn takes messages and the log.
5. Meet the Scrum Team; the pull by name at topic 2.
6. The question channel: cards addressed to seats, "waiting on", the clock, the guess.
7. The Daily Scrum at the board with "hand it back".
8. Compact refinement.
9. Free-play naming of PO anti-patterns.

Each ships alone.
