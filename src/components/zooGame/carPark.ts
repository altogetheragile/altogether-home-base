// ============= Car park =============
//
// The car park is the frame around the play area: it sits OUTSIDE the fence, as a fixed apron
// below the entrance, so guests arrive by car (or coach), park, and walk in through the gate.
// It is scenery, not a placeable PBI - the lot is drawn by the guest layer beneath the visitors,
// and its car footprints are the obstacles the visitors route around on their way to the gate.
//
// Everything here is pure and deterministic (no randomness), so the lot renders the same every
// frame. Coordinates are in the park's design pixels; `top` is the apron's top edge (the fence).

// Vertical rhythm of the apron. Every lane is sized against the vehicle that has to use it: a car is
// ~48 long, so a car aisle is wider than that (you have to be able to drive along it and swing into
// a bay); a coach is ~100 long and 46 wide, so coaches get their own lay-by lane deep enough for one
// to drive down it. Bays face each other across the single aisle, the way a real lot is set out.
const BAY_H = 52;      // depth of a car bay
const AISLE_H = 64;    // the driving aisle - wider than a car is long, so a car can travel it
const COACH_H = 76;    // the coach lay-by: coaches park along it, nose to tail, and drive out of it
const LINK_W = 52;     // the link roads down each side, joining the aisle to the lay-by
const WALK_W = 64;     // the pedestrian walkway up the middle, from the lay-by to the gate
export const CAR_PARK_H = 6 + BAY_H + AISLE_H + BAY_H + COACH_H + 6; // = 256

export interface CarSpot { x: number; y: number; kind: string; color: string; bus: boolean; rot: number; }
export interface Obstacle { x0: number; x1: number; y0: number; y1: number; }
export interface Road { x: number; y: number; w: number; h: number; dir: 'h' | 'v'; }
export interface CarParkLayout {
  top: number; W: number;
  spots: CarSpot[];      // occupied bays (cars + coaches), used to draw and to spawn guests from
  empties: { x: number; y: number; w: number; h: number; bus: boolean }[]; // marked-out empty bays
  obstacles: Obstacle[]; // footprints the guests walk around (occupied bays only)
  roads: Road[];         // driving lanes: the aisle, the coach lay-by, and a link road each side
  walkway: { x: number; y: number; w: number; h: number }; // the footway up the middle to the gate
  crossings: { x: number; y: number; w: number; h: number }[]; // where that footway crosses a lane
  lanes: { aisle: number; layby: number }; // centre line of each lane, for guests walking out to it
}

export interface Pt { x: number; y: number; }

const CARS = ['#e0574b', '#4a90d9', '#43a047', '#f0b429', '#eeeeee', '#7d6bd0', '#e6842a', '#37b3a6', '#d94f8a', '#5b6673'];
const KINDS = ['sedan', 'suv', 'hatch', 'van', 'pickup', 'sedan', 'suv', 'hatch'];
const CAR_HW = 23, CAR_HH = 26, BUS_HW = 50, BUS_HH = 23; // half-footprints; a coach lies on its side

const BAY_W = 78, BAY_GAP = 10, EDGE = 56; // bay pitch, and the margin the link roads need each side
export const CAR_BAYS = 16, COACH_BAYS = 2; // what a default-width apron holds: 16 bays + 2 coaches

/** How many car bays this apron is wide enough for: two rows of columns either side of the walkway,
 *  four columns per side at the least and more as the park gets wider - so a bigger lot is a fuller
 *  one rather than bare asphalt. */
export function carCapacity(W: number): number {
  const perBlock = Math.max(4, Math.floor((W - WALK_W - 2 * EDGE) / 2 / (BAY_W + BAY_GAP)));
  return perBlock * 4; // two blocks of columns, two rows deep
}

/** Build the lot for an apron of width `W` whose top edge is at `top`, filled to `carCount` cars
 *  and `busCount` coaches. The lot starts empty (just painted bays) and fills front-to-back as the
 *  zoo gets busier, so it reads as how full the park is. Bays beyond the count are drawn as empty
 *  outlines. Which bay gets a car, and its colour/kind, is deterministic, so a given car stays put
 *  and keeps its look as more arrive.
 *
 *  The set-out, top (the fence) to bottom: a row of bays nosed up to the curb, the driving aisle,
 *  a second row nosed the other way off that same aisle, then the coach lay-by, which doubles as
 *  the access road in off the street. A link road down each side joins the aisle to the lay-by, so
 *  there is a way in and out of every space. Four bays either side of a pedestrian walkway that
 *  runs up the middle to the gate, so people on foot are never in the traffic. */
export function carParkLayout(W: number, top: number, carCount = CAR_BAYS, busCount = COACH_BAYS): CarParkLayout {
  const bayW = BAY_W, gap = BAY_GAP, perBlock = carCapacity(W) / 4; // columns each side of the walkway
  const blockW = perBlock * bayW + (perBlock - 1) * gap;
  const startX = (W - (blockW * 2 + WALK_W)) / 2;
  const walkX = startX + blockW;                 // the walkway sits between the two blocks of bays
  const rowA = top + 6 + BAY_H / 2;              // front row, nosed up to the curb - fills first
  const aisleY = top + 6 + BAY_H;                // the one aisle, serving both rows
  const rowB = aisleY + AISLE_H + BAY_H / 2;     // back row, nosed the other way off the aisle
  const coachY0 = aisleY + AISLE_H + BAY_H;      // the lay-by along the foot
  const roads: Road[] = [
    { x: 4, y: aisleY, w: W - 8, h: AISLE_H, dir: 'h' },
    { x: 4, y: coachY0, w: W - 8, h: COACH_H, dir: 'h' },
    { x: 4, y: aisleY, w: LINK_W, h: coachY0 + COACH_H - aisleY, dir: 'v' },
    { x: W - 4 - LINK_W, y: aisleY, w: LINK_W, h: coachY0 + COACH_H - aisleY, dir: 'v' },
  ];
  const cars = Math.max(0, Math.min(carCapacity(W), carCount));
  const spots: CarSpot[] = [];
  const empties: CarParkLayout['empties'] = [];
  // Fill order: the whole front row, then the back row, left to right across both blocks. Each bay's
  // colour/kind is keyed to its own fill index so it is stable as the lot fills.
  let fi = 0;
  for (const [y, rot] of [[rowA, 0], [rowB, Math.PI]] as [number, number][]) {
    for (let c = 0; c < perBlock * 2; c++, fi++) {
      // columns 0-3 are the left block, 4-7 the right one - the walkway sits in the gap between them
      const bx = startX + (c < perBlock ? 0 : blockW + WALK_W) + (c % perBlock) * (bayW + gap) + bayW / 2;
      if (fi < cars) spots.push({ x: bx, y, kind: KINDS[fi % KINDS.length], color: CARS[fi % CARS.length], bus: false, rot });
      else empties.push({ x: bx, y, w: 46, h: BAY_H - 4, bus: false });
    }
  }
  // Two coach spaces in the lay-by, one either side of the walkway, coaches lying along it (nose to
  // tail, facing the way out) - so a coach only ever drives straight down its own lane.
  const coachCy = coachY0 + COACH_H / 2;
  const buses = Math.max(0, Math.min(COACH_BAYS, busCount));
  const mid = walkX + WALK_W / 2;
  const coachXs = [mid - 174, mid + 174];
  coachXs.forEach((cx, i) => {
    if (i < buses) spots.push({ x: cx, y: coachCy, kind: 'bus', color: i === 0 ? '#3f8fd0' : '#e0574b', bus: true, rot: Math.PI / 2 });
    else empties.push({ x: cx, y: coachCy, w: 2 * BUS_HW + 8, h: 2 * BUS_HH + 10, bus: true });
  });
  const obstacles: Obstacle[] = spots.map((s) => s.bus
    ? { x0: s.x - BUS_HW, x1: s.x + BUS_HW, y0: s.y - BUS_HH, y1: s.y + BUS_HH }
    : { x0: s.x - CAR_HW, x1: s.x + CAR_HW, y0: s.y - CAR_HH, y1: s.y + CAR_HH });
  return {
    top, W, spots, empties, obstacles, roads,
    walkway: { x: walkX, y: top, w: WALK_W, h: coachY0 + COACH_H - top },
    crossings: [
      { x: walkX, y: aisleY, w: WALK_W, h: AISLE_H },
      { x: walkX, y: coachY0, w: WALK_W, h: COACH_H },
    ],
    lanes: { aisle: aisleY + AISLE_H / 2, layby: coachCy },
  };
}

/** The way a guest walks between their vehicle and the gate: out of the bay into the lane behind it,
 *  along that lane to the walkway, then straight up the walkway and in. Nobody cuts across the bays,
 *  because the lanes and the walkway are clear by construction - they follow the made route, which
 *  is what the lot is drawn to invite. Pass `gateY` for the park entrance; reverse it to go home. */
export function walkToGate(lot: CarParkLayout, spot: CarSpot, gateY: number, spread = 0): Pt[] {
  const laneY = spot.bus ? lot.lanes.layby : lot.lanes.aisle;
  const cx = lot.walkway.x + lot.walkway.w / 2;
  return [{ x: spot.x + spread, y: laneY }, { x: cx + spread, y: laneY }, { x: cx + spread, y: gateY }];
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

/** Draw the whole lot: asphalt apron, lanes, the walkway, bay markings, then the vehicles. */
export function drawCarPark(ctx: CanvasRenderingContext2D, lot: CarParkLayout) {
  const { top, W, walkway: wk } = lot;
  // asphalt slab with a rounded bottom to echo the park panel above
  ctx.fillStyle = '#4f545b';
  rr(ctx, 2, top, W - 4, CAR_PARK_H - 2, 16); ctx.fill();
  // subtle asphalt speckle (deterministic)
  ctx.fillStyle = 'rgba(255,255,255,.03)';
  for (let i = 0; i < 360; i++) { const px = (i * 137) % (W - 8) + 4, py = top + ((i * 53) % (CAR_PARK_H - 6)); ctx.fillRect(px, py, 1, 1); }
  // driving lanes: lighter tarmac with a dashed centre line, so every bay has a road to reach it
  for (const r of lot.roads) { ctx.fillStyle = '#5c626c'; rr(ctx, r.x, r.y, r.w, r.h, 6); ctx.fill(); }
  ctx.strokeStyle = 'rgba(244,236,207,.5)'; ctx.lineWidth = 2; ctx.setLineDash([12, 11]);
  for (const r of lot.roads) {
    ctx.beginPath();
    if (r.dir === 'h') { ctx.moveTo(r.x + 8, r.y + r.h / 2); ctx.lineTo(r.x + r.w - 8, r.y + r.h / 2); }
    else { ctx.moveTo(r.x + r.w / 2, r.y + 8); ctx.lineTo(r.x + r.w / 2, r.y + r.h - 8); }
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // the pedestrian walkway up the middle, in the same tan as the park's paths, with a zebra crossing
  // where it steps over the driving aisle - people on foot have their own way up to the gate
  ctx.fillStyle = '#b9975e'; ctx.fillRect(wk.x, wk.y, wk.w, wk.h);
  ctx.fillStyle = '#c9a86a'; ctx.fillRect(wk.x + 3, wk.y, wk.w - 6, wk.h);
  for (const cr of lot.crossings) {
    ctx.fillStyle = '#5c626c'; ctx.fillRect(cr.x, cr.y, cr.w, cr.h);
    // Zebra stripes lie across the way people walk, so you step over one bar after another - they
    // run with the traffic, not with the pedestrian. The walkway runs up the lot, so the bars are
    // horizontal, spanning its width.
    ctx.fillStyle = 'rgba(244,236,207,.85)';
    for (let sy = cr.y + 5; sy < cr.y + cr.h - 6; sy += 12) ctx.fillRect(cr.x + 3, sy, cr.w - 6, 7);
  }
  // curb line at the fence
  ctx.fillStyle = '#c9a86a'; ctx.fillRect(4, top, W - 8, 3);
  // bay + coach outlines (empties get a full box; occupied bays get ticks along their flanks)
  ctx.strokeStyle = '#f4eccf'; ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
  for (const e of lot.empties) ctx.strokeRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
  for (const s of lot.spots) {
    const o = s.bus // a coach lies along its lane, so its bay is marked front and back, not either side
      ? { x0: s.x - BUS_HW - 6, x1: s.x + BUS_HW + 6, y0: s.y - BUS_HH, y1: s.y + BUS_HH }
      : { x0: s.x - CAR_HW - 6, x1: s.x + CAR_HW + 6, y0: s.y - CAR_HH, y1: s.y + CAR_HH };
    ctx.beginPath(); ctx.moveTo(o.x0, o.y0); ctx.lineTo(o.x0, o.y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(o.x1, o.y0); ctx.lineTo(o.x1, o.y1); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // vehicles, back rows first so nearer ones overlap correctly
  for (const s of [...lot.spots].sort((a, b) => b.y - a.y)) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
    if (s.bus) bus(ctx, 0, 0, s.color); else car(ctx, 0, 0, s.color, s.kind);
    ctx.restore();
  }
}
