import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooIntro } from './ZooIntro';

// Two rules about anything that explains, and they hold across the whole app.
//
//   1. A panel that explains opens when it is asked for, not before.
//   2. The teaching is an icon. It is never a card standing open on the screen.
//
// Both came from one screen and one sentence - "The Product Goal area should be closed and not
// expanded as default. The purple teach area should be closed too - we should see the teaching
// icon to click if we wish. These rules are true across the whole app."
//
// The screen that prompted it asked you to write one sentence, and gave you, above the button that
// starts the game: a paragraph of explanation, a format picker, a worked example, and a teaching
// card about the length of the panel again. Every one of those was added for a good reason, and
// together they buried the thing to do.
//
// The rules are not "say less". They are about WHEN: a drawer with its name on it is not hidden,
// and an icon that pulses when there is something new in it is not silent. Both are a click away
// and a click back, which is what the open card never was - its only control said "do not show me
// this again".

const SCREENS = readdirSync('src/components/zooGame')
  .filter((f) => f.endsWith('.tsx') && !f.includes('.test.'));
const src = (f: string) => readFileSync(`src/components/zooGame/${f}`, 'utf8');

describe('the teaching is behind an icon', () => {
  it('is never rendered open on a screen', () => {
    // `Explain.tsx` is where the exception lives, and it is not one: that IS the icon, and the
    // card is inside the thing it opens.
    const open = SCREENS
      .filter((f) => f !== 'Explain.tsx')
      .filter((f) => /<TeachingCard/.test(src(f)));
    expect(open, `a teaching card is rendered open on a screen: ${open.join(', ')}`).toEqual([]);
  });

  it('is offered on every screen that has teaching to give', () => {
    // The other half of it. Taking the card off a screen and giving nothing back would be the
    // rule applied as "show less", which is not what it says: a learner who wants the teaching
    // has to be able to reach it from where they are.
    // A screen that TAKES a teaching card and never offers it is the rule applied as "show less".
    // It caught a dead prop the first time it ran: the board declared one, documented it as "shown
    // inside the ?", and never read it - the Sprint's teaching comes from BoardTools beside it.
    const teaches = SCREENS.filter((f) => /teachCard/.test(src(f)) && f !== 'Explain.tsx');
    const silent = teaches.filter((f) => !/ExplainButton/.test(src(f)));
    expect(silent, `these take a teaching card and offer no way to read it: ${silent.join(', ')}`)
      .toEqual([]);
  });
});

describe('a panel that explains', () => {
  it('starts closed, wherever one is drawn', () => {
    // Read off the files rather than off a render, because the point is the rule rather than one
    // screen: a panel added next month gets the same answer. `useState(true)` on something whose
    // name says open is a panel that is open before anybody asked.
    const offenders: string[] = [];
    for (const f of SCREENS) {
      for (const m of src(f).matchAll(/const \[(\w*[Oo]pen|\w*[Ss]howing)\s*,\s*set\w+\]\s*=\s*useState\(true\)/g)) {
        offenders.push(`${f}: ${m[1]}`);
      }
    }
    expect(offenders, `a panel is open before anybody asked for it: ${offenders.join(', ')}`)
      .toEqual([]);
  });
});

describe('the screen it came from', () => {
  const intro = () => render(
    <MemoryRouter><ZooIntro productGoal="" onSetGoal={() => {}} onStart={() => {}}
      onStartFromTheBrief={() => {}} onSetGoalShape={() => {}}
      teachCard="product-goal" onMarkTaught={() => {}} /></MemoryRouter>,
  ).container;

  it('shows the Product Goal box, because that is what it asks you for', () => {
    // The rule is about what EXPLAINS. The thing to do stays where it is - which is the other half
    // of the same report, from the last time this screen was rearranged: "this should be at the
    // top and expanded."
    const c = intro();
    expect(c.querySelector('textarea[aria-label="Product Goal"]'),
      'the rule was applied to the one thing on the screen that is not reading').toBeTruthy();
    expect(c.textContent).toContain('Your Product Goal');
  });

  it('keeps the teaching one click away, and actually behind the click', () => {
    // Both halves. An icon that is there and carries nothing is the rule applied as "show less":
    // the card is gone, the button looks the part, and the teaching has simply left the game.
    const c = intro();
    const open = () => /It gives every Sprint something to aim at/.test(document.body.textContent ?? '');
    expect(open(), 'the teaching card is standing open on the screen again').toBe(false);
    const ask = [...c.querySelectorAll('button')]
      .find((b) => /What is this/i.test(b.textContent ?? '') || /What is this/i.test(b.getAttribute('aria-label') ?? ''));
    expect(ask, 'the teaching was taken away and nothing offers it back').toBeTruthy();
    // ...and it says there is something new in it, which is the only thing the open card did that
    // an icon does not do by standing there. Handed no teaching card, the button still opens and
    // still shows the explanation - so what a dropped `teachCard` loses is silent: nothing pulses,
    // and nothing is ever marked read.
    expect(ask!.getAttribute('title'), 'the icon never says there is new teaching in it')
      .toMatch(/New teaching/i);
    fireEvent.click(ask!);
    expect(open(), 'the icon is there and the teaching is not behind it').toBe(true);
  });
});
