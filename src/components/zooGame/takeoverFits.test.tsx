import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooShell } from './ZooShell';
import { SprintReview } from './SprintReview';
import { SprintPlanning } from './SprintPlanning';
import { SprintRetro } from './SprintRetro';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// An event fills the screen it takes over.
//
// Reported from a live game at the Sprint Review: a column down the middle of a wide screen, the
// room either side of it empty, and half of what the Review had to say below the fold. "This could
// all be on the screen with no need to page down. Use the full width of the screen in the takeover."

const at = (phase: ZooGameState['phase']): ZooGameState =>
  ({ ...initialZooState(3), phase, sprintNumber: 1 }) as ZooGameState;

const shell = (state: ZooGameState) => render(
  <MemoryRouter><ZooShell state={state}><div>the event</div></ZooShell></MemoryRouter>,
);

describe('an event on the screen', () => {
  it('takes the whole width and the whole height, and does not page', () => {
    const { container } = shell(at('review'));
    const takeover = container.querySelector('[data-part="takeover"]')!;
    expect(takeover, 'the Review is not a takeover at all').toBeTruthy();
    const panel = takeover.firstElementChild as HTMLElement;
    expect(panel.className, 'the event is a column down the middle again').not.toMatch(/max-w-\d/);
    expect(panel.className, 'the event does not fill the width it is given').toMatch(/w-full/);
    expect(takeover.className, 'the whole window scrolls to read an event').not.toMatch(/overflow-y-auto/);
  });

  it('is a takeover at Planning and the Retrospective too', () => {
    for (const phase of ['planning', 'retro'] as const) {
      const { container } = shell(at(phase));
      expect(container.querySelector('[data-part="takeover"]'), `${phase} is not a takeover`).toBeTruthy();
    }
  });
});

describe('every event, on half a screen of park', () => {
  it('gives Planning and the Retrospective the same stage as the Review', () => {
    // "Do the same for the Retrospective and Planning screens." One layout for all three: the zoo
    // as it stands on the left, what the event is asking beside it.
    for (const [phase, screen] of [
      ['planning', <SprintPlanning state={at('planning')} onPlan={() => {}} onSetForecast={() => {}}
        onEstimate={() => {}} onSetTasks={() => {}} onSetSprintGoal={() => {}} onRefine={() => {}}
        onPlanShape={() => {}} onToggleGoalCritical={() => {}} onTakeSignal={() => {}} onSplitEpic={() => {}} />],
      ['retro', <SprintRetro state={at('retro')} onNextSprint={() => {}} onSetDod={() => {}} onSetSprintDays={() => {}} />],
    ] as const) {
      const { container } = render(<MemoryRouter>{screen}</MemoryRouter>);
      expect(container.querySelector('[data-part="event-park"]'), `${phase} has no park on it`).toBeTruthy();
      const read = container.querySelector('[data-part="event-read"]') as HTMLElement;
      expect(read, `${phase} is one column`).toBeTruthy();
      expect(read.className, `${phase} does not scroll inside the event`).toMatch(/overflow-y-auto/);
    }
  });
});

describe('what the Review has to say', () => {
  it('sits beside the Increment rather than under it, on every step of the agenda', () => {
    // The picture and everything said about it used to be one column, so the honest caption for the
    // picture - what is built and still shut - was off the bottom of the screen.
    const state = { ...at('review'), sprintForecast: 8 } as ZooGameState;
    const { container } = render(
      <MemoryRouter>
        <SprintReview state={state} onContinue={() => {}} onOpen={() => {}}
          onConfirmAc={() => {}} onToggleTask={() => {}} onTakeSignal={() => {}} />
      </MemoryRouter>,
    );
    const read = container.querySelector('[data-part="event-read"]') as HTMLElement;
    expect(read, 'the Review is one column again').toBeTruthy();
    expect(read.className, 'the column does not scroll inside the event').toMatch(/overflow-y-auto/);
    const columns = read.parentElement!;
    expect(columns.className, 'the Increment and the reading are not side by side').toMatch(/lg:grid-cols/);
    // The picture is the left half on all three steps: what was Done, what the visitors made of it,
    // and what we do about it are all about the same Increment.
    expect(columns.firstElementChild!.textContent,
      'the Increment is not the other half of the screen').toMatch(/The Increment/);
  });
});
