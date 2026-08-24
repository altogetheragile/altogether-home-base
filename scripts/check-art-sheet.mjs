#!/usr/bin/env node
/**
 * Will this illustration sheet actually work in the zoo?
 *
 *   npm run art-check -- path/to/sheet.eps        (or .svg)
 *
 * Three sheets in, three different problems: one came apart neatly by group, one had no groups left
 * at all, and one was the right subject in the wrong treatment entirely. None of that is visible
 * from a thumbnail on a stock site, and all of it decides whether a pack is an afternoon's work or
 * a dead end. This answers it in one run, before anyone commits to a file.
 *
 * It reports, and writes a contact sheet of whatever it managed to separate.
 */
import { readFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, join } from 'node:path';
import { chromium } from 'playwright';
import { topLevelGroups, measureGroups, contactSheet } from './lib/svg-sheet.mjs';
import { findIslands } from './lib/svg-clusters.mjs';

const WORK = 'art-src/.work';
const file = process.argv[2];
if (!file || !existsSync(file)) {
  console.error('Usage: npm run art-check -- path/to/sheet.eps\n');
  process.exit(1);
}

/** EPS has to go through PostScript to become something a browser can read. */
function loadSvg(path) {
  if (!/\.eps$/i.test(path)) return readFileSync(path, 'utf8').replace(/^[\s\S]*?(?=<svg)/, '');
  mkdirSync(WORK, { recursive: true });
  const stem = join(WORK, basename(path).replace(/[^\w]/g, '_'));
  if (!existsSync(`${stem}.svg`)) {
    try {
      execFileSync('gs', ['-q', '-dNOPAUSE', '-dBATCH', '-dEPSCrop', '-sDEVICE=pdfwrite', `-sOutputFile=${stem}.pdf`, path]);
      execFileSync('pdftocairo', ['-svg', `${stem}.pdf`, `${stem}.svg`]);
    } catch (e) {
      console.error(`Could not convert ${path}. EPS needs Ghostscript and poppler:\n  brew install ghostscript poppler\n${e.message}`);
      process.exit(1);
    }
  }
  return readFileSync(`${stem}.svg`, 'utf8').replace(/^[\s\S]*?(?=<svg)/, '');
}

/** A description of the palette, NOT a verdict on it.
 *
 *  The obvious test - "a duotone sits in one wedge of the colour wheel" - fails on the very sheet
 *  it was written to approve: a page of animals is honestly almost all browns, and counting hue
 *  families calls it a duotone. Style is not decidable from a histogram, so this reports what it
 *  found and the overview PNG is left to answer the question a person can answer in a glance. */
function hueSpread(svg) {
  const seen = new Set();
  const buckets = new Set();
  let saturated = 0;
  const consider = (r, g, b) => {
    const key = `${Math.round(r * 50)},${Math.round(g * 50)},${Math.round(b * 50)}`;
    if (seen.has(key)) return;
    seen.add(key);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    const sat = max === min ? 0 : (max - min) / (l < 0.5 ? max + min : 2 - max - min);
    if (sat < 0.18 || l < 0.1 || l > 0.92) return;
    saturated++;
    let h;
    if (max === r) h = ((g - b) / (max - min) + 6) % 6;
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    buckets.add(Math.floor((h * 60) / 30));
  };
  for (const m of svg.matchAll(/rgb\(\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)%\s*\)/g)) {
    consider(+m[1] / 100, +m[2] / 100, +m[3] / 100);
  }
  for (const m of svg.matchAll(/#([0-9a-fA-F]{6})\b/g)) {
    const v = m[1];
    consider(parseInt(v.slice(0, 2), 16) / 255, parseInt(v.slice(2, 4), 16) / 255, parseInt(v.slice(4, 6), 16) / 255);
  }
  return { colours: seen.size, saturated, families: buckets.size };
}

const svg = loadSvg(file);
const browser = await chromium.launch();

const groups = topLevelGroups(svg);
const boxes = await measureGroups(browser, svg);
const drawable = boxes.filter((b) => b.w > 12 && b.h > 12 && b.n > 3);
// These two numbers decide what island 0 is. A config that clusters differently gets a different
// island 0, and the numbers read off this sheet then point at the wrong drawings - which is not
// something you notice until you look at what came out.
const BRIDGE = 0, IGNORE_LARGER_THAN = 0.06;
const islands = await findIslands(browser, svg, BRIDGE, IGNORE_LARGER_THAN);
const bigIslands = islands.filter((c) => c.w > 25 && c.h > 18);

const kb = statSync(file).size / 1024;
const hues = hueSpread(svg);
const uses = (svg.match(/<use\b/g) ?? []).length;
const clips = (svg.match(/<clipPath\b/g) ?? []).length;
const rasters = (svg.match(/<image\b/g) ?? []).length;
const grads = (svg.match(/<(linear|radial)Gradient\b/g) ?? []).length;
const shapes = (svg.match(/<(path|polygon|circle|ellipse|rect)\b/g) ?? []).length;

// How the drawings would be separated, and how well.
const byGroup = drawable.length >= 4 && drawable.length >= groups.length * 0.3;
const byIsland = bigIslands.length >= 4;
const separable = Math.max(byGroup ? drawable.length : 0, byIsland ? bigIslands.length : 0);

console.log(`\n${basename(file)}  ${kb.toFixed(0)} KB, ${shapes} shapes\n`);
const line = (ok, label, detail) => console.log(`  ${ok === null ? '·' : ok ? '✓' : '✗'} ${label.padEnd(24)} ${detail}`);

// Few islands on a busy sheet almost always means a connecting device - flowchart lines, a
// headline behind the artwork - welding drawings together, and that is what regions are for.
const weldedTogether = !byGroup && shapes > 400 && bigIslands.length < 8;
line(separable >= 4, 'Comes apart',
  byGroup ? `${drawable.length} drawings, one per group - the easy case`
    : `no usable groups; ${bigIslands.length} found as islands of touching shapes`
      + (weldedTogether ? `\n      ^ few islands on a busy sheet: something is probably touching everything.\n        Name each drawing's region instead - see docs/ZOO_ISO_VIEW.md` : ''));
line(null, 'Palette',
  `${hues.colours} colours, ${hues.saturated} of them saturated, across ${hues.families} hue families`
  + (hues.families < 3 ? '\n      ^ narrow. Fine for a page of animals; a warning sign on a page of scenery.' : ''));
line(rasters === 0, 'Vector throughout', rasters ? `${rasters} embedded bitmaps - these will not scale` : 'no embedded bitmaps');
line(uses === 0 && clips === 0, 'Self-contained shapes',
  uses || clips ? `${uses} <use>, ${clips} clipPath - ids get renamed on extraction` : 'no shared ids to untangle');
line(null, 'Gradients', grads ? `${grads} - flattened on extraction; harmless` : 'none');
line(separable && !weldedTogether ? kb / separable < 120 : null, 'Weight per drawing',
  !separable ? 'unknown'
    : weldedTogether ? 'not meaningful until the drawings are separated'
      : `about ${(kb / separable).toFixed(0)} KB each before trimming`);

const verdict = rasters > 0
  ? 'NO - part of this is bitmap, and a bitmap does not survive being shrunk to park size.'
  : separable >= 4
    ? 'CAN BE USED - it comes apart. Now look at the overview and judge the style: it has to sit\n    beside flat-colour artwork with no outlines and no texture.'
    : 'HAND WORK - nothing separates on its own. Usable by naming each drawing\'s region by hand.';
console.log(`\n  ${verdict}\n`);

const stem = join(WORK, basename(file).replace(/\W/g, '_'));
const out = `${stem}-check.png`;
mkdirSync(WORK, { recursive: true });
{
  // The whole sheet as it stands. Whether a treatment fits is a question for eyes, not a script.
  const page = await browser.newPage({ viewport: { width: 1200, height: 860 }, deviceScaleFactor: 2 });
  await page.setContent(`<body style="margin:0;background:#8fbc6f;padding:12px">
    <div style="width:1170px">${svg.replace('<svg', '<svg width="1170"')}</div></body>`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${stem}-overview.png`, fullPage: true });
  await page.close();
}
if (byGroup) {
  await contactSheet(browser, groups, boxes, out);
} else {
  const cells = islands.slice(0, 60).map((c, i) => {
    const k = Math.min(3, 130 / Math.max(c.w, c.h));
    return `<div style="width:150px;text-align:center;background:#fff;border-radius:6px;padding:5px 2px">
      <div class="slot" data-i="${i}" style="height:134px;display:flex;align-items:center;justify-content:center"></div>
      <div style="font:10px ui-monospace">${i} · ${Math.round(c.w)}×${Math.round(c.h)}</div></div>`;
  }).join('');
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 }, deviceScaleFactor: 2 });
  await page.setContent(`<body style="margin:0;background:#8fbc6f;font-family:system-ui">
    <div id="src" style="display:none">${svg}</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px">${cells}</div></body>`);
  await page.evaluate((cs) => {
    const src = document.querySelector('#src svg');
    for (const slot of document.querySelectorAll('.slot')) {
      const c = cs[+slot.dataset.i];
      const clone = src.cloneNode(true);
      const keep = new Set(c.members);
      [...clone.querySelectorAll('path,polygon,circle,ellipse,rect,line,image')]
        .forEach((el, i) => { if (!keep.has(i) && !el.closest('defs,clipPath,mask,pattern')) el.remove(); });
      clone.setAttribute('viewBox', `${c.x - 2} ${c.y - 2} ${c.w + 4} ${c.h + 4}`);
      const k = Math.min(3, 130 / Math.max(c.w, c.h));
      clone.setAttribute('width', (c.w * k).toFixed(0));
      clone.setAttribute('height', (c.h * k).toFixed(0));
      slot.appendChild(clone);
    }
  }, islands.slice(0, 60));
  await page.waitForTimeout(600);
  await page.screenshot({ path: out, fullPage: true });
  await page.close();
}
await browser.close();
if (!byGroup) {
  console.log(`  Island numbers are relative to bridge=${BRIDGE}, ignoreLargerThan=${IGNORE_LARGER_THAN}.`);
  console.log('  Use the same values in the config, or island 0 will be a different drawing.\n');
}
console.log(`  Overview:      ${stem}-overview.png`);
console.log(`  Contact sheet: ${out}\n`);
