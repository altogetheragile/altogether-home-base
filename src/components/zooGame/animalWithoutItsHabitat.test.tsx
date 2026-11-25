import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintPlanning } from './SprintPlanning';
import { initialZooState } from './config';
import { enclosureOf } from './engine';
import type { ZooGameState } from './types';

// The 26th scrum-master playtest forecast the Tiger and the Leopard without their habitats: the
// velocity was 5 and the Tiger Enclosure was 8. Both animals sat in To Do all Sprint saying "Waits
// for Tiger Enclosure to be Done", with nothing in the Sprint that could ever finish it: "I have no
// Tiger Enclosure or Leopard Enclosure on the board". Topic two now says so when the choice is made.

const noop = () => {};
const planning = (s: ZooGameState) => render(
  <MemoryRouter>
    <SprintPlanning state={s} onPlan={noop} onSetForecast={noop} onSetSprintGoal={noop}
      onEstimate={noop} onSetTasks={noop} onPlanShape={noop} onToggleGoalCritical={noop}
      onReorderForecast={noop} onRefine={noop} onTakeSignal={noop} onSplitEpic={noop} />
  </MemoryRouter>,
).container;
const init = initialZooState(1);
const animal = init.backlog.find((it) => it.category === 'exhibit' && it.enclosureId && !it.unsized)!;
const home = enclosureOf(init, animal)!;
const topicTwo = (forecast: string[]) => ({ ...init, phase: 'planning', planningTopic: 'what', forecast,
  sprintGoal: 'Open the big cats', sprintGoalAgreed: ['developer'] } as unknown as ZooGameState);
const warning = (s: ZooGameState) => planning(s).querySelector('[data-part="waits-outside"]')?.textContent ?? null;

describe('an animal forecast without its habitat', () => {
  it('is said to be unstartable when its habitat is neither Done nor in the Sprint', () => {
    expect(home.status, 'this test needs a habitat that is not Done').not.toMatch(/done|open/);
    expect(warning(topicTwo([animal.id]))).toBe(`${animal.name} waits for ${home.name} to be Done. That habitat is not in this Sprint, so it cannot be started. Add the habitat, or leave the animal for a later Sprint.`);
  });
  it('says nothing when the habitat is in the Sprint too', () => {
    expect(warning(topicTwo([home.id, animal.id]))).toBeNull();
  });
  it('says nothing when the habitat is already Done', () => {
    const s = topicTwo([animal.id]);
    expect(warning({ ...s, backlog: s.backlog.map((it) => (it.id === home.id ? { ...it, status: 'done' as const } : it)) } as ZooGameState)).toBeNull();
  });
});
