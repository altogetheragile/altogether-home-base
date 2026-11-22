import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintPlanning } from './SprintPlanning';
import { initialZooState } from './config';
import { SCRUM_CARDS } from './scrumContent';
import type { ZooGameState } from './types';

// "The refinement points selector ... sits inside Sprint Planning Topic 3. It feels out of place" -
// five times in sm19, in every run since sm13. Topic two is where the Developers decide how much
// the Sprint can hold, and refinement set aside comes out of that, so it is asked there.

const noop = () => {};
const planning = (topic: 'what' | 'how', over: Partial<ZooGameState> = {}) => render(
  <MemoryRouter>
    <SprintPlanning state={{ ...initialZooState(1), phase: 'planning', planningTopic: topic, sprintGoal: 'A pleasanter park', sprintGoalAgreed: ['developer'], ...over } as ZooGameState}
      onPlan={noop} onSetForecast={noop} onSetSprintGoal={noop}
      onEstimate={noop} onSetTasks={noop} onPlanShape={noop} onToggleGoalCritical={noop}
      onReorderForecast={noop} onRefine={noop} onTakeSignal={noop} onSplitEpic={noop} />
  </MemoryRouter>,
);

describe('refinement is asked in topic two', () => {
  it('is in topic two, beside the total, and not in topic three', () => {
    const two = planning('what');
    expect(two.container.querySelector('[data-part="refine-points"]'), 'not in topic two').toBeTruthy();
    cleanup();
    const three = planning('how');
    expect(three.container.querySelector('[data-part="refine-points"]'), 'still in topic three').toBeNull();
  });

  it('counts what is set aside in the Sprint total, because it comes out of the same capacity', () => {
    const { container } = planning('what');
    const total = () => container.textContent?.match(/(\d+) pts of (\d+)/)?.[1];
    const before = Number(total());
    fireEvent.click(screen.getByRole('button', { name: '2 pts' }));
    expect(Number(total())).toBe(before + 2);
    expect(container.querySelector('[data-part="meter-refining"]')?.textContent).toMatch(/2 pts set aside for refinement/);
  });

  it('the teaching card puts refining during Planning in topic two, as the Guide does', () => {
    const card = SCRUM_CARDS.find((c) => /Topic two/.test(c.how ?? ''))!;
    const two = card.how!.split('Topic three')[0];
    expect(two).toMatch(/refine/);
    expect(card.how!.split('Topic three')[1]).not.toMatch(/refine/);
  });
});
