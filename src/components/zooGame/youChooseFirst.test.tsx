import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { initialZooState, DAY_SECONDS } from './config';
import { startItem, yourDev, otherDevs, heldBy } from './engine';
import { aiDevTurn } from './aiSeats';
import { SeatBand } from './SeatBand';
import type { ZooGameState } from './types';

// Which of the three Developers is you, and who reaches for a card first.
//
// Two reports, one cause. "Three Devs are mentioned. Which is the human player?" - you hold Ada
// and nothing on the screen said so, because the band marks the seat you took and a solo player
// takes no seat. And: "The AI Dev's start building stuff straight away. They have picked the
// interesting items i.e. an enclosure. A human player should pull first and the AIs follow with
// other items like the toilet."
//
// Both rules here are the game making room for the person at the table rather than anything the
// Guide says. The Sprint Backlog belongs to the Developers and a real team would take the top of
// it; what a real team would also do is ask the person standing there what they want to pick up.

const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const ready = base.backlog
    .filter((it) => !it.unsized && !['epic', 'exhibit'].includes(it.category)).slice(0, 4);
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    daySecondsLeft: DAY_SECONDS, wipLimit: 0,
    committedIds: ready.map((it) => it.id),
    backlog: base.backlog.map((it) => (ready.some((r) => r.id === it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1, pos: { x: 200, y: 300 } } : it)),
    ...over,
  } as ZooGameState;
};

describe('you are one of the three', () => {
  it('and the band says which', () => {
    const s = sprint();
    const c = render(<MemoryRouter><SeatBand state={s} /></MemoryRouter>).container;
    // By the marker rather than by the words: the band's spans run together in `textContent`,
    // so "Ada" + "you" reads as "Adayou" and a word boundary finds nothing.
    const yours = [...c.querySelectorAll('[data-part="seat-you"]')]
      .map((n) => n.closest('[data-part="seat"]')!);
    expect(yours.length, 'nothing on the band says which of them you are').toBe(1);
    expect(yours[0].textContent, 'the wrong person is marked as you').toContain(yourDev(s)!.name);
  });

  it('and it is a Developer, not the Product Owner', () => {
    // Priya is played by the game in a solo match. Marking her as you would be the opposite of
    // what the seat band is for.
    const s = sprint();
    const c = render(<MemoryRouter><SeatBand state={s} /></MemoryRouter>).container;
    const yours = c.querySelector('[data-part="seat-you"]')!.closest('[data-part="seat"]')!;
    expect(yours.textContent, 'the Product Owner is marked as you').not.toMatch(/\bPO\b/);
    expect(yours.textContent, 'the Scrum Master is marked as you').not.toMatch(/\bSM\b/);
    expect(yours.textContent).toContain(yourDev(s)!.name);
  });

  it('and in a shared game it is still the seat you took', () => {
    // The band's older job. A Product Owner sitting with real Developers is marked at their own
    // seat, and no Developer is marked at all.
    const s = sprint();
    const c = render(<MemoryRouter><SeatBand state={s} seat="product_owner" /></MemoryRouter>).container;
    const yours = [...c.querySelectorAll('[data-part="seat-you"]')]
      .map((n) => n.closest('[data-part="seat"]')!);
    expect(yours.length, 'the seat you took is not marked, or something else is').toBe(1);
    // The band writes the person's short name beside the accountability's initials, so match on
    // what it draws rather than on the full "Priya (PO)" the state carries.
    expect(yours[0].textContent).toMatch(/PO/);
    expect(yours[0].textContent, 'a Developer is marked as you as well')
      .not.toContain(yourDev(s)!.name);
  });
});

describe('the person at the table chooses first', () => {
  it('so nobody pulls while you have nothing in hand', () => {
    const s = sprint();
    for (const dev of otherDevs(s)) {
      expect(aiDevTurn(s, dev)?.action.type, `${dev.name} reached across you for a card`)
        .not.toBe('START_ITEM');
    }
  });

  it('and they get on with it once you have', () => {
    // Waiting forever would be worse than not waiting: the point is that you choose first, not
    // that two Developers stand about until you finish.
    const top = sprint().backlog.find((it) => it.status === 'committed')!;
    const s = startItem(sprint(), top.id);
    const [ben] = otherDevs(s);
    expect(aiDevTurn(s, ben)?.action.type, 'they are still waiting after you took one')
      .toBe('START_ITEM');
  });

  it('and they take from the bottom of the Sprint Backlog, not the top', () => {
    // The Product Backlog is ordered by value and the Sprint Backlog keeps that order, so the top
    // is the thing worth doing most - the enclosure, not the toilets. It is still there when you
    // come back to the board.
    const s = sprint();
    const top = s.backlog.find((it) => it.status === 'committed')!;
    const mine = startItem(s, top.id);
    const left = mine.backlog.filter((it) => it.status === 'committed' && !it.started);
    expect(left.length, 'there is only one card left, so the order cannot be tested').toBeGreaterThan(1);

    const [ben] = otherDevs(mine);
    const move = aiDevTurn(mine, ben)!;
    expect((move.action as { id: string }).id, 'he took the most valuable thing on the board')
      .toBe(left[left.length - 1].id);
    expect((move.action as { id: string }).id).not.toBe(left[0].id);
  });

  it('and what they leave is what you are offered next', () => {
    const s = sprint();
    const top = s.backlog.find((it) => it.status === 'committed')!;
    let after = startItem(s, top.id);
    const [ben, cara] = otherDevs(after);
    for (const dev of [ben, cara]) {
      const move = aiDevTurn(after, dev);
      if (move?.action.type === 'START_ITEM') {
        after = startItem(after, (move.action as { id: string }).id, 'developer', dev.id);
      }
    }
    const held = otherDevs(after).map((d) => heldBy(after, d.id)?.name);
    expect(held.filter(Boolean).length, 'neither of them took anything').toBe(2);
    expect(held, 'one of them took the card at the top of the Sprint Backlog')
      .not.toContain(top.name);
  });
});
