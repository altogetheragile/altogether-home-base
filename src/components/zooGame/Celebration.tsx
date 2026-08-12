import { useEffect, useRef } from 'react';

/** A short, self-contained confetti burst for celebrating a delivery (Deploy Complete). Re-fires
 *  whenever `trigger` changes to a new truthy value. Pure canvas, no dependencies; cleans itself up.
 *  Respects prefers-reduced-motion (skips the animation). */
export function Celebration({ trigger }: { trigger: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = canvas.clientWidth, H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const colors = ['#f4c430', '#43a047', '#4a90d9', '#ef6f53', '#e6842a', '#a56cc1', '#ffffff'];
    const cx = W / 2, cy = H * 0.32;
    const N = 140;
    const parts = Array.from({ length: N }, () => {
      const a = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      return {
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 20,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 4, // bias upward for a celebratory pop
        size: 5 + Math.random() * 7,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        color: colors[(Math.random() * colors.length) | 0],
        shape: Math.random() < 0.35 ? 'circle' : 'rect',
      };
    });

    let raf = 0;
    const start = performance.now();
    const DURATION = 1500;
    const tick = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, W, H);
      const fade = t < DURATION - 400 ? 1 : Math.max(0, (DURATION - t) / 400);
      for (const p of parts) {
        p.vy += 0.28; // gravity
        p.vx *= 0.99;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size / 1.6);
        ctx.restore();
      }
      if (t < DURATION) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [trigger]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[60] h-full w-full" />;
}
