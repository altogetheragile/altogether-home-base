/** Shared machinery for cutting individual drawings out of a licensed illustration sheet.
 *
 * A sheet is one SVG holding many drawings, each a top-level <g> with no id. Two things are hard
 * about taking them apart, and this handles both: only a renderer knows where a path actually
 * lands, so bounding boxes are measured in a real browser; and a group may carry its own transform,
 * so the box has to be brought back into the root's coordinates before it can be used as a viewBox.
 */

/** The top-level <g> elements, as source text. A regex cannot do this - the groups nest - so it
 *  walks the string counting depth. */
export function topLevelGroups(svg) {
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

/** Each top-level group's box in the ROOT's coordinates, so it can be used as a viewBox directly.
 *  `getBBox` alone is not enough: it reports a group's contents in the group's own space, which is
 *  the wrong answer the moment the group carries a transform. */
export async function measureGroups(browser, svg) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } });
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  const boxes = await page.evaluate(() => {
    const root = document.querySelector('svg');
    const inv = root.getScreenCTM().inverse();
    return [...root.children].filter((n) => n.tagName === 'g').map((g) => {
      const bb = g.getBBox(), m = inv.multiply(g.getScreenCTM());
      const at = (x, y) => { const p = root.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(m); };
      const cs = [at(bb.x, bb.y), at(bb.x + bb.width, bb.y), at(bb.x, bb.y + bb.height), at(bb.x + bb.width, bb.y + bb.height)];
      const xs = cs.map((c) => c.x), ys = cs.map((c) => c.y);
      const x = Math.min(...xs), y = Math.min(...ys);
      return { x: +x.toFixed(1), y: +y.toFixed(1), w: +(Math.max(...xs) - x).toFixed(1), h: +(Math.max(...ys) - y).toFixed(1),
               n: g.querySelectorAll('path,polygon,circle,ellipse,rect,line').length };
    });
  });
  await page.close();
  return boxes;
}

/** Illustrator writes `style="fill:#5B2A15;"` and coordinates to three decimals. Neither survives
 *  being shrunk to forty pixels wide, and together they are most of the file. */
export function slim(markup) {
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

/** A viewBox cropped tight to a box, with a little room so an edge stroke is not clipped. */
export const viewBoxOf = (b, pad = 1.5) =>
  `${+(b.x - pad).toFixed(1)} ${+(b.y - pad).toFixed(1)} ${+(b.w + pad * 2).toFixed(1)} ${+(b.h + pad * 2).toFixed(1)}`;

/** A numbered contact sheet of every group in a file, so the numbers in a config can be read off a
 *  picture instead of guessed. */
export async function contactSheet(browser, groups, boxes, path) {
  const cells = boxes.map((b, i) => {
    const k = Math.min(3.4, 116 / Math.max(b.w, b.h));
    return `<div style="width:130px;text-align:center;background:#fdfdfb;border-radius:6px;padding:6px 2px">
      <div style="height:120px;display:flex;align-items:center;justify-content:center">
        <svg viewBox="${viewBoxOf(b)}" width="${(b.w * k).toFixed(0)}" height="${(b.h * k).toFixed(0)}">${groups[i]}</svg></div>
      <div style="font:10px ui-monospace;color:#333">${i} · ${Math.round(b.w)}×${Math.round(b.h)} · ${b.n}</div></div>`;
  }).join('');
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
  await page.setContent(`<body style="margin:0;background:#8fbc6f;font-family:system-ui">
    <div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px">${cells}</div></body>`);
  await page.screenshot({ path, fullPage: true });
  await page.close();
}
