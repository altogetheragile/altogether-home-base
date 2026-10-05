import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkPlan } from './ParkPlan';
import { initialZooState } from './config';
import { zonePlots, plotOrder } from './parkZones';
import type { ZooGameState, BacklogItem } from './types';

// Names on the park, when two things stand next to each other.
//
// Every built thing wore its name AND its state - "Toilets · nothing chosen yet" - which is three
// times the width for something the build strip's chip already says about whatever is selected.
// Two small things side by side and the two labels sat on top of each other: "the text labels on
// multiple items overlap and get in the way."

/** Two small things, side by side, with names long enough to collide. */
const crowded = (): ZooGameState => {
  const base = initialZooState(1);
  const near = base.backlog.filter((it) => it.category === 'amenity').slice(0, 2);
  expect(near.length, 'no pair of small things to crowd together').toBe(2);
  const at = [{ x: 300, y: 500 }, { x: 340, y: 500 }];
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    backlog: base.backlog.map((it) => {
      const k = near.findIndex((n) => n.id === it.id);
      if (k < 0) return it;
      return { ...it, status: 'committed' as const, sprintNumber: 1, started: true, pos: at[k] } as BacklogItem;
    }),
  } as ZooGameState;
};

const labels = (c: Element) => [...c.querySelectorAll('[data-part="park-plan"] text')]
  .map((n) => ({
    text: (n.textContent ?? '').trim(),
    x: Number(n.getAttribute('x')), y: Number(n.getAttribute('y')),
  }))
  .filter((l) => l.text && Number.isFinite(l.x) && Number.isFinite(l.y));

const park = (state: ZooGameState) => render(
  <MemoryRouter><ParkPlan state={state} /></MemoryRouter>,
).container;

describe('a name on the park', () => {
  it('is the name, and not the state as well', () => {
    // The chip says the state of whatever is selected. One question, one place.
    const said = labels(park(crowded())).map((l) => l.text).join(' | ');
    expect(said, 'the park is repeating what the chip says').not.toMatch(/nothing chosen yet/);
    expect(said, 'the park is repeating what the chip says').not.toMatch(/built, not Done/);
  });

  it('names the things that are standing on the park', () => {
    const s = crowded();
    const standing = s.backlog.filter((it) => it.pos).map((it) => it.name);
    const said = labels(park(s)).map((l) => l.text);
    for (const name of standing) expect(said, `${name} is not named on the park`).toContain(name);
  });
});

/** One thing, standing exactly where an area writes its own name. */
const onTheAreaName = (): ZooGameState => {
  const base = initialZooState(1);
  const zone = plotOrder(base)[0];
  const plot = zonePlots(base).get(zone)!;
  const one = base.backlog.find((it) => it.category === 'amenity')!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    backlog: base.backlog.map((it) => (it.id === one.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true,
        pos: { x: plot.x0 + 40, y: plot.y0 + 60 } } as BacklogItem
      : it)),
  } as ZooGameState;
};

describe('two names that would land on each other', () => {
  /** Roughly, the way the park itself estimates it: SVG will not measure text without a DOM. */
  const wide = (text: string) => text.length * 7.2;
  const overlaps = (a: { text: string; x: number; y: number }, z: { text: string; x: number; y: number }) =>
    Math.abs(a.y - z.y) < 15 && Math.abs(a.x - z.x) < (wide(a.text) + wide(z.text)) / 2;

  it('do not', () => {
    const all = labels(park(crowded()));
    expect(all.length, 'nothing is labelled, so nothing is being tested').toBeGreaterThan(2);
    const hit: string[] = [];
    for (let i = 0; i < all.length; i += 1) {
      for (let j = i + 1; j < all.length; j += 1) {
        // The same words twice at the same spot is one label drawn with a halo, not two labels.
        if (all[i].text === all[j].text) continue;
        if (overlaps(all[i], all[j])) hit.push(`${all[i].text} / ${all[j].text}`);
      }
    }
    expect(hit, `these names are drawn on top of each other: ${hit.join(', ')}`).toEqual([]);
  });

  it('do not, when one of them is an area\u2019s own name', () => {
    // The area names are on the park before anything stands on it, at the top-left of each plot.
    // A thing put down there had its own name laid across one, and they are not ours to move.
    const s = onTheAreaName();
    const all = labels(park(s));
    const mine = s.backlog.find((it) => it.pos)!;
    const ours = all.find((l) => l.text === mine.name);
    expect(ours, `${mine.name} is not named on the park`).toBeTruthy();
    for (const other of all) {
      if (other.text === ours!.text) continue;
      expect(overlaps(ours!, other), `${ours!.text} is drawn across ${other.text}`).toBe(false);
    }
  });

  it('are separated by lifting one clear, not by hiding it', () => {
    const s = crowded();
    const standing = s.backlog.filter((it) => it.pos);
    const said = labels(park(s));
    const ys = standing.map((it) => said.find((l) => l.text === it.name)?.y);
    expect(ys.every((y) => y !== undefined), 'a name was dropped rather than moved').toBe(true);
    expect(new Set(ys).size, 'two crowded names are still on the same line').toBe(ys.length);
  });
});
