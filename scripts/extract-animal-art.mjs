#!/usr/bin/env node
/**
 * Cuts individual animals out of a licensed illustration sheet and writes them as a TypeScript
 * module the game can render.
 *
 * The sheets come as one SVG holding two dozen drawings side by side, each a top-level <g> with no
 * id. This finds the bounding box of every group (in a real browser, because only a renderer knows
 * where a path actually lands), takes the ones named in animal-art.config.json, and emits each as a
 * tight viewBox plus its markup.
 *
 * It is a hand-run step, not part of the build: the output is committed, so a normal build and CI
 * need neither a browser nor the source sheets.
 *
 *   npm run animal-art -- --index    print every group with its number, as a PNG contact sheet
 *   npm run animal-art               write src/components/zooGame/art/animalArt.generated.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';
import { topLevelGroups, measureGroups, slim, viewBoxOf, contactSheet, inlineStyles } from './lib/svg-sheet.mjs';
import { findIslands, cutIslands, regionsOf } from './lib/svg-clusters.mjs';

const CONFIG = 'scripts/animal-art.config.json';
const OUT = 'src/components/zooGame/art/animalArt.generated.ts';
const SHEET = 'art-src/zoo/contact-sheet.png';

const config = JSON.parse(readFileSync(CONFIG, 'utf8'));
const wantIndex = process.argv.includes('--index');
const browser = await chromium.launch();

const entries = [];
const credits = new Set();

for (const source of config.sources) {
  const svg = await inlineStyles(browser, readFileSync(resolve(source.file), 'utf8'));
  const groups = topLevelGroups(svg);

  const boxes = await measureGroups(browser, svg);

  if (boxes.length !== groups.length) {
    console.error(`${source.file}: ${groups.length} groups in the text, ${boxes.length} when rendered.`);
    process.exit(1);
  }

  if (wantIndex) {
    mkdirSync(dirname(SHEET), { recursive: true });
    await contactSheet(browser, groups, boxes, SHEET);
    console.log(`${source.file}: ${groups.length} groups -> ${SHEET}`);
    continue;
  }

  // Not every sheet keeps its grouping. Where it does not, the drawings are found as islands of
  // touching shapes instead - see scripts/lib/svg-clusters.mjs.
  const islands = Object.values(source.species).some((sp) => sp.island !== undefined)
    ? await findIslands(browser, svg, source.bridge ?? 0, source.ignoreLargerThan ?? 0.06)
    : [];
  // Where even islands weld drawings together - a sheet where every animal sits among the same
  // foliage - a species can name the patch of the sheet it occupies instead.
  const boxed = Object.entries(source.species).filter(([, sp]) => sp.box);
  const carved = boxed.length
    ? await regionsOf(browser, svg, boxed.map(([species, sp]) => ({ name: species, box: sp.box, inside: sp.inside })))
    : [];

  if (source.credit) credits.add(source.credit);
  // Every sheet is drawn to its own scale. `unitScale` says what one of this sheet's units is worth
  // in the units the rest of the zoo is measured in, so a flamingo off a second sheet stands the
  // right height beside a giraffe off the first.
  const unit = source.unitScale ?? 1;
  // A species can override the sheet's scale. Illustration sets draw a meerkat nearly as tall as a
  // lion so it is not a speck on the page; the park is not a page, and something has to give.
  const unitFor = (spec) => spec.unitScale ?? unit;
  const named = Object.entries(source.species);
  const picks = named.filter(([, sp]) => sp.island !== undefined || sp.box).map(([species, sp]) => {
    const c = sp.box ? carved.find((r) => r.name === species) : islands[sp.island];
    if (!c || !c.members.length) { console.error(`${species}: nothing found for it in ${source.file}`); process.exit(1); }
    return { name: species, members: c.members, drop: sp.drop ?? source.drop ?? [] };
  });
  const cuts = picks.length ? await cutIslands(browser, svg, picks) : [];

  for (const [species, spec] of named) {
    let box, body;
    if (spec.island !== undefined || spec.box) {
      const cut = cuts.find((x) => x.name === species);
      box = cut.box ?? (spec.box ? carved.find((r) => r.name === species) : islands[spec.island]);
      body = cut.body;
    } else {
      box = boxes[spec.group];
      body = groups[spec.group];
      if (!box) { console.error(`${species}: no group ${spec.group} in ${source.file}`); process.exit(1); }
    }
    entries.push({
      species,
      // The box is scaled; the viewBox is not. The drawing is stretched into whatever box it is
      // given, so scaling the box is all it takes to put a second sheet on the first one's scale.
      w: +(box.w * unitFor(spec)).toFixed(1), h: +(box.h * unitFor(spec)).toFixed(1),
      viewBox: viewBoxOf(box, 2),
      flip: !!spec.flip,
      body: slim(body),
    });
  }
}

await browser.close();
if (wantIndex) process.exit(0);

entries.sort((a, b) => a.species.localeCompare(b.species));
const body = entries.map((e) => `  ${/^[a-z][a-zA-Z0-9]*$/.test(e.species) ? e.species : JSON.stringify(e.species)}: {
    viewBox: '${e.viewBox}',
    w: ${e.w}, h: ${e.h},${e.flip ? '\n    flip: true,' : ''}
    body: ${JSON.stringify(e.body)},
  },`).join('\n');

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `/* Generated by scripts/extract-animal-art.mjs - do not edit by hand.
 *
 * Artwork: ${[...credits].join(', ')}, used under licence. Re-run \`npm run animal-art\` after
 * changing scripts/animal-art.config.json or the sheets in art-src/.
 *
 * \`w\`/\`h\` are in the source sheet's own units, and every sheet is drawn to one scale - so a
 * giraffe is genuinely taller than a fox, and the park gets its sizes for free.
 */

export type AnimalArt = {
  /** The drawing's own box in the sheet, cropped tight. */
  viewBox: string;
  /** Size in sheet units. Comparable across every species from the same sheet. */
  w: number;
  h: number;
  /** Drawn facing left in the source, so mirror it: everything in the park faces right. */
  flip?: boolean;
  /** The SVG markup, with no wrapping <svg>. */
  body: string;
};

export const ANIMAL_ART: Record<string, AnimalArt> = {
${body}
};
`);

const bytes = Buffer.byteLength(readFileSync(OUT));
console.log(`${entries.length} animals -> ${OUT} (${(bytes / 1024).toFixed(0)} KB)`);
for (const e of entries) console.log(`  ${e.species.padEnd(10)} ${String(Math.round(e.w)).padStart(4)}×${String(Math.round(e.h)).padEnd(4)} ${(e.body.length / 1024).toFixed(1)} KB${e.flip ? '  flipped' : ''}`);
