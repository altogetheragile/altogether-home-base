# Build A Zoo: The Takeover Build Model

Note for Claude Code · 8 September 2026 · Al Davies-Baker with Claude

Frames in this folder: `01` to `05`. They show the Sprint Backlog tab while a Developer is building. The park renderer in the frames is a plain grid; the isometric or top-down decision is separate and does not change anything here.

## The Rule

- The park is for placement and orientation. Nothing else is edited on it.
- Every object (habitat, animal, facility) is built and edited in a takeover. New object: the takeover opens when the card is picked up. Existing object: it opens from Edit on the selected object.
- Everything about the object lives in the takeover: footprint, shape, ground, fence, shelter, water, planting inside the fence, the animal, the facility type.
- Path and loose planting are the only park tools. They have no object.
- Animals are never placed on the park. The Lion card opens the Lion Enclosure's takeover and the lion is added there. The park shows the lion because the enclosure has one.

## Two Different Lists

The takeover's panel is headed "Acceptance criteria". These belong to the item and differ item by item. The Definition of Done is the team's bar for every item and is shown separately, once, at the Done gate and on the Increment tab. Do not merge or relabel the two.

## The Flow

1. Pick a card in the strip. The takeover opens (frame 02).
2. Build the object. Acceptance criteria marked "here" go green as the park engine sees them met, with the evidence in one line.
3. Place on the park. The takeover closes and the object is a ghost under the cursor. Green means room, red means not (frame 03). Esc returns to the takeover.
4. Drop it. It is "built, not Done". Criteria marked "on the park" are checked now. If one fails, a single pill under the object says what and how to fix it (frame 04).
5. Draw the path if needed. When all criteria are green the pill turns green and "Ask Priya to check" appears (frame 05).
6. Select any object on the park to get Edit, Turn, Move, Remove. Edit reopens the takeover. Turn and Move happen on the park.

Keep as draft closes the takeover with the card still in hand. Nothing is on the park until it is placed.

## Where Each Acceptance Criterion Is Checked

| Criterion | Checked | Evidence line |
|---|---|---|
| Fence with no way out | takeover | Closed, 4 sides |
| Room to move about | takeover | 6 × 4, a lion needs 5 × 4 |
| Looks like a home, not a shed | takeover | Ground, shelter, water in |
| Path all the way round | park | Path reaches N sides of 4 |

Every acceptance criterion carries a `checkedAt: 'object' | 'park'` field. The takeover shows the tag so the learner sees why the fourth one waits. An item can leave the takeover 3 of 4 green. That is deliberate: building the thing and integrating it are two steps, and the second is the Increment lesson.

The site thumbnail in the takeover is required, not decoration. Footprint is chosen in the takeover but tested on the park, so the takeover must say whether the chosen size fits the intended site before the learner commits.

## What Goes, And Why

Working through the five current screens:

**Left column, in-hand card.** Removed. The card is in the strip and the takeover is the detail view. Two copies of the same item on one screen is the duplicate that made the screen feel squashed.

**Next step and Plan 0/4.** Merged and moved. They were the same list twice. The takeover's acceptance criteria list is the plan. If a step order is still needed for the guided first run, it is the coach's job, not a permanent panel.

**Acceptance criteria as radio buttons the learner ticks.** Changed. The park engine ticks them, with evidence. The learner does not self-certify. This was already the direction and the takeover makes it easy.

**Definition of Done block on every item, all the time.** Removed from the build screens. The DoD is the same bar for every item, so it is shown once: at the Done gate (Ask Priya to check) and on the Increment tab. Showing it while building, with one line already ticked, taught nothing and took a third of the column.

**More controls: colours, ground, shape (open link).** Removed. This was a second, hidden control set. Everything is in the takeover, visible.

**Palette of six tools.** Reduced to two on the park: Path and Planting. Habitat, Animal, Facility are cards, not tools. Water is part of a habitat. The sub-chip row for Planting (Tree, Bush, Flowers, Hedge, Rocks) stays, but as the Planting tool's options, and it also appears as "+ Planting" inside the takeover.

**Instruction line on the park.** Removed. The one-line status next to the palette says what to do now, and only now.

**Surface: Gravel in the view bar.** Removed. It is a path property. If path surface matters to visitors, it is a Path tool option. If it does not, cut it.

**Increment 0 · Site 1 · 480 visitors pill.** Moved to the Increment tab. It is Increment information on a Sprint Backlog screen.

**Building Lion Enclosure · 3 Developers on the team.** Removed. Ada's status in the event band already says it.

**Zoom and Turn.** Kept, as two small buttons. Zoom becomes zoom-to-selection when something is selected.

## What The Sprint Backlog Tab Now Has

- Strip of card tokens, left.
- Park, full width. Two tools, one status line, Turn, Zoom.
- Takeover per object, over the park, with the clock strip and PO rail still visible.
- One pill on the park per object that is built but not Done.
- Ask Priya to check, only when 4 of 4.

Nothing else.

## The Park Renderer

This is still Al's decision. The takeover changes the trade-off, so here is where it stands.

The problem with the isometric park was editing: screen x and y do not map to the grid, and objects overlap what is behind them. Every awkward action (hit the right cell, drag a fence, find an animal) came from that. Four options were on the table:

1. Top-down for everything. One renderer, trivial editing, flatter look.
2. Top-down to build, isometric read-only for Review and the Increment tab. Two renderers of one model, the second display-only.
3. Isometric with a proper interaction layer: snap, cell highlight, base handle, zoom-to-selection. Weeks of work if the park is where everything is edited.
4. Top-down with a little depth: fences and buildings get a short front face. One renderer, easy editing, most of the flatness gone.

The takeover moves footprint, ground, fence, shelter, water, planting-inside and animals off the park. What the park has left is: drop a footprint, draw a path, select an object to move or turn it. Of those, only path drawing is awkward in isometric.

So the ranking shifts:

- Option 3 shrinks from weeks to days. The interaction layer only needs snap, highlight and a base handle for whole objects.
- Option 4 is now over-specified. It buys an editing grid the takeover has made mostly unnecessary.
- Option 2 loses its reason. The takeover is the build view, and it is not a park.
- Path is the swing factor. Point-to-point paths (click start, click end, route along the grid) work in isometric. Painted cell-by-cell paths do not, and would push the park to top-down.

Current lean: keep the isometric park, add the small interaction layer, draw paths point-to-point. If point-to-point paths feel wrong in use, switch the park to top-down with depth. Nothing in the takeover changes either way, which is why the frames use a plain grid.

Build the takeover first. It is renderer-independent and it is the bigger change.

## Open For Al To Decide

- Fence style (Timber, Stone, Glass) is in the takeover. If it never affects Done or visitors it is cosmetic and should go.
- Path drawing: point-to-point (click start, click end, it routes along the grid) or painted cell by cell. Point-to-point is the assumption in frame 04 and is the safer choice if the park stays isometric.
- Whether Turn on the park is worth having. If every object is rectangular and symmetric, it is not.
