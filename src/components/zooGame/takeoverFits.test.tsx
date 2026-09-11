import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
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
  it('takes the whole width, and pages as one rather than hiding the reading in a well', () => {
    const { container } = shell(at('review'));
    const takeover = container.querySelector('[data-part="takeover"]')!;
    expect(takeover, 'the Review is not a takeover at all').toBeTruthy();
    const panel = takeover.firstElementChild as HTMLElement;
    expect(panel.className, 'the event is a column down the middle again').not.toMatch(/max-w-\d/);
    expect(panel.className, 'the event does not fill the width it is given').toMatch(/w-full/);
    // The width rule is the original one and it stands: a column down the middle of a wide screen,
    // with the room either side left empty, put half a Sprint Review below the fold.
    //
    // The height rule is the opposite of what it was, on purpose. Pinning the event to the height of
    // the window did not make the Review shorter - it made the column beside the picture into a
    // little scrolling well whose top line was cut off with nothing saying so. An event is a
    // document: it is as tall as it needs to be and it scrolls, once, like a page.
    expect(takeover.className, 'the event is pinned to the window again').toMatch(/overflow-y-auto/);
    expect(panel.className, 'the event cannot grow past the window').toMatch(/min-h-full/);
  });

  it('is a takeover at Planning and the Retrospective too', () => {
    for (const phase of ['planning', 'retro'] as const) {
      const { container } = shell(at(phase));
      expect(container.querySelector('[data-part="takeover"]'), `${phase} is not a takeover`).toBeTruthy();
    }
  });
});

describe('where the park is, and is not', () => {
  it('is off Sprint Planning and off the Retrospective', () => {
    // A panel earns its width by having the next click in it. The park has the next click during
    // Build and at the Review; on Planning and the Retrospective it is decoration, and it halves
    // the width of the work.
    for (const [phase, screen] of [
      ['planning', <SprintPlanning state={at('planning')} onPlan={() => {}} onSetForecast={() => {}}
        onEstimate={() => {}} onSetTasks={() => {}} onSetSprintGoal={() => {}} onRefine={() => {}}
        onPlanShape={() => {}} onToggleGoalCritical={() => {}} onTakeSignal={() => {}} onSplitEpic={() => {}} />],
      ['retro', <SprintRetro state={at('retro')} onNextSprint={() => {}} onSetDod={() => {}} onSetSprintDays={() => {}} />],
    ] as const) {
      const { container } = render(<MemoryRouter>{screen}</MemoryRouter>);
      expect(container.querySelector('[data-part="event-park"]'),
        `${phase} still gives half its width to a picture nobody clicks`).toBeNull();
    }
  });
});

describe('the Increment picture at a Review', () => {
  it('can be made bigger, because at a Review it is the thing being presented', () => {
    // "Given it is a review we should be able to increase the size of the park increment image."
    const { container } = render(
      <MemoryRouter>
        <SprintReview state={at('review')} onContinue={() => {}} onOpen={() => {}}
          onToggleTask={() => {}} onTakeSignal={() => {}} />
      </MemoryRouter>,
    );
    const grow = container.querySelector('[data-part="picture-size"]') as HTMLButtonElement | null;
    expect(grow, 'the picture is whatever size it was given and no other').toBeTruthy();
    const before = (container.querySelector('[data-part="event-park"]') as HTMLElement).className;
    fireEvent.click(grow!);
    const after = (container.querySelector('[data-part="event-park"]') as HTMLElement).className;
    expect(after, 'pressing it changed nothing about the picture').not.toBe(before);
    expect(grow!.getAttribute('aria-label'), 'nothing offers to put it back').toMatch(/smaller/i);
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
          onToggleTask={() => {}} onTakeSignal={() => {}} />
      </MemoryRouter>,
    );
    const read = container.querySelector('[data-part="event-read"]') as HTMLElement;
    expect(read, 'the Review is one column again').toBeTruthy();
    expect(read.className, 'the reading is back in a scrolling well of its own').not.toMatch(/overflow-y-auto/);
    const picture = container.querySelector('[data-part="event-park"]') as HTMLElement;
    expect(picture.className, 'the picture scrolls away from under the conversation about it')
      .toMatch(/lg:sticky/);
    const columns = read.parentElement!;
    expect(columns.className, 'the Increment and the reading are not side by side').toMatch(/lg:grid-cols/);
    // The picture is the left half on all three steps: what was Done, what the visitors made of it,
    // and what we do about it are all about the same Increment.
    expect(columns.firstElementChild!.textContent,
      'the Increment is not the other half of the screen').toMatch(/The Increment/);
  });
});
