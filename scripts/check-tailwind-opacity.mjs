#!/usr/bin/env node
/**
 * Every `bg-foo/NN` in the source must exist in the built stylesheet.
 *
 * Tailwind's opacity modifier only accepts values on its scale. `bg-background/98` is not one of
 * them, so Tailwind generates nothing for it - and nothing is exactly what you get: an element with
 * no background at all, which in a modal over a busy board reads as "semi-transparent" rather than
 * as broken. It survived code review, typechecking, the linter and 400 tests, because none of them
 * look at the compiled CSS. This does.
 *
 * It compares what the source asks for against what the build produced. A class in the source and
 * missing from the output is either a typo or an invalid value; either way nothing will render it.
 *
 * Run after `vite build`, against dist/.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const SRC = 'src';
const DIST = 'dist/assets';

/** Utilities where `/NN` means opacity. Deliberately not `w-1/2` and friends, where it means a
 *  fraction and Tailwind has its own list. */
const COLOUR_UTILITIES = [
  'bg', 'text', 'border', 'ring', 'ring-offset', 'from', 'via', 'to', 'fill', 'stroke',
  'shadow', 'placeholder', 'divide', 'outline', 'decoration', 'accent', 'caret',
];
const PATTERN = new RegExp(String.raw`\b(?:${COLOUR_UTILITIES.join('|')})-[a-z0-9-]+\/(?:\[[^\]\s]+\]|\d{1,3})\b`, 'g');

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

/** Comments talk ABOUT classes - including the broken one this script exists to catch. */
const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/** How a class name appears in CSS: the slash, brackets and dots are escaped. */
const asSelector = (cls) => cls.replace(/[/[\]().%,#]/g, (ch) => `\\${ch}`);

const sources = walk(SRC).filter((f) => ['.ts', '.tsx', '.js', '.jsx'].includes(extname(f)));
const css = readdirSync(DIST).filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(DIST, f), 'utf8')).join('\n');
if (!css) {
  console.error('No built CSS found in dist/assets - run the build first.');
  process.exit(1);
}

const missing = new Map();
for (const file of sources) {
  const code = stripComments(readFileSync(file, 'utf8'));
  for (const cls of code.match(PATTERN) ?? []) {
    if (css.includes(asSelector(cls))) continue;
    if (!missing.has(cls)) missing.set(cls, new Set());
    missing.get(cls).add(file);
  }
}

if (!missing.size) {
  console.log('Tailwind opacity classes: all present in the built CSS.');
  process.exit(0);
}

console.error('\nThese classes are in the source and NOT in the built CSS, so they render nothing:\n');
for (const [cls, files] of [...missing].sort()) {
  console.error(`  ${cls}`);
  for (const f of files) console.error(`      ${f}`);
}
console.error('\nThe opacity modifier only takes values on Tailwind\'s scale (…/90, /95, /100), or an');
console.error('arbitrary one in brackets: bg-background/[0.98]. Anything else compiles to nothing.\n');
process.exit(1);
