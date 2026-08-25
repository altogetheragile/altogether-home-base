import { ISO_ART, type IsoProp } from './isoArt.generated';
import { shade } from '../design';

/** The park, seen from the corner.
 *
 *  The showcase draws the same zoo the park view draws, in the same world coordinates, through a
 *  true isometric projection: a world square becomes a diamond a little under twice as wide as it
 *  is tall, which is the grid the licensed props are drawn on. Nothing here changes the game - it
 *  is a second way of looking at what is already there.
 */
export const COS = Math.cos(Math.PI / 6); // 0.866
export const SIN = 0.5;

export interface Pt { x: number; y: number }

/** World (plan) coordinates to screen, at `u` screen pixels per world pixel. */
export const project = (wx: number, wy: number, u: number): Pt =>
  ({ x: (wx - wy) * COS * u, y: (wx + wy) * SIN * u });

/** Screen back to world - the inverse of `project`, at the same `u`.
 *
 *  Needed the moment the isometric view stops being a picture and becomes somewhere you can drag
 *  things: a pointer arrives in screen coordinates and has to be answered in world ones.
 *
 *  `project` says  sx = (wx - wy)·COS·u  and  sy = (wx + wy)·SIN·u, so the two sums fall straight
 *  out of it. It is exact, not an approximation - the projection is a plain linear map. */
export const unproject = (sx: number, sy: number, u: number): Pt => {
  const diff = sx / (COS * u);   // wx - wy
  const sum = sy / (SIN * u);    // wx + wy
  return { x: (sum + diff) / 2, y: (sum - diff) / 2 };
};

/** How far back something stands. Everything is drawn in this order so that what is in front
 *  covers what is behind it - the only way a scene like this stays readable. */
export const depth = (wx: number, wy: number): number => wx + wy;

/** The screen box a whole world rectangle projects into, so the view can be framed around it. */
export function screenBounds(w: number, h: number, u: number): { w: number; h: number; ox: number; oy: number } {
  const cs = [project(0, 0, u), project(w, 0, u), project(w, h, u), project(0, h, u)];
  const xs = cs.map((c) => c.x), ys = cs.map((c) => c.y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  return { w: Math.max(...xs) - minX, h: Math.max(...ys) - minY, ox: -minX, oy: -minY };
}

const pts = (ps: Pt[]) => ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

/** A patch of ground - a world rectangle, lying flat. */
export function groundPoints(x0: number, y0: number, x1: number, y1: number, u: number): string {
  return pts([project(x0, y0, u), project(x1, y0, u), project(x1, y1, u), project(x0, y1, u)]);
}

/** A box standing on the ground: its top and the two faces you can see.
 *
 *  Buildings and vehicles are boxes, and a box is the one thing that is easier to draw than to
 *  license - three flat quads and a rule about which is lit. The faces come back darkest last so
 *  they can be painted in order. */
export function boxFaces(x0: number, y0: number, x1: number, y1: number, h: number, u: number):
  { top: string; left: string; right: string } {
  const up = (p: Pt): Pt => ({ x: p.x, y: p.y - h });
  const a = project(x0, y0, u), b = project(x1, y0, u), c = project(x1, y1, u), d = project(x0, y1, u);
  return {
    left: pts([d, c, up(c), up(d)]),
    right: pts([c, b, up(b), up(c)]),
    top: pts([up(a), up(b), up(c), up(d)]),
  };
}

/** A pitched roof over a rectangle, with the ridge running along the shorter way so the slopes face
 *  the viewer. Comes back with the far slope first, then the near one, then the gable you can see -
 *  the order they have to be painted in. A flat lid on a box reads as a crate; this reads as a shop. */
export function roofFaces(x0: number, y0: number, x1: number, y1: number, wallH: number, riseH: number, eave: number, u: number):
  { far: string; near: string; gable: string } {
  const ex0 = x0 - eave, ex1 = x1 + eave, ey0 = y0 - eave, ey1 = y1 + eave;
  const xm = (x0 + x1) / 2;
  const up = (p: Pt, h: number): Pt => ({ x: p.x, y: p.y - h });
  const at = (wx: number, wy: number, h: number) => up(project(wx, wy, u), h);
  const rBack = at(xm, ey0, wallH + riseH), rFront = at(xm, ey1, wallH + riseH);
  return {
    far: pts([at(ex0, ey0, wallH), rBack, rFront, at(ex0, ey1, wallH)]),
    near: pts([at(ex1, ey0, wallH), rBack, rFront, at(ex1, ey1, wallH)]),
    gable: pts([at(ex0, ey1, wallH), rFront, at(ex1, ey1, wallH)]),
  };
}

/** A panel on a vertical wall - a door, a window - given as fractions along the wall and up it.
 *  Doors drawn as flat rectangles on a projected face slide off it; these lie in the wall's plane. */
export function wallPanel(from: Pt, to: Pt, t0: number, t1: number, h0: number, h1: number, u: number): string {
  const a = project(from.x, from.y, u), b = project(to.x, to.y, u);
  const at = (t: number, h: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - h });
  return pts([at(t0, h0), at(t1, h0), at(t1, h1), at(t0, h1)]);
}

/** The three tones a box is painted in: lit on top, and the two walls falling away from the light. */
export const boxTones = (hex: string) => ({ top: shade(hex, 16), left: shade(hex, -14), right: shade(hex, -32) });

/** How much of its footprint a facility tile is drawn across.
 *
 *  A drawn building is walls standing on its footprint; a tile is a building AND the ground under
 *  it, so it needs a little more room than the footprint alone to stand in the same space. */
export const TILE_SPREAD = 1.15;

/** The screen width a footprint projects to - what a tile is sized against. */
export const footprintWidth = (w: number, h: number, u: number): number => (w + h) * COS * u;

/** A licensed prop, ready to place. */
export const prop = (name: string): IsoProp | undefined => ISO_ART[name];

/** Hand a tinted prop its colours. The drawing keeps its own shading - it is only the hue that is
 *  being replaced - so a fence can wear the colour of the zone it encloses. */
export function tint(body: string, base: string, slots: number): string {
  let out = body;
  for (let i = 0; i < slots; i++) {
    // Lightest slot first, falling away to the darkest, matching how the prop was drawn.
    const by = 12 - (i * 44) / Math.max(1, slots - 1);
    out = out.split(`#__T${i}__`).join(shade(base, Math.round(by)));
  }
  return out;
}

export interface Placement { name: string; x: number; y: number; w: number; h: number; z: number }

/** A run of fencing between two world points, as whole panels.
 *
 *  Fence panels come drawn at one length, so a side is fenced by fitting a whole number of them and
 *  stretching each by the remainder - a fence with a gap at the end is what a wall of a zoo must
 *  never have. `up` picks the panel for the axis: one drawing climbs to the right, the other falls.
 */
export function fenceRun(from: Pt, to: Pt, u: number, up: boolean): Placement[] {
  const name = up ? 'fenceUp' : 'fenceDown';
  const p = prop(name);
  if (!p) return [];
  const a = project(from.x, from.y, u), b = project(to.x, to.y, u);
  const span = Math.abs(b.x - a.x);
  if (span < 4) return [];
  const n = Math.max(1, Math.round(span / (p.w * 0.55)));
  const k = span / (n * p.w);
  // The post rises above the ground line; that overhang is the panel's height beyond its own run.
  const overhang = (p.h - p.w * (SIN / COS)) * k;
  const out: Placement[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = i / n;
    const x = a.x + (b.x - a.x) * t0;
    const y = a.y + (b.y - a.y) * t0;
    const wx = from.x + (to.x - from.x) * t0, wy = from.y + (to.y - from.y) * t0;
    out.push({
      name,
      x: Math.min(x, x + (b.x - a.x) / n),
      y: Math.min(y, y + (b.y - a.y) / n) - overhang,
      w: p.w * k, h: p.h * k,
      z: depth(wx, wy),
    });
  }
  return out;
}

/** A stable pseudo-random number for a given seed - so a zoo looks the same every time it is
 *  shown, and a tree does not jump across the park between one Review and the next. */
export function jitter(seed: number, salt = 0): number {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}
