import { describe, it, expect } from 'vitest';
import { union, centreOn, theWork, type Rect } from './frameTheWork';

// Zooming the Increment takes you closer to the zoo.
//
// Reported from playing it: "the zoom does not zoom in to the current work. When I click zoom it
// zooms in and out again partially each time." Two faults in one control. It kept the middle of the
// VIEWPORT where it was, which on a park that is mostly grass means it kept the grass; and it wrote
// the new scroll position before the drawing had grown, so the browser clamped it to the old extent
// and the view slid part of the way and came back.
//
// The arithmetic is here so it can be checked without a browser to measure in.

const r = (left: number, top: number, right: number, bottom: number): Rect => ({ left, top, right, bottom });
const box = (over: Partial<Parameters<typeof centreOn>[1]> = {}) => ({
  rect: r(0, 0, 800, 600), scrollLeft: 0, scrollTop: 0,
  clientWidth: 800, clientHeight: 600, scrollWidth: 2400, scrollHeight: 1800, ...over,
});

describe('what the zoom aims at', () => {
  it('is everything that has been built, taken together', () => {
    const work = union([r(100, 100, 150, 150), r(300, 400, 380, 460)])!;
    expect(work).toEqual(r(100, 100, 380, 460));
  });

  it('ignores anything with no size, which is most of an SVG', () => {
    expect(union([r(10, 10, 10, 10), r(20, 20, 40, 40)])).toEqual(r(20, 20, 40, 40));
  });

  it('has nothing to aim at before anything is built', () => {
    // ...and the caller leaves the view alone rather than scrolling to a corner.
    expect(union([])).toBeNull();
    expect(union([r(5, 5, 5, 5)])).toBeNull();
  });
});

describe('where it scrolls to', () => {
  it('puts the middle of the work in the middle of the box', () => {
    // The work is at 900..1100 on screen with nothing scrolled: its middle is 1000, and a 800-wide
    // box centres that by scrolling to 600.
    const at = centreOn(r(900, 200, 1100, 400), box());
    expect(at.left).toBe(600);
    expect(at.top).toBe(0);   // its middle is 300, which is already the middle of a 600-tall box
  });

  it('counts what is already scrolled past', () => {
    // A rectangle measured on screen says nothing about where it sits in the content until you add
    // back what has been scrolled - which is the arithmetic that made the old version drift.
    const at = centreOn(r(100, 100, 300, 300), box({ scrollLeft: 500, scrollTop: 250 }));
    expect(at.left).toBe(500 + 200 - 400);
    expect(at.top).toBe(250 + 200 - 300);
  });

  it('does not scroll past either end', () => {
    expect(centreOn(r(-2000, -2000, -1900, -1900), box())).toEqual({ left: 0, top: 0 });
    const far = centreOn(r(9000, 9000, 9100, 9100), box());
    expect(far.left, 'it scrolled past the right-hand end').toBe(2400 - 800);
    expect(far.top, 'it scrolled past the bottom').toBe(1800 - 600);
  });

  it('asks for nothing where there is nothing to scroll', () => {
    const still = centreOn(r(100, 100, 200, 200), box({ scrollWidth: 800, scrollHeight: 600 }));
    expect(still).toEqual({ left: 0, top: 0 });
  });
});

describe('what counts as the work', () => {
  // Everything drawn on the park carries its item's id. The union of all of them is the union of the
  // whole zoo, and centring the whole zoo is exactly what the zoom did wrong to begin with - so on a
  // park with a Sprint or two behind it, aiming at "every data-item" would quietly be the old bug
  // again, arrived at by a longer route.
  const drawn = (...ids: string[]) => ids.map((id) => ({ getAttribute: () => id }));

  it('is the thing in hand, and not the zoo it stands in', () => {
    const park = drawn('lion-enc', 'lion-enc', 'penguins-enc', 'toilets', 'trees');
    expect(theWork(park, 'lion-enc').length, 'it framed the whole park').toBe(2);
  });

  it('is the whole zoo when nothing is in hand', () => {
    // Between Sprints there is no work in hand, and then the zoo IS the thing worth looking at.
    const park = drawn('lion-enc', 'toilets');
    expect(theWork(park, null)).toHaveLength(2);
    expect(theWork(park, undefined)).toHaveLength(2);
  });

  it('falls back to the zoo when the thing in hand is not on the park yet', () => {
    // Started, nothing placed. Framing an empty selection would leave the view wherever it was.
    const park = drawn('toilets', 'trees');
    expect(theWork(park, 'lion-enc'), 'it aimed at nothing').toHaveLength(2);
  });
});
