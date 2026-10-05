import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooIntro } from './ZooIntro';
import { INTRO_COPY } from './scrumContent';

// The one thing this page asks you to write comes first.
//
// Reported from playing it: "this should be at the top and expanded. The messages should be
// underneath. On top they push down the Product Goals dialog." The Product Goal sat under an
// explanation of how a Sprint goes and whatever the game was teaching that session - so the thing
// to DO was below the things to read, and on a short window it was off the bottom of it.

const intro = () => render(
  <MemoryRouter><ZooIntro productGoal="" onSetGoal={() => {}} onStart={() => {}} onStartFromTheBrief={() => {}}
    onSetGoalShape={() => {}} /></MemoryRouter>,
);


describe('the Product Goal on the first screen', () => {
  it('comes before the reading matter, not after it', () => {
    // The game's own title is the only thing above it. Everything that is READING sits underneath.
    const { container } = intro();
    const headings = [...container.querySelectorAll('h1,h2,h3')].map((h) => h.textContent ?? '');
    const goal = headings.findIndex((h) => /Your Product Goal/.test(h));
    expect(goal, 'there is no Product Goal on the page at all').toBeGreaterThanOrEqual(0);
    expect(goal, 'something was put above the thing this screen asks you to write').toBeLessThanOrEqual(1);
  });

  it('does not explain the Sprint loop, because the screen before it does', () => {
    // It used to, and that made the same five lines the reading matter on two screens in a row.
    // They are shown on How the zoo works against WHEN each step happens, which is more than a list
    // of five, and this is the screen that asks you to write something.
    //
    // Asked for after spotting the double in the copy editor: "take the Sprint loop off the Product
    // Goal screen."
    const text = intro().container.textContent ?? '';
    for (const l of INTRO_COPY.loop) {
      expect(text, `the Sprint loop is back on this screen: "${l.step}"`).not.toContain(l.text);
    }
    expect(text, 'its heading is still here with nothing under it').not.toContain(INTRO_COPY.loopTitle);
  });

  it('opens with the other ways to write one FOLDED, and says where they are', () => {
    // This used to assert the opposite, on the argument that a closed drawer is help nobody finds.
    // What that produced was the screen in the report above: the help was three times the height
    // of the thing to do, with a format picker and a worked example standing between the Product
    // Goal box and the button that starts the game. "The Product Goal area should be closed and
    // not expanded as default."
    //
    // A drawer with its name on it is not hidden; it is offered. The test that matters is that it
    // is still FINDABLE, which is the thing the old argument was right about.
    const { container } = intro();
    expect(container.textContent, 'the shapes are open again, over the thing to do')
      .not.toMatch(/A plain outcome/);
    const toggle = [...container.querySelectorAll('button')]
      .find((b) => /Other ways to write a Product Goal/.test(b.textContent ?? ''));
    expect(toggle, 'the shapes are folded away with nothing to open them by').toBeTruthy();
    fireEvent.click(toggle!);
    expect(container.textContent, 'opening it did not bring the shapes back').toMatch(/A plain outcome/);
    expect(container.textContent).toMatch(/Objective and key results/);
  });
});
