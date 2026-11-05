import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { initialZooState, DEFAULT_BRIEF } from './config';
import { applyFlow, preset, writeFlowBacklog } from './flow';
import { goalCandidates, goalSource, rewordSprintGoal, suggestSprintGoal } from './engine';
import { handover } from './handover';
import { PriyaHandover } from './PriyaHandover';
import type { ZooGameState } from './types';

// Sprint Planning with nothing Ready, which is allowed now that refining can wait for Planning.
//
// Reported from playing it: the wizard's Goal was nonsense ("Our goal is to open a lion enclosure
// so that they do"), Priya pointed at "the marked items" when none were marked, and her line and
// the move were stacked on the left with the right of the page empty above the Sprint Goal.

// The whole of Scrum, arrived at Planning without refining anything: the Product Backlog is epics.
const planning = (): ZooGameState => ({
  ...writeFlowBacklog(applyFlow(initialZooState(3), preset('whole')!, DEFAULT_BRIEF), DEFAULT_BRIEF),
  phase: 'planning', planningTopic: 'why',
} as ZooGameState);

describe('the Sprint Goal with nothing Ready', () => {
  it('is the case being tested: nothing is marked, and the top is an epic', () => {
    expect(goalCandidates(planning())).toEqual([]);
    expect(goalSource(planning())[0]?.category).toBe('epic');
  });

  it('is written from the top of the Product Backlog, as a sentence about somebody', () => {
    const s = planning();
    const goal = suggestSprintGoal(goalSource(s));
    expect(goal).not.toMatch(/so that they do/);
    expect(goal).toBe('Our goal is to open the first of the Big Cats to visitors so that there is something worth coming for');
  });

  it('rewords what the player wrote into a sentence that ends in a reason', () => {
    const out = rewordSprintGoal('open a lion enclosure', goalSource(planning()));
    expect(out.goal).toBe('Our goal is to open a lion enclosure so that there is something worth coming for');
    // ...and with nothing at all to go on, still not "so that they do".
    expect(rewordSprintGoal('open a lion enclosure', []).goal).not.toMatch(/they do$/);
  });
});

describe('Priya at the Why topic with nothing Ready', () => {
  it('names the top item rather than marked items that are not there', () => {
    const s = planning();
    const h = handover(s)!;
    expect(h.says).not.toMatch(/marked items/);
    expect(h.says).toContain(goalSource(s)[0].name);
  });

  it('says her line beside the move, in a bubble that points at her', () => {
    const { container } = render(<MemoryRouter><PriyaHandover state={planning()} side /></MemoryRouter>);
    const section = container.querySelector('[data-part="handover"]')!;
    expect(section.className, 'the move is stacked under the line again').toMatch(/lg:grid-cols-2/);
    expect(container.querySelector('[data-part="bubble-tail"]'), 'a box with a name over it, not a speech bubble').toBeTruthy();
  });
});
