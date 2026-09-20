import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
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

describe('the numbered marks', () => {
  // Found by measuring the screen in dark mode, though it was never a dark-mode fault: the marks
  // were white on the primary, 2.85:1, in BOTH themes. Below the 4.5 that small bold text needs and
  // below even the 3 that large text does. Dark ink takes it to about 6.
  it('is dark ink on the mark, not white', () => {
    const { container } = render(<LabelledPark />);
    const marks = [
      ...container.querySelectorAll('[data-part^="pin-"]'),
      ...container.querySelectorAll('figcaption li > span:first-child'),
    ];
    expect(marks.length, 'there are no numbered marks to check').toBeGreaterThan(2);
    for (const m of marks) {
      expect(m.className, 'a mark went back to white on the orange').not.toMatch(/text-primary-foreground/);
      expect(m.className, 'a mark has no colour of its own').toMatch(/text-\[#/);
    }
  });

  it('keeps the same ink whichever theme the page is in', () => {
    // The mark's ground is the primary in both themes, so its text has to be fixed too. A token
    // here would be near-white on orange in one theme and near-black on orange in the other, from
    // one colour that is supposed to mean one thing.
    //
    // Read off the KEY's marks rather than the pins: a pin is placed by measuring the drawing, and
    // there is no layout to measure here, so none of them exist in this test. The key is where the
    // same treatment can actually be seen.
    const { container } = render(<LabelledPark />);
    const inks = new Set([...container.querySelectorAll('figcaption li > span:first-child')]
      .map((m) => (m.className.match(/text-\[#[0-9a-f]+\]/i) ?? [''])[0]));
    expect(inks.size, 'the marks are not all the same colour').toBe(1);
    expect([...inks][0], 'the mark has no ink of its own').toMatch(/^text-\[#/);
  });
});

describe('walking closer into the example', () => {
  // "Can we use the zoom on the park part of the screen?" It was the one park in the game without
  // one: the game's own two both have a zoom, and this one had its controls taken off when it
  // became a picture rather than a workbench. A picture somebody wants to look INTO is still worth
  // a zoom.
  const zooms = (c: HTMLElement) => [...c.querySelectorAll('[data-part="example-zoom"]')];
  const btn = (within: Element, label: string) =>
    [...within.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === label)!;

  it('offers one on each picture', () => {
    // One each, not one for both: looking closer at the plan and looking closer at the Increment
    // are two different things somebody wants at two different moments.
    expect(zooms(render(<LabelledPark />).container)).toHaveLength(2);
  });

  it('starts at the shot the example framed for itself', () => {
    const c = render(<LabelledPark />).container;
    for (const z of zooms(c)) {
      expect(btn(z, 'Further out').disabled, 'it opens already zoomed').toBe(true);
      expect(z.querySelector('[aria-label="Back to the whole example"]'),
        'it offers to go back before anybody has gone anywhere').toBeNull();
    }
  });

  it('offers the way back once you have walked in', () => {
    const c = render(<LabelledPark />).container;
    fireEvent.click(btn(zooms(c)[0], 'Closer'));
    expect(zooms(c)[0].querySelector('[aria-label="Back to the whole example"]'),
      'there is no way back to the framed shot').toBeTruthy();
    expect(btn(zooms(c)[0], 'Further out').disabled).toBe(false);
  });

  it('stops, rather than going in for ever', () => {
    const c = render(<LabelledPark />).container;
    for (let i = 0; i < 6; i++) fireEvent.click(btn(zooms(c)[0], 'Closer'));
    expect(btn(zooms(c)[0], 'Closer').disabled, 'it can be walked into indefinitely').toBe(true);
  });

  it('walks one picture without moving the other', () => {
    const c = render(<LabelledPark />).container;
    fireEvent.click(btn(zooms(c)[0], 'Closer'));
    expect(zooms(c)[1].querySelector('[aria-label="Back to the whole example"]'),
      'zooming the plan moved the Increment too').toBeNull();
  });
});
