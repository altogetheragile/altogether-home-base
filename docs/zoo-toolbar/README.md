# The build strip's icons

Twelve SVGs, one per distinct name on the build strip. Drawn outside the repo and dropped in here
whole; `scripts/zooToolbar/import.mjs` turns them into `toolbarIcons.ts`, which is what the game
imports. Nothing reads these files at runtime.

To take a new set: replace the files, run `node scripts/zooToolbar/import.mjs`, commit both. CI runs
the same script with `--check` and fails if the generated file has drifted from this folder.

## Why twelve

The strip has seventeen groups of controls (`src/components/zooGame/buildGroups.ts`) but only twelve
names, because four groups are the same act on different things: a habitat's fence, a building's
sign, an animal's coat and a plant's foliage are all **Look**. Two are **Size**, two are **How many**.

A group's category decides whether it is on the strip at all, and no two groups that share a name
can appear together - a habitat has a footprint, a plant has a grown size, nothing is both. So one
icon per name is enough, and a test holds that: if a future group broke the rule, one item would
show the same icon twice with no way to tell the buttons apart.

## The one rule the drawings have to follow

A single colour, `#004D4D`, and no `fill="#fff"` knockouts. The importer rewrites that colour to
`currentColor` so the button's own text colour drives the icon: grey at rest, darker under the
pointer, orange while its menu is open. An icon with a second colour baked in would sit there grey
while the button around it turned orange.
