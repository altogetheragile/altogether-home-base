import { useEffect, useRef } from 'react';
import type { SegmentId } from './simulation/types';
import { drawCarPark, type CarParkLayout } from './carPark';

// ============= Living visitors =============
//
// A lightweight guest layer drawn over the park on a requestAnimationFrame loop. Guests arrive at
// the entrance and walk to the live exhibits: FAMILIES come as a group (a grown-up or two plus
// smaller, bouncier kids that trail along, sometimes with a pram and holding hands), ENTHUSIASTS
// wander solo, COMFORT seekers stroll as couples. They gather at an exhibit, react to how appealing
// it is for their kind, then leave. It reads as a place people enjoy, and delivering an exhibit
// brings them - value made visible. Calm and capped by default; honours prefers-reduced-motion.

type Pt = { x: number; y: number };
type Appeal = { families: number; enthusiasts: number; comfortSeekers: number };
export type Attraction = Pt & { hh: number; appeal: Appeal };

const SEG: Record<SegmentId, string> = { families: '#ef6f53', enthusiasts: '#4a90d9', comfortSeekers: '#43a047' };
const SKIN = '#f1c9a0';

type Role = 'adult' | 'kid' | 'pram';
interface Member { role: Role; ox: number; oy: number; x: number; y: number; vx: number; vy: number; color: string; phase: number; hand: boolean; }
interface Party {
  seg: SegmentId; color: string; x: number; y: number; route: Pt[]; ri: number;
  state: 'arriving' | 'toExhibit' | 'viewing' | 'toFood' | 'atFood' | 'leaving' | 'departing'; target: Attraction | null; food: Pt | null;
  dwell: number; mood: number; emote: 'heart' | 'frown' | 'need' | null; et: number; needy: boolean;
  jx: number; jy: number; speed: number; members: Member[]; homeCar: Pt | null;
}

function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16); const c = (i: number) => Math.min(255, ((n >> i) & 255) + amt);
  return '#' + [c(16), c(8), c(0)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
const rnd = () => Math.random();

interface Inputs { attractions: Attraction[]; food: Pt[]; entrance: Pt; mix: SegmentId[]; W: number; H: number; carPark?: CarParkLayout | null; }

export function VisitorLayer({ attractions, food, entrance, mix, W, H, carPark }: Inputs) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inRef = useRef<Inputs>({ attractions, food, entrance, mix, W, H, carPark });
  useEffect(() => { inRef.current = { attractions, food, entrance, mix, W, H, carPark }; });

  useEffect(() => {
    const canvas0 = canvasRef.current; if (!canvas0) return;
    const ctx0 = canvas0.getContext('2d'); if (!ctx0) return;
    const canvas: HTMLCanvasElement = canvas0;
    const ctx: CanvasRenderingContext2D = ctx0;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const parties: Party[] = [];
    let spawnTimer = 0.4, raf = 0, last = performance.now();

    // A routing midpoint inside the park. The park is the scene minus the car-park apron, so the hub
    // stays in the grounds even though the canvas now extends over the lot below the fence.
    const hub = () => { const I = inRef.current; const parkH = I.carPark ? I.carPark.top : I.H; return { x: I.W / 2, y: parkH * 0.62 }; };
    // Where a party gathers at an exhibit: at the fence, in front of it, never inside.
    const gatherPt = (a: Attraction): Pt => ({ x: a.x + (rnd() - 0.5) * 40, y: a.y + a.hh + 12 + (rnd() - 0.5) * 6 });

    function pickSeg(mix: SegmentId[]): SegmentId {
      // Weight party segments by the current visitor mix (falls back to a family-heavy default).
      const w: Record<SegmentId, number> = { families: 0.5, enthusiasts: 0.22, comfortSeekers: 0.28 };
      if (mix.length) { const t: Record<string, number> = {}; for (const s of mix) t[s] = (t[s] || 0) + 1;
        for (const k of Object.keys(w) as SegmentId[]) w[k] = (t[k] || 0.4); }
      const tot = w.families + w.enthusiasts + w.comfortSeekers; let r = rnd() * tot;
      for (const k of Object.keys(w) as SegmentId[]) { r -= w[k]; if (r <= 0) return k; }
      return 'families';
    }

    function members(seg: SegmentId): Member[] {
      const mk = (role: Role, ox: number, oy: number, color: string): Member => ({ role, ox, oy, x: 0, y: 0, vx: 0, vy: 0, color, phase: rnd() * 6.28, hand: false });
      if (seg === 'families') {
        const c = SEG.families, kidC = lighten(c, 46), m: Member[] = [];
        if (rnd() < 0.35) { m.push(mk('adult', -7, -1, c)); m.push(mk('adult', 7, 0, c)); } else m.push(mk('adult', 0, 0, c));
        const kids = 1 + (rnd() < 0.6 ? 1 : 0), spots: [number, number][] = [[-11, 8], [11, 7], [0, 11]];
        const pram = rnd() < 0.4;
        for (let i = 0; i < kids; i++) { const isPram = pram && i === kids - 1; const k = mk(isPram ? 'pram' : 'kid', spots[i][0], spots[i][1], kidC); k.hand = !isPram && rnd() < 0.6; m.push(k); }
        return m;
      }
      if (seg === 'comfortSeekers') { const c = SEG.comfortSeekers; return rnd() < 0.55 ? [mk('adult', -6, 0, c), mk('adult', 6, 0, c)] : [mk('adult', 0, 0, c)]; }
      return [mk('adult', 0, 0, SEG.enthusiasts)];
    }

    function spawn() {
      const I = inRef.current; if (!I.attractions.length) return;
      const seg = pickSeg(I.mix), target = I.attractions[(rnd() * I.attractions.length) | 0];
      const cp = I.carPark;
      // Arrive from a parked car (or coach) in the lot when there is one; otherwise appear at the gate.
      let x: number, y: number, state: Party['state'], route: Pt[], homeCar: Pt | null;
      if (cp && cp.spots.length) {
        const s = cp.spots[(rnd() * cp.spots.length) | 0];
        x = s.x + (rnd() - 0.5) * 10; y = s.y - (s.bus ? 50 : 24) - 6; // step out in front, toward the gate
        homeCar = { x: s.x, y: s.y }; state = 'arriving'; route = [];
      } else {
        x = I.entrance.x + (rnd() - 0.5) * 40; y = I.entrance.y;
        state = 'toExhibit'; route = [hub(), gatherPt(target)]; homeCar = null;
      }
      const p: Party = {
        seg, color: SEG[seg], x, y, route, ri: 0, state, target, food: null,
        dwell: 0, mood: 0, emote: null, et: 0, needy: seg !== 'enthusiasts' && rnd() < 0.3,
        jx: (rnd() - 0.5) * 40, jy: (rnd() - 0.5) * 12, speed: 46 + rnd() * 24, members: members(seg), homeCar,
      };
      for (const m of p.members) { m.x = p.x + m.ox; m.y = p.y + m.oy; m.vx = m.x; m.vy = m.y; }
      parties.push(p);
    }

    // Steer a party through the lot toward `targetX`, going `dir` (-1 up to the gate, +1 down to a
    // car), sliding around the parked footprints so guests walk between the cars, never over them.
    function apronSteer(p: Party, dir: number, targetX: number, dt: number) {
      const cp = inRef.current.carPark; if (!cp) return;
      let vx = Math.max(-0.6, Math.min(0.6, (targetX - p.x) * 0.02)), vy = dir;
      for (const o of cp.obstacles) {
        const margin = 9, look = 18;
        const nearX = p.x > o.x0 - margin && p.x < o.x1 + margin;
        const ahead = dir < 0 ? (p.y > o.y0 - 2 && p.y < o.y1 + margin + look) : (p.y < o.y1 + 2 && p.y > o.y0 - margin - look);
        if (nearX && ahead) {
          const toLeft = p.x - (o.x0 - margin), toRight = (o.x1 + margin) - p.x;
          const depth = 1 - Math.min(toLeft, toRight) / (o.x1 - o.x0 + 2 * margin);
          vx += (toLeft < toRight ? -1 : 1) * (1.2 + 1.4 * depth); vy *= 0.25;
        }
      }
      const m = Math.hypot(vx, vy) || 1, sp = p.speed * dt;
      p.x += vx / m * sp; p.y += vy / m * sp;
    }

    function arrive(p: Party) {
      p.state = 'viewing'; p.dwell = 2 + rnd() * 2.6;
      const a = p.target!; const ap = a.appeal[p.seg];
      const crowd = parties.filter((o) => o.state === 'viewing' && o.target === a).length;
      p.mood = Math.max(-1, Math.min(1, (ap - (p.seg === 'comfortSeekers' ? Math.max(0, crowd - 4) * 0.1 : 0)) * 2 - 0.6));
      if (p.mood > 0.3) p.emote = 'heart'; else if (p.mood < -0.2) p.emote = 'frown';
      p.et = p.dwell;
      // Kids press up to the fence (front edge), the grown-ups hang back a little - all OUTSIDE it.
      p.members.forEach((m, i) => {
        const spread = (i - (p.members.length - 1) / 2) * 13 + (rnd() - 0.5) * 4;
        m.vx = a.x + spread; m.vy = a.y + a.hh + (m.role === 'adult' ? 22 : 6);
      });
    }
    function afterView(p: Party) {
      const I = inRef.current;
      if (p.needy && I.food.length) { p.food = I.food.reduce((b, f) => (Math.hypot(f.x - p.x, f.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? f : b));
        p.route = [hub(), { x: p.food.x + (rnd() - 0.5) * 24, y: p.food.y + 30 }]; p.ri = 0; p.state = 'toFood'; }
      else { if (p.needy) { p.emote = 'need'; p.et = 1.6; p.mood = -0.7; } leave(p); }
    }
    function leave(p: Party) { p.state = 'leaving'; p.route = [hub(), inRef.current.entrance]; p.ri = 0; }

    function step(dt: number) {
      const I = inRef.current;
      spawnTimer -= dt;
      if (spawnTimer <= 0 && parties.length < 16 && I.attractions.length) { spawn(); spawnTimer = 1 + rnd() * 1.1; }

      for (let i = parties.length - 1; i >= 0; i--) {
        const p = parties[i];
        if (p.emote) { p.et -= dt; if (p.et <= 0) p.emote = null; }
        const moving = p.state === 'arriving' || p.state === 'toExhibit' || p.state === 'toFood' || p.state === 'leaving' || p.state === 'departing';

        if (p.state === 'arriving') {
          // Walk up out of the lot to the gate, then join the park and head for the exhibit.
          apronSteer(p, -1, I.entrance.x, dt);
          if (p.y <= I.entrance.y) { p.state = 'toExhibit'; p.route = [hub(), gatherPt(p.target!)]; p.ri = 0; }
        } else if (p.state === 'departing') {
          // Back down through the lot to the car they came in, then they are gone.
          const hc = p.homeCar!; apronSteer(p, 1, hc.x, dt);
          if (p.y >= hc.y - 2) { parties.splice(i, 1); continue; }
        } else if (p.state === 'viewing' || p.state === 'atFood') {
          p.dwell -= dt; if (p.dwell <= 0) { if (p.state === 'viewing') afterView(p); else leave(p); }
        } else if (p.route.length) {
          const dest = p.route[p.ri], dx = dest.x - p.x, dy = dest.y - p.y, d = Math.hypot(dx, dy) || 1, sd = p.speed * dt;
          if (d <= sd + 1) { p.x = dest.x; p.y = dest.y; p.ri++;
            if (p.ri >= p.route.length) {
              if (p.state === 'toExhibit') arrive(p);
              else if (p.state === 'toFood') { p.state = 'atFood'; p.dwell = 1.1; p.emote = 'heart'; p.et = 1.3; p.mood = 0.5; }
              else if (I.carPark && p.homeCar) { p.state = 'departing'; p.route = []; } // at the gate: walk back to the car
              else { parties.splice(i, 1); continue; }
            }
          } else { p.x += dx / d * sd; p.y += dy / d * sd; }
        }
        // members follow the leader (walking) or take their viewing spots
        const viewing = p.state === 'viewing' || p.state === 'atFood';
        for (const m of p.members) {
          const tx = viewing ? m.vx : p.x + m.ox, ty = viewing ? m.vy : p.y + m.oy;
          const rate = m.role === 'kid' || m.role === 'pram' ? 9 : 15, k = reduce ? 1 : 1 - Math.exp(-rate * dt);
          m.x += (tx - m.x) * k; m.y += (ty - m.y) * k;
          m.phase += dt * (m.role === 'adult' ? 6.5 : 10) * (moving ? 1 : 0.4);
        }
      }
    }

    // ---- draw -----------------------------------------------------------
    function rr(x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function member(m: Member, moving: boolean) {
      const kid = m.role === 'kid', pram = m.role === 'pram';
      const amp = reduce ? 0 : (moving ? (kid ? 2.4 : pram ? 0 : 1.4) : (kid ? 0.8 : 0.4));
      const x = m.x, y = m.y + Math.sin(m.phase) * amp;
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(x, m.y + (kid ? 5 : 7), kid ? 4.4 : 6, kid ? 1.8 : 2.4, 0, 0, 6.29); ctx.fill();
      if (pram) { // a little stroller
        ctx.fillStyle = '#4a5560'; ctx.beginPath(); ctx.arc(x - 3, m.y + 5, 2, 0, 6.29); ctx.arc(x + 3, m.y + 5, 2, 0, 6.29); ctx.fill();
        ctx.fillStyle = m.color; rr(x - 5, y - 6, 10, 8, 3); ctx.fill();
        ctx.fillStyle = lighten(m.color, -30); rr(x - 5, y - 8, 6, 6, 3); ctx.fill();
        return;
      }
      const bw = kid ? 6 : 9, bh = kid ? 8 : 11, hr = kid ? 3 : 4, top = kid ? y - 2 : y - 4, hy = kid ? y - 6 : y - 8;
      ctx.fillStyle = m.color; rr(x - bw / 2, top, bw, bh, bw * 0.42); ctx.fill();
      ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(x, hy, hr, 0, 6.29); ctx.fill();
    }
    function emote(x: number, y: number, type: string) {
      ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 8, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 2.6, y + 6.5); ctx.lineTo(x + 2.6, y + 6.5); ctx.lineTo(x, y + 10.5); ctx.closePath(); ctx.fill();
      if (type === 'heart') {
        ctx.fillStyle = '#ef4d5f'; const s = 8.5, hx = x, hy = y - 4;
        ctx.beginPath(); ctx.moveTo(hx, hy + s * .3);
        ctx.bezierCurveTo(hx, hy, hx - s * .5, hy, hx - s * .5, hy + s * .3);
        ctx.bezierCurveTo(hx - s * .5, hy + s * .58, hx, hy + s * .82, hx, hy + s);
        ctx.bezierCurveTo(hx, hy + s * .82, hx + s * .5, hy + s * .58, hx + s * .5, hy + s * .3);
        ctx.bezierCurveTo(hx + s * .5, hy, hx, hy, hx, hy + s * .3); ctx.fill();
      } else if (type === 'need') {
        ctx.fillStyle = '#e6a11a'; ctx.font = '900 12px ui-rounded, system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', x, y - 0.5); ctx.textBaseline = 'alphabetic';
      } else {
        ctx.strokeStyle = '#7a8087'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y + 3, 3.2, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        ctx.fillStyle = '#7a8087'; ctx.beginPath(); ctx.arc(x - 2.6, y - 1.5, 1.1, 0, 6.29); ctx.arc(x + 2.6, y - 1.5, 1.1, 0, 6.29); ctx.fill();
      }
      ctx.restore();
    }
    function party(p: Party) {
      const moving = p.state === 'toExhibit' || p.state === 'toFood' || p.state === 'leaving';
      // held hands: a short skin-tone link from a hand-holding kid to the nearest adult
      const adults = p.members.filter((m) => m.role === 'adult');
      if (adults.length) for (const m of p.members) if (m.hand) {
        const a = adults.reduce((b, o) => (Math.hypot(o.x - m.x, o.y - m.y) < Math.hypot(b.x - m.x, b.y - m.y) ? o : b));
        if (Math.hypot(a.x - m.x, a.y - m.y) < 20) { ctx.strokeStyle = SKIN; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(a.x, a.y + 1); ctx.lineTo(m.x, m.y - 1); ctx.stroke(); }
      }
      for (const m of [...p.members].sort((a, b) => a.y - b.y)) member(m, moving);
      if (p.emote) { const lead = p.members[0]; emote(lead.x, lead.y - (lead.role === 'adult' ? 21 : 16), p.emote); }
    }

    function draw() {
      const I = inRef.current;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cw = canvas.clientWidth || I.W, ch = canvas.clientHeight || I.H;
      if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) { canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr); }
      const s = (cw / I.W) * dpr;
      ctx.setTransform(s, 0, 0, s, 0, 0);
      ctx.clearRect(0, 0, I.W, I.H);
      if (I.carPark) drawCarPark(ctx, I.carPark); // the lot sits below the fence, under the guests
      for (const p of [...parties].sort((a, b) => a.y - b.y)) party(p);
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      step(reduce ? dt * 0.6 : dt); draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 z-10 h-full w-full" />;
}
