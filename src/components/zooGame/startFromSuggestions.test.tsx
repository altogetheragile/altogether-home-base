import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RefineBacklog } from './RefineBacklog';
import { DodEditor } from './DodEditor';
import { initialZooState, DEFAULT_BRIEF, DEFAULT_DOD, DOD_LIBRARY } from './config';
import { writeBacklog } from './engine';
import type { ZooGameState } from './types';

// "Start from something, never from a blank page" (docs/ZOO_GAME_FLOW.md). The Definition of Done
// always opened with three lines and a library behind a button. What was missing was getting to
// them: Priya asked what Done meant over a step folded shut, and nothing said the lines were only a
// suggestion.

const noop = () => {};
const refine = (state: ZooGameState) => render(
  <MemoryRouter>
    <RefineBacklog state={state} onEstimate={noop} onAddPbi={noop} onRefinePbi={noop} onReorder={noop}
      onMoveZone={noop} onMoveBefore={noop} onSetUseStories={noop} onSplitEpic={noop} onDeletePbi={noop}
      onDuplicatePbi={noop} onPlan={noop} onSetDod={noop} onAgreeDod={noop} />
  </MemoryRouter>,
).container;

const written = () => ({ ...writeBacklog(initialZooState(1), DEFAULT_BRIEF), phase: 'refine' } as ZooGameState);

describe('the Definition of Done starts from suggestions', () => {
  it('opens when Priya asks what Done means, which is first, before anything is sized', () => {
    expect(refine(written()).querySelector('[data-part="dod-suggested"]')).not.toBeNull();
    expect(refine({ ...written(), dodAgreed: true } as ZooGameState).querySelector('[data-part="dod-suggested"]'), 'still open once agreed').toBeNull();
  });

  it('says the lines are a suggestion and shows the rest of the library, until it is agreed', () => {
    const open = render(<DodEditor dod={DEFAULT_DOD} onSave={noop} suggesting />).container;
    expect(open.textContent).toMatch(/Suggested to start from/);
    expect(open.textContent).toContain(DOD_LIBRARY[0].items[1]);
    const agreed = render(<DodEditor dod={DEFAULT_DOD} onSave={noop} />).container;
    expect(agreed.querySelector('[data-part="dod-suggested"]')).toBeNull();
    expect(agreed.textContent).not.toContain(DOD_LIBRARY[0].items[1]);
  });

  it('does not offer a suggestion a line already says', () => {
    const c = render(<DodEditor dod={['Meets its acceptance criteria, confirmed by the Product Owner']} onSave={noop} suggesting />).container;
    const chip = [...c.querySelectorAll('button')].find((b) => b.textContent?.endsWith('Meets its acceptance criteria'))!;
    expect(chip.disabled).toBe(true);
  });
});
