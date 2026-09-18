import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, within } from '@testing-library/react';
import { ZooOrientation } from './ZooOrientation';
import { ZooIntro } from './ZooIntro';
import { ORIENTATION, INTRO_COPY } from './scrumContent';

// What am I looking at?
//
// "Scrum on one page" answers what Scrum is. Nothing answered what the GAME is: the park and its
// areas, the five seats, the three tabs, the clock, and the three rules that catch everybody out.
// A learner who knows Scrum perfectly well still does not know any of that, and was finding it out
// by pressing things.
//
// The constraint this screen is built under: the Product Goal owns the top of the intro. It was
// moved there because the reading matter above it pushed it off the bottom of a short window -
// "this should be at the top and expanded. The messages should be underneath." So the orientation
// is a screen you pass through once, not a panel that is always in the way.

const screen = (over: Partial<Parameters<typeof ZooOrientation>[0]> = {}) =>
  render(<ZooOrientation onDone={() => {}} {...over} />).container;

describe('the orientation screen', () => {
  it('says what the game is, not what Scrum is', () => {
    const c = screen();
    const text = c.textContent ?? '';
    for (const heading of [ORIENTATION.park.title, ORIENTATION.seats.title,
      ORIENTATION.tabs.title, ORIENTATION.clock.title, ORIENTATION.gotchas.title]) {
      expect(text, `it never mentions ${heading}`).toContain(heading);
    }
  });

  it('names the three tabs a player is about to be looking at', () => {
    const text = screen().textContent ?? '';
    for (const tab of ['Product Backlog', 'Sprint Backlog', 'Increment']) {
      expect(text, `${tab} is unexplained`).toContain(tab);
    }
  });

  it('names who is in the seats, because the game plays them at you', () => {
    const text = screen().textContent ?? '';
    for (const who of ['Priya', 'Sam', 'Ada', 'Product Owner', 'Scrum Master', 'Developers']) {
      expect(text).toContain(who);
    }
  });

  it('warns about the three rules people report as bugs', () => {
    // Each of these has been met the hard way and reported. Said once, up front, costs nothing.
    const text = screen().textContent ?? '';
    expect(text).toMatch(/not a budget/i);
    expect(text).toMatch(/Done needs the Product Owner/i);
    expect(text).toMatch(/Definition of Done/i);
  });

  it('reads the Sprint loop from the front page rather than writing its own', () => {
    // The same five lines in two components is two answers waiting to disagree, and this game has
    // a build-breaking test about exactly that elsewhere. One source, two views of it: the front
    // page lists them, this one says when each happens.
    const c = screen();
    const text = c.textContent ?? '';
    for (const l of INTRO_COPY.loop) {
      expect(text, `the loop step ${l.step} is missing`).toContain(l.step);
      expect(text, `${l.step} was reworded instead of read`).toContain(l.text);
    }
    // ...and the thing this view adds: when each one happens.
    for (const when of ORIENTATION.when) expect(text).toContain(when);
  });

  it('leads on to the Product Goal, which is the first thing to decide', () => {
    const onDone = vi.fn();
    const c = screen({ onDone });
    const on = c.querySelector('[data-part="orientation-done"]') as HTMLButtonElement;
    expect(on, 'there is no way off this screen').toBeTruthy();
    expect(on.textContent).toContain(ORIENTATION.onward);
    fireEvent.click(on);
    expect(onDone).toHaveBeenCalled();
  });

  it('offers the framework page across, for somebody who wants it first', () => {
    const onScrum = vi.fn();
    const c = screen({ onScrum });
    fireEvent.click(c.querySelector('[data-part="to-scrum"]') as HTMLButtonElement);
    expect(onScrum).toHaveBeenCalled();
  });

  it('has no way back the first time, because there is nothing behind it', () => {
    expect((screen().textContent ?? '').includes('← Back')).toBe(false);
  });
});

describe('what it does to the screen after it', () => {
  const intro = (over: Partial<Parameters<typeof ZooIntro>[0]> = {}) => render(
    <ZooIntro productGoal="" onSetGoal={() => {}} onStart={() => {}} onSetGoalShape={() => {}} {...over} />,
  ).container;

  it('leaves the Product Goal at the top of it', () => {
    // The whole reason this is a screen and not a panel.
    const c = intro({ onOrient: () => {}, onBack: () => {} });
    const headings = [...c.querySelectorAll('h1,h2,h3')].map((h) => h.textContent ?? '');
    const goal = headings.findIndex((h) => /Your Product Goal/.test(h));
    expect(goal, 'the Product Goal is not on the page').toBeGreaterThanOrEqual(0);
    expect(goal, 'something was put above the Product Goal again').toBeLessThanOrEqual(1);
  });

  it('can get back to either page, as a link rather than a panel', () => {
    const onOrient = vi.fn();
    const c = intro({ onOrient, onBack: () => {} });
    const link = c.querySelector('[data-part="to-orientation"]') as HTMLButtonElement;
    expect(link, 'the orientation cannot be reached again').toBeTruthy();
    fireEvent.click(link);
    expect(onOrient).toHaveBeenCalled();
    expect(within(c).getByText(/Scrum on one page/), 'the framework page went missing').toBeTruthy();
  });

  it('shows neither link when the teaching is off', () => {
    const c = intro();
    expect(c.querySelector('[data-part="to-orientation"]')).toBeNull();
  });
});
