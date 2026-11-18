import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { SEAT } from './seats';
import { labelOn } from './board/personShape';

// Words that can be read, on the paper they are written on.
//
// Measured on 20 screens (18 Nov 2026), 282 of 2,132 pieces of text were under WCAG AA - most of
// them one habit, the muted colour faded to 40-80% for anything secondary, and the rest a handful
// of colours that are fills being used as words. "The blue dots numbering the plan have black text
// which is very hard to read." These pin the colours, and the habit, so it does not drift back.

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lum = (h: string) => {
  const [r, g, b] = hex(h).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const hsl = (h: number, s: number, l: number) => {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
};

const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf8');
const zoo = css.slice(css.indexOf('.zoo-theme {'));
const token = (name: string) => {
  const m = zoo.match(new RegExp(`--${name}:\\s*([\\d.]+)\\s+([\\d.]+)%\\s+([\\d.]+)%`));
  if (!m) throw new Error(`--${name} is not an hsl triple in .zoo-theme`);
  return hsl(Number(m[1]), Number(m[2]), Number(m[3]));
};
const PAPER = token('zoo-paper');
const CARD = token('card');
const TAN = token('muted');

describe('the quiet words', () => {
  it('read on the paper, on a card and on a tan panel', () => {
    for (const name of ['muted-foreground', 'zoo-quiet']) {
      for (const [where, bg] of [['the paper', PAPER], ['a card', CARD], ['a tan panel', TAN]] as const) {
        expect(ratio(token(name), bg), `--${name} on ${where}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('are never the muted colour faded', () => {
    // The habit itself. text-muted-foreground/70 on the paper is 3.2:1, and /50 is 2.2.
    const dir = __dirname;
    const files = readdirSync(dir, { recursive: true }) as string[];
    const faded = files
      .filter((f) => /\.tsx$/.test(f) && !/\.test\./.test(f) && statSync(join(dir, f)).isFile())
      .filter((f) => /(?<![:\w-])text-muted-foreground\/\d+/.test(readFileSync(join(dir, f), 'utf8')));
    expect(faded, 'faded muted text: use text-zoo-quiet').toEqual([]);
  });
});

describe('each seat, as words', () => {
  it('reads on the paper', () => {
    for (const [seat, v] of Object.entries(SEAT)) {
      expect(ratio(v.ink, PAPER), `${seat}'s words on the paper`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('carries white words when it is a fill under them', () => {
    expect(ratio('#ffffff', SEAT.developers.ink), 'your own chat bubble').toBeGreaterThanOrEqual(4.5);
  });

  it('puts the letters on a figure in whichever of white or ink reads', () => {
    expect(labelOn(SEAT.productOwner.hex), 'white on her orange was 2.2:1').not.toBe('#fff');
    expect(ratio(labelOn(SEAT.productOwner.hex), SEAT.productOwner.hex)).toBeGreaterThanOrEqual(4.5);
    expect(labelOn(SEAT.scrumMaster.hex)).toBe('#fff');
  });
});

describe('the numbered marks', () => {
  it('are white on the blue', () => {
    expect(ratio('#ffffff', token('primary'))).toBeGreaterThanOrEqual(4.5);
  });
});
