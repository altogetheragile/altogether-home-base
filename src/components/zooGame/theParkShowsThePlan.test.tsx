import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { IsoZoo } from './IsoZoo';
import { initialZooState, DEFAULT_BRIEF } from './config';
import { writeBacklog, splitEpic, estimateItem, planSprint } from './engine';
import type { ZooGameState } from './types';
import { parkPlans } from './parkPlans';

// "Every step shows on the park" (docs/ZOO_GAME_FLOW.md). Before the first Sprint the park was
// empty grass with faint, nameless plots. Plans are a layer of their own over it - never part of
// the Increment, which is only what is Done.

const written = () => writeBacklog(initialZooState(1), DEFAULT_BRIEF);
const refined = () => {
  const w = written();
  let s = splitEpic(w, 'bigcats', (w.backlog.find((it) => it.id === 'bigcats')?.epicMembers ?? []).map((m) => m.id));
  for (const it of s.backlog.filter((x) => x.unsized && x.category !== 'epic' && x.category !== 'need')) s = estimateItem(s, it.id, 3);
  return s;
};
const forecast = () => {
  const s = refined();
  return planSprint({ ...s, phase: 'planning' } as ZooGameState, ['lion-enc', 'lion']);
};

describe('the plans on the park', () => {
  it('names each plot with what its area is waiting for', () => {
    const labels = parkPlans(written()).plots.map((p) => p.label);
    expect(labels).toContain('Big Cats: an epic to split');
    expect(labels.every((l) => /an epic to split/.test(l))).toBe(true);
    expect(parkPlans(refined()).plots.find((p) => p.zone === 'Big Cats')?.label).toBe('Big Cats: 7 Ready');
  });

  it('outlines Ready work where it will stand, in its own area, and nothing that is not Ready', () => {
    const s = refined();
    const { outlines, plots } = parkPlans(s);
    expect(outlines.map((o) => o.id).sort()).toEqual(['kiosk', 'leopard-enc', 'lion-enc', 'tiger-enc']);
    const plot = plots.find((p) => p.zone === 'Big Cats')!.plot;
    for (const o of outlines) {
      expect(o.x, o.name).toBeGreaterThan(plot.x0);
      expect(o.x, o.name).toBeLessThan(plot.x1);
      expect(o.y, o.name).toBeGreaterThan(plot.y0);
      expect(o.y, o.name).toBeLessThan(plot.y1);
    }
    // No two in one place.
    expect(new Set(outlines.map((o) => `${o.x},${o.y}`)).size).toBe(outlines.length);
    expect(parkPlans(written()).outlines).toEqual([]);
  });

  it('lights what the forecast is building this Sprint', () => {
    const { outlines, plots } = parkPlans(forecast());
    expect(outlines.filter((o) => o.forecast).map((o) => o.id)).toEqual(['lion-enc']);
    expect(plots.find((p) => p.zone === 'Big Cats')?.label).toMatch(/^Big Cats: 2 this Sprint/);
  });

  it('is drawn only when asked for, and never as part of the Increment', () => {
    const s = { ...forecast(), phase: 'sprint' } as ZooGameState;
    const without = render(<IsoZoo state={s} />).container;
    expect(without.querySelector('[data-part="plan-outline"]')).toBeNull();
    expect(without.querySelector('[data-part="plan-label"]')).toBeNull();
    const withPlans = render(<IsoZoo state={s} plans />).container;
    expect(withPlans.querySelectorAll('[data-part="plan-outline"]').length).toBe(4);
    expect(withPlans.querySelector('[data-part="plan-outline"][data-forecast="yes"]')?.getAttribute('data-item')).toBe('lion-enc');
    expect(withPlans.querySelector('[data-part="plan-name"]')?.textContent).toBe('Lion Enclosure');
    expect(withPlans.querySelector('[data-plot="Big Cats"][data-part="plan-label"]')?.textContent).toMatch(/Big Cats:/);
  });
});
