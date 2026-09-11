import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RefineBacklog } from './RefineBacklog';
import { initialZooState } from './config';
import { planSprint, retroQuestions, decisionsIn } from './engine';
import type { ZooGameState } from './types';

// Starting without a Definition of Done is a lesson, not an error.
//
// The game would not let you reach Sprint Planning until you had agreed one, which took the best
// teaching moment of the first Sprint and threw it away: play a Sprint with nothing agreed, find
// out at the Review what Done meant, and let the Retrospective ask the question with the evidence
// in front of you. Reported as "there is no learning opportunity here".

const noop = () => {};
const refine = (state: ZooGameState) => render(
  <MemoryRouter>
    <RefineBacklog state={state} onEstimate={noop} onAddPbi={noop} onRefinePbi={noop} onReorder={noop}
      onMoveZone={noop} onMoveBefore={noop} onSetUseStories={noop} onSplitEpic={noop} onDeletePbi={noop}
      onDuplicatePbi={noop} onPlan={noop} onSetDod={noop} onAgreeDod={noop} />
  </MemoryRouter>,
);

const ready = (over: Partial<ZooGameState> = {}): ZooGameState =>
  ({ ...initialZooState(3), phase: 'refine', ...over }) as ZooGameState;

describe('the way to Sprint Planning', () => {
  it('is open whether or not anybody agreed what Done means', () => {
    const { unmount } = refine(ready({ dodAgreed: false }));
    expect(screen.getByRole('button', { name: /Go to Sprint Planning/ }),
      'the game still refuses to start a Sprint without a Definition of Done').toBeEnabled();
    unmount();
    refine(ready({ dodAgreed: true }));
    expect(screen.getByRole('button', { name: /Go to Sprint Planning/ })).toBeEnabled();
  });

  it('says what starting without one will mean, rather than blocking', () => {
    refine(ready({ dodAgreed: false, definitionOfDone: [] }));
    expect(document.body.textContent).toMatch(/Done will mean whatever anybody says it means/i);
  });

  it('offers starting without one as a choice a team could actually make', () => {
    refine(ready({ dodAgreed: false }));
    // The step where a team considers what Done means is where both answers live. It comes BEFORE
    // sizing now: the bar the work has to meet is part of how big the work is.
    fireEvent.click(screen.getByText(/And agree what Done means/i));
    expect(screen.getByText(/Start without one/i), 'the only way on was to agree one').toBeTruthy();
  });
});

describe('what the Sprint remembers about it', () => {
  const start = (state: ZooGameState) => {
    const ids = state.backlog.filter((it) => !it.unsized && it.category !== 'epic').slice(0, 1).map((it) => it.id);
    return planSprint({ ...state, phase: 'planning' } as ZooGameState, ids);
  };

  it('writes down what Done meant when the Sprint began', () => {
    const agreed = decisionsIn(start(ready({ dodAgreed: true })), 1).filter((d) => d.kind === 'dod');
    expect(agreed[0].what).toMatch(/the Scrum Team agreed/);

    const not = decisionsIn(start(ready({ dodAgreed: false, definitionOfDone: [] })), 1).filter((d) => d.kind === 'dod');
    expect(not[0].what, 'a Sprint with no Definition of Done recorded nothing about it').toMatch(/whatever anybody says it means/);
    expect(not[0].cost).toMatch(/nothing was agreed/);
  });

  it('asks the Retrospective’s question when nobody agreed one', () => {
    const asked = retroQuestions(ready({ dodAgreed: false, phase: 'retro' }));
    expect(asked.some((q) => /What did Done mean this Sprint/.test(q)),
      'nobody was ever asked what Done had meant').toBe(true);

    const settled = retroQuestions(ready({ dodAgreed: true, phase: 'retro' }));
    expect(settled.some((q) => /What did Done mean this Sprint/.test(q)),
      'a team that agreed one was asked as though they had not').toBe(false);
  });

  it('still asks how the team worked together, whatever else happened', () => {
    // The Guide's first two inspection targets are individuals and interactions. A Sprint with
    // three things to answer for used to push that question off the list.
    const busy = ready({ dodAgreed: false, sprintGoalMet: false, signals: [{ drivenBy: 'x', suggestion: 'y', estimatedValue: 'high' }] } as Partial<ZooGameState>);
    expect(retroQuestions(busy).some((q) => /together|help/i.test(q))).toBe(true);
  });
});

describe('the order the agreements are made in', () => {
  it('puts what Done means before the sizing', () => {
    // "When we estimate size then we need to understand what Done looks like." Quite so: the bar the
    // work has to meet is part of how big the work is, and a team sizing before it has agreed one is
    // sizing against a guess. The steps were numbered the other way round.
    const { container } = refine(ready({ dodAgreed: false }));
    const text = container.textContent ?? '';
    const done = text.indexOf('And agree what Done means');
    const size = text.indexOf('Then get the top ready');
    expect(done, 'the screen no longer asks what Done means').toBeGreaterThan(-1);
    expect(size, 'the screen no longer asks for anything to be sized').toBeGreaterThan(-1);
    expect(done, 'sizing is still asked for before the bar it is sized against').toBeLessThan(size);
  });
});
