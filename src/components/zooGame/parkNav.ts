// ============= Getting around the park =============
//
// Visitors walk the park the way visitors do: along the made paths, and over the bridge to cross the
// water. This turns what is drawn on the park - the boundary walk, the perimeter path round each
// enclosure, the connectors the player laid in deploy mode, and any bridge - into a little network,
// and finds a way through it. Water (a river, a pond) is not walkable; a bridge is the hole in it.
//
// Two rules keep it feeling human rather than robotic:
//  - a guest takes the network when it is a sensible way to go (see DETOUR), and otherwise cuts
//    across the grass, because nobody walks three sides of a square to reach the next enclosure;
//  - but water always wins: if the direct line is wet, only a route over a crossing will do, however
//    far round it goes. No bridge, no visit - which is exactly the feedback the park should give.
//
// Everything here is pure geometry, so it is unit-testable and has no idea it is in a game.

export interface Pt { x: number; y: number; }
/** An area on the park. `rot` turns it (degrees clockwise) about its own centre, so a river running
 *  up and down or on the diagonal blocks the ground it actually covers, not its bounding box. */
export interface Rect { x0: number; y0: number; x1: number; y1: number; rot?: number; }
export interface NavInput {
  paths: Pt[][];    // walkable polylines: boundary, perimeters, connectors, bridges
  water: Rect[];    // impassable: rivers, ponds
  crossings: Rect[]; // bridges - the places water can be crossed
}
export interface Nav { nodes: Pt[]; adj: { to: number; w: number }[][]; input: NavInput; }

const SAMPLE = 18;   // how finely a path is chopped into nodes (design px)
const LINK = 24;     // two path nodes this close are treated as a junction
const GRASS = 48;    // ...and this close, people will step off one path onto the other over the grass
const GRASS_COST = 1.8; // but they would rather stay on the path, so that step counts for more
const HOPS = 6;      // how many network nodes a guest will consider joining/leaving at
const DETOUR = 1.6;  // take the path unless it is more than this much longer than walking straight

const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
/** Is this point inside the area? A turned area is tested by turning the point back the other way
 *  about the area's centre, which puts it back in the area's own square-on frame. */
function inRect(p: Pt, r: Rect): boolean {
  let { x, y } = p;
  if (r.rot) {
    const cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2, a = -r.rot * Math.PI / 180;
    const dx = x - cx, dy = y - cy;
    x = cx + dx * Math.cos(a) - dy * Math.sin(a);
    y = cy + dx * Math.sin(a) + dy * Math.cos(a);
  }
  return x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
}
const inAny = (p: Pt, rs: Rect[]) => rs.some((r) => inRect(p, r));

/** Would walking straight from `a` to `b` mean going through water? A bridge over that water makes
 *  the stretch it covers dry, so crossing there is fine. */
export function wet(a: Pt, b: Pt, input: NavInput): boolean {
  if (!input.water.length) return false;
  const n = Math.max(1, Math.ceil(dist(a, b) / 6));
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    if (inAny(p, input.water) && !inAny(p, input.crossings)) return true;
  }
  return false;
}

/** Chop a polyline into nodes at most SAMPLE apart, keeping its corners. */
function chop(poly: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i], b = poly[i + 1], d = dist(a, b), steps = Math.max(1, Math.round(d / SAMPLE));
    for (let s = 0; s < steps; s++) out.push({ x: a.x + (b.x - a.x) * (s / steps), y: a.y + (b.y - a.y) * (s / steps) });
  }
  if (poly.length) out.push(poly[poly.length - 1]);
  return out;
}

/** Build the walkable network from what is drawn on the park. */
export function buildNav(input: NavInput): Nav {
  const nodes: Pt[] = [], adj: { to: number; w: number }[][] = [], poly: number[] = [];
  const link = (i: number, j: number, w: number) => { adj[i].push({ to: j, w }); adj[j].push({ to: i, w }); };
  input.paths.forEach((path, pi) => {
    const pts = chop(path.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)));
    let prev = -1;
    for (const p of pts) {
      const id = nodes.length; nodes.push(p); adj.push([]); poly.push(pi);
      // a path laid straight over water is not walkable there - the player needs a bridge
      if (prev >= 0 && !wet(nodes[prev], p, input)) link(prev, id, dist(nodes[prev], p));
      prev = id;
    }
  });
  // Where two paths meet, guests step from one to the other; where they nearly meet, guests will
  // still step across the little bit of grass between them, just less willingly. A grid keeps this
  // linear rather than comparing every node with every other one.
  const cell = GRASS, grid = new Map<string, number[]>();
  const key = (x: number, y: number) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`;
  nodes.forEach((p, i) => { const k = key(p.x, p.y); const b = grid.get(k); if (b) b.push(i); else grid.set(k, [i]); });
  nodes.forEach((p, i) => {
    for (let gx = -1; gx <= 1; gx++) for (let gy = -1; gy <= 1; gy++) {
      for (const j of grid.get(key(p.x + gx * cell, p.y + gy * cell)) ?? []) {
        if (j <= i || poly[j] === poly[i]) continue;
        const d = dist(p, nodes[j]);
        if (d <= GRASS && !wet(p, nodes[j], input)) link(i, j, d <= LINK ? d : d * GRASS_COST);
      }
    }
  });
  return { nodes, adj, input };
}

/** The nodes a guest could join the network at from `p`: the nearest few they can actually reach. */
function hops(nav: Nav, p: Pt): { id: number; w: number }[] {
  const near = nav.nodes
    .map((n, id) => ({ id, w: dist(p, n) }))
    .sort((a, b) => a.w - b.w)
    .slice(0, HOPS * 3)
    .filter((h) => !wet(p, nav.nodes[h.id], nav.input));
  return near.slice(0, HOPS);
}

/** Walk the network from `from` to `to`, returning the waypoints to follow (ending at `to`), or
 *  null if the network does not join them up. */
export function navRoute(nav: Nav, from: Pt, to: Pt): Pt[] | null {
  const starts = hops(nav, from), ends = hops(nav, to);
  if (!starts.length || !ends.length) return null;
  const n = nav.nodes.length, best = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1);
  // Dijkstra from every possible joining-on point at once, each seeded with the walk out to it.
  const heap: { id: number; d: number }[] = [];
  const push = (id: number, d: number) => {
    heap.push({ id, d }); let i = heap.length - 1;
    while (i > 0) { const par = (i - 1) >> 1; if (heap[par].d <= heap[i].d) break; [heap[par], heap[i]] = [heap[i], heap[par]]; i = par; }
  };
  const pop = () => {
    const top = heap[0], last = heap.pop()!;
    if (heap.length) { heap[0] = last; let i = 0;
      for (;;) { const l = i * 2 + 1, r = l + 1; let m = i;
        if (l < heap.length && heap[l].d < heap[m].d) m = l;
        if (r < heap.length && heap[r].d < heap[m].d) m = r;
        if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } }
    return top;
  };
  for (const s of starts) { best[s.id] = s.w; push(s.id, s.w); }
  const endW = new Map(ends.map((e) => [e.id, e.w]));
  while (heap.length) {
    const { id, d } = pop();
    if (d > best[id]) continue;
    for (const e of nav.adj[id]) { const nd = d + e.w; if (nd < best[e.to]) { best[e.to] = nd; prev[e.to] = id; push(e.to, nd); } }
  }
  let goal = -1, goalCost = Infinity;
  for (const [id, w] of endW) { const c = best[id] + w; if (c < goalCost) { goalCost = c; goal = id; } }
  if (goal < 0 || !Number.isFinite(goalCost)) return null;
  const back: Pt[] = [];
  for (let at = goal; at >= 0; at = prev[at]) back.push(nav.nodes[at]);
  return [...back.reverse(), to];
}

/** How a guest gets from `from` to `to`: the made route where that makes sense, straight across the
 *  grass where it does not, and null when water is in the way with no bridge over it. */
export function routeAcross(nav: Nav | null, from: Pt, to: Pt): Pt[] | null {
  const blocked = nav ? wet(from, to, nav.input) : false;
  if (!nav) return [to];
  const onPath = navRoute(nav, from, to);
  if (onPath) {
    let len = 0;
    for (let i = 0, at = from; i < onPath.length; at = onPath[i], i++) len += dist(at, onPath[i]);
    if (blocked || len <= DETOUR * dist(from, to)) return onPath;
  }
  return blocked ? null : [to];
}
