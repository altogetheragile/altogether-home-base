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
  // Measured twice. White on the primary when the primary was orange: 2.85:1, so the marks took a
  // fixed dark ink. Then the primary became blue (10 Nov 2026) and the ink stayed - 2.8:1 again,
  // "the blue dots numbering the plan have black text which is very hard to read". The mark stands
  // on the primary, so it takes the primary's own foreground: white on the blue, 6.2:1. The game is
  // a light surface in both themes, so there is one primary to follow.
  const marks = (c: HTMLElement) => [
    ...c.querySelectorAll('[data-part^="pin-"]'),
    ...c.querySelectorAll('figcaption li > span:first-child'),
  ];

  it('is written in the colour made for the mark it stands on', () => {
    const { container } = render(<LabelledPark />);
    const all = marks(container);
    expect(all.length, 'there are no numbered marks to check').toBeGreaterThan(2);
    for (const m of all) {
      expect(m.className, 'a mark is not on the primary').toMatch(/bg-primary/);
      expect(m.className, 'a mark is not in the primary\'s own foreground').toMatch(/text-primary-foreground/);
      expect(m.className, 'a mark has a fixed ink that will not follow the primary').not.toMatch(/text-\[#/);
    }
  });
});


describe('walking closer into the example', () => {
  // "Can we use the zoom on the park part of the screen?" It was the one park in the game without
  // one: the game's own two both have a zoom, and this one had its controls taken off when it
  // became a picture rather than a workbench. A picture somebody wants to look INTO is still worth
  // a zoom.
  const zooms = (c: HTMLElement) => [...c.querySelectorAll('[data-part="example-zoom"]')];
  // Matched on the direction, because the label now also names the picture it is on.
  const btn = (within: Element, label: string) =>
    [...within.querySelectorAll('button')].find((b) => (b.getAttribute('aria-label') ?? '').startsWith(label))!;
  const back = (z: Element) =>
    [...z.querySelectorAll('button')].find((b) => /^Back to the whole of /.test(b.getAttribute('aria-label') ?? '')) ?? null;

  it('offers one on each picture', () => {
    // One each, not one for both: looking closer at the plan and looking closer at the Increment
    // are two different things somebody wants at two different moments.
    expect(zooms(render(<LabelledPark />).container)).toHaveLength(2);
  });

  it('starts at the shot the example framed for itself', () => {
    const c = render(<LabelledPark />).container;
    for (const z of zooms(c)) {
      expect(btn(z, 'Further out').disabled, 'it opens already zoomed').toBe(true);
      expect(back(z), 'it offers to go back before anybody has gone anywhere').toBeNull();
    }
  });

  it('offers the way back once you have walked in', () => {
    const c = render(<LabelledPark />).container;
    fireEvent.click(btn(zooms(c)[0], 'Closer'));
    expect(back(zooms(c)[0]), 'there is no way back to the framed shot').toBeTruthy();
    expect(btn(zooms(c)[0], 'Further out').disabled).toBe(false);
  });

  it('stops, rather than going in for ever', () => {
    const c = render(<LabelledPark />).container;
    for (let i = 0; i < 6; i++) fireEvent.click(btn(zooms(c)[0], 'Closer'));
    expect(btn(zooms(c)[0], 'Closer').disabled, 'it can be walked into indefinitely').toBe(true);
  });

  it('says which picture each one is for', () => {
    // Two pictures side by side meant two buttons called "Closer" and two called "Further out", and
    // nothing on either to say which was which. Every newcomer who has played this game cold has
    // stopped on it: "There are two 'Closer' buttons but I cannot tell what they are close to."
    // A screen reader reads out the same undifferentiated list.
    const c = render(<LabelledPark />).container;
    const names = zooms(c).map((z) => btn(z, 'Closer').getAttribute('aria-label') ?? '');
    expect(names, 'one of the pictures has no zoom').toHaveLength(2);
    expect(names[0], 'the zoom does not say what it is zooming').not.toBe('Closer');
    expect(names[0] === names[1], 'both pictures claim the same button').toBe(false);
    for (const n of names) expect(n, 'it no longer says which way it goes').toMatch(/^Closer into \S/);
  });

  it('walks one picture without moving the other', () => {
    const c = render(<LabelledPark />).container;
    fireEvent.click(btn(zooms(c)[0], 'Closer'));
    expect(back(zooms(c)[1]), 'zooming the plan moved the Increment too').toBeNull();
  });
});
