import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintPlanning } from './SprintPlanning';
import { initialZooState } from './config';
import { availableItems, notReady } from './engine';
import type { ZooGameState } from './types';

// "The initial pages suggested the 10 points worth of stories would be enough. Step 2 in Sprint
// Planning is suggesting estimated velocity is 21 points" (23 November 2026).

const noop = () => {};
const planning = (s: ZooGameState) => render(
  <MemoryRouter>
    <SprintPlanning state={s} onPlan={noop} onSetForecast={noop} onSetSprintGoal={noop}
      onEstimate={noop} onSetTasks={noop} onPlanShape={noop} onToggleGoalCritical={noop}
      onReorderForecast={noop} onRefine={noop} onTakeSignal={noop} onSplitEpic={noop} />
  </MemoryRouter>,
).container;
// Only the forecast items are sized, as in the screenshot: 10 pts ready, the rest still "?".
const topicTwo = (forecast: string[], sized = forecast) => {
  const init = initialZooState(1);
  const base = { ...init, backlog: init.backlog.map((it) => (sized.includes(it.id) ? it : { ...it, unsized: true })) };
  return { ...base, phase: 'planning', planningTopic: 'what', forecast, sprintGoal: 'Open the lions', sprintGoalAgreed: ['developer'] } as unknown as ZooGameState;
};

describe('topic two, when the ready work runs out before the first guess does', () => {
  const all = availableItems(initialZooState(1)).filter((it) => notReady(it, initialZooState(1)) === null);
  // Ready items adding up to less than a Sprint.
  const ready = all.reduce<typeof all>((got, it) => (got.reduce((n, g) => n + g.estimate, 0) + it.estimate < 21 ? [...got, it] : got), []);

  it('says Refinement aimed to begin the Sprint, not to fill it, and what the rest is for', () => {
    const total = ready.reduce((n, it) => n + it.estimate, 0);
    expect(total, 'this test needs less ready work than a Sprint').toBeLessThan(21);
    const said = planning(topicTwo(ready.map((it) => it.id))).querySelector('[data-part="ready-ran-out"]')?.textContent ?? '';
    expect(said).toMatch(/That is all the ready work\. Refinement aimed for about 11 pts, enough to begin rather than to fill the Sprint/);
    expect(said).toContain(`the other ${21 - total} pts`);
  });

  it('says nothing while there is still ready work to pull', () => {
    expect(ready.length, 'this test needs two ready items').toBeGreaterThan(1);
    expect(planning(topicTwo([ready[0].id], ready.map((it) => it.id))).querySelector('[data-part="ready-ran-out"]')).toBeNull();
  });
});

describe('how much ready work is left for the next Planning', () => {
  // The screenshot said "About 0.5 Sprints of ready work is waiting" while the Sprint took all of it.
  it('does not count what is going into this Sprint', () => {
    const init = initialZooState(1);
    const ready = availableItems(init).filter((it) => notReady(it, init) === null);
    const one = ready[0];
    const s = { ...init, phase: 'planning', planningTopic: 'what', forecast: [one.id], sprintGoal: 'Open the lions', sprintGoalAgreed: ['developer'],
      backlog: init.backlog.map((it) => (it.id === one.id ? it : { ...it, unsized: true })) } as unknown as ZooGameState;
    const text = planning(s).querySelector('[data-part="refine-points"]')?.textContent ?? '';
    expect(text).toMatch(/With these in the Sprint, no ready work is left for the next Planning\./);
    expect(text).not.toMatch(/Sprints? of ready work is waiting/);
  });
});
