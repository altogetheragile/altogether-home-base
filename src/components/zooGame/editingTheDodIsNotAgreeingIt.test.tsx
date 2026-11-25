import { describe, it, expect } from 'vitest';
import { useReducer } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { initialZooState, DEFAULT_BRIEF } from './config';
import { writeBacklog } from './engine';
import { reducer } from './useZooGame';
import { RefineBacklog } from './RefineBacklog';
import type { ZooGameState } from './types';

// "When I cut ', confirmed by the Product Owner' to paste it as a separate DoD criteria the DOD
// dialog collapsed" (Al, 25 November 2026). Every keystroke in the suggested Definition of Done was
// a save, and saving one agreed it, so the editor folded into "Definition of Done agreed: 3 items"
// in the middle of an edit. Editing the suggestion is drafting it; only "We agree" agrees it.

const noop = () => {};
const atTheDod = () => {
  const s = { ...writeBacklog(initialZooState(3), DEFAULT_BRIEF), phase: 'refine' } as ZooGameState;
  expect(s.dodAgreed, 'the fixture starts with a suggestion, not an agreement').toBeFalsy();
  return s;
};

describe('editing the suggested Definition of Done', () => {
  it('changes the lines without agreeing them', () => {
    const s = atTheDod();
    const line = s.definitionOfDone[0];
    const cut = reducer(s, { type: 'SET_DOD', dod: [line.replace(/, confirmed by .*$/, ''), ...s.definitionOfDone.slice(1)], draft: true });
    expect(cut.dodAgreed, 'a cut agreed the Definition of Done').toBeFalsy();
    expect(cut.definitionOfDone[0]).not.toBe(line);
    expect(reducer(cut, { type: 'AGREE_DOD' }).dodAgreed).toBe(true);
  });

  it('still agrees it when it is written outside the suggestion, as at the Retrospective', () => {
    expect(reducer(atTheDod(), { type: 'SET_DOD', dod: ['Peer-reviewed'] }).dodAgreed).toBe(true);
  });

  it('keeps the editor open on the screen while you cut a line', () => {
    function Screen() {
      const [state, send] = useReducer(reducer, atTheDod());
      return (
        <MemoryRouter>
          <RefineBacklog state={state} onSetSprintDays={noop}
            onSetDod={(dod, draft) => send({ type: 'SET_DOD', dod, draft })} onAgreeDod={() => send({ type: 'AGREE_DOD' })}
            onEstimate={noop} onAddPbi={noop} onRefinePbi={noop} onReorder={noop} onMoveZone={noop}
            onMoveBefore={noop} onSetUseStories={noop} onSplitEpic={noop} onDeletePbi={noop}
            onDuplicatePbi={noop} onPlan={noop} />
        </MemoryRouter>
      );
    }
    const page = render(<Screen />).baseElement;
    const input = page.querySelector<HTMLInputElement>('input[placeholder="A general Done criterion"]')!;
    expect(input, 'no Definition of Done editor on the screen').not.toBeNull();
    fireEvent.change(input, { target: { value: input.value.replace(/, confirmed by .*$/, '') } });
    expect(page.querySelector('input[placeholder="A general Done criterion"]'), 'the editor folded away mid-edit').not.toBeNull();
    expect([...page.querySelectorAll('button')].some((b) => /We agree - this is our Definition of Done/.test(b.textContent ?? ''))).toBe(true);
  });
});
