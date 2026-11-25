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
  it('opens once the team has agreed what Done means, or chosen to start without one', () => {
    // It used to be open before either: Planning sizes work, and "we cannot size PBIs without an
    // understanding of the DoD". Starting without one is still a choice the game offers.
    const { unmount } = refine(ready({ dodAgreed: false }));
    expect(screen.queryByRole('button', { name: /Go to Sprint Planning/ }), 'Planning opened before anything was decided about Done').toBeNull();
    unmount();
    const without = refine(ready({ dodAgreed: true, definitionOfDone: [] }));
    expect(screen.getByRole('button', { name: /Go to Sprint Planning/ }), 'the game refuses to start a Sprint without a Definition of Done').toBeEnabled();
    without.unmount();
    refine(ready({ dodAgreed: true }));
    expect(screen.getByRole('button', { name: /Go to Sprint Planning/ })).toBeEnabled();
  });

  it('says what starting without one will mean, rather than blocking', () => {
    refine(ready({ dodAgreed: false, definitionOfDone: [] }));
    // On the screen, where the choice is, rather than written into the bar beside the button.
    expect(document.body.textContent).toMatch(/find out at the Review what Done meant/i);
  });

  it('offers starting without one as a choice a team could actually make', () => {
    refine(ready({ dodAgreed: false }));
    // The step where a team considers what Done means is where both answers live. It comes BEFORE
    // sizing now: the bar the work has to meet is part of how big the work is.
    // It opens by itself when a Sprint's worth is Ready, because that is when Priya asks.
    if (!screen.queryByRole('button', { name: /Start without one/i })) fireEvent.click(screen.getByText(/And agree what Done means/i));
    expect(screen.getByRole('button', { name: /Start without one/i }), 'the only way on was to agree one').toBeTruthy();
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
  it('asks what Done means before anything is sized', () => {
    // "When we estimate size then we need to understand what Done looks like." It was made one press
    // away while refinement was the move, and that was not enough: "the DoD tells us what finished
    // looks like. We cannot size PBIs without an understanding of the DoD. It should be created
    // before we size any PBIs." So Priya asks for it first, before any sizing.
    const s = ready({ dodAgreed: false });
    const { container } = refine({ ...s, backlog: s.backlog.map((it) => ({ ...it, unsized: true })) } as ZooGameState);
    expect(container.textContent).toMatch(/Before we size anything: what does Done mean\?/);
    expect(container.textContent).toMatch(/We agree - this is our Definition of Done/);
  });
});
