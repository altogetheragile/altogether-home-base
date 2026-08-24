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

const CONFIG = 'scripts/animal-art.config.json';
const OUT = 'src/components/zooGame/art/animalArt.generated.ts';
const SHEET = 'art-src/zoo/contact-sheet.png';
const PAD = 2; // user units of breathing room, so a stroke on the edge is not clipped

/** The top-level <g> elements, as source text. A regex cannot do this - the groups nest - so it
 *  walks the string counting depth. */
function topLevelGroups(svg) {
  const inner = svg.slice(svg.indexOf('>', svg.indexOf('<svg')) + 1, svg.lastIndexOf('</svg>'));
  const out = [];
  let i = 0;
  for (;;) {
    const start = inner.indexOf('<g', i);
    if (start < 0) return out;
    let depth = 0, j = start;
    while (j < inner.length) {
      if (inner.startsWith('<g', j)) { depth++; j = inner.indexOf('>', j) + 1; continue; }
      if (inner.startsWith('</g>', j)) { depth--; j += 4; if (!depth) break; continue; }
      j++;
    }
    out.push(inner.slice(start, j));
    i = j;
  }
}

/** Illustrator writes `style="fill:#5B2A15;"` and coordinates to three decimals. Neither survives
 *  being shrunk to 40 pixels wide, and together they are most of the file. A presentation
 *  attribute is shorter than a style block and a tenth of a user unit is a third of a pixel. */
function slim(markup) {
  return markup
    .replace(/\s*style="fill:(#[0-9A-Fa-f]{3,6});?"/g, ' fill="$1"')
    .replace(/\s*style="([^"]*)"/g, (m, css) => {
      const decls = css.split(';').map((d) => d.trim()).filter(Boolean)
        .map((d) => { const [k, v] = d.split(':'); return `${k.trim()}="${v.trim()}"`; });
      return decls.length ? ` ${decls.join(' ')}` : '';
    })
    .replace(/(-?\d+\.\d{2,})/g, (n) => String(Math.round(Number(n) * 10) / 10))
    .replace(/\s+/g, ' ')
    .trim();
}

const config = JSON.parse(readFileSync(CONFIG, 'utf8'));
const wantIndex = process.argv.includes('--index');
const browser = await chromium.launch();

const entries = [];
const credits = new Set();

for (const source of config.sources) {
  const svg = readFileSync(resolve(source.file), 'utf8');
  const groups = topLevelGroups(svg);

  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  const boxes = await page.evaluate(() =>
    [...document.querySelector('svg').children]
      .filter((n) => n.tagName === 'g')
      .map((g) => { const b = g.getBBox(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; }));
  await page.close();

  if (boxes.length !== groups.length) {
    console.error(`${source.file}: found ${groups.length} groups in the text but ${boxes.length} when rendered.`);
    process.exit(1);
  }

  if (wantIndex) {
    const cells = boxes.map((b, i) => {
      const vb = `${b.x - PAD} ${b.y - PAD} ${b.w + PAD * 2} ${b.h + PAD * 2}`;
      return `<div style="width:150px;text-align:center">
        <div style="height:96px;display:flex;align-items:flex-end;justify-content:center">
          <svg viewBox="${vb}" height="${Math.min(96, (96 * b.w) / b.h > 140 ? (140 * b.h) / b.w : 96)}">${groups[i]}</svg></div>
        <div style="font:12px ui-monospace">${i} · ${Math.round(b.w)}×${Math.round(b.h)}</div></div>`;
    }).join('');
    const p = await browser.newPage({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 2 });
    await p.setContent(`<body style="margin:0;background:#8fbc6f;font-family:system-ui">
      <div style="display:flex;flex-wrap:wrap;gap:10px;padding:14px">${cells}</div></body>`);
    mkdirSync(dirname(SHEET), { recursive: true });
    await p.screenshot({ path: SHEET, fullPage: true });
    await p.close();
    console.log(`${source.file}: ${groups.length} groups -> ${SHEET}`);
    continue;
  }

  if (source.credit) credits.add(source.credit);
  for (const [species, spec] of Object.entries(source.species)) {
    const b = boxes[spec.group];
    if (!b) { console.error(`${species}: no group ${spec.group} in ${source.file}`); process.exit(1); }
    entries.push({
      species,
      w: b.w, h: b.h,
      viewBox: `${+(b.x - PAD).toFixed(1)} ${+(b.y - PAD).toFixed(1)} ${+(b.w + PAD * 2).toFixed(1)} ${+(b.h + PAD * 2).toFixed(1)}`,
      flip: !!spec.flip,
      body: slim(groups[spec.group]),
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
