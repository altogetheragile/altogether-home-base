#!/usr/bin/env node
// The board's reference pages and icons, lifted out of the design file and into the game.
//
// `docs/scrum-board/scrum-big-picture.html` is the design source: one file, no build step, and the
// place the layout and the icon drawing code are decided. What it is NOT, any more, is the source
// of truth for the WORDS. The game's teaching copy is editable from the live page - defaults in
// code, overrides in `zoo_copy` - and a trainer polishing a sentence at 9pm must not need a
// developer, nor a second copy of the Scrum Guide to keep in step.
//
// So the words come across once, mechanically, and live here afterwards. Hand-copying 28 pages of
// Guide-derived text would have been a tenth source of one truth in this codebase, and the park's
// own notes record nine.
//
//   node scripts/scrumBoard/import.mjs
//   node scripts/scrumBoard/import.mjs --check   (fails if the generated files are stale)

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const SRC = resolve(ROOT, 'docs/scrum-board');
const OUT = resolve(ROOT, 'src/components/zooGame/board');
const check = process.argv.includes('--check');

/** The knowledge pages, read out of the design file's own `P` array. */
function pages() {
  const html = readFileSync(resolve(SRC, 'scrum-big-picture.html'), 'utf8');
  const from = html.indexOf('const P=[');
  if (from < 0) throw new Error('the design file has no P array - has it been restructured?');
  const body = html.slice(from);
  const to = body.indexOf('\n];');
  if (to < 0) throw new Error('the P array does not end where expected');
  // Our own file, read at build time, never at runtime.
  // eslint-disable-next-line no-eval
  const read = eval(`(${body.slice('const P='.length, to + 2)})`);
  if (!Array.isArray(read) || !read.length) throw new Error('the P array came back empty');
  return read;
}

/** Every icon, as the markup inside its <svg> plus the box it is drawn in. */
function icons() {
  const dir = resolve(SRC, 'icons');
  return readdirSync(dir).filter((f) => f.endsWith('.svg')).sort().map((f) => {
    const svg = readFileSync(resolve(dir, f), 'utf8');
    const box = svg.match(/viewBox="([^"]+)"/)?.[1];
    const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
    if (!box) throw new Error(`${f} has no viewBox`);
    return { id: basename(f, '.svg'), box, inner: tokenised(inner) };
  });
}

/** The board's own drawing code, lifted whole.
 *
 *  Two hundred lines of hand-tuned coordinates. Re-deriving them in JSX would make a third drawing
 *  of this zoo's worth of geometry, and the park's notes already record nine occasions when two
 *  drawings of one thing disagreed. So it comes across verbatim and stays one implementation.
 *
 *  What does NOT come across verbatim is the text on it. INPUTS, OUTPUTS and DESC are the teaching
 *  voice - "Inspect the Product Backlog", "Improvements | from the last Retrospective" - so they
 *  are lifted out as data the copy editor can reach, and injected back in. Everything else on the
 *  board is a column name or a step title bound to the layout, which `copy.ts` has always kept in
 *  code for the same reason: an edit there breaks a screen rather than improving a sentence. */
function drawing() {
  const html = readFileSync(resolve(SRC, 'scrum-big-picture.html'), 'utf8');
  const from = html.indexOf('/* ---------- board drawing');
  const end = html.indexOf('const VBH=');
  if (from < 0 || end < 0) throw new Error('the drawing block is not where it was');
  let code = html.slice(from, html.indexOf('\n', end) + 1);

  // The three that carry words, pulled out so they can be edited, and read from the argument.
  const lifted = {};
  for (const name of ['INPUTS', 'OUTPUTS', 'DESC']) {
    const at = code.indexOf(`const ${name}=`);
    if (at < 0) throw new Error(`${name} is not in the drawing block`);
    const close = code.indexOf('];', at);
    const literal = code.slice(at + `const ${name}=`.length, close + 1);
    // eslint-disable-next-line no-eval
    lifted[name] = eval(`(${literal})`);
    code = code.slice(0, at) + `const ${name}=T.${name};` + code.slice(close + 2);
  }
  // The legend at the foot of the board names every icon properly - "Definition of Done", not
  // "Definition: of Done". Those names are what a hover should say.
  //
  // The chips carry a `|` where the text wraps onto a second line, and the drawing turns the FIRST
  // one into ": " as though it always separated a name from a qualifier. For "Product Backlog|Goal
  // + PBIs" it does. For "Definition|of Done" it does not, and the gem ended up labelled
  // "Definition" with "of Done" underneath it.
  // Keyed by the ICON, not by the page. Two different icons link to the Sprint Review page - the
  // event itself and "Changes in the Environment" - so a page id names one of them and loses the
  // other.
  const names = {};
  for (const m of code.matchAll(/\["([a-z]+)","[a-z-]+","([^"]+)",\d+\]/g)) names[m[1]] = m[2];
  if (Object.keys(names).length < 12) throw new Error('the legend rows are not where they were');

  // Each chip told what it is called, so the label on it does not depend on where its text wraps.
  for (const list of [lifted.INPUTS, lifted.OUTPUTS]) {
    for (const col of list) for (const chip of col) if (names[chip.k]) chip.name = names[chip.k];
  }

  // ...and the drawing asked to use it. The line it replaces made the first `|` into ": " as though
  // a wrap were always a name and a qualifier, which is how the Definition of Done gem came to
  // announce itself as "Definition", with "of Done" underneath.
  const was = 'it.t.replace("|",": ").replace(/\\|/g," ")';
  if (!code.includes(was)) throw new Error('the chip label is not built where it was');
  code = code.replace(was, 'chipLabel(it)');
  code = `const chipLabel=it=>{const whole=it.t.replace(/\\|/g," ");
  if(!it.name||!whole.startsWith(it.name))return whole;
  const sub=whole.slice(it.name.length).replace(/^[\\s,]+/,"");
  return sub?it.name+": "+sub:it.name};
${code}`;

  return { code: tokenised(code), lifted, names };
}

/** The brand palette, written as tokens rather than as hex.
 *
 *  `src/theme/brandColoursComeFromTokens.test.ts` bans the literals outside the token package, and
 *  its note says why: 41 files once hardcoded them, so a rebrand was a find-and-replace instead of
 *  a config change. Artwork generated from a design file is no exception - it is the kind of thing
 *  that would quietly put all eight of them back.
 *
 *  Only the eight the repo calls brand. The design file's other colours - the mid teal of the
 *  Developers, the plum of the events, the coral of the stakeholders - are the board's own language
 *  and are not in the app's palette, so they stay as they are drawn. */
const TOKEN = {
  '#004D4D': 'hsl(var(--aa-deep-teal-hsl))',
  '#007A7A': 'hsl(var(--aa-mid-teal-hsl))',
  '#FF9715': 'hsl(var(--aa-orange-hsl))',
  '#F0FAFA': 'hsl(var(--aa-sky-teal-hsl))',
  '#D9F2F2': 'hsl(var(--aa-pale-teal-hsl))',
  '#B2DFDF': 'hsl(var(--aa-light-teal-hsl))',
  '#006666': 'hsl(var(--aa-hero-teal-hsl))',
  '#E6870E': 'hsl(var(--aa-orange-hover-hsl))',
};
const tokenised = (text) => Object.entries(TOKEN).reduce(
  (out, [hex, token]) => out.replaceAll(hex, token).replaceAll(hex.toLowerCase(), token), text);

const banner = `// Generated by scripts/scrumBoard/import.mjs from docs/scrum-board. Do not edit by hand.
//
// The WORDS here are the shipped defaults only. They are editable in the game from the live page,
// through the copy editor, and an override lives in \`zoo_copy\` rather than in this file - so
// re-running the import never overwrites anybody's edit.
`;

const q = (s) => JSON.stringify(s);

function writePages(P) {
  const body = P.map((p) => `  {
    id: ${q(p.id)},
    kind: ${q(p.kind ?? '')},
    title: ${q(p.title)},
    lede: ${q(p.lede ?? '')},
    facts: [${(p.facts ?? []).map(([a, b]) => `[${q(a)}, ${q(b)}]`).join(', ')}],
    secs: [
${(p.secs ?? []).map(([h, b]) => `      [${q(h)},\n        ${q(b)}],`).join('\n')}
    ],
    rel: [${(p.rel ?? []).map(q).join(', ')}],
  },`).join('\n');
  return `${banner}
/** One reference page behind an icon on the board. */
export interface BoardPage {
  /** Stable id. It is the anchor the cross-links in \`secs\` point at, and the copy key's stem. */
  id: string;
  /** Foundation, Event, Accountability, Artifact, Commitment - the band it belongs to. */
  kind: string;
  title: string;
  /** The one-sentence answer, before any detail. */
  lede: string;
  /** Short label-and-value pairs, shown as a strip. */
  facts: [string, string][];
  /** Heading and body. The body is HTML and is sanitised on render, because it is editable. */
  secs: [string, string][];
  /** Other pages worth reading next. */
  rel: string[];
}

export const BOARD_PAGES: BoardPage[] = [
${body}
];

export const pageById = (id: string): BoardPage | undefined => BOARD_PAGES.find((p) => p.id === id);
`;
}

function writeIcons(list) {
  return `${banner}
/** An icon from the board, as the markup inside its <svg> and the box it is drawn in. */
export interface BoardIcon { box: string; inner: string }

export const BOARD_ICONS: Record<string, BoardIcon> = {
${list.map((i) => `  ${q(i.id)}: { box: ${q(i.box)}, inner: ${q(i.inner)} },`).join('\n')}
};

export type BoardIconName = keyof typeof BOARD_ICONS;
`;
}

function writeDrawing(code) {
  return `/* eslint-disable */
// @ts-nocheck
${banner}
// The board, drawn. \`T\` carries the text that is editable; everything else is geometry.
export function drawBoard(T) {
${code}
  return { svg: s, height: VBH };
}
`;
}

function writeLabels(lifted, names) {
  return `${banner}
/** One chip on the board: an icon with its name, or a dashed note. */
export interface BoardChip {
  /** The text drawn on it. A \`|\` is where the line wraps, not a separator. */
  t: string;
  /** Which icon it is. */
  k: string;
  /** The page it opens. */
  id: string;
  /** What it is called, from the board's legend - what a hover says, and the part of \`t\` that is
   *  the name rather than the qualifier after it. */
  name?: string;
}

/** What each event inspects, laid out per column. */
export const BOARD_INPUTS: BoardChip[][] = ${JSON.stringify(lifted.INPUTS, null, 2)};

/** What each event adapts or creates. */
export const BOARD_OUTPUTS: BoardChip[][] = ${JSON.stringify(lifted.OUTPUTS, null, 2)};

/** The two lines under each event: what it inspects, and what it adapts. */
export const BOARD_DESC: [string, string][] = ${JSON.stringify(lifted.DESC, null, 2)};

/** What each shape is called, taken from the board's own legend.
 *
 *  A hover says this, rather than the shape's \`aria-label\`: a chip's label puts a colon where its
 *  text happens to wrap, so the Definition of Done gem announced itself as "Definition" with "of
 *  Done" underneath. */
export const BOARD_NAMES: Record<string, string> = ${JSON.stringify(names, null, 2)};
`;
}

const P = pages();
const I = icons();
const D = drawing();
const want = [
  [resolve(OUT, 'boardPages.ts'), writePages(P)],
  [resolve(OUT, 'boardIcons.ts'), writeIcons(I)],
  [resolve(OUT, 'boardLabels.ts'), writeLabels(D.lifted, D.names)],
  [resolve(OUT, 'boardDrawing.generated.js'), writeDrawing(D.code)],
  // The drawing is lifted JavaScript and stays that way - it is not ours to re-type, and every
  // annotation added to it would have to be re-added on the next import. The boundary is typed
  // instead, which is the only part the app touches.
  [resolve(OUT, 'boardDrawing.generated.d.ts'), `${banner}
import type { BoardChip } from './boardLabels';

export declare function drawBoard(text: {
  INPUTS: BoardChip[][];
  OUTPUTS: BoardChip[][];
  DESC: [string, string][];
}): { svg: string; height: number };
`],
];

let stale = 0;
for (const [path, text] of want) {
  let now = null;
  try { now = readFileSync(path, 'utf8'); } catch { /* not written yet */ }
  if (now === text) continue;
  stale += 1;
  if (check) { console.error(`stale: ${path.replace(`${ROOT}/`, '')}`); continue; }
  writeFileSync(path, text);
  console.log(`wrote ${path.replace(`${ROOT}/`, '')}`);
}

if (check && stale) {
  console.error(`\n${stale} generated file(s) do not match docs/scrum-board.\nRun: node scripts/scrumBoard/import.mjs`);
  process.exit(1);
}
console.log(`${P.length} pages, ${I.length} icons, ${D.lifted.INPUTS.length + D.lifted.OUTPUTS.length} label groups${check ? ' - in step' : ''}`);
