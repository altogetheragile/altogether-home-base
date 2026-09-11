import { CANVAS_W, PAD, PROMENADE_Y } from './parkLayout';
import { ZOO_AREAS } from './config';

/** The ground each area of the zoo owns.
 *
 *  A zoo is not a field with animals dotted about it: it is laid out in areas, and you walk from one
 *  into the next. Marking that ground out is what makes the zoo growable a piece at a time - the
 *  Savanna can be opened in Sprint 4 without disturbing anything built in Sprint 1, because the
 *  ground it will stand on was always going to be its.
 *
 *  It is also what makes the Sprint Goal visible. "Open the Big Cats" is a plot of land that fills
 *  up, and an empty plot beside it is the rest of the Product Backlog drawn to scale.
 *
 *  Marked out from the day the brief is agreed, not on the day work starts: an area nobody has
 *  opened yet is ground with a name on it. That is a plan, and a plan you can see is the point.
 */

/** The walkway between one area and the next, and between the areas and the way in. */
export const PLOT_GAP = 40;

export interface Plot { zone: string; x0: number; y0: number; x1: number; y1: number }

export const plotCentre = (p: Plot) => ({ x: (p.x0 + p.x1) / 2, y: (p.y0 + p.y1) / 2 });
export const plotSize = (p: Plot) => ({ w: p.x1 - p.x0, h: p.y1 - p.y0 });

/** Which areas own ground, in the order they take it.
 *
 *  From the brief, and in the fixed order the areas are written in - NOT from the zones currently on
 *  the Backlog. The Backlog's list grows as items are added, and ground that reshuffled underneath a
 *  built zoo every time somebody split an epic would be the opposite of safe to grow into.
 *
 *  `Grounds` and `Facilities` are not areas of the zoo: paths, the river, signposts and the toilets
 *  are the fabric between the areas, and they may be put anywhere. */
export function plotOrder(state: { brief?: { zones: string[] }; zones?: string[] }): string[] {
  const chosen = state.brief?.zones ?? state.zones ?? [];
  const has = new Set(chosen);
  return ZOO_AREAS.map((a) => a.zone).filter((z) => has.has(z));
}

/** The ground each area owns, laid out over the buildable park.
 *
 *  Filled from the FRONT, left to right: the first area of the zoo is the one nearest the way in,
 *  which is where a zoo puts the thing it most wants you to see. */
export function zonePlots(state: { brief?: { zones: string[] }; zones?: string[] }): Map<string, Plot> {
  const order = plotOrder(state);
  const plots = new Map<string, Plot>();
  if (!order.length) return plots;

  const left = PAD, right = CANVAS_W - PAD;
  const top = PAD, bottom = PROMENADE_Y - PLOT_GAP;
  const cols = order.length <= 1 ? 1 : order.length <= 4 ? 2 : 3;
  const rows = Math.ceil(order.length / cols);
  const cellW = (right - left - PLOT_GAP * (cols - 1)) / cols;
  const cellH = (bottom - top - PLOT_GAP * (rows - 1)) / rows;

  order.forEach((zone, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x0 = left + col * (cellW + PLOT_GAP);
    // Row 0 is the front row, so counting up from the bottom rather than down from the top.
    const y1 = bottom - row * (cellH + PLOT_GAP);
    plots.set(zone, { zone, x0, y0: y1 - cellH, x1: x0 + cellW, y1 });
  });
  return plots;
}

/** The ground this item's area owns, or null if it belongs to no area and may go anywhere. */
export function plotFor(state: { brief?: { zones: string[] }; zones?: string[] }, zone: string | undefined): Plot | null {
  if (!zone) return null;
  return zonePlots(state).get(zone) ?? null;
}

/** Whether something of this size, standing here, is on the ground its area owns.
 *
 *  Measured on the whole footprint, not the middle of it: half a paddock over the fence into the
 *  Savanna is in the Savanna, whatever its centre says. */
export function insidePlot(plot: Plot, box: { w: number; h: number }, at: { x: number; y: number }): boolean {
  return at.x - box.w / 2 >= plot.x0 - 1 && at.x + box.w / 2 <= plot.x1 + 1
    && at.y - box.h / 2 >= plot.y0 - 1 && at.y + box.h / 2 <= plot.y1 + 1;
}

/** The nearest place on this ground that something of this size can stand. A plot too small for it
 *  is not a reason to drop it off the park: it is centred instead, and overlaps as it must. */
export function ontoPlot(plot: Plot, box: { w: number; h: number }, at: { x: number; y: number }): { x: number; y: number } {
  const fit = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v)));
  return {
    x: fit(at.x, plot.x0 + box.w / 2, plot.x1 - box.w / 2),
    y: fit(at.y, plot.y0 + box.h / 2, plot.y1 - box.h / 2),
  };
}
