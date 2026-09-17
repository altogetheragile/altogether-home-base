import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ZooIntro } from './ZooIntro';

// The one thing this page asks you to write comes first.
//
// Reported from playing it: "this should be at the top and expanded. The messages should be
// underneath. On top they push down the Product Goals dialog." The Product Goal sat under an
// explanation of how a Sprint goes and whatever the game was teaching that session - so the thing
// to DO was below the things to read, and on a short window it was off the bottom of it.

const intro = () => render(
  <ZooIntro productGoal="" onSetGoal={() => {}} onStart={() => {}} onStartFromTheBrief={() => {}}
    onSetGoalShape={() => {}} />,
);

/** Where something sits down the page, by the order the document puts it in. */
const order = (container: HTMLElement, text: RegExp): number => {
  const all = [...container.querySelectorAll('h1,h2,h3')];
  return all.findIndex((h) => text.test(h.textContent ?? ''));
};

describe('the Product Goal on the first screen', () => {
  it('comes before the reading matter, not after it', () => {
    const { container } = intro();
    const goal = order(container, /Your Product Goal/);
    const loop = order(container, /Sprint|loop/i);
    expect(goal, 'there is no Product Goal on the page at all').toBeGreaterThanOrEqual(0);
    expect(loop, 'nothing explains the loop any more').toBeGreaterThanOrEqual(0);
    expect(goal, 'the explanation is above the thing to write').toBeLessThan(loop);
  });

  it('opens with the other ways to write one already showing', () => {
    // "and expanded". A closed drawer on the one screen that asks you to write something is help
    // nobody finds.
    const { container } = intro();
    expect(container.textContent, 'the shapes are folded away').toMatch(/A plain outcome/);
    expect(container.textContent).toMatch(/Objective and key results/);
  });
});
