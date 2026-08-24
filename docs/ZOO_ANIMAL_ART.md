# Zoo Animal Artwork

The animals in Build a Zoo are cut from licensed illustration sheets rather than
drawn as pixel grids. This is how to add more.

## Why it works this way

A sheet is one SVG holding two dozen drawings side by side, each a top-level
`<g>` with no id. `scripts/extract-animal-art.mjs` opens it in a real browser,
measures where every group actually lands, crops the ones you have named, and
writes them to `src/components/zooGame/art/animalArt.generated.ts`.

It is a hand-run step and its output is committed, so a normal build and CI need
neither a browser nor the source sheets.

Every drawing on a sheet is to one scale, so the generated `w`/`h` are directly
comparable. `UNITS_PER_CELL` in `art/animalArt.ts` turns those into pixels - one
number for the whole menagerie. That is where a giraffe being taller than a fox
comes from; there is no per-species size table to keep in step.

## Adding a species

1. Put the sheet in `art-src/zoo/`.

2. See what is on it:

   ```
   npm run animal-art -- --index
   ```

   That writes `art-src/zoo/contact-sheet.png` with every drawing numbered.

3. Add the sheet and its drawings to `scripts/animal-art.config.json`. The key
   must be an exhibit's `template` from `toolboxItems.ts` - `animalArt.test.ts`
   fails on a name no toolbox item uses, which is usually a typo. Set
   `"flip": true` for a drawing that faces left, so everything in the park faces
   the same way.

4. Regenerate and check:

   ```
   npm run animal-art
   npx vitest run src/components/zooGame/animalArt.test.ts
   ```

## Species with no drawing yet

A species without artwork falls back to its built sprite, so the toolbox never
loses an animal waiting for one to be drawn. As of the first sheet these are
still on built sprites:

> cheetah, buffalo, antelope, meerkat, otter, flamingo, reef, eagle, parrot,
> toucan, peacock, ostrich, emu, panda, gorilla, monkey, kangaroo

## Licensing

`art-src/` holds licensed source art. Record where each sheet came from in the
`credit` field of the config - it is carried into the generated file's header.
The current sheet is Freepik, under Al's licence.
