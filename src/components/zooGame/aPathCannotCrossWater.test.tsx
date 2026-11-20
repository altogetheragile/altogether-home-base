import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkPlan } from './ParkPlan';
import { initialZooState } from './config';
import { startOnTheBoard } from './engine';
import { reducer } from './useZooGame';
import type { ZooGameState, ZooConnector } from './types';
import { checkCriterion } from './parkChecks';

// sm17: the Tiger Enclosure stood across the river from the way in. The pen steered the player
// straight down at the promenade, through the water, said "This joins the path from the way in", and
// the criterion called what was laid "3 paces short" - five tries, twenty steps, and the Sprint ended
// with it unfinished. A path cannot cross water without a bridge; neither screen said so.

const WALK = 'Can I walk to it from the way in?';
/** The first item started, standing across the river from the way in. */
const acrossTheRiver = (): { s: ZooGameState; id: string } => {
  const s0 = startOnTheBoard(initialZooState(1) as ZooGameState);
  const id = s0.backlog.find((it) => it.status === 'committed')!.id;
  const s = reducer(s0, { type: 'START_ITEM', id });
  return { s: { ...s, backlog: s.backlog.map((it) => (it.id === id ? { ...it, pos: { x: 440, y: 220 } } : it)) } as ZooGameState, id };
};
const pen = (s: ZooGameState, id: string, onAdd: (c: ZooConnector) => void = () => {}) => {
  const c = render(<MemoryRouter><ParkPlan state={s} tool="path" runFor={id} onAddConnector={onAdd} onPlaceItem={() => {}} /></MemoryRouter>).container;
  const park = c.querySelector('[data-part="park-plan"]') as SVGSVGElement;
  fireEvent.focus(park);
  return { park, where: () => c.querySelector('[data-part="pen-where"]')?.textContent ?? '' };
};

describe('a path across the river', () => {
  it('the criterion says the water is in the way, not that nothing reaches it', () => {
    const { s, id } = acrossTheRiver();
    const v = checkCriterion(s, s.backlog.find((it) => it.id === id)!, WALK);
    expect(v?.met).toBe(false);
    expect(v?.evidence).toMatch(/water is in the way.*Bridge would/);
  });

  it('...and still says so with a path laid into the river, rather than "N paces short"', () => {
    const { s, id } = acrossTheRiver();
    let laid = s;
    const { park } = pen(s, id, (c) => { laid = { ...laid, connectors: [...(laid.connectors ?? []), c] }; });
    fireEvent.keyDown(park, { key: 'Enter' });
    for (let i = 0; i < 52; i += 1) fireEvent.keyDown(park, { key: 'ArrowDown' });
    fireEvent.keyDown(park, { key: 'Enter' });
    expect(laid.connectors.length, 'nothing was laid').toBeGreaterThan(s.connectors.length);
    const v = checkCriterion(laid, laid.backlog.find((it) => it.id === id)!, WALK);
    expect(v?.evidence).not.toMatch(/short/);
    expect(v?.evidence).toMatch(/water is in the way/);
  });

  it('the pen does not steer at a path across the water', () => {
    const { s, id } = acrossTheRiver();
    const { where } = pen(s, id);
    expect(where()).toMatch(/Every path from the way in is across the water from here/);
    expect(where()).not.toMatch(/nearest path from the way in is/);
  });

  it('the pen says a leg crosses the water, and never that it joins', () => {
    const { s, id } = acrossTheRiver();
    const { park, where } = pen(s, id);
    fireEvent.keyDown(park, { key: 'Enter' });
    const said: string[] = [];
    for (let i = 0; i < 52; i += 1) { fireEvent.keyDown(park, { key: 'ArrowDown' }); said.push(where()); }
    expect(said.some((w) => /crosses the water/.test(w)), said.slice(-1)[0]).toBe(true);
    expect(said.some((w) => /joins the path/.test(w)), 'it said the path joins across the river').toBe(false);
  });
});
