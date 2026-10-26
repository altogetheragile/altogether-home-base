import type { SVGProps } from 'react';
import { jitter } from './iso';

/** The park, inked.
 *
 *  Style C from the mock-ups (Al, 26 Oct 2026): everything drawn is outlined in one dark brown ink,
 *  with a line that wobbles a little, as if by hand. The shape keeps its own `<polygon>` - so every
 *  `data-` attribute, hit test and test that finds a shape by one keeps working - and the ink is a
 *  second path laid over it.
 *
 *  The wobble is seeded from the shape's own points, so a building does not shimmer between one
 *  render and the next: the same shape is always drawn with the same hand. */
export const INK = '#2b1d14';

type Pt = { x: number; y: number };

const parse = (points: string): Pt[] =>
  points.trim().split(/\s+/).map((p) => {
    const [x, y] = p.split(',').map(Number);
    return { x, y };
  }).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));

/** A stable number from a string, for seeding. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h % 100000);
}

/** A closed outline through these points, nudged off the straight between them. Long edges are
 *  cut into short runs so a wall wavers along its length; a window's edge is one run and stays
 *  straight, which is how a hand draws a small thing. */
function wobble(points: string, amp = 0.55, step = 12): string {
  const ps = parse(points);
  if (ps.length < 2) return '';
  const seed = hash(points);
  const out: string[] = [];
  for (let i = 0; i < ps.length; i++) {
    const a = ps[i], b = ps[(i + 1) % ps.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
    const runs = Math.max(1, Math.round(len / step));
    for (let k = 0; k < runs; k++) {
      const t = k / runs;
      const o = k === 0 ? 0 : (jitter(seed + i * 31 + k) - 0.5) * 2 * amp;
      out.push(`${(a.x + (b.x - a.x) * t + nx * o).toFixed(1)},${(a.y + (b.y - a.y) * t + ny * o).toFixed(1)}`);
    }
  }
  return `M${out.join(' L')} Z`;
}

/** A filled shape with an inked edge. `ink` scales the line: 1 for a building's wall, less for a
 *  window or a sign, which a hand draws lighter. The line stays the same width on screen at every
 *  zoom, so a park drawn small is not drowned in it. */
export function InkPoly({ points, ink = 1, ...rest }: SVGProps<SVGPolygonElement> & { points: string; ink?: number }) {
  return (
    <>
      <polygon points={points} {...rest} />
      <path d={wobble(points, 0.55 * ink)} fill="none" stroke={INK} strokeWidth={1.5 * ink}
        strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"
        opacity={rest.opacity} pointerEvents="none" data-ink="" />
    </>
  );
}

const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Rows across a four-cornered face, parallel to its first edge: the courses of a tiled roof.
 *  `points` is the face as drawn, corners in order, the first edge being the eave. */
export function InkRows({ points, n = 5 }: { points: string; n?: number }) {
  const q = parse(points);
  if (q.length !== 4) return null;
  const d = Array.from({ length: n - 1 }, (_, k) => {
    const t = (k + 1) / n;
    return wobble(`${lerp(q[0], q[3], t).x},${lerp(q[0], q[3], t).y} ${lerp(q[1], q[2], t).x},${lerp(q[1], q[2], t).y}`, 0.35)
      .replace(/ Z$/, '');
  }).join(' ');
  return <path d={d} fill="none" stroke={INK} strokeWidth={0.8} opacity={0.55} vectorEffect="non-scaling-stroke"
    strokeLinecap="round" pointerEvents="none" data-ink="" />;
}

/** Hatching on a wall in shadow: short strokes rising from its foot, the comic's way of saying
 *  "this side is away from the light". `points` runs foot-left, foot-right, top-right, top-left. */
export function InkHatch({ points, n = 7 }: { points: string; n?: number }) {
  const q = parse(points);
  if (q.length !== 4) return null;
  const d = Array.from({ length: n }, (_, k) => {
    const t = (k + 0.5) / n;
    const a = lerp(q[0], q[1], t), top = lerp(q[3], q[2], Math.min(1, t + 0.08));
    const b = lerp(a, top, 0.5);
    return `M${a.x.toFixed(1)},${a.y.toFixed(1)} L${b.x.toFixed(1)},${b.y.toFixed(1)}`;
  }).join(' ');
  return <path d={d} fill="none" stroke={INK} strokeWidth={0.7} opacity={0.4} vectorEffect="non-scaling-stroke"
    strokeLinecap="round" pointerEvents="none" data-ink="" />;
}

/** For licensed artwork from a sheet: an ink outline round its silhouette and its colours drawn
 *  down a little, so a bought lion sits in the same park as a drawn one. Put once in the scene's
 *  `<defs>`, then `filter="url(#zoo-ink-art)"` on the artwork's group.
 *
 *  `radius` is in the scene's own units, so the caller sizes it to its scale: a fixed 1 was a
 *  heavy line on a small park and invisible on a large one. */
export function InkDefs({ radius = 1 }: { radius?: number }) {
  return (
    <filter id="zoo-ink-art" x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius={radius.toFixed(2)} result="spread" />
      <feFlood floodColor={INK} />
      <feComposite in2="spread" operator="in" result="outline" />
      <feColorMatrix in="SourceGraphic" type="saturate" values="0.75" result="muted" />
      <feMerge>
        <feMergeNode in="outline" />
        <feMergeNode in="muted" />
      </feMerge>
    </filter>
  );
}
