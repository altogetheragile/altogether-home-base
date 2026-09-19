import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, within } from '@testing-library/react';
import { ZooOrientation } from './ZooOrientation';
import { ZooIntro } from './ZooIntro';
import { ORIENTATION, INTRO_COPY } from './scrumContent';
import { copyEntries } from './copy';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ACTION_BAR, BAR_ACTION } from './ui/tokens';

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

describe('the bar at the foot of a way-in screen', () => {
  // Found by looking at the orientation screen at phone width. Three screens had hand-rolled the
  // same class string, and it was a pill: one row, the quiet escape on the left, the action you
  // came for on the right. At 390px the two buttons wrapped - and a `rounded-full` box two rows
  // tall is an oval, a big soft blob sitting over the text behind it. A careful screen looking
  // broken on the device most people meet it on.
  //
  // It is one token now, and this test is here because the fault was a copied string rather than a
  // bad decision: the next screen with a way onward will copy something, and it should copy this.
  const SOURCES = ['ZooOrientation.tsx', 'ScrumTeaching.tsx', 'ZooIntro.tsx'];

  it('is the same bar on every screen that has one', () => {
    const hand: string[] = [];
    for (const f of SOURCES) {
      const src = readFileSync(join(__dirname, f), 'utf8');
      // A bar written out by hand rather than taken from the token.
      if (/className="sticky bottom-4/.test(src)) hand.push(f);
      expect(src, `${f} has a way onward but no bar`).toMatch(/ACTION_BAR/);
    }
    expect(hand, `these hand-roll the action bar instead of using ACTION_BAR:\n${hand.join('\n')}`).toEqual([]);
  });

  it('stacks rather than wrapping, so two rows look like a choice', () => {
    // The phone shape first, the pill from `sm` up - and the radius moves with it, because the
    // radius is the whole reason the wrapped version looked wrong.
    expect(ACTION_BAR, 'it still wraps on a phone').toContain('flex-col');
    expect(ACTION_BAR, 'it is a pill even when stacked').toContain('rounded-2xl');
    expect(ACTION_BAR, 'it never becomes a pill again').toContain('sm:rounded-full');
    expect(ACTION_BAR).toContain('sm:flex-row');
    // ...and a stacked bar is not a ragged column.
    expect(BAR_ACTION).toContain('w-full');
    expect(BAR_ACTION).toContain('sm:w-auto');
  });
});

describe('a trainer can change the words on it', () => {
  // Asked while reading it: "can the orientation screen be editable like other copy?"
  //
  // It carried the pencil from the day it shipped and none of its own words were behind it - so a
  // trainer who opened the editor on that screen was shown the front page's copy instead. The
  // pencil was a promise the screen did not keep.
  //
  // The line this holds is the one the copy module already draws: everything a learner READS is
  // editable, and the buttons are not, because a button label is bound to what the button does.

  it('has every sentence on it behind the pencil', () => {
    const keys = new Set(copyEntries().map((e) => e.key));
    const want = ['orientation.title', 'orientation.strapline', 'orientation.gotchas.title'];
    for (const k of want) expect(keys.has(k), `${k} cannot be edited`).toBe(true);

    // Every panel, every line of every panel, and every one of the surprises. Named by walking the
    // content rather than by listing them here, so a panel added later is covered or this fails.
    for (const panel of ['park', 'seats', 'tabs', 'clock'] as const) {
      const p = ORIENTATION[panel];
      expect(keys.has(`orientation.${panel}.title`), `${panel}: the heading is fixed`).toBe(true);
      expect(keys.has(`orientation.${panel}.lead`), `${panel}: the opening line is fixed`).toBe(true);
      p.rows.forEach((_, i) => {
        expect(keys.has(`orientation.${panel}.rows.${i}.name`), `${panel} line ${i}: the bold part is fixed`).toBe(true);
        expect(keys.has(`orientation.${panel}.rows.${i}.text`), `${panel} line ${i} is fixed`).toBe(true);
      });
    }
    ORIENTATION.gotchas.rows.forEach((_, i) => {
      expect(keys.has(`orientation.gotchas.${i}.text`), `surprise ${i} is fixed`).toBe(true);
    });
    ORIENTATION.when.forEach((_, i) => {
      expect(keys.has(`orientation.when.${i}`), `when-step ${i} is fixed`).toBe(true);
    });
  });

  it('shows them on the screen they belong to, not on a list of everything', () => {
    // The point of the in-game editor: open it where you are, and see what is in front of you.
    const mine = copyEntries().filter((e) => e.group === 'How the zoo works');
    expect(mine.length, 'the orientation has no editable copy at all').toBeGreaterThan(10);
    for (const e of mine) {
      expect(e.phases, `${e.key} would not be found on the screen it is on`).toContain('intro');
      expect(e.where, `${e.key} does not say where it appears`).toMatch(/How the zoo works/);
    }
  });

  it('writes an edit back to the screen', () => {
    const entry = copyEntries().find((e) => e.key === 'orientation.title')!;
    const was = ORIENTATION.title;
    try {
      entry.apply('How this zoo works');
      expect(ORIENTATION.title, 'the edit did not reach the content').toBe('How this zoo works');
      expect(screen().textContent).toContain('How this zoo works');
    } finally {
      entry.apply(was);
    }
  });

  it('leaves the buttons alone, which is the rule everywhere else in this file', () => {
    // "Only the TEACHING voice is editable: button labels, column names and step titles stay in
    // code, because they are bound to layout and logic."
    const keys = copyEntries().map((e) => e.key);
    expect(keys).not.toContain('orientation.onward');
    expect(keys).not.toContain('orientation.aside');
  });
});
