import { describe, it, expect } from 'vitest';
import { slim } from '../../../scripts/lib/svg-sheet.mjs';

/** Numbers as an SVG path parser would read them: a '-' starts a new number as well as negating it. */
const numbers = (d: string): number[] =>
  (d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number);

describe('trimming a drawing down', () => {
  it('never fuses two coordinates into one', () => {
    // Illustrator writes `0.2-0.008` for two numbers, leaning on the minus as a separator. Rounding
    // the second to zero used to print it as "0", giving `0.20` - one number where there were two,
    // and every coordinate after it in the path shifted by one. The drawing comes apart into
    // slivers and nothing raises an error.
    const d = 'M571.297,185.959c-0.003,0.16-0.008,0.317-0.015,0.472c-0.009,0.155-0.02,0.307-0.032,0.457';
    const out = slim(`<path style="fill:#765069;" d="${d}"/>`);
    const got = out.match(/d="([^"]*)"/)![1];
    expect(numbers(got)).toHaveLength(numbers(d).length);
  });

  it('keeps the sign on a coordinate that rounds away to nothing', () => {
    const out = slim('<path d="M0,0c-0.003,1.5-0.004,2.5"/>');
    expect(out).toContain('-0');
    expect(numbers(out.match(/d="([^"]*)"/)![1])).toHaveLength(numbers('M0,0c-0.003,1.5-0.004,2.5').length);
  });

  it('still rounds, and still turns a style fill into an attribute', () => {
    const out = slim('<path style="fill:#AABBCC;" d="M10.123456,20.987654"/>');
    expect(out).toContain('fill="#AABBCC"');
    expect(out).toContain('10.1');
    expect(out).not.toContain('10.123456');
  });

  it('leaves a whole-number coordinate alone', () => {
    expect(slim('<path d="M10,20L30,40"/>')).toContain('M10,20L30,40');
  });

  it('holds a real path\'s coordinate count across the trim', () => {
    // A curve made entirely of tiny relative steps - the shape most at risk.
    const d = 'M1,1c-0.001,0.002-0.003,0.004-0.005,0.006c-0.007,0.008-0.009,0.01-0.011,0.012';
    const got = slim(`<path d="${d}"/>`).match(/d="([^"]*)"/)![1];
    expect(numbers(got)).toHaveLength(numbers(d).length);
  });
});
