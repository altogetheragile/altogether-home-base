/** Cutting drawings out of a sheet that has no groups left.
 *
 * Some sheets arrive as EPS. Converting one to SVG goes through PostScript, which is a page
 * description rather than a scene graph, so Illustrator's grouping does not survive: what comes out
 * the far end is a few thousand paths in a heap, sorted by nothing.
 *
 * The drawings are still separate on the page, though - a van does not overlap the bus parked next
 * to it. So instead of asking which group a shape belongs to, this asks which shapes touch, and
 * takes each island of touching shapes as one drawing. Then it prunes: every gradient and clip path
 * the island does not use is dropped, and the ids it does use are renamed, so two copies of the same
 * van on one page cannot end up sharing a clip path.
 */

/** Every drawable leaf's box in root coordinates, and which island it belongs to.
 *
 *  `bridge` is how close two boxes have to be to count as touching, in root units. Too small and a
 *  car comes apart into a body and four wheels; too large and the whole sheet is one blob. */
async function islandsOf(page, bridge, ignoreLargerThan) {
  return page.evaluate(({ gap, ignoreLargerThan }) => {
    const root = document.querySelector('svg');
    const inv = root.getScreenCTM().inverse();
    const vb = (root.getAttribute('viewBox') || '0 0 1 1').split(/\s+/).map(Number);
    const pageArea = Math.max(1, vb[2] * vb[3]);
    const leaves = [...root.querySelectorAll('path,polygon,circle,ellipse,rect,line,image')];
    const boxes = leaves.map((el) => {
      let bb;
      try { bb = el.getBBox(); } catch { return null; }
      if (!bb.width && !bb.height) return null;
      // A backdrop, a grid or a drop shadow spanning the sheet touches everything on it, and would
      // weld the whole page into one island. Anything that big is scenery, not a drawing.
      if (bb.width * bb.height > pageArea * ignoreLargerThan) return null;
      const m = inv.multiply(el.getScreenCTM());
      const at = (x, y) => { const p = root.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(m); };
      const cs = [at(bb.x, bb.y), at(bb.x + bb.width, bb.y), at(bb.x, bb.y + bb.height), at(bb.x + bb.width, bb.y + bb.height)];
      const xs = cs.map((c) => c.x), ys = cs.map((c) => c.y);
      return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
    });

    // Union-find over boxes that touch. Sorting by left edge first means the sweep only has to look
    // at boxes that could still reach - a sheet has thousands of paths and the naive pairing is
    // slow enough to matter.
    const parent = boxes.map((_, i) => i);
    const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
    const join = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[rb] = ra; };
    const order = boxes.map((b, i) => (b ? i : -1)).filter((i) => i >= 0).sort((a, b) => boxes[a].x0 - boxes[b].x0);
    for (let i = 0; i < order.length; i++) {
      const a = boxes[order[i]];
      for (let j = i + 1; j < order.length; j++) {
        const b = boxes[order[j]];
        if (b.x0 > a.x1 + gap) break;
        if (b.y0 <= a.y1 + gap && a.y0 <= b.y1 + gap) join(order[i], order[j]);
      }
    }

    const byRoot = new Map();
    boxes.forEach((b, i) => {
      if (!b) return;
      const r = find(i);
      const got = byRoot.get(r);
      if (!got) byRoot.set(r, { members: [i], x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 });
      else { got.members.push(i); got.x0 = Math.min(got.x0, b.x0); got.y0 = Math.min(got.y0, b.y0); got.x1 = Math.max(got.x1, b.x1); got.y1 = Math.max(got.y1, b.y1); }
    });
    return [...byRoot.values()]
      .map((c) => ({ members: c.members, x: +c.x0.toFixed(1), y: +c.y0.toFixed(1), w: +(c.x1 - c.x0).toFixed(1), h: +(c.y1 - c.y0).toFixed(1), n: c.members.length }))
      .sort((a, b) => b.w * b.h - a.w * a.h);
  }, { gap: bridge, ignoreLargerThan });
}

/** The islands on a sheet, largest first, each with its box and how many shapes are in it. */
export async function findIslands(browser, svg, bridge = 1.5, ignoreLargerThan = 0.25) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1600 } });
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  const islands = await islandsOf(page, bridge, ignoreLargerThan);
  await page.close();
  return islands;
}

/** One island as standalone markup: the shapes it is made of, the ancestors that position them,
 *  and only the gradients and clip paths it actually uses - with every id renamed so two copies of
 *  the drawing on one page cannot collide. */
export async function cutIslands(browser, svg, picks) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1600 } });
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  const out = await page.evaluate(({ picks }) => {
    const root = document.querySelector('svg');
    const leafSel = 'path,polygon,circle,ellipse,rect,line,image';
    const inv = root.getScreenCTM().inverse();
    const originals = [...root.querySelectorAll(leafSel)];
    /** A shape's box in the root's coordinates. */
    const boxOf = (el) => {
      let bb; try { bb = el.getBBox(); } catch { return null; }
      const m = inv.multiply(el.getScreenCTM());
      const at = (x, y) => { const p = root.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(m); };
      const cs = [at(bb.x, bb.y), at(bb.x + bb.width, bb.y), at(bb.x, bb.y + bb.height), at(bb.x + bb.width, bb.y + bb.height)];
      const xs = cs.map((c) => c.x), ys = cs.map((c) => c.y);
      return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
    };

    /** Does this shape's fill match one of the colours to throw away?
     *
     *  Read from what the browser computes, not from the attribute: a fill written inside a style
     *  attribute never matches a hex compared as a string, and quietly keeps the thing you meant to
     *  drop - usually the sheet's own backdrop or the shadow puddle under each drawing. */
     const matchesDrop = (el, drop) => {
      if (!drop || !drop.length) return false;
      const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(getComputedStyle(el).fill || '');
      if (!m) return false;
      const got = [+m[1], +m[2], +m[3]];
      return drop.some((hex) => {
        const want = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
        return want.every((v, i) => Math.abs(v - got[i]) <= 14);
      });
    };

    return picks.map(({ name, members, drop }) => {
      const keep = new Set(members);
      const clone = root.cloneNode(true);
      // Same document order in the clone as in the original, so indices still line up.
      const leaves = [...clone.querySelectorAll(leafSel)];
      // The box of what SURVIVES, not of the island it came from. Dropping a shadow puddle and
      // then sizing the drawing to a box that still allows for it leaves the animal squashed.
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      leaves.forEach((el, i) => {
        if (el.closest('defs,clipPath,mask,pattern')) return;
        if (!keep.has(i) || matchesDrop(originals[i], drop)) { el.remove(); return; }
        const b = boxOf(originals[i]);
        if (!b) return;
        x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0);
        x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1);
      });
      const box = Number.isFinite(x0)
        ? { x: +x0.toFixed(1), y: +y0.toFixed(1), w: +(x1 - x0).toFixed(1), h: +(y1 - y0).toFixed(1) }
        : null;

      // Groups with nothing drawable left in them are just wrappers around air.
      let pruned = true;
      while (pruned) {
        pruned = false;
        for (const g of [...clone.querySelectorAll('g')]) {
          if (g.closest('defs,clipPath,mask,pattern')) continue;
          if (!g.querySelector(leafSel)) { g.remove(); pruned = true; }
        }
      }

      // Which ids does what is left actually point at? Follow references from definitions too - a
      // clip path can reference a gradient - until nothing new turns up.
      const refsIn = (el) => {
        const found = new Set();
        const attrs = ['clip-path', 'mask', 'fill', 'stroke', 'filter', 'href', 'xlink:href'];
        for (const node of [el, ...el.querySelectorAll('*')]) {
          for (const a of attrs) {
            const v = node.getAttribute?.(a);
            if (!v) continue;
            const m = v.match(/url\(#([^)]+)\)/) || v.match(/^#(.+)$/);
            if (m) found.add(m[1]);
          }
        }
        return found;
      };
      const used = new Set(refsIn(clone));
      for (let pass = 0; pass < 8; pass++) {
        const before = used.size;
        for (const id of [...used]) {
          const def = clone.querySelector(`[id="${CSS.escape(id)}"]`);
          if (def) for (const r of refsIn(def)) used.add(r);
        }
        if (used.size === before) break;
      }
      // Only definitions get pruned. An earlier version removed anything with an unreferenced id,
      // which is fine until a sheet's exporter gives every path an id - and then it deletes the
      // drawing and leaves a correctly sized, entirely empty box.
      const DEFN = 'linearGradient,radialGradient,clipPath,mask,pattern,filter,symbol,marker';
      for (const def of [...clone.querySelectorAll(`${DEFN},defs [id]`)]) {
        if (def.id && !used.has(def.id)) def.remove();
      }
      for (const d of [...clone.querySelectorAll('defs')]) if (!d.children.length) d.remove();

      // Rename what is left, so the same drawing twice on a page keeps its own definitions.
      let html = clone.innerHTML;
      for (const id of used) {
        const safe = `${name}_${id}`.replace(/[^\w-]/g, '_');
        html = html.split(`id="${id}"`).join(`id="${safe}"`)
          .split(`url(#${id})`).join(`url(#${safe})`)
          .split(`href="#${id}"`).join(`href="#${safe}"`);
      }
      return { name, body: html, box };
    });
  }, { picks });
  await page.close();
  return out;
}

/** The shapes whose middles fall inside a named region, and the box they actually occupy.
 *
 *  Islands are the quick way, and they fail where a sheet has a device that deliberately touches
 *  everything - a flowchart's connecting lines, a headline set behind the artwork. Then the honest
 *  answer is to say where each drawing is. Selecting on a shape's midpoint rather than its box
 *  keeps a connector that merely reaches into the region from being dragged in with it. */
export async function regionsOf(browser, svg, regions) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1600 } });
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  const out = await page.evaluate((regs) => {
    const root = document.querySelector('svg');
    const inv = root.getScreenCTM().inverse();
    const leaves = [...root.querySelectorAll('path,polygon,circle,ellipse,rect,line,image')];
    const boxes = leaves.map((el) => {
      let bb;
      try { bb = el.getBBox(); } catch { return null; }
      if (!bb.width && !bb.height) return null;
      const m = inv.multiply(el.getScreenCTM());
      const at = (x, y) => { const p = root.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(m); };
      const cs = [at(bb.x, bb.y), at(bb.x + bb.width, bb.y), at(bb.x, bb.y + bb.height), at(bb.x + bb.width, bb.y + bb.height)];
      const xs = cs.map((c) => c.x), ys = cs.map((c) => c.y);
      return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
    });
    return regs.map(({ name, box: [rx, ry, rw, rh], inside = 0.86 }) => {
      const members = [];
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      boxes.forEach((b, i) => {
        if (!b) return;
        const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
        if (cx < rx || cx > rx + rw || cy < ry || cy > ry + rh) return;
        // A connector line reaching into the region can have its middle inside it and most of its
        // length outside. Anything mostly out of the region belongs to something else.
        const ow = Math.max(0, Math.min(b.x1, rx + rw) - Math.max(b.x0, rx));
        const oh = Math.max(0, Math.min(b.y1, ry + rh) - Math.max(b.y0, ry));
        const area = Math.max(1e-6, (b.x1 - b.x0) * (b.y1 - b.y0));
        if ((ow * oh) / area < inside) return;
        members.push(i);
        x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0);
        x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1);
      });
      return { name, members, n: members.length,
               x: +x0.toFixed(1), y: +y0.toFixed(1), w: +(x1 - x0).toFixed(1), h: +(y1 - y0).toFixed(1) };
    });
  }, regions);
  await page.close();
  return out;
}
