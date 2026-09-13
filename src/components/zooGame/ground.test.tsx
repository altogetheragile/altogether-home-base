import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { GroundPanel } from './GroundPanel';
import { ParkPlan } from './ParkPlan';
import { initialZooState } from './config';
import { openGround, cannotOpenGround, groundOpen, groundPrice, hasGround, notReady, isReady, splitEpic, estimateItem, decisionsIn } from './engine';
import { applyTuning } from './tuning';
import { aiTurn } from './aiSeats';
import type { ZooGameState } from './types';

// Ground is earned, not given.
//
// A zoo that can build anywhere for nothing has no ordering decision worth having: every item is
// just work, and "what is worth doing next" is a matter of taste. Ground costs what the zoo is
// WORTH - the value its visitors got out of coming - so growing is paid for by being good, and the
// Product Owner's argument becomes the real one: another animal in the area we have, or the ground
// for the area we have not?
//
// The first area is the one the zoo was given. The grounds - the paths, the bridge, the way in -
// belong to no area and are always open: a zoo that had to buy the ground its own entrance stands
// on would be a joke.

const zoo = (value = 0): ZooGameState => {
  let s = initialZooState(1) as ZooGameState;
  for (const e of s.backlog.filter((i) => i.category === 'epic')) {
    s = splitEpic(s, e.id, (e.epicMembers ?? []).map((m) => m.id));
  }
  for (const it of s.backlog) if (it.unsized && it.category !== 'epic') s = estimateItem(s, it.id, it.trueSize ?? 5);
  return { ...s, value } as ZooGameState;
};

/** The area the zoo was given. Before the brief is written it is simply the first one. */
const given = (s: ZooGameState): string => groundOpen(s).filter((z) => z !== 'Grounds')[0];

const other = (s: ZooGameState): string => {
  const open = groundOpen(s);
  return ['Waterside', 'Savanna', 'Forest'].find((z) => !open.includes(z))!;
};

describe('the ground a zoo starts with', () => {
  it('is the first area, and the grounds between the areas', () => {
    const s = zoo();
    expect(hasGround(s, given(s)), 'the zoo was not given its first area').toBe(true);
    expect(hasGround(s, 'Grounds'), 'the zoo has to buy the ground its own paths run on').toBe(true);
    expect(hasGround(s, other(s)), 'every area was given away at the start').toBe(false);
  });

  it('makes work in an area it does not own not Ready, and says why', () => {
    const s = zoo();
    const waiting = s.backlog.find((it) => it.zone === other(s) && it.category !== 'epic')!;
    expect(isReady(waiting), 'the card itself is fine - it is the zoo that is not ready').toBe(true);
    expect(isReady(waiting, s), 'work was plannable in an area the zoo has no ground in').toBe(false);
    expect(notReady(waiting, s)).toMatch(new RegExp(`no ground in the ${other(s)}`, 'i'));
    expect(notReady(waiting, s), 'it does not say who can do something about it').toMatch(/Product Owner/i);
  });
});

describe('opening ground', () => {
  it('cannot be done until the zoo is worth it, and says how short it is', () => {
    applyTuning({});
    const s = zoo(groundPrice() - 100);
    const why = cannotOpenGround(s, other(s))!;
    expect(why, 'a zoo that could not afford it was allowed to').toBeTruthy();
    expect(why, 'it does not say how far off the zoo is').toMatch(/100 short/);
    expect(openGround(s, other(s)), 'the ground opened anyway').toBe(s);
  });

  it('spends what the zoo is worth, and opens the work with it', () => {
    const s = zoo(groundPrice() + 300);
    const zone = other(s);
    const after = openGround(s, zone);
    expect(hasGround(after, zone), 'the ground was paid for and not opened').toBe(true);
    expect(after.value, 'the ground was free after all').toBe(300);
    const waiting = after.backlog.find((it) => it.zone === zone && it.category !== 'epic')!;
    expect(isReady(waiting, after), 'the ground opened and the work stayed unplannable').toBe(true);
  });

  it('is a decision, and goes in the log as one', () => {
    // The Retrospective should be able to look back at it beside the Sprint that paid for it.
    const s = zoo(groundPrice());
    const after = openGround(s, other(s));
    const said = decisionsIn(after, after.sprintNumber).map((d) => `${d.what} ${d.cost ?? ''}`).join(' | ');
    expect(said, 'spending everything the zoo was worth was not written down').toMatch(/ground for the/i);
    expect(said, 'the log does not say what it cost').toMatch(new RegExp(`${groundPrice()}`));
  });

  it('cannot be bought twice', () => {
    const s = zoo(groundPrice() * 3);
    const zone = other(s);
    const once = openGround(s, zone);
    expect(cannotOpenGround(once, zone), 'the same ground was for sale again').toMatch(/already/i);
    expect(openGround(once, zone).value, 'the zoo paid twice for one area').toBe(once.value);
  });

  it('costs what the dial says, so a trainer can make growing dear or cheap', () => {
    applyTuning({ 'tune.ground.price': '200' });
    const s = zoo(250);
    expect(cannotOpenGround(s, other(s)), 'the turned-down price was not used').toBeNull();
    applyTuning({});
  });
});

describe('the Product Owner seat, played by the game', () => {
  it('opens ground the zoo has earned, when something is waiting on it', () => {
    const s = { ...zoo(groundPrice()), phase: 'sprint' } as ZooGameState;
    const move = aiTurn(s, 'product_owner');
    expect(move?.action, 'a zoo that could afford to grow never did').toMatchObject({ type: 'OPEN_GROUND' });
    expect(move?.says, 'it does not say what paid for it').toMatch(/worth/i);
  });

  it('does not buy a field with nothing to put in it', () => {
    // What a Product Owner does when they are optimising for having spent the money.
    const rich = zoo(groundPrice() * 4);
    const empty = { ...rich, phase: 'sprint',
      backlog: rich.backlog.filter((it) => groundOpen(rich).includes(it.zone)) } as ZooGameState;
    const move = aiTurn(empty, 'product_owner');
    expect(move?.action?.type, 'it bought ground for work that does not exist').not.toBe('OPEN_GROUND');
  });
});

describe('what the screens say about it', () => {
  it('offers the ground at refinement, with what it costs and what is waiting on it', () => {
    const s = zoo(0);
    const { container } = render(<GroundPanel state={s} onOpenGround={() => {}} />);
    const panel = container.querySelector('[data-part="ground"]')!;
    expect(panel, 'refinement says nothing about ground at all').toBeTruthy();
    expect(panel.textContent).toMatch(/Ground the zoo does not have yet/i);
    expect(panel.textContent, 'it does not say what an area costs').toMatch(new RegExp(`${groundPrice().toLocaleString()}`));
    expect(panel.textContent, 'it does not say how far off the zoo is').toMatch(/short/i);
    expect(panel.textContent, 'it does not say what is waiting on the ground').toMatch(/waiting on it/i);
  });

  it('only lets it be opened when the zoo can afford it', () => {
    const bought: string[] = [];
    const poor = render(<GroundPanel state={zoo(0)} onOpenGround={(z) => bought.push(z)} />);
    fireEvent.click(poor.container.querySelectorAll('button')[0]);
    expect(bought, 'a zoo worth nothing bought an area').toEqual([]);
    poor.unmount();

    render(<GroundPanel state={zoo(groundPrice())} onOpenGround={(z) => bought.push(z)} />);
    fireEvent.click(screen.getAllByRole('button', { name: /Open this ground/ })[0]);
    expect(bought.length, 'a zoo that could afford it was refused').toBe(1);
  });

  it('draws ground the zoo does not own as ground it does not own', () => {
    const s = zoo(0);
    const { container } = render(<ParkPlan state={s} />);
    const mine = container.querySelector(`[data-zone="${given(s)}"]`)!;
    const theirs = container.querySelector(`[data-zone="${other(s)}"]`)!;
    expect(mine.getAttribute('data-ours'), 'the zoo does not own the area it was given').toBe('yes');
    expect(theirs.getAttribute('data-ours'), 'the park hands over every area for free').toBe('no');
    expect(theirs.textContent, 'unbought ground does not say what it would cost')
      .toMatch(new RegExp(`${groundPrice().toLocaleString()}`));
  });
});
