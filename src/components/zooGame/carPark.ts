// ============= Car park =============
//
// The car park is the frame around the play area: it sits OUTSIDE the fence, as a fixed apron
// below the entrance, so guests arrive by car (or coach), park, and walk in through the gate.
// It is scenery, not a placeable PBI - the lot is drawn by the guest layer beneath the visitors,
// and its car footprints are the obstacles the visitors route around on their way to the gate.
//
// Everything here is pure and deterministic (no randomness), so the lot renders the same every
// frame. Coordinates are in the park's design pixels; `top` is the apron's top edge (the fence).

export const CAR_PARK_H = 234; // apron height in design px: two car rows + a coach bay

export interface CarSpot { x: number; y: number; kind: string; color: string; bus: boolean; }
export interface Obstacle { x0: number; x1: number; y0: number; y1: number; }
export interface CarParkLayout {
  top: number; W: number;
  spots: CarSpot[];      // occupied bays (cars + coaches), used to draw and to spawn guests from
  empties: { x: number; y: number; w: number; h: number; bus: boolean }[]; // marked-out empty bays
  obstacles: Obstacle[]; // footprints the guests walk around (occupied bays only)
}

const CARS = ['#e0574b', '#4a90d9', '#43a047', '#f0b429', '#eeeeee', '#7d6bd0', '#e6842a', '#37b3a6', '#d94f8a', '#5b6673'];
const KINDS = ['sedan', 'suv', 'hatch', 'van', 'pickup', 'sedan', 'suv', 'hatch'];
const CAR_HH = 24, BUS_HH = 50;

export const CAR_BAYS = 16, COACH_BAYS = 2; // capacity: 16 car bays + 2 usable coach bays

/** Build the lot for an apron of width `W` whose top edge is at `top`, filled to `carCount` cars
 *  and `busCount` coaches. The lot starts empty (just painted bays) and fills front-to-back as the
 *  zoo gets busier, so it reads as how full the park is. Bays beyond the count are drawn as empty
 *  outlines. Which bay gets a car, and its colour/kind, is deterministic, so a given car stays put
 *  and keeps its look as more arrive. Two car rows over a central lane, then two coach bays that
 *  flank an always-empty middle bay, keeping the centre corridor clear up to the gate. */
export function carParkLayout(W: number, top: number, carCount = CAR_BAYS, busCount = COACH_BAYS): CarParkLayout {
  const bayW = 78, gap = 10, cols = 8;
  const totalW = cols * bayW + (cols - 1) * gap;
  const startX = (W - totalW) / 2 + bayW / 2;
  const rowA = top + 44;          // front row (nearer the gate) - fills first
  const rowB = top + 100;         // back row
  const coachY = top + 182;       // coach bay
  const cars = Math.max(0, Math.min(CAR_BAYS, carCount));
  const spots: CarSpot[] = [];
  const empties: CarParkLayout['empties'] = [];
  // Fill order: whole front row, then the back row. Each bay's colour/kind is keyed to its own
  // fill index so it is stable as the lot fills.
  let fi = 0;
  for (const y of [rowA, rowB]) {
    for (let c = 0; c < cols; c++, fi++) {
      const bx = startX + c * (bayW + gap);
      if (fi < cars) spots.push({ x: bx, y, kind: KINDS[fi % KINDS.length], color: CARS[fi % CARS.length], bus: false });
      else empties.push({ x: bx, y, w: 46, h: 52, bus: false });
    }
  }
  // three coach bays: [left] [empty middle] [right]; the middle stays open for the corridor
  const coachW = 150, coachGap = 24, coachCols = 3;
  const coachTotal = coachCols * coachW + (coachCols - 1) * coachGap;
  const coachStart = (W - coachTotal) / 2 + coachW / 2;
  const buses = Math.max(0, Math.min(COACH_BAYS, busCount));
  const coachOrder = [0, 2]; // left bay fills first, then right; index 1 (middle) never
  for (let c = 0; c < coachCols; c++) {
    const cx = coachStart + c * (coachW + coachGap);
    const filled = c !== 1 && coachOrder.indexOf(c) < buses;
    if (filled) spots.push({ x: cx, y: coachY, kind: 'bus', color: c === 0 ? '#3f8fd0' : '#e0574b', bus: true });
    else empties.push({ x: cx, y: coachY, w: coachW - 6, h: 104, bus: true });
  }
  const obstacles: Obstacle[] = spots.map((s) => s.bus
    ? { x0: s.x - 26, x1: s.x + 26, y0: s.y - BUS_HH, y1: s.y + BUS_HH }
    : { x0: s.x - 23, x1: s.x + 23, y0: s.y - CAR_HH, y1: s.y + CAR_HH });
  return { top, W, spots, empties, obstacles };
}

// ---- drawing (pure canvas, design-space) ------------------------------------------------------

function shade(hex: string, d: number): string {
  const n = parseInt(hex.slice(1), 16), c = (v: number) => Math.max(0, Math.min(255, v));
  return `rgb(${c((n >> 16) + d)},${c(((n >> 8) & 255) + d)},${c((n & 255) + d)})`;
}
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function shell(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, taper: number) {
  ctx.beginPath();
  ctx.moveTo(x + taper + 3, y); ctx.lineTo(x + w - taper - 3, y);
  ctx.quadraticCurveTo(x + w - taper, y, x + w - taper, y + 4); ctx.lineTo(x + w, y + 10); ctx.lineTo(x + w, y + h - 6);
  ctx.quadraticCurveTo(x + w, y + h, x + w - 5, y + h); ctx.lineTo(x + 5, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - 6); ctx.lineTo(x, y + 10); ctx.lineTo(x + taper, y + 4);
  ctx.quadraticCurveTo(x + taper, y, x + taper + 3, y); ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = shade(color, 30); rr(ctx, x + 2, y + 2, w * 0.34, h - 4, 5); ctx.fill();
  ctx.fillStyle = shade(color, -26); rr(ctx, x + w * 0.72, y + 2, w * 0.3, h - 4, 5); ctx.fill();
  ctx.restore();
}
function wheels(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#23252b';
  for (const p of [[x - 1.5, y + 7], [x + w - 2.5, y + 7], [x - 1.5, y + h - 16], [x + w - 2.5, y + h - 16]]) { rr(ctx, p[0], p[1], 4, 9, 2); ctx.fill(); }
}
function lights(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, taper: number) {
  ctx.fillStyle = '#fff3c4'; rr(ctx, x + taper + 2, y + 1, 3.5, 2.5, 1); ctx.fill(); rr(ctx, x + w - taper - 5.5, y + 1, 3.5, 2.5, 1); ctx.fill();
  ctx.fillStyle = '#d43b2c'; ctx.fillRect(x + 3, y + h - 3, 3.5, 2); ctx.fillRect(x + w - 6.5, y + h - 3, 3.5, 2);
}

const GEO: Record<string, { top: number; bot: number; taper: number; rt: number; rb: number; roofShade: number; rails?: boolean; bed?: boolean }> = {
  sedan: { top: 0.30, bot: 0.72, taper: 2.2, rt: 0.42, rb: 0.58, roofShade: 8 },
  hatch: { top: 0.26, bot: 0.80, taper: 2.0, rt: 0.40, rb: 0.60, roofShade: 8 },
  van: { top: 0.14, bot: 0.86, taper: 0.0, rt: 0.30, rb: 0.70, roofShade: -6 },
  suv: { top: 0.20, bot: 0.84, taper: 1.2, rt: 0.34, rb: 0.66, roofShade: -4, rails: true },
  pickup: { top: 0.22, bot: 0.50, taper: 2.0, rt: 0.30, rb: 0.46, roofShade: 6, bed: true },
};

/** A car, facing up (nose toward the gate), centred at (cx, cy). */
function car(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, kind: string) {
  const g = GEO[kind] || GEO.sedan;
  const w = kind === 'van' ? 42 : 40, h = kind === 'van' ? 52 : kind === 'pickup' ? 50 : 46;
  const x = cx - w / 2, y = cy - h / 2, glass = '#252b34';
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.18)'; rr(ctx, x + 2, y + 5, w, h, 7); ctx.fill();
  wheels(ctx, x, y, w, h);
  shell(ctx, x, y, w, h, color, g.taper);
  ctx.fillStyle = glass; rr(ctx, x + 4, y + h * g.top, w - 8, h * (g.bot - g.top), 4); ctx.fill();
  if (g.bed) {
    ctx.fillStyle = shade(color, -34); rr(ctx, x + 4, y + h * 0.56, w - 8, h * 0.38, 3); ctx.fill();
    ctx.strokeStyle = shade(color, -48); ctx.lineWidth = 1;
    for (let by = 0.62; by < 0.92; by += 0.09) { ctx.beginPath(); ctx.moveTo(x + 6, y + h * by); ctx.lineTo(x + w - 6, y + h * by); ctx.stroke(); }
  }
  ctx.fillStyle = shade(color, g.roofShade); rr(ctx, x + 5, y + h * g.rt, w - 10, h * (g.rb - g.rt), 3); ctx.fill();
  if (g.rails) {
    ctx.strokeStyle = shade(color, -30); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x + 7, y + h * 0.30); ctx.lineTo(x + 7, y + h * 0.70); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - 7, y + h * 0.30); ctx.lineTo(x + w - 7, y + h * 0.70); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,.16)'; rr(ctx, x + 6, y + h * g.top + 1.5, (w - 12) * 0.4, h * 0.05, 1); ctx.fill();
  ctx.fillStyle = shade(color, -18); ctx.fillRect(x - 2, y + h * g.top + 1, 3, 3); ctx.fillRect(x + w - 1, y + h * g.top + 1, 3, 3);
  lights(ctx, x, y, w, h, g.taper);
  ctx.restore();
}

/** A bus / coach, facing up, centred at (cx, cy). */
function bus(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  const w = 46, h = 100, x = cx - w / 2, y = cy - h / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.2)'; rr(ctx, x + 2, y + 6, w, h, 6); ctx.fill();
  ctx.fillStyle = '#2a2c31';
  for (const p of [[x - 1.5, y + 10], [x + w - 2.5, y + 10], [x - 1.5, y + h - 22], [x + w - 2.5, y + h - 22]]) { rr(ctx, p[0], p[1], 4, 11, 2); ctx.fill(); }
  ctx.fillStyle = color; rr(ctx, x, y, w, h, 7); ctx.fill();
  ctx.fillStyle = shade(color, 22); rr(ctx, x + 2, y + 2, w * 0.3, h - 4, 5); ctx.fill();
  ctx.fillStyle = shade(color, -22); rr(ctx, x + w * 0.74, y + 2, w * 0.26, h - 4, 5); ctx.fill();
  ctx.fillStyle = '#e9edf2'; rr(ctx, x + 4, y + 4, w - 8, h * 0.12, 3); ctx.fill();
  ctx.fillStyle = '#f0b429'; rr(ctx, x + w * 0.28, y + 2.5, w * 0.44, 3.5, 1); ctx.fill();
  ctx.fillStyle = '#252b34';
  for (let wy = 0.22; wy < 0.9; wy += 0.11) { rr(ctx, x + 3, y + h * wy, 5, h * 0.07, 1.5); ctx.fill(); rr(ctx, x + w - 8, y + h * wy, 5, h * 0.07, 1.5); ctx.fill(); }
  ctx.fillStyle = shade(color, 10); rr(ctx, x + w / 2 - 3, y + h * 0.2, 6, h * 0.72, 2); ctx.fill();
  ctx.fillStyle = '#fff3c4'; ctx.fillRect(x + 4, y + 1.5, 4, 2.5); ctx.fillRect(x + w - 8, y + 1.5, 4, 2.5);
  ctx.restore();
}

/** Draw the whole lot: asphalt apron, curb, bay markings, empty-bay outlines, then the vehicles. */
export function drawCarPark(ctx: CanvasRenderingContext2D, lot: CarParkLayout) {
  const { top, W } = lot;
  // asphalt slab with a rounded bottom to echo the park panel above
  ctx.fillStyle = '#4f545b';
  rr(ctx, 2, top, W - 4, CAR_PARK_H - 2, 16); ctx.fill();
  // subtle asphalt speckle (deterministic)
  ctx.fillStyle = 'rgba(255,255,255,.03)';
  for (let i = 0; i < 360; i++) { const px = (i * 137) % (W - 8) + 4, py = top + ((i * 53) % (CAR_PARK_H - 6)); ctx.fillRect(px, py, 1, 1); }
  // curb line at the fence
  ctx.fillStyle = '#c9a86a'; ctx.fillRect(4, top, W - 8, 3);
  // bay + coach outlines (empties get a full box; occupied bays get side ticks)
  ctx.strokeStyle = '#f4eccf'; ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
  for (const e of lot.empties) ctx.strokeRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
  for (const s of lot.obstacles) { // side ticks either flank of an occupied bay
    ctx.beginPath(); ctx.moveTo(s.x0 - 6, s.y0); ctx.lineTo(s.x0 - 6, s.y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s.x1 + 6, s.y0); ctx.lineTo(s.x1 + 6, s.y1); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // vehicles, back rows first so nearer ones overlap correctly
  for (const s of [...lot.spots].sort((a, b) => b.y - a.y)) {
    if (s.bus) bus(ctx, s.x, s.y, s.color); else car(ctx, s.x, s.y, s.color, s.kind);
  }
}
