import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LabelledPark } from './LabelledPark';
import { ParkPlan } from './ParkPlan';
import { exampleZoo } from './exampleZoo';
import type { ZooGameState } from './types';

// One zoo, drawn twice.
//
// "Can we show an example of the studio park view and the isometric increment side by side on the
// orientation view?"
//
// It is the thing the screen most needed to say and had not said: a learner meets a top-down plan
// they build on and an isometric park they look at, and nothing told them those were the same zoo.

describe('the plan and the Increment, together', () => {
  it('shows two drawings, not one', () => {
    const { container } = render(<LabelledPark />);
    expect(container.querySelectorAll('[data-part="labelled-park"]').length,
      'the orientation shows one view of the zoo').toBe(2);
  });

  it('names what each one is for', () => {
    const text = render(<LabelledPark />).container.textContent ?? '';
    expect(text, 'the plan is not named as the place you build').toMatch(/where the Developers build/);
    expect(text, 'the Increment is not named as what a visitor gets').toMatch(/what a visitor walks into/);
  });

  it('numbers them once, for both', () => {
    // The key is the point: 1 in one drawing is 1 in the other. Two keys would be two zoos.
    const { container } = render(<LabelledPark />);
    expect(container.querySelectorAll('figcaption ol').length).toBe(1);
    expect(container.querySelectorAll('figcaption li').length).toBe(exampleZoo().labels.length);
  });

  it('points at the same things in both, by the same name', () => {
    // Every label has to be findable in EITHER drawing with one selector. It used to use the
    // isometric view's own `data-spot` for an animal, so the lion had no pin in the plan at all -
    // two renderers answering "which item is this?" in two different words.
    const { state, labels } = exampleZoo();
    const plan = render(<ParkPlan state={state} height={280} still />).container;
    const missing = labels.filter((l) => !plan.querySelector(l.find)).map((l) => l.title);
    // The plan does not draw a path run the way the isometric does, so a path may legitimately be
    // absent. Everything that STANDS on the park has to be there.
    const standing = labels.filter((l) => state.backlog.find((it) => it.id === l.id)?.category !== 'path');
    for (const l of standing) {
      expect(missing, `${l.title} cannot be found in the plan`).not.toContain(l.title);
    }
  });

  it('is a picture of the plan, not the plan', () => {
    // A zoom control on an example is an offer that leads nowhere, and it was sitting on top of a
    // pin. `still` takes the camera's own controls away.
    const { state } = exampleZoo();
    const shown = render(<ParkPlan state={state as ZooGameState} height={280} still />).container;
    const live = render(<ParkPlan state={state as ZooGameState} height={280} />).container;
    expect(shown.querySelector('[data-part="park-camera"]'), 'the example offers to zoom').toBeNull();
    expect(live.querySelector('[data-part="park-camera"]'), 'the real plan lost its camera').toBeTruthy();
  });
});
