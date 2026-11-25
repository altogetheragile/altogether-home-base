import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintPlanning } from './SprintPlanning';
import { initialZooState } from './config';
import { availableItems, notReady } from './engine';
import type { ZooGameState } from './types';

// "The wording on the two wizard buttons is confusing. The top one doesn't really suggest that it's
// for all of the user stories. It looks the same as the second wizard button... Maybe move the top
// one" (Al, 25 November 2026). The one for every item sits over the list of every item, in outline;
// the one for a single item names it.

const noop = () => {};
const init = initialZooState(1);
const ready = availableItems(init).filter((it) => notReady(it, init) === null && it.category !== 'epic').slice(0, 2);
const topicThree = { ...init, phase: 'planning', planningTopic: 'how', forecast: ready.map((it) => it.id),
  sprintGoal: 'Open the big cats', sprintGoalAgreed: ['developer'] } as unknown as ZooGameState;
const screen = () => render(
  <MemoryRouter>
    <SprintPlanning state={topicThree} onPlan={noop} onSetForecast={noop} onSetSprintGoal={noop}
      onEstimate={noop} onSetTasks={noop} onPlanShape={noop} onToggleGoalCritical={noop}
      onReorderForecast={noop} onRefine={noop} onTakeSignal={noop} onSplitEpic={noop} />
  </MemoryRouter>,
).container;

describe('the two wands in topic three', () => {
  it('puts the one for every item over the list of items, and says so', () => {
    expect(ready.length, 'this test needs two items in the Sprint').toBe(2);
    const all = screen().querySelector('[data-part="plan-wand-all"]')!;
    expect(all.textContent?.trim()).toBe('Suggest steps for every item in this Sprint (2)');
    expect(all.closest('section'), 'it is still inside the Plan panel, which is about one item').toBeNull();
  });
  it('names the item on the one for a single plan', () => {
    const one = screen().querySelector('[data-part="plan-wand"]');
    expect(one?.textContent?.trim()).toMatch(/^Suggest steps for .+/);
    expect(one?.textContent).not.toMatch(/every item/);
  });
});
