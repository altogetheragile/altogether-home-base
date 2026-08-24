#!/usr/bin/env node
/**
 * Cuts isometric vehicles out of a licensed EPS sheet and writes them as a TypeScript module the
 * car park can render.
 *
 * EPS comes through PostScript, which has no notion of a group, so the usual "one drawing per
 * top-level <g>" trick does not work here - see scripts/lib/svg-clusters.mjs for what replaces it.
 *
 * Hand-run, like the other art steps; the output is committed. Needs Ghostscript on PATH
 * (`brew install ghostscript`) and poppler's pdftocairo, to turn EPS into SVG first.
 *
 *   npm run vehicle-art -- --index    numbered contact sheet of every island on the sheet
 *   npm run vehicle-art               write src/components/zooGame/art/vehicleArt.generated.ts
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { chromium } from 'playwright';
import { slim, viewBoxOf } from './lib/svg-sheet.mjs';
import { findIslands, cutIslands, regionsOf } from './lib/svg-clusters.mjs';

const CONFIG = 'scripts/vehicle-art.config.json';
const OUT = 'src/components/zooGame/art/vehicleArt.generated.ts';
const SHEET = 'art-src/zoo/vehicle-contact-sheet.png';
const WORK = 'art-src/.work';

/** EPS -> PDF -> SVG. Cached, because Ghostscript on a 2 MB sheet is not quick. */
function toSvg(epsPath) {
  mkdirSync(WORK, { recursive: true });
  const stem = join(WORK, epsPath.replace(/[^\w]/g, '_'));
  if (!existsSync(`${stem}.svg`)) {
    try {
      execFileSync('gs', ['-q', '-dNOPAUSE', '-dBATCH', '-dEPSCrop', '-sDEVICE=pdfwrite', `-sOutputFile=${stem}.pdf`, resolve(epsPath)]);
      execFileSync('pdftocairo', ['-svg', `${stem}.pdf`, `${stem}.svg`]);
    } catch (e) {
      console.error(`Could not convert ${epsPath}. This step needs Ghostscript and pdftocairo:\n  brew install ghostscript poppler\n${e.message}`);
      process.exit(1);
    }
  }
  return readFileSync(`${stem}.svg`, 'utf8').replace(/^[\s\S]*?(?=<svg)/, '');
}

/** Swap every gradient for the flat colour halfway along it, and throw the gradients away.
 *
 *  A vehicle in the car park is a dozen pixels long. A hundred-stop gradient across it is invisible
 *  and is most of what the file weighs, so it buys nothing and costs everything. */
function flatten(html) {
  const mid = new Map();
  for (const g of html.matchAll(/<(linearGradient|radialGradient)[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g)) {
    // A stop's colour arrives as an attribute from some converters and as CSS from others, and a
    // gradient whose stops go unread gets deleted with everything still pointing at it.
    const stops = [...g[3].matchAll(/stop-color\s*[:=]\s*"?(rgb\([^)]*\)|#[0-9a-fA-F]{3,6})/g)].map((m) => m[1]);
    if (stops.length) mid.set(g[2], stops[Math.floor(stops.length / 2)]);
  }
  let out = html.replace(/<(linearGradient|radialGradient)[\s\S]*?<\/\1>/g, '');
  for (const [id, colour] of mid) out = out.split(`url(#${id})`).join(colour);
  // Anything still pointing at a gradient that had no stops would render as nothing at all.
  out = out.replace(/fill\s*[:=]\s*"?url\(#[^)]*\)"?/g, 'fill="rgb(60%,60%,60%)"');
  return out.replace(/<defs>\s*<\/defs>/g, '');
}

const config = JSON.parse(readFileSync(CONFIG, 'utf8'));
const wantIndex = process.argv.includes('--index');
const browser = await chromium.launch();

const entries = [];
const credits = new Set();

for (const source of config.sources) {
  const svg = /\.eps$/i.test(source.file) ? toSvg(source.file) : readFileSync(resolve(source.file), 'utf8');
  const islands = await findIslands(browser, svg, source.bridge ?? 1.5, source.ignoreLargerThan ?? 0.25);

  if (wantIndex) {
    const cells = islands.map((c, i) => {
      const k = Math.min(3, 150 / Math.max(c.w, c.h));
      return `<div style="width:172px;text-align:center;background:#fff;border-radius:6px;padding:5px 2px">
        <div class="slot" data-i="${i}" style="height:154px;display:flex;align-items:center;justify-content:center"></div>
        <div style="font:10px ui-monospace">${i} · ${Math.round(c.w)}×${Math.round(c.h)} · ${c.n}</div></div>`;
    }).join('');
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
    await page.setContent(`<body style="margin:0;background:#8fbc6f;font-family:system-ui">
      <div id="src" style="display:none">${svg}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px">${cells}</div></body>`);
    await page.evaluate((cs) => {
      const src = document.querySelector('#src svg');
      const leafSel = 'path,polygon,circle,ellipse,rect,line,image';
      for (const slot of document.querySelectorAll('.slot')) {
        const c = cs[+slot.dataset.i];
        const clone = src.cloneNode(true);
        const keep = new Set(c.members);
        [...clone.querySelectorAll(leafSel)].forEach((el, i) => { if (!keep.has(i) && !el.closest('defs,clipPath,mask,pattern')) el.remove(); });
        clone.setAttribute('viewBox', `${c.x - 2} ${c.y - 2} ${c.w + 4} ${c.h + 4}`);
        const k = Math.min(3, 150 / Math.max(c.w, c.h));
        clone.setAttribute('width', (c.w * k).toFixed(0));
        clone.setAttribute('height', (c.h * k).toFixed(0));
        slot.appendChild(clone);
      }
    }, islands);
    await page.waitForTimeout(600);
    mkdirSync(dirname(SHEET), { recursive: true });
    await page.screenshot({ path: SHEET, fullPage: true });
    await page.close();
    console.log(`${source.file}: ${islands.length} islands -> ${SHEET}`);
    continue;
  }

  if (source.credit) credits.add(source.credit);
  const named = Object.entries(source.vehicles);
  const regions = named.filter(([, s]) => s.box).map(([name, s]) => ({ name, box: s.box, inside: s.inside }));
  const carved = regions.length ? await regionsOf(browser, svg, regions) : [];
  const picks = named.map(([name, spec]) => {
    const c = spec.box ? carved.find((r) => r.name === name) : islands[spec.island];
    if (!c || !c.members.length) { console.error(`${name}: nothing found for it in ${source.file}`); process.exit(1); }
    return { name, members: c.members, box: c, spec };
  });
  const cut = await cutIslands(browser, svg, picks.map(({ name, members }) => ({ name, members })));
  cut.forEach((piece, i) => {
    const { box, spec, name } = picks[i];
    entries.push({ name, w: box.w, h: box.h, viewBox: viewBoxOf(box, 1), bus: !!spec.bus, body: slim(flatten(piece.body)) });
  });
}

await browser.close();
if (wantIndex) process.exit(0);

entries.sort((a, b) => a.name.localeCompare(b.name));
const body = entries.map((e) => `  ${e.name}: {
    viewBox: '${e.viewBox}',
    w: ${e.w}, h: ${e.h},${e.bus ? '\n    bus: true,' : ''}
    body: ${JSON.stringify(e.body)},
  },`).join('\n');

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `/* Generated by scripts/extract-vehicle-art.mjs - do not edit by hand.
 *
 * Artwork: ${[...credits].join(', ')}, used under licence. Re-run \`npm run vehicle-art\` after
 * changing scripts/vehicle-art.config.json or the sheets in art-src/.
 *
 * Every vehicle is drawn facing the same way on the same isometric grid, and carries its own
 * gradients and clip paths under renamed ids - so the same van can be parked twice.
 */

export type VehicleArt = {
  /** The drawing's own box on the sheet, cropped tight. */
  viewBox: string;
  /** Size in sheet units, comparable across every vehicle here. */
  w: number;
  h: number;
  /** A coach rather than a car: it needs a lay-by, not a bay. */
  bus?: boolean;
  /** The SVG markup, with no wrapping <svg>. */
  body: string;
};

export const VEHICLE_ART: Record<string, VehicleArt> = {
${body}
};
`);

console.log(`${entries.length} vehicles -> ${OUT} (${(Buffer.byteLength(readFileSync(OUT)) / 1024).toFixed(0)} KB)`);
for (const e of entries) console.log(`  ${e.name.padEnd(14)} ${String(Math.round(e.w)).padStart(4)}×${String(Math.round(e.h)).padEnd(4)} ${(e.body.length / 1024).toFixed(1)} KB${e.bus ? '  coach' : ''}`);
