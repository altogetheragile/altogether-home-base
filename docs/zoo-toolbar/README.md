# The build strip's icons

One SVG per distinct name on the build strip, plus the odd drawing that is placed by hand. Drawn outside the repo and dropped in here
whole; `scripts/zooToolbar/import.mjs` turns them into `toolbarIcons.ts`, which is what the game
imports. Nothing reads these files at runtime.

To take a new set: replace the files, run `node scripts/zooToolbar/import.mjs`, commit both. CI runs
the same script with `--check` and fails if the generated file has drifted from this folder.

## Why there are fewer drawings than controls

The strip has seventeen groups of controls (`src/components/zooGame/buildGroups.ts`) but far fewer
names, because four groups are the same act on different things: a habitat's fence, a building's
sign, an animal's coat and a plant's foliage are all **Look**. Two are **Size**, two are **How
many**. The first decision is the other way round - one group wearing three names, Structure over a
habitat, Species over a lion, Planting over a stand of trees - so it has three drawings and picks
between them with `iconFor`.

Not every drawing is a group's. `acceptance-criteria` belongs to the item being built rather than
to any control: it stands on the item chip and on the panel that chip opens. The orphan check knows
it by name, so a drawing nobody placed anywhere is still a failure.

A group's category decides whether it is on the strip at all, and no two groups that share a name
can appear together - a habitat has a footprint, a plant has a grown size, nothing is both. So one
icon per name is enough, and a test holds that: if a future group broke the rule, one item would
show the same icon twice with no way to tell the buttons apart.

## The one rule the drawings have to follow

A single colour, `#004D4D`, and no `fill="#fff"` knockouts. The importer rewrites that colour to
`currentColor` so the button's own text colour drives the icon: grey at rest, darker under the
pointer, orange while its menu is open. An icon with a second colour baked in would sit there grey
while the button around it turned orange.
