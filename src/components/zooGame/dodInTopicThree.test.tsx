import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintPlanning } from './SprintPlanning';
import { ParkPlan } from './ParkPlan';
import { initialZooState, DEFAULT_DOD } from './config';
import { availableItems, notReady } from './engine';
import type { ZooGameState } from './types';

const noop = () => {};

describe('topic three of Sprint Planning', () => {
  // "How can I access the DoD? I'm in Topic 3 of Sprint Planning. I can't see the definition of
  // done. There is a task added ... about the PO signing off." (23 November 2026)
  it('shows the Definition of Done beside the plans, and which line becomes a step', () => {
    const init = initialZooState(1);
    const one = availableItems(init).find((it) => notReady(it, init) === null)!;
    const s = { ...init, phase: 'planning', planningTopic: 'how', forecast: [one.id], sprintGoal: 'Open the lions', sprintGoalAgreed: ['developer'] } as unknown as ZooGameState;
    const c = render(
      <MemoryRouter>
        <SprintPlanning state={s} onPlan={noop} onSetForecast={noop} onSetSprintGoal={noop}
          onEstimate={noop} onSetTasks={noop} onPlanShape={noop} onToggleGoalCritical={noop}
          onReorderForecast={noop} onRefine={noop} onTakeSignal={noop} onSplitEpic={noop} />
      </MemoryRouter>,
    ).container;
    const dod = c.querySelector('[data-part="plan-dod"]');
    expect(dod, 'no Definition of Done in topic three').toBeTruthy();
    for (const line of DEFAULT_DOD) expect(dod!.textContent).toContain(line);
    expect(dod!.textContent).toMatch(/sign-off becomes a step in each plan: this game.s rule, not the Guide.s/);
    expect(dod!.textContent).toMatch(/peer review is met when more than one Developer has worked the item/);
  });
});

describe('the park plan', () => {
  // "The river crosses over the top of the border trees. The trees should be above the river."
  it('draws the river before the treeline, so the trees stand over it', () => {
    const c = render(<MemoryRouter><ParkPlan state={initialZooState(1)} onPlaceItem={noop} /></MemoryRouter>).container;
    const river = c.querySelector('[data-part="river"]')!;
    const tree = c.querySelector('[data-tree]')!;
    expect(river && tree, 'river or trees missing').toBeTruthy();
    expect(river.compareDocumentPosition(tree) & Node.DOCUMENT_POSITION_FOLLOWING, 'the river is drawn over the trees').toBeTruthy();
  });
});
