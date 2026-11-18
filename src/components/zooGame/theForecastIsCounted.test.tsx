import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SprintBacklogGlance } from './ZooShell';
import { initialZooState, starterBacklog } from './config';
import type { ZooGameState } from './types';

// At Sprint Planning nothing is committed yet, so the Sprint Backlog glance counted nothing:
// "the Sprint Backlog shows '1 item in this Sprint 8 / 21 pts' but the Sprint Backlog panel says
// '0 items' and 'Nothing forecast' - those two counts contradict each other on the same screen"
// (scrum-master playtest, 17 Nov, six steps running).

const planning = (forecast: string[]): ZooGameState =>
  ({ ...initialZooState(1), backlog: starterBacklog(), phase: 'planning', sprintNumber: 1, forecast } as ZooGameState);

describe('the Sprint Backlog glance at Sprint Planning', () => {
  it('lists the forecast so far', () => {
    const s = planning([]);
    const pick = s.backlog[0];
    const c = render(<SprintBacklogGlance state={{ ...s, forecast: [pick.id] }} locked={false} />).container;
    expect(c.querySelector('[data-part="glance-count"]')?.textContent).toMatch(/forecast so far · 1 item$/);
    expect(c.textContent).toContain(pick.name);
    expect(c.textContent, 'it still says nothing is forecast').not.toMatch(/Nothing forecast/);
  });

  it('says nothing is forecast yet, while nothing is', () => {
    const c = render(<SprintBacklogGlance state={planning([])} locked={false} />).container;
    expect(c.textContent).toMatch(/Nothing forecast yet/);
  });
});
