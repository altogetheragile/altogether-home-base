import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, within } from '@testing-library/react';
import { ZooOrientationBody } from './ZooOrientation';
import { BeforeYouStart } from './BeforeYouStart';
import { ZooIntro } from './ZooIntro';
import { ORIENTATION, INTRO_COPY } from './scrumContent';
import { copyEntries } from './copy';
import { TAB_EDGE, TAB_ROW } from './ui/tokens';
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

/** The orientation on its own, which is how the screen mounts it. */
const screen = () => render(<ZooOrientationBody />).container;
/** ...and the screen round it, which owns the tabs and the one way onward. */
const before = (over: Partial<Parameters<typeof BeforeYouStart>[0]> = {}) =>
  render(<BeforeYouStart tab="zoo" onTab={() => {}} onDone={() => {}} {...over} />).container;

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
    expect(text).toMatch(/Done is what your Definition of Done says/i);
    expect(text).toMatch(/Definition of Done/i);
  });

  it('does not sell this game\'s Definition of Done as a rule of Scrum', () => {
    // It did. "Done needs the Product Owner. Somebody has to look at it." - stated on the first
    // screen of a game that teaches Scrum, about a thing the Guide says the other way round:
    //
    //   Work cannot be considered part of an Increment unless it meets the Definition of Done.
    //   The Developers are required to conform to the Definition of Done.
    //
    // ...and the Scrum Team writes that definition. A Product Owner is accountable for the value of
    // the product and may perfectly well let the Developers move work to Done on tacit approval.
    // This zoo puts their look IN its Definition of Done, which is a choice open to any team and
    // required of none - and a teaching product has to be the one that says which is which.
    const text = screen().textContent ?? '';
    expect(text, 'Done is described as needing the Product Owner, full stop')
      .not.toMatch(/Done needs the Product Owner/i);
    // ...it says whose choice it is...
    expect(text, 'the game does not own the choice it made').toMatch(/need not write it that way/i);
    expect(text, 'it does not say who conforms to the Definition of Done').toMatch(/Developers conform/i);
    // ...and it says the tick is a criterion rather than a gate after the criteria.
    //
    // The second wording got the owner right and the mechanism wrong: "every criterion the park can
    // answer can be green and it still is not Done" describes a gate that opens after the list.
    // There is no such gate. "Meets its acceptance criteria, confirmed by the Product Owner" is the
    // first line OF the list, so the tick is one of the boxes and the last one to go.
    expect(text, 'the sign-off reads as a gate after Done rather than a box in it')
      .not.toMatch(/still is not Done/i);
    expect(text, 'it does not say the tick is one of the boxes').toMatch(/one of the boxes for Done/i);
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

  it('brings no chrome of its own, because the screen owns it', () => {
    // It is a tab now. A tab that carries its own heading, its own way onward and its own escape
    // is a tab that looks like a different place, which is the thing tabs exist not to be.
    const c = screen();
    expect(c.querySelector('[data-part="start-done"]'), 'the tab has its own way onward').toBeNull();
    expect(c.querySelector('[role="tablist"]'), 'the tab has its own tabs').toBeNull();
  });
});

describe('the two pages, as one screen', () => {
  // "Can the Scrum one-pager and game orientation be tabbed so a player can easily switch between
  // them?" They were two screens with a button on each pointing at the other, and the two buttons
  // were not even the same shape: going across and coming back were differently named moves.

  it('offers both, named as they name themselves', () => {
    const c = before();
    expect(c.querySelector('[data-part="start-tab-zoo"]')?.textContent?.trim()).toBe(ORIENTATION.title);
    expect(c.querySelector('[data-part="start-tab-scrum"]')?.textContent).toMatch(/Scrum on one page/);
  });

  it('looks like the tabs the game already has', () => {
    // Reported on the first version: "can the new tabs be more obvious? It is not clear they are
    // tabs. Outline colours, or?" They were big bold labels with an underline - which is the exact
    // fault the game's own tab row carries a comment about having already fixed:
    //
    //   "Drawn as tabs: an outlined shape that the active one joins to the screen below it. They
    //    were three words with an underline, which reads as a menu rather than as three artifacts
    //    you are standing in front of."
    //
    // So this screen wears the game's tab rather than a second kind of tab. A player learns what a
    // tab looks like here from the three they meet on the very next screen.
    const src = readFileSync(join(__dirname, 'BeforeYouStart.tsx'), 'utf8');
    expect(src, 'the screen hand-rolls its own tab').toMatch(/import \{ Tab \} from '\.\/ZooShell'/);
    expect(src, 'there is a second kind of tab in the game again').not.toMatch(/border-b-2 border-primary/);

    // ...and it is drawn, not merely imported: an outlined shape, with the active one joined to
    // the panel under it.
    const on = before({ tab: 'zoo' }).querySelector('[data-part="start-tab-zoo"]')!;
    expect(on.className, 'the active tab is not an outlined shape').toMatch(/rounded-t-lg/);
    expect(on.className, 'the active tab does not join the panel below it').toMatch(/border-b-background/);
  });

  it('is drawn in a line you can see from across a room', () => {
    // "Can the tab outline be thicker and darker - it is still too subtle." It was `border-border`
    // at 2px: the same hairline every quiet panel in the game wears. A tab is not a quiet panel,
    // and in a classroom it is being read from the back of the room.
    expect(TAB_EDGE, 'the tab is drawn in the hairline panels use').not.toMatch(/border-border/);
    expect(TAB_ROW, 'the row is not drawn in the same line as the tab on it').toContain(TAB_EDGE);
    expect(TAB_ROW, 'the row is thinner than the tab standing on it').toMatch(/border-b-\[3px\]/);
    const src = readFileSync(join(__dirname, 'ZooShell.tsx'), 'utf8');
    expect(src, 'the tab outline is thinner than the row it stands on').toMatch(/border-\[3px\]/);
  });

  it('says which one you are on, to anything that asks', () => {
    const c = before({ tab: 'scrum' });
    expect(c.querySelector('[data-part="start-tab-scrum"]')?.getAttribute('aria-selected')).toBe('true');
    expect(c.querySelector('[data-part="start-tab-zoo"]')?.getAttribute('aria-selected')).toBe('false');
  });

  it('switches without leaving the screen', () => {
    const onTab = vi.fn();
    const c = before({ onTab });
    fireEvent.click(c.querySelector('[data-part="start-tab-scrum"]')!);
    expect(onTab).toHaveBeenCalledWith('scrum');
  });

  it('brings the tab you chose into view', () => {
    // On a phone the row scrolls rather than squashing, so the second tab sits half off the edge.
    // Tapping it selected a tab that stayed half off the edge, which reads as a press that half
    // worked. Checked at 320px in the browser: the row scrolls it fully in.
    const seen: Element[] = [];
    const was = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function scrollIntoView(this: Element) { seen.push(this); };
    try {
      before({ tab: 'scrum' });
      const on = seen.find((e) => e.getAttribute('data-part') === 'start-tab-scrum');
      expect(on, 'the chosen tab was left wherever it was').toBeTruthy();
    } finally {
      Element.prototype.scrollIntoView = was;
    }
  });

  it('shows the zoo on one tab and Scrum on the other', () => {
    expect(before({ tab: 'zoo' }).textContent, 'the zoo tab is not the zoo').toContain(ORIENTATION.park.title);
    expect(before({ tab: 'scrum' }).textContent, 'the Scrum tab is not Scrum').toMatch(/Three accountabilities/);
  });

  it('mounts only the tab you are on', () => {
    // The Scrum page is a hundred-odd panels and the zoo page draws an isometric park. Mounting
    // both and hiding one makes arriving here pay for the half nobody asked for.
    expect(before({ tab: 'scrum' }).textContent, 'both tabs are mounted').not.toContain(ORIENTATION.park.title);
  });

  it('has one way onward, whichever tab you were reading', () => {
    const onDone = vi.fn();
    for (const tab of ['zoo', 'scrum'] as const) {
      const c = before({ tab, onDone });
      const on = c.querySelector('[data-part="start-done"]') as HTMLButtonElement;
      expect(on, `${tab}: there is no way off this screen`).toBeTruthy();
      expect(on.textContent).toContain(ORIENTATION.onward);
      fireEvent.click(on);
    }
    expect(onDone).toHaveBeenCalledTimes(2);
  });

  it('does not offer to turn the teaching off, because there is no such thing', () => {
    // There was a second button here: "I have covered this - turn the teaching off". It set a flag
    // that hid this screen and the in-context cards, left the "?" on every screen and the whole
    // Learn drawer untouched, and reset to on at the start of every new game. Leaving the reading
    // is one press of the button beside it, and always was.
    const c = before();
    expect(c.querySelector('[data-part="skip-teaching"]'), 'the teaching toggle came back').toBeNull();
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

  it('keeps both ways back, because they are two tabs of one screen', () => {
    // These used to be gated differently: the framework page went when the teaching was switched
    // off and the manual stayed, on the reasoning that "I have covered this" meant "I have covered
    // Scrum". It was one of the two places that switch contradicted itself - press it and the
    // Scrum link vanished from the intro, but the Scrum TAB was still sitting there the moment you
    // opened the manual. With the switch gone they are simply two tabs again, and both are here.
    const c = intro({ onOrient: () => {}, onBack: () => {} });
    expect(c.querySelector('[data-part="to-orientation"]'), 'the manual is unreachable').toBeTruthy();
    expect(within(c).getByText(/Scrum on one page/), 'the framework page went missing').toBeTruthy();
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
  // The screens that HAVE a way onward. The two reading pages lost theirs when they became tabs:
  // the screen round them owns one bar for both, which is the point of tabbing them.
  const SOURCES = ['BeforeYouStart.tsx', 'ZooIntro.tsx'];

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
    // The title names the TAB now, so an edit to it has to come out on the tab. That is the whole
    // reason the tab reads its label from the content rather than carrying its own copy of it.
    const entry = copyEntries().find((e) => e.key === 'orientation.title')!;
    const was = ORIENTATION.title;
    try {
      entry.apply('How this zoo works');
      expect(ORIENTATION.title, 'the edit did not reach the content').toBe('How this zoo works');
      expect(before().querySelector('[data-part="start-tab-zoo"]')?.textContent?.trim()).toBe('How this zoo works');
    } finally {
      entry.apply(was);
    }
  });

  it('writes an edit back to the body of it too', () => {
    const entry = copyEntries().find((e) => e.key === 'orientation.park.title')!;
    const was = ORIENTATION.park.title;
    try {
      entry.apply('The grounds');
      expect(screen().textContent).toContain('The grounds');
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

describe('the editor says where the words are', () => {
  // "Where do I find this text? I can't actually find it." - a trainer with the copy editor open,
  // looking at a group called "The front page" for words that are on the Product Goal screen.
  //
  // There is no front page. The way in became Before you start, and then Your Product Goal, and the
  // labels were left describing the game as it used to be. A `where` that names a screen nobody can
  // reach is worse than no `where` at all: it sends somebody looking.

  /** Every screen name a player could be told to go to. */
  const SCREENS = [ORIENTATION.title, 'Scrum on one page', 'Your Product Goal'];

  it('names a screen that exists for everything on the way in', () => {
    // The three groups the way in is made of. It used to be one group called "The way in" holding
    // copy from two different screens, which is the shape the ordering question was really about.
    const wayIn = copyEntries().filter((e) =>
      e.group === 'How the zoo works' || e.group === 'Scrum on one page' || e.group === 'Your Product Goal');
    expect(wayIn.length, 'the way in has no editable copy').toBeGreaterThan(4);
    for (const e of wayIn) {
      expect(SCREENS.some((s) => e.where.includes(s)),
        `${e.key} says it is on "${e.where}", which is not a screen`).toBe(true);
    }
  });

  it('never sends anybody to the front page, because there is not one', () => {
    const lost = copyEntries().filter((e) => /front page/i.test(e.where) || /front page/i.test(e.group));
    expect(lost.map((e) => e.key), 'these point at a screen the game no longer has').toEqual([]);
  });

  it('sends you to the one screen the Sprint loop is on', () => {
    // It was on two screens in a row and the labels said so. It is on one now, and saying two would
    // send a trainer to the Product Goal screen looking for five lines that are not there.
    //
    // `intro.loop.` with the dot: `intro.loopTitle` starts with the same letters and is the heading
    // over them, not one of them.
    const loop = copyEntries().filter((e) => e.key.startsWith('intro.loop.'));
    expect(loop.length).toBe(INTRO_COPY.loop.length);
    for (const e of loop) {
      expect(e.where, `${e.key} does not say which screen it is on`).toContain(ORIENTATION.title);
      expect(e.where, `${e.key} still claims to be on the Product Goal screen`).not.toContain('Your Product Goal');
    }
  });
});
