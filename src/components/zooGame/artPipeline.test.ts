import { describe, it, expect } from 'vitest';
import { slim, namespaceIds } from '../../../scripts/lib/svg-sheet.mjs';
import { chromium } from 'playwright';
import { regionsOf, cutIslands } from '../../../scripts/lib/svg-clusters.mjs';

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

describe('lifting a drawing that refers to itself', () => {
  it('gives its ids a prefix, and repoints what pointed at them', () => {
    // A drawing that clips itself carries ids that were unique on the sheet and are not unique on a
    // page holding two copies of it. The second copy would borrow the first one's clip path.
    const markup = '<g><clipPath id="SVGID_7"><path d="M0,0"/></clipPath><path clip-path="url(#SVGID_7)" d="M1,1"/></g>';
    const out = namespaceIds(markup, 'kiosk')!;
    expect(out).toContain('id="kiosk_SVGID_7"');
    expect(out).toContain('url(#kiosk_SVGID_7)');
    expect(out).not.toMatch(/url\(#SVGID_7\)/);
  });

  it('refuses a drawing whose definitions live somewhere else on the sheet', () => {
    // This one genuinely cannot be salvaged: the definition would be left behind on the sheet.
    expect(namespaceIds('<g><path fill="url(#elsewhere)" d="M0,0"/></g>', 'kiosk')).toBeNull();
  });

  it('leaves a drawing that refers to nothing exactly as it was', () => {
    const plain = '<g><path fill="#abc123" d="M0,0"/></g>';
    expect(namespaceIds(plain, 'tree')).toBe(plain);
  });
});

/** A drawing that arrives standing on something: a shop on its own patch of pavement and road.
 *  The base is the one thing bigger than the thing on it, which is what makes it separable. */
const DIORAMA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <polygon points="5,60 50,40 95,60 50,80" fill="#607d8b"/>
  <rect x="40" y="20" width="20" height="25" fill="#ffb74d"/>
  <rect x="44" y="30" width="6" height="8" fill="#42a5f5"/>
</svg>`;

describe('lifting a drawing off the base it came on', () => {
  it('drops the base and keeps what stood on it', async () => {
    const browser = await chromium.launch();
    try {
      const [region] = await regionsOf(browser, DIORAMA, [{ name: 'shop', box: [0, 0, 100, 100] }]);
      const [whole] = await cutIslands(browser, DIORAMA, [{ name: 'shop', members: region.members }]);
      expect(whole.body).toContain('#607d8b'); // the base is still there
      const [lifted] = await cutIslands(browser, DIORAMA, [{ name: 'shop', members: region.members, dropLargerThan: 2000 }]);
      expect(lifted.body).not.toContain('#607d8b'); // and now it is not
      expect(lifted.body).toContain('#ffb74d');     // while the building is
      expect(lifted.body).toContain('#42a5f5');     // window and all
      // The box shrinks to what is left, so the building is not sized to allow for a base it no
      // longer has - the same trap the flamingo's shadow set.
      expect(lifted.box!.h).toBeLessThan(whole.box!.h);
    } finally {
      await browser.close();
    }
  }, 60_000);
});
