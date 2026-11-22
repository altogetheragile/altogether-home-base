import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkPlan } from './ParkPlan';
import { initialZooState } from './config';
import { startOnTheBoard } from './engine';
import { reducer } from './useZooGame';
import type { ZooGameState } from './types';

// From the twenty-second scrum-master playtest (playtest-report-sm22).

const started = (): ZooGameState => {
  const s = startOnTheBoard(initialZooState(1) as ZooGameState);
  const first = s.backlog.find((it) => it.status === 'committed')!;
  return reducer(s, { type: 'START_ITEM', id: first.id });
};
const where = (c: HTMLElement) => c.querySelector('[data-part="pen-where"]')?.textContent ?? '';

describe('the keyboard pen, away from both ends', () => {
  // "'The nearest path from the way in is 9 paces right and 3 paces down. The Tiger Enclosure is 14
  // paces left and 11 paces down.' I need to walk 9 right ..." - then walked back, and lost a dozen
  // steps finding out which one to go to first.
  it('says a path joins two ends, and to start at either and walk to the other', () => {
    const s = started();
    const forItem = s.backlog.find((it) => it.status === 'committed')!;
    const c = render(
      <MemoryRouter>
        <ParkPlan state={s} tool="path" runFor={forItem.id} onAddConnector={() => {}} onPlaceItem={() => {}} />
      </MemoryRouter>,
    ).container;
    const park = c.querySelector('[data-part="park-plan"]') as SVGSVGElement;
    fireEvent.focus(park);
    fireEvent.keyDown(park, { key: 'ArrowRight', shiftKey: true });
    fireEvent.keyDown(park, { key: 'ArrowRight', shiftKey: true });
    const said = where(c);
    expect(said).toMatch(/^No path started yet\. A path joins two ends: the nearest path from the way in is .*paces/);
    expect(said).toMatch(new RegExp(`The ${forItem.name} is \\d+ paces .*\\(its door\\)\\.`));
    expect(said).toMatch(/Walk to either end and press Enter to start, then walk to the other\.$/);
  });
});

describe('holding the refinement planned into the Sprint', () => {
  // "I'm not sure whether clicking that costs me build time immediately or just reserves time" -
  // asked six times. It said it cost the day's build time, and since #418 it cost nothing.
  it('takes its time off today’s clock as soon as it is held', async () => {
    const { holdPlannedRefinement } = await import('./engine');
    const { PLANNED_REFINE_SECONDS } = await import('./config');
    const s = { ...started(), sprintRefinement: { points: 2, done: false }, daySecondsLeft: 200, refinePenalty: 0 } as ZooGameState;
    const after = holdPlannedRefinement(s);
    expect(after.sprintRefinement?.done).toBe(true);
    expect(after.daySecondsLeft).toBe(200 - 2 * PLANNED_REFINE_SECONDS);
    expect(after.refinePenalty).toBe(2 * PLANNED_REFINE_SECONDS);
  });
});
