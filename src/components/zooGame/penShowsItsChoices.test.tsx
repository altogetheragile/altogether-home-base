import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ParkPlan } from './ParkPlan';
import { initialZooState } from './config';
import { presetFor } from './design';
import type { ZooGameState, BacklogItem } from './types';

// A habitat is drawn in the choices somebody made about it.
//
// Reported from playing it twice, five minutes apart: "nothing changes on the enclosure image to
// indicate the feature has been set - e.g. the ground colour, or barrier type or colour", and then
// "I lost the ground setting again".
//
// The second report was the first fault. The plan painted every habitat the same category beige
// whatever was chosen, so a ground colour that had been set perfectly well looked exactly like one
// that had been forgotten. There was no way to tell a choice from a loss by looking - and being able
// to tell is the whole point of building the thing in place rather than in a dialog.
//
// The isometric view has painted the chosen ground and fence since the day it was reported there.
// This was the eighth time the two drawings disagreed about the same piece of state.

const habitat = (over: Partial<BacklogItem> = {}): { state: ZooGameState; pen: BacklogItem } => {
  const base = initialZooState(3) as ZooGameState;
  const found = base.backlog.find((it) => it.category === 'enclosure')!;
  const pen = { ...found, status: 'committed' as const, started: true, sprintNumber: 1,
    design: presetFor(found), ...over } as BacklogItem;
  return {
    state: { ...base, phase: 'sprint', sprintNumber: 1,
      backlog: base.backlog.map((it) => (it.id === pen.id ? pen : it)) } as ZooGameState,
    pen,
  };
};

/** The box the plan draws for this item. */
const boxOf = (container: HTMLElement, id: string): SVGRectElement => {
  const g = container.querySelector(`[data-plan-item="${id}"]`);
  expect(g, 'the habitat is not on the plan at all').toBeTruthy();
  return g!.querySelector('rect')!;
};

describe('the ground somebody chose', () => {
  it('is the colour the pen is drawn in', () => {
    const green = '#2f6f3f';
    const { state, pen } = habitat({
      design: { ...presetFor({ category: 'enclosure' } as BacklogItem), colors: { ground: green } },
    } as Partial<BacklogItem>);
    const { container } = render(<ParkPlan state={state} />);
    expect(boxOf(container, pen.id).getAttribute('fill'),
      'the ground colour was chosen and the pen was painted the same beige as ever').toBe(green);
  });

  it('is still shown while the work is in hand, not only once it is Done', () => {
    // Being built IS the thing whose ground you are choosing. A hoarding that hides your own choices
    // until you press Done is the dialog this game got rid of, drawn on the park.
    const blue = '#3b6ea5';
    const { state, pen } = habitat({
      status: 'committed', started: true,
      design: { ...presetFor({ category: 'enclosure' } as BacklogItem), colors: { ground: blue } },
    } as Partial<BacklogItem>);
    const { container } = render(<ParkPlan state={state} />);
    const box = boxOf(container, pen.id);
    expect(box.getAttribute('fill')).toBe(blue);
    // ...and it still reads as unfinished, which is a different thing from what it is made of.
    expect(box.getAttribute('stroke-dasharray'), 'work under way stopped saying it is under way').toBeTruthy();
  });
});

describe('a pride', () => {
  it('is drawn as a pride while the choice is being made', () => {
    // Reported from playing it: "when I select Family for Lion should I see multiple dots to
    // indicate a pride?" You should - and the Increment drew them. The plan read the saved design
    // rather than the one in hand, so it stayed a single lion until the card was Done.
    const base = initialZooState(3) as ZooGameState;
    const pen = base.backlog.find((it) => it.category === 'enclosure')!;
    const lion = base.backlog.find((it) => it.category === 'exhibit' && it.enclosureId === pen.id)!;
    const withPride = {
      ...base, phase: 'sprint', sprintNumber: 1,
      backlog: base.backlog.map((it) => {
        if (it.id === pen.id) return { ...it, status: 'open' as const, started: true, sprintNumber: 1, design: presetFor(it) };
        if (it.id === lion.id) return { ...it, status: 'committed' as const, started: true, sprintNumber: 1,
          // In hand: the choice lives in the draft until the build is committed.
          draftDesign: { ...presetFor(it), group: { males: 1, females: 3, juveniles: 1, cubs: 2 } } };
        return it;
      }),
    } as ZooGameState;
    const { container } = render(<ParkPlan state={withPride} />);
    const drawn = container.querySelectorAll(`[data-animal^="${lion.id}-"]`);
    expect(drawn.length, 'a family of seven was drawn as one lion').toBeGreaterThan(1);
  });
});

describe('what is holding them in', () => {
  it('is drawn heavier for a wall than for a hedge', () => {
    const weight = (barrier: string) => {
      const { state, pen } = habitat({
        design: { ...presetFor({ category: 'enclosure' } as BacklogItem), parts: { barrier }, colors: {} },
      } as Partial<BacklogItem>);
      const { container } = render(<ParkPlan state={state} />);
      return Number(boxOf(container, pen.id).getAttribute('stroke-width'));
    };
    expect(weight('wall'), 'a wall is drawn no heavier than a low hedge').toBeGreaterThan(weight('hedge'));
    expect(weight('high'), 'a 4m fence is drawn no heavier than a 2m one').toBeGreaterThan(weight('fence'));
  });

  it('is drawn in the colour chosen for it', () => {
    const teal = '#1f7a7a';
    const { state, pen } = habitat({
      design: { ...presetFor({ category: 'enclosure' } as BacklogItem), parts: { barrier: 'fence' }, colors: { fence: teal } },
    } as Partial<BacklogItem>);
    const { container } = render(<ParkPlan state={state} />);
    expect(boxOf(container, pen.id).getAttribute('stroke'),
      'the fence colour was chosen and nothing on the plan changed').toBe(teal);
  });
});
